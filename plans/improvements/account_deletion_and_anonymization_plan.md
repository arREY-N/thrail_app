# Account Deletion and Data Anonymization Plan (Tombstoning Architecture)

**Feature / Improvement:** Account Deletion, System Integrity & User Data Anonymization  
**Date:** 2026-10-29  
**Status:** Architecture Plan & Implementation Roadmap  

---

## 1. Problem Statement & Motivation

When a user requests to delete their account, executing a direct hard delete (`UserRepo.delete(userId)` and removing the document from the `users` collection) introduces catastrophic cascade failures across the system:

1. **Dangling Foreign Keys:** Historical records—such as reviews (`authorId`), hike logs, tour reservations (`userId`), group chats, and organizer rosters—will reference a non-existent document ID, resulting in runtime null pointer exceptions, broken UI renders, and failed data aggregations.
2. **Loss of Public UGC (User-Generated Content):** Trail difficulty ratings, condition reports, and hike logs written by that user represent critical community safety data that other hikers depend on.
3. **Emergency & Safety Inconsistencies:** Other hikers might still list the deleted account as their designated emergency contact, or active emergency chat groups might fail to route updates.
4. **Legal Compliance (GDPR, CCPA, Philippine Data Privacy Act of 2012):** Privacy regulations mandate the right to erasure of **Personally Identifiable Information (PII)**, but do **not** mandate deleting anonymous business logs, historical transactions, or safety records, provided personal identifiers are completely and irreversibly scrubbed.

---

## 2. Recommended Solution: Soft Delete with Tombstone Anonymization

The best architectural approach is **Auth Revocation + PII Scrubbing + Tombstoning**:

```
[ User Requests Deletion ]
           │
           ▼
[ Step 1: Pre-Condition Checks ] ──(Has active tour / pending refund?)──► [ Block Deletion & Prompt User ]
           │ (Checks Pass)
           ▼
[ Step 2: Cloud Function Trigger (`deleteUserAccount`) ]
           │
           ├──► A. Revoke Sessions & Delete from Firebase Authentication
           │
           ├──► B. Anonymize PII in Firestore `users/{userId}` (Tombstone)
           │
           ├──► C. Detach / Clean Up Relational Links (Emergency Contacts, Groups)
           │
           └──► D. Client-Side Sign Out & Cache Wipe
```

Rather than destroying the document, we:
1. Delete the user from **Firebase Auth** (preventing any future logins).
2. Retain the **document ID (`userId`)** in Firestore to maintain relational integrity.
3. Overwrite all **Personally Identifiable Information (PII)** with generic placeholder values.
4. Mark the account with `isDeleted: true` and `deletedAt: timestamp`.

---

## 3. Schema Transformation: Before & After

### Active User Document (`users/{userId}`)
```json
{
  "id": "usr_948192847",
  "firstname": "Juan",
  "lastname": "Dela Cruz",
  "username": "juandc",
  "email": "juan.delacruz@example.com",
  "phoneNumber": "9171234567",
  "phoneVerifiedAt": "2026-05-10T12:00:00Z",
  "birthday": "1994-08-20",
  "address": "Makati City, Metro Manila",
  "medicalProfile": {
    "hasCondition": true,
    "details": ["Asthma"],
    "clearanceUri": "https://storage.googleapis.com/.../clearance.jpg"
  },
  "emergencyContact": {
    "name": "Maria Dela Cruz",
    "contactNumber": "9187654321",
    "email": "maria@example.com",
    "userId": "usr_551029384",
    "chatId": "chat_grp_102"
  },
  "role": "hiker",
  "createdAt": "2026-01-15T08:30:00Z",
  "isDeleted": false
}
```

### Anonymized Tombstone Document (`users/{userId}`)
```json
{
  "id": "usr_948192847",
  "firstname": "Deleted",
  "lastname": "User",
  "username": "deleted_user",
  "email": "deleted_usr_948192847@anonymized.thrail.local",
  "phoneNumber": null,
  "phoneVerifiedAt": null,
  "birthday": null,
  "address": null,
  "medicalProfile": null,
  "emergencyContact": null,
  "role": "hiker",
  "createdAt": "2026-01-15T08:30:00Z",
  "isDeleted": true,
  "deletedAt": "2026-10-29T04:15:00Z"
}
```

> **Why salt/reformat the email?**  
> If you maintain uniqueness constraints on email or usernames, rewriting the email to `deleted_<userId>@anonymized.thrail.local` frees up the user's real email address if they ever choose to register again with a fresh account in the future.

---

## 4. Domain-by-Domain Impact & Cleanup Rules

### 4.1 Reviews & Community Trail Data
* **Retain the reviews:** The rating (stars), review text, trail condition notes, and hike stats are retained.
* **Display as "Deleted User":** UI components displaying review authors will recognize `isDeleted === true` (or check for `"Deleted User"`) and render a neutral silhouette avatar and `"Deleted User"` name tag.
* **Likes / Likes Count:** Retain like counts on reviews. Remove the user's specific like entries if tracked in a subcollection, or leave them aggregated.

