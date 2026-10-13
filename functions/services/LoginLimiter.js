/**
 * Server-side login attempt limiter.
 *
 * Flow (see secureLogin in index.js):
 *  1. reserveAttempt  - atomically checks lockouts and reserves one attempt slot
 *                       for both the email key and the IP key (race-safe).
 *  2. verifyPassword  - verifies credentials through the Identity Toolkit REST API
 *                       (the Admin SDK cannot verify passwords).
 *  3. recordFailure   - applies the 15 min lockout once the limit is reached.
 *     recordSuccess   - clears the email counter and releases the IP slot.
 *
 * Counters live in the top-level `loginAttempts` collection, keyed by SHA-256
 * hashes so no raw emails / IPs are stored as document IDs. Counters are kept
 * whether or not the account exists so responses never reveal account existence.
 */
const crypto = require('crypto');
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');
const { HttpsError } = require('firebase-functions/v2/https');
const { Timestamp } = require('firebase-admin/firestore');

const COLLECTION = 'loginAttempts';

const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
/** Docs are removed by a Firestore TTL policy on `expiresAt`. */
const DOC_TTL_MS = 24 * 60 * 60 * 1000;

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 4096;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_INVALID_MESSAGE = 'Invalid email or password.';

/** Identity Toolkit errors that mean "wrong credentials" (counted as a failure). */
const CREDENTIAL_FAILURE_CODES = new Set([
    'INVALID_LOGIN_CREDENTIALS',
    'INVALID_PASSWORD',
    'EMAIL_NOT_FOUND',
    'INVALID_EMAIL',
]);

const hashKey = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Returns the caller IP. On Cloud Functions Gen2 / Cloud Run, Google's front end
 * APPENDS the real socket IP to X-Forwarded-For, so the LAST entry is the only
 * trustworthy one (earlier entries can be spoofed by the client).
 *
 * @param {import('express').Request | undefined} rawRequest
 * @returns {string | null}
 */
function getClientIp(rawRequest) {
    if (!rawRequest) return null;

    const xff = rawRequest.headers && rawRequest.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
        const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) return parts[parts.length - 1];
    }

    return rawRequest.ip || null;
}

const freshState = (nowMs) => ({ count: 0, firstAttemptAtMs: nowMs, lockedUntilMs: 0 });

/**
 * Normalizes a stored counter doc, resetting it when the window or lockout expired.
 */
function resolveState(data, nowMs) {
    if (!data) return freshState(nowMs);

    const lockedUntilMs = data.lockedUntil ? data.lockedUntil.toMillis() : 0;
    const firstAttemptAtMs = data.firstAttemptAt ? data.firstAttemptAt.toMillis() : nowMs;
    const count = typeof data.count === 'number' ? data.count : 0;

    if (lockedUntilMs > nowMs) return { count, firstAttemptAtMs, lockedUntilMs };
    if (lockedUntilMs > 0) return freshState(nowMs); // lockout expired
    if (nowMs - firstAttemptAtMs >= WINDOW_MS) return freshState(nowMs); // window expired

    return { count, firstAttemptAtMs, lockedUntilMs: 0 };
}

function toDoc(state, nowMs) {
    return {
        count: state.count,
        firstAttemptAt: Timestamp.fromMillis(state.firstAttemptAtMs),
        lockedUntil: state.lockedUntilMs ? Timestamp.fromMillis(state.lockedUntilMs) : null,
        updatedAt: Timestamp.fromMillis(nowMs),
        expiresAt: Timestamp.fromMillis(Math.max(nowMs, state.lockedUntilMs) + DOC_TTL_MS),
    };
}

/**
 * Atomically checks every target for an active lockout and, if none, reserves one
 * attempt on each. Reserving up front means parallel requests cannot all slip past
 * the check before failures are recorded.
 *
 * @returns {Promise<{ locked: boolean, retryAfterMs?: number }>}
 */
