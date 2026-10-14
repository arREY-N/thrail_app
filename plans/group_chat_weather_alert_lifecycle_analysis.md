# Group Chat Weather Alert Lifecycle & Expiration Analysis

## 1. Executive Summary

This document provides a technical audit and architectural recommendation regarding the lifecycle of weather alerts in group chats (`RoomScreen.tsx` / `GroupWeatherAlertBanner.tsx`). 

### Core Question:
> *Does the alert end after the hike? Does it disappear in the group chat the alert banner? Are we already done that?*

### Direct Answer:
**No. Currently, the alert does NOT end or disappear after the hike ends. We have not implemented alert expiration yet.**

---

## 2. Current Architecture & Root Cause Analysis

### A. Cloud Functions (`functions/index.js`)
* **Scheduled Cron**: `checkHikeWeatherAlerts` runs hourly (`0 * * * *` Asia/Manila) to evaluate active groups (`status == 'active'`).
* **Hike Date Evaluation**:
  ```javascript
  let diffHours = hikeDate && hikeDate.isValid ? hikeDate.diff(nowManila, 'hours').hours : null;

  if (diffHours != null) {
      if (diffHours >= 0 && diffHours <= 3) currentPhase = 'T-3';
      else if (diffHours > 3 && diffHours <= 24) currentPhase = 'T-24';
      else if (diffHours > 24 && diffHours <= 72) currentPhase = 'T-72';
      else if (diffHours > 72 && diffHours <= 168) currentPhase = 'T-168';
  }

  if (!currentPhase) {
      return { skipped: true, reason: 'Hike date is outside the 7-day forecast window or date is invalid.' };
  }
  ```
* **The Gap**:
  * Once the hike date passes (`diffHours < 0`), the cron job merely **skips** the group.
  * It does **not** mark existing alerts as expired, does **not** update group status, and does **not** delete old alert documents.

### B. Firestore Alert Storage (`groups/{groupId}/alerts`)
* Alert documents created during `T-168`, `T-72`, `T-24`, and `T-3` remain in Firestore indefinitely.
* The last document added is usually the `T-3` ("FINAL DEPARTURE ALERT").

### C. Client-Side Subscription (`GroupRepository.ts` & `GroupWeatherAlertBanner.tsx`)
* In `GroupRepository.ts`:
  ```typescript
  listenToLatestWeatherAlert(groupId: string, onUpdate: (alert: IWeatherAlert | null) => void) {
      const q = query(
          collection(db, 'groups', groupId, 'alerts'),
          orderBy('createdAt', 'desc'),
          limit(1)
      );
      ...
  }
  ```
* In `GroupWeatherAlertBanner.tsx`:
  ```typescript
  const { latestAlert, isLoading } = useGroupWeatherAlert(groupId);
  if (isLoading || !latestAlert) return null;
  ```
* **The Gap**:
  * The banner blindly renders the most recent alert document retrieved from Firestore.
  * It does **not** check whether the hike has already concluded.
  * **Result**: Months after a hike has finished, opening the group chat will still display the `T-3 FINAL DEPARTURE ALERT` banner pinned at the top.

---

## 3. Recommended Lifecycle Strategy

To ensure group chats automatically dismiss stale weather alerts once the hike is over, we recommend a two-tier approach:

### Tier 1: Frontend Guard (Immediate & Graceful)
In `GroupWeatherAlertBanner.tsx` (or `useGroupWeatherAlert`):
1. Receive the group or hike date (`offer.date`, `offer.endDate`, or `hikeDate`).
2. Calculate if the hike has completed (e.g., `currentTime > hikeEndDate + 12 hours` buffer for post-hike travel).
3. If completed, return `null` immediately.
4. **Benefit**: Instantly clears stale banners for all existing and past hikes without requiring database migrations or cloud script executions.

### Tier 2: Backend Cleanup / Status Flag (Data Hygiene)
In `functions/index.js` (`checkHikeWeatherAlerts`):
1. When `diffHours < -24` (more than 24 hours post-hike):
   * Option A: Set `{ expired: true }` on past alerts in `/groups/{groupId}/alerts`.
   * Option B: Automatically delete documents in `/groups/{groupId}/alerts` once the group is completed or archived.
2. **Benefit**: Keeps Firestore storage clean and prevents stale data accumulation.

---

## 4. Implementation Checklist

- [ ] Create `plans/group_chat_weather_alert_lifecycle_analysis.md` (Documented).
- [ ] Update `GroupWeatherAlertBanner.tsx` to accept `hikeDate` / `currentGroup` and hide when the hike has passed.
- [ ] (Optional) Add automatic alert expiration in Cloud Function cron.