### 4.2 Active Reservations & Tours
* **Pre-Deletion Guard:** The user **must not** have an active, unpaid, or upcoming reservation (status: `PENDING`, `APPROVED`, or `ONGOING`).
  * If active bookings exist, block deletion with an alert:  
    *"You have active tour bookings. Please cancel your upcoming reservations before deleting your account."*
* **Completed Bookings:** Historical booking records (for revenue audits, tour rosters, and guide attendance reports) are preserved with the user ID pointing to the anonymized tombstone.

### 4.3 Emergency Contacts & Chat Groups
* **When the deleted user is an Emergency Contact for others:**  
  A background batch/Cloud Function scans users whose `emergencyContact.userId == deletedUserId`, unlinking the `userId` reference so their friends/family receive a prompt to update their emergency contact.
* **Emergency Chat Groups (`CreateEmergencyChatFlow`):**  
  Mark the chat group as archived or post a system message: `"Participant has left Thrail"`. Clear any direct chat notifications.

### 4.4 Medical Documents & Stored Files
* In Cloud Storage (`gs://.../medical_clearances/...`), permanently delete uploaded photos/PDFs of medical clearances, IDs, or government credentials associated with `userId`.

---

## 5. Implementation Architecture (Client + Cloud Function)

Because standard client-side tokens cannot reliably execute administrative deletes on Firebase Auth or multi-collection updates safely, deletion must be orchestrated via a **Callable Cloud Function**:

```typescript
// functions/src/account/deleteAccount.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const deleteUserAccount = functions.https.onCall(async (data, context) => {
    // 1. Authenticate requester
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const uid = context.auth.uid;
    const db = admin.firestore();

    // 2. Pre-condition checks: Verify no active bookings
    const activeBookings = await db.collection('reservations')
        .where('userId', '==', uid)
        .where('status', 'in', ['PENDING', 'APPROVED', 'ONGOING'])
        .get();

    if (!activeBookings.empty) {
        throw new functions.https.HttpsError(
            'failed-precondition', 
            'Cannot delete account with active or upcoming reservations. Please cancel them first.'
        );
    }

    // 3. Delete uploaded files in Storage (Medical clearances, ID photos)
    const bucket = admin.storage().bucket();
    await bucket.deleteFiles({ prefix: `users/${uid}/` }).catch(() => null);

    // 4. Clean up emergency contact linkages in other users
    const linkedContacts = await db.collection('users')
        .where('emergencyContact.userId', '==', uid)
        .get();

    const batch = db.batch();
    linkedContacts.docs.forEach(doc => {
        batch.update(doc.ref, {
            'emergencyContact.userId': null,
            'emergencyContact.phoneVerifiedAt': null
        });
    });

    // 5. Tombstone the User document in Firestore
    const userRef = db.collection('users').doc(uid);
    batch.update(userRef, {
        firstname: 'Deleted',
        lastname: 'User',
        username: 'deleted_user',
        email: `deleted_${uid}@anonymized.thrail.local`,
        phoneNumber: null,
        phoneVerifiedAt: null,
        birthday: null,
        address: null,
        medicalProfile: null,
        emergencyContact: null,
        preferences: null,
        isDeleted: true,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    // 6. Delete User from Firebase Authentication
    await admin.auth().deleteUser(uid);

    return { success: true };
});
```

---

## 6. Client-Side Presentation & Fallback Helpers

In the client application (`src/utils/userDisplay.ts`):

```typescript
export interface UserDisplayInfo {
    displayName: string;
    avatarInitials: string;
    isDeleted: boolean;
}

export function getUserDisplayInfo(user?: Partial<IUser> | null): UserDisplayInfo {
    if (!user || user.isDeleted) {
        return {
            displayName: 'Deleted User',
            avatarInitials: '?',
            isDeleted: true,
        };
    }

    const name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || 'Hiker';
    return {
        displayName: name,
        avatarInitials: getInitials(user.firstname, user.lastname),
        isDeleted: false,
    };
}
```

---

## 7. Implementation Checklist

- [ ] **Phase 1: Backend Callable Cloud Function**
  - Implement `deleteUserAccount` Cloud Function.
  - Implement active reservation guard verification.
  - Implement file purge for user storage folders.
  - Implement batch update for unlinking dependent emergency contacts.
- [ ] **Phase 2: Data Model & Repository Support**
  - Add optional `isDeleted?: boolean` and `deletedAt?: Date | string` to `IUser`.
  - Ensure `UserRepo` filters out `isDeleted: true` from global search lookups (e.g. emergency contact user searches).
- [ ] **Phase 3: Settings Screen UI Entry Point**
  - Add "Delete Account" button in `SettingsScreen.tsx` with destructive red styling.
  - Trigger double confirmation modal (e.g., typing `"DELETE"` or confirmation with warning text).
  - Handle loading spinner, call Cloud Function, and automatically log out with navigation to login screen.
- [ ] **Phase 4: Component Rendering Safeguards**
  - Update `ReviewCard`, `PostCardSkeleton`, and hike log lists to render `Deleted User` gracefully when encountering a tombstoned profile.