async function reserveAttempt(db, targets, nowMs) {
    return db.runTransaction(async (tx) => {
        const snaps = await Promise.all(targets.map((t) => tx.get(t.ref)));
        const states = snaps.map((snap) => resolveState(snap.exists ? snap.data() : null, nowMs));

        const retryAfterMs = states.reduce(
            (max, s) => (s.lockedUntilMs > nowMs ? Math.max(max, s.lockedUntilMs - nowMs) : max),
            0
        );
        if (retryAfterMs > 0) return { locked: true, retryAfterMs };

        // Limit already consumed by in-flight attempts -> lock now.
        const saturated = states.map((s, i) => s.count >= targets[i].max);
        if (saturated.some(Boolean)) {
            states.forEach((s, i) => {
                if (saturated[i]) {
                    tx.set(targets[i].ref, toDoc({ ...s, lockedUntilMs: nowMs + LOCKOUT_MS }, nowMs));
                }
            });
            return { locked: true, retryAfterMs: LOCKOUT_MS };
        }

        states.forEach((s, i) => tx.set(targets[i].ref, toDoc({ ...s, count: s.count + 1 }, nowMs)));
        return { locked: false };
    });
}

/**
 * Called after a failed credential check. Starts the lockout on any target whose
 * reserved attempts reached its limit.
 *
 * @returns {Promise<{ locked: boolean, retryAfterMs?: number }>}
 */
async function recordFailure(db, targets, nowMs) {
    return db.runTransaction(async (tx) => {
        const snaps = await Promise.all(targets.map((t) => tx.get(t.ref)));
        let locked = false;

        snaps.forEach((snap, i) => {
            const s = resolveState(snap.exists ? snap.data() : null, nowMs);
            if (s.lockedUntilMs > nowMs) {
                locked = true;
                return;
            }
            if (s.count >= targets[i].max) {
                tx.set(targets[i].ref, toDoc({ ...s, lockedUntilMs: nowMs + LOCKOUT_MS }, nowMs));
                locked = true;
            }
        });

        return locked ? { locked: true, retryAfterMs: LOCKOUT_MS } : { locked: false };
    });
}

/** Gives back one reserved attempt slot (never below zero). */
async function releaseAttempt(db, ref) {
    try {
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) return;
            const count = snap.get('count');
            if (typeof count === 'number' && count > 0) tx.update(ref, { count: count - 1 });
        });
    } catch (err) {
        logger.warn('LoginLimiter: failed to release attempt', { error: err.message });
    }
}

async function recordSuccess(db, emailRef, ipRef) {
    const tasks = [emailRef.delete().catch((err) => {
        logger.warn('LoginLimiter: failed to reset email counter', { error: err.message });
    })];
    if (ipRef) tasks.push(releaseAttempt(db, ipRef));
    await Promise.all(tasks);
}

/**
 * Verifies email/password via the Identity Toolkit REST API.
 * Uses the Auth emulator automatically when FIREBASE_AUTH_EMULATOR_HOST is set.
 *
 * @returns {Promise<{ ok: true, uid: string } | { ok: false, code: string }>}
 */
async function verifyPassword(email, password, apiKey) {
    const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const base = emulatorHost
        ? `http://${emulatorHost}/identitytoolkit.googleapis.com`
        : 'https://identitytoolkit.googleapis.com';
    const url = `${base}/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: false }),
    });

    const body = await response.json().catch(() => ({}));

    if (response.ok && body.localId) return { ok: true, uid: body.localId };

    // Messages can look like "TOO_MANY_ATTEMPTS_TRY_LATER : Access to this account...".
    const rawCode = (body.error && body.error.message) || `HTTP_${response.status}`;
    return { ok: false, code: rawCode.split(':')[0].trim() };
}

function lockedError(retryAfterMs) {
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return new HttpsError(
        'resource-exhausted',
        `Too many failed login attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        { retryAfterSeconds }
    );
}

/**
 * Callable handler for `secureLogin`.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @param {{ apiKey: string }} options
 * @returns {Promise<{ token: string }>} Custom token for signInWithCustomToken.
 */
