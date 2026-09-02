# 🧪 Thrail — Weather Alert Feature Testing Guide

This document provides a step-by-step testing guide for QA engineers, developers, and team members to verify all components of the Weather Alert & Progressive Monitoring system.

---

## 📋 Table of Contents
1. [Prerequisites & Test Setup](#1-prerequisites--test-setup)
2. [Test Suite 1: 1-Click Cloud Function HTTP Testing](#2-test-suite-1-1-click-cloud-function-http-testing)
3. [Test Suite 2: Notifications Feed UI (`NotificationScreen`)](#3-test-suite-2-notifications-feed-ui-notificationscreen)
4. [Test Suite 3: Group Chat Pinned Weather Bulletin (`RoomScreen`)](#4-test-suite-3-group-chat-pinned-weather-bulletin-roomscreen)
5. [Test Suite 4: Trail Weather Tab & Local Weather Screen](#5-test-suite-4-trail-weather-tab--local-weather-screen)
6. [Test Suite 5: Scheduled Cron Simulation (Cloud Scheduler)](#6-test-suite-5-scheduled-cron-simulation-cloud-scheduler)
7. [Verification Checklist Matrix](#7-verification-checklist-matrix)

---

## 1. Prerequisites & Test Setup

### A. Environment
* **Firebase Project:** `default` (`thrail` on Blaze Plan)
* **Local App:** Running on Expo (`npx expo start`) connected via `.env.local` (pointing to `default` project).

### B. Quick Lookup: How to find your IDs
* **User ID (`userId`):**
  * Open [Firebase Console](https://console.firebase.google.com/) -> Project `thrail` -> **Authentication** -> **Users** tab -> Copy the **User UID** column.
* **Group ID (`groupId`):**
  * In [Firebase Console](https://console.firebase.google.com/) -> **Firestore Database** -> Click **`groups`** collection -> Copy any active document ID.

---

## 2. Test Suite 1: 1-Click Cloud Function HTTP Testing

Use the deployed test endpoint to simulate weather alerts with real meteorological data from Open-Meteo without needing manual database seeding.

### Test 1.1: Direct User Weather Alert Trigger
* **Action:** Open this URL in your web browser:
  ```
  https://us-central1-thrail.cloudfunctions.net/testGroupWeatherAlert?userId=YOUR_USER_ID&trail=Mt.+Daraitan
  ```
* **Expected Result:**
  1. Browser displays a JSON response with status `200 OK`:
     ```json
     {
       "success": true,
       "trailName": "Mt. Daraitan",
       "evaluation": {
         "status": "CAUTION",
         "headline": "🌧️ Weather Advisory: Mt. Daraitan (Eve-of-Hike Update)",
         "metrics": { "temperature": 26, "precipitationProbability": 65, "weatherCode": 61, "windSpeed": 22 },
         "checklist": [...]
       },
       "note": "Notification added to user YOUR_USER_ID"
     }
     ```
  2. Firestore creates a new notification document at:
     `/users/{userId}/notifications/{notificationId}`

---

### Test 1.2: Group Weather Alert Trigger (Targeting Participants)
* **Action:** Open this URL in your web browser with an active `groupId`:
  ```
  https://us-central1-thrail.cloudfunctions.net/testGroupWeatherAlert?groupId=YOUR_GROUP_ID
  ```
* **Expected Result:**
  1. Browser returns `200 OK` with `recipientsCount` matching all participants in `group.participantsIds`.
  2. Alert document is written to:
     `/groups/{groupId}/alerts/{alertId}`
  3. In-app notifications are written to all participants' `/users/{userId}/notifications` sub-collections.
  4. FCM push notifications are dispatched to registered mobile devices.

---

## 3. Test Suite 2: Notifications Feed UI (`NotificationScreen`)

* **Target Screen:** Open the **Notifications tab** in the app.

| Test Case | Steps to Test | Expected Behavior | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **TC-2.1: Weather Alert Icon** | Open Notification tab after running Test 1.1 | Notification displays with a weather/rain/cloud icon instead of the generic bell. | [ ] |
| **TC-2.2: Headline & Body** | Inspect notification card | Title reflects phase (e.g. *"🌧️ Weather Advisory: Mt. Daraitan"*), and body details rain probability / wind. | [ ] |
| **TC-2.3: Unread State** | Receive new alert | Green dot or unread highlight displays until tapped. | [ ] |

---

## 4. Test Suite 3: Group Chat Pinned Weather Bulletin (`RoomScreen`)

* **Target Screen:** Open any group chat room (`/groups/{groupId}`) in the app.

| Test Case | Steps to Test | Expected Behavior | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **TC-3.1: Pinned Banner Visibility** | Trigger Test 1.2 for the group, then open the group chat | A pinned weather bulletin appears at the top of the chat (below header). | [ ] |
| **TC-3.2: Phase Badge** | Inspect the top-left badge of the banner | Displays the current countdown phase: `7-DAY FORECAST`, `3-DAY ADVISORY`, `EVE-OF-HIKE UPDATE`, or `FINAL DEPARTURE ALERT`. | [ ] |
| **TC-3.3: Weather Metrics** | Check the badge metrics row | Displays live stats (e.g. `🌧️ 70% Rain`, `🌡️ 27°C`). | [ ] |
| **TC-3.4: Expand / Collapse** | Tap anywhere on the banner header | Banner smoothly expands to reveal the full safety advisory and recommended checklist. | [ ] |
| **TC-3.5: Interactive Gear Checklist** | Tap checkmark boxes on gear items (e.g. *Waterproof backpack cover*, *High-traction shoes*) | Checkbox toggles active green state and strikethroughs the label without affecting other users. | [ ] |

---

## 5. Test Suite 4: Trail Weather Tab & Local Weather Screen

* **Target Screens:**
  1. **Home Screen -> Weather Card / Widget** (`WeatherScreen`)
  2. **Explore / Mountain Detail -> Weather Tab** (`TrailWeatherTab`)

### A. PAGASA Meteorological Metrics Grid:
| Metric Card | API Fields | PAGASA / Outdoor Classification | What to Verify |
| :--- | :--- | :--- | :--- |
| **PAGASA Heat Index** | `apparent_temperature`, `temperature_2m` | • `< 27°C`: Comfortable<br>• `27°C–32°C`: Caution<br>• `33°C–41°C`: Extreme Caution *(Heat exhaustion risk)*<br>• `42°C–51°C`: Danger *(Heat stroke possible)* | Card shows "Feels Like" in °C with PAGASA category & hydration advice. |
| **Rain & Heavy Rainfall Advisory** | `precipitation_probability`, `precipitation_sum`, `weather_code` | • `🟡 Yellow Advisory` (2.5–7.5 mm)<br>• `🟠 Orange Alert` (7.5–15 mm)<br>• `🔴 Red Warning` (> 15 mm / Torrential) | Shows rain chance (%), accumulated mm (e.g. `14.2 mm`), and official PAGASA warning badge. |
| **Wind & Peak Gusts** | `wind_speed_10m`, `wind_gusts_10m`, `wind_direction_10m` | • Beaufort Scale (Gentle / Moderate / Strong Breeze / Gale)<br>• Direction (From North, Northeast, etc.) | Shows sustained speed (km/h) + peak gusts (e.g. `Gusts up to 42 km/h`) + ridge safety advice. |
| **UV Index (WHO)** | `uv_index`, `uv_index_max` | • `0–2`: Low<br>• `3–5`: Moderate<br>• `6–7`: High<br>• `8–10`: Very High<br>• `11+`: Extreme | Displays current UV & peak daylight UV with sunscreen / protective wear reminder. |
| **Summit Visibility & Cloud Cover** | `visibility` (meters), `cloud_cover` (%) | • `> 6 km`: Clear scenic views<br>• `2–6 km`: Overcast / haze<br>• `< 2 km`: Dense mountain fog | Shows visibility in km and cloud coverage %, alerting hikers if fog reduces trail visibility. |
| **Atmospheric Pressure & Humidity** | `relative_humidity_2m`, `surface_pressure` (hPa) | • `80%+`: Very Humid (High sweat rate)<br>• `< 1008 hPa`: Low Pressure Area (LPA) activity | Shows relative humidity % and barometric pressure in hPa (indicates storm/LPA formation). |

---

### B. Actionable Checklist & Safety Cards:
| Test Case | Steps to Test | Expected Behavior | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **TC-4.1: Mountain Weather Safety Card** | Open Mt. Batulao or Mt. Makiling -> click **Weather** tab | Prominently renders the **Outdoor Safety Advisory & Actionable Checklist** card for that mountain. | [ ] |
| **TC-4.2: Dynamic Checklist Items** | Check items on a rainy forecast vs clear forecast | **Rainy:** Recommends waterproof bag cover, poncho, traction shoes.<br>**Extreme UV:** Recommends 2.5L+ water, SPF 50+ sunscreen.<br>**Severe Storm:** Highlights guide consultation warning. | [ ] |
| **TC-4.3: Home Screen Compact Banner** | View Home Screen when user's location has rain/hazard | Displays a compact advisory alert card at the top of Home. | [ ] |

---

## 6. Test Suite 5: Scheduled Cron Simulation (Cloud Scheduler)

* **Function:** `checkHikeWeatherAlerts`
* **Trigger Schedule:** Hourly (`0 * * * *` Asia/Manila)

### Steps to Test:
1. Open **[Google Cloud Scheduler Console](https://console.cloud.google.com/cloudscheduler)** (or Firebase Console -> Functions).
2. Locate `firebase-schedule-checkHikeWeatherAlerts-us-central1`.
3. Check the checkbox `[x]` on the left.
4. Click **`Force run`** in the top toolbar.
5. Click the job name -> **Logs** to inspect the execution log:
   * Should log: `[checkHikeWeatherAlerts] Evaluating X active groups...`
   * Resolves mountain coordinates.
   * Logs alert creation for groups within the T-168, T-72, T-24, or T-3 windows.

---

## 7. Verification Checklist Matrix

- [ ] **Data Integrity**: Alert documents successfully saved to `/groups/{groupId}/alerts/{alertId}`.
- [ ] **PAGASA Metrics**: Heat Index (°C), Rainfall Warning (Yellow/Orange/Red), Wind Gusts, Summit Visibility, and Atmospheric Pressure (hPa) render with real Open-Meteo values.
- [ ] **Privacy**: Only participants listed in `group.participantsIds` receive push notifications for that hike.
- [ ] **Deduplication**: Function does not spam users with repeat alerts within the same countdown window unless weather severity changes.
- [ ] **Error Handling**: Gracefully handles offline states, missing coordinates, or expired FCM tokens without crashing.
- [ ] **Cross-Platform UI**: Verified layout across Web, Android, and iOS viewports.