async function handleSecureLogin(request, { apiKey }) {
    const { email, password } = request.data || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new HttpsError('invalid-argument', 'Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(normalizedEmail)) {
        throw new HttpsError('invalid-argument', 'Please enter a valid email address.');
    }
    if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
        throw new HttpsError('invalid-argument', 'Please enter a valid password.');
    }
    if (!apiKey) {
        logger.error('LoginLimiter: AUTH_WEB_API_KEY is not configured');
        throw new HttpsError('internal', 'Unable to log in right now. Please try again later.');
    }

    const db = admin.firestore();
    const emailHash = hashKey(normalizedEmail);
    const emailRef = db.collection(COLLECTION).doc(`email_${emailHash}`);
    const targets = [{ ref: emailRef, max: MAX_FAILURES_PER_EMAIL }];

    const ip = getClientIp(request.rawRequest);
    const ipRef = ip ? db.collection(COLLECTION).doc(`ip_${hashKey(ip)}`) : null;
    if (ipRef) targets.push({ ref: ipRef, max: MAX_FAILURES_PER_IP });

    const logCtx = { emailKey: emailHash.slice(0, 12), hasIp: Boolean(ipRef) };

    // 1. Gate (checked BEFORE the password, so a locked account answers the
    //    same way whether the password is right or wrong).
    const gate = await reserveAttempt(db, targets, Date.now());
    if (gate.locked) {
        logger.info('LoginLimiter: attempt blocked by lockout', logCtx);
        throw lockedError(gate.retryAfterMs);
    }

    // 2. Verify credentials.
    let result;
    try {
        result = await verifyPassword(normalizedEmail, password, apiKey);
    } catch (err) {
        logger.error('LoginLimiter: Identity Toolkit request failed', { ...logCtx, error: err.message });
        await Promise.all(targets.map((t) => releaseAttempt(db, t.ref)));
        throw new HttpsError('unavailable', 'Unable to log in right now. Please try again later.');
    }

    // 3a. Success -> reset + custom token.
    if (result.ok) {
        let token;
        try {
            token = await admin.auth().createCustomToken(result.uid);
        } catch (err) {
            logger.error('LoginLimiter: createCustomToken failed (check Service Account Token Creator role)', {
                ...logCtx,
                error: err.message,
            });
            await Promise.all(targets.map((t) => releaseAttempt(db, t.ref)));
            throw new HttpsError('internal', 'Unable to log in right now. Please try again later.');
        }
        await recordSuccess(db, emailRef, ipRef);
        return { token };
    }

    // 3b. Failure.
    if (CREDENTIAL_FAILURE_CODES.has(result.code)) {
        const failure = await recordFailure(db, targets, Date.now());
        logger.info('LoginLimiter: invalid credentials', { ...logCtx, locked: failure.locked });
        if (failure.locked) throw lockedError(failure.retryAfterMs);
        throw new HttpsError('unauthenticated', GENERIC_INVALID_MESSAGE);
    }

    if (result.code === 'USER_DISABLED') {
        // Attempt stays counted.
        throw new HttpsError('permission-denied', 'This account has been disabled.');
    }

    if (result.code === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        // Firebase Auth's own throttling kicked in. Attempt stays counted.
        logger.warn('LoginLimiter: Firebase Auth throttled the request', logCtx);
        throw new HttpsError('resource-exhausted', 'Too many login attempts. Please try again later.');
    }

    logger.error('LoginLimiter: unexpected Identity Toolkit error', { ...logCtx, code: result.code });
    await Promise.all(targets.map((t) => releaseAttempt(db, t.ref)));
    throw new HttpsError('internal', 'Unable to log in right now. Please try again later.');
}

module.exports = {
    handleSecureLogin,
    // Exported for unit tests.
    _internal: {
        getClientIp,
        resolveState,
        hashKey,
        MAX_FAILURES_PER_EMAIL,
        MAX_FAILURES_PER_IP,
        WINDOW_MS,
        LOCKOUT_MS,
    },
};
