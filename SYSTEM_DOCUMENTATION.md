# Thrail System Architecture & In-Depth Technical Documentation

This documentation provides a comprehensive technical exploration of the **Thrail** codebase, covering the architectural implementation, data models, workflows, and security posture across the mobile client (React Native / Expo), backend infrastructure (Firebase Cloud Functions & Firestore), and algorithmic services (Python TARS recommendation engine).

---

## Table of Contents
1. [Trail Information Database and Relevant Hiking Data](#1-trail-information-database-and-relevant-hiking-data)
   - [1.1 Architecture & Core Domain Model](#11-architecture--core-domain-model)
   - [1.2 3D GeoJSON Processing & Elevation Mechanics](#12-3d-geojson-processing--elevation-mechanics)
   - [1.3 Weather Intelligence & Progressive T-Minus Engine](#13-weather-intelligence--progressive-t-minus-engine)
   - [1.4 Ratings and Reviews Recalculation Flow](#14-ratings-and-reviews-recalculation-flow)
   - [1.5 Security Threat Analysis: Trail & Hiking Data](#15-security-threat-analysis-trail--hiking-data)
2. [Business and Hiker Connectivity: Booking, Messaging, and Community Feed](#2-business-and-hiker-connectivity-booking-messaging-and-community-feed)
   - [2.1 Commercial Lifecycle: Offers & Bookings](#21-commercial-lifecycle-offers--bookings)
   - [2.2 Payment Gateway Pipeline (PayMongo & Cloud Functions)](#22-payment-gateway-pipeline-paymongo--cloud-functions)
   - [2.3 Real-Time Messaging & Live GPS Hiker Tracking](#23-real-time-messaging--live-gps-hiker-tracking)
   - [2.4 Community Feed & Social Interactivity](#24-community-feed--social-interactivity)
   - [2.5 Security Threat Analysis: Connectivity, Booking & Messaging](#25-security-threat-analysis-connectivity-booking--messaging)
3. [Offline Functionality](#3-offline-functionality)
   - [3.1 Offline Map Rendering (MapLibre & Protomaps PMTiles)](#31-offline-map-rendering-maplibre--protomaps-pmtiles)
   - [3.2 Offline Waypoints & Map POIs](#32-offline-waypoints--map-pois)
   - [3.3 State Persistence & Data Caching](#33-state-persistence--data-caching)
   - [3.4 Resilient Background GPS Tracking & Storage](#34-resilient-background-gps-tracking--storage)
   - [3.5 Security Threat Analysis: Offline Functionality](#35-security-threat-analysis-offline-functionality)
4. [Recommendation System (TARS 2.0 Microservice)](#4-recommendation-system-tars-20-microservice)
   - [4.1 Architectural Design of the Engine](#41-architectural-design-of-the-engine)
   - [4.2 17-Dimensional Feature Vector Space ($p=17$)](#42-17-dimensional-feature-vector-space-p17)
   - [4.3 Dual-Anchor Profiling: $P_e$ and $P_d$](#43-dual-anchor-profiling-p_e-and-p_d)
   - [4.4 Hybrid Blending & The Dynamic Alpha Tuner ($\alpha$)](#44-hybrid-blending--the-dynamic-alpha-tuner-alpha)
   - [4.5 Continuous Profile Evolution (Beta Corrector Factor $\beta$)](#45-continuous-profile-evolution-beta-corrector-factor-beta)
   - [4.6 Security Threat Analysis: Recommendation Microservice](#46-security-threat-analysis-recommendation-microservice)
5. [Comprehensive Security Audit & Threat Matrix](#5-comprehensive-security-audit--threat-matrix)
6. [Summary and Next Architectural Steps](#6-summary-and-next-architectural-steps)

---

## 1. Trail Information Database and Relevant Hiking Data

### 1.1 Architecture & Core Domain Model
The Trail module is structured following the **Domain Facade Pattern** in [`src/core/models/Trail/Trail.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/Trail.ts), delegating concerns across:
* **Interfaces & Types:** [`Trail.types.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/interfaces/Trail.types.ts)
* **Firestore Repository:** [`TrailRepository.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/repositories/TrailRepository.ts)
* **Zustand State Store:** [`trailStoreCreator.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/stores/trailStoreCreator.ts) with platform persistence in [`trailStore.native.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/stores/trailStore.native.ts)
* **Topological & Geo-computation Utilities:** [`GeoJSONProcessor.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/utils/GeoJSONProcessor.ts) and [`TrailComputation.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/utils/TrailComputation.ts)

```
                            ┌────────────────────────┐
                            │  3D GeoJSON Asset      │
                            │ (trails_3D_final_v2)   │
                            └───────────┬────────────┘
                                        │ (parse & build index)
                                        ▼
┌──────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│  Trail Screen UI     │◄───┤  GeoJSONProcessor      │◄───┤  TrailComputation      │
│  (Explore / Details) │    │  (Haversine & Filter)  │    │  (Gain/Loss/Distance)  │
└──────────┬───────────┘    └────────────────────────┘    └────────────────────────┘
           │
           ▼
┌──────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│  useTrailStore       │◄───┤  TrailRepository       │◄───┤  Firestore Collection  │
│  (AsyncStorage Cache)│    │  (Data Converter)      │    │  /trails/{trailId}     │
└──────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

#### Data Model Breakdown
A Trail document comprises four primary blocks:
1. **`general`**: Name, description, active/inactive flag, address, array of mountain names, provinces, guideline strings, safety tips, LGU regulations, rating ($0.0 - 5.0$), and `reviewCount`.
2. **`difficulty`**: LASCO rating ($1-9$), classification (`minor` vs `major`), length (km), elevation gain (MASL), slope percentage, obstacle intensity, estimated hiking hours, circularity (`Circuit`, `Traverse`, `Out-and-Back`), and difficulty point tags.
3. **`tourism`**: Amenities checklist (shelter, resting spots, information boards, water sources, rivers, waterfalls, historical monuments, local community presence, viewpoint types, cellular reception).
4. **`geography`**: Trailhead and summit geographic coordinates (`start` and `end` stored as `GeoPoint` in DB and `{ startLat, startLong, endLat, endLong }` in UI state).

---

### 1.2 3D GeoJSON Processing & Elevation Mechanics
Topological computations run locally on the client via [`GeoJSONProcessor.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/utils/GeoJSONProcessor.ts) and [`TrailComputation.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/utils/TrailComputation.ts):
* **Asset Loading:** Loads `trails_3D_final_v2.geojson` using `expo-asset` and `expo-file-system`.
* **Spatial Indexing:** A singleton in-memory map indexes coordinates by mountain name, filtering features to hiking-grade highways (`path`, `footway`).
* **Trailhead Radius Boundary:** Points further than $2,000\text{ m}$ (`TRAILHEAD_RADIUS_M`) from trailhead coordinates are discarded to remove irrelevant municipal road segments.
* **3D Haversine Distance & Noise Filtering:**
  $$\Delta\text{distance} = \sqrt{\text{Haversine}(\text{lat}_1, \text{lon}_1, \text{lat}_2, \text{lon}_2)^2 + (\Delta\text{altitude})^2}$$
  GPS and DEM jitter are filtered by enforcing `MIN_ELEVATION_CHANGE = 2m` and discarding unrealistic jumps exceeding `MAX_REASONABLE_GAIN = 300m`.

---

### 1.3 Weather Intelligence & Progressive T-Minus Engine
Weather monitoring functions in two layers:

#### Client-Side Live Weather (`weatherRepository.ts`)
* Communicates directly with the **Open-Meteo API** (using Philippine Standard Time `Asia/Manila` and $7$-day forecasts).
* Caches responses in `AsyncStorage` keyed by rounded coordinates (`weather_${roundLat}_${roundLon}`) with a $1$-hour TTL (`CACHE_EXPIRY_MS = 3,600,000`).
* Calculates hourly UV indices, precipitation probability, apparent temperature, and wind gusts.

#### Cloud-Side Progressive T-Minus Engine (`functions/index.js`)
* **Hourly Cron Trigger (`checkHikeWeatherAlerts`):** Queries `/groups` where `status == 'active'` and calculates the time remaining until hike departure:
  * **T-168h (7 Days):** General outlook advisory (daily max data).
  * **T-72h (3 Days):** Intermediate advisory check.
  * **T-24h (1 Day):** Eve-of-hike evaluation using hourly precision with a $3$-hour recurring watch for adverse weather.
  * **T-3h (Departure):** Final pre-departure alert.
* **Safety Rules Matrix:** Evaluates WMO weather codes, wind speeds ($\ge 40\text{ km/h}$ Caution, $\ge 60\text{ km/h}$ Danger), torrential precipitation ($\ge 100\text{ mm}$), and UV index ($\ge 11$ Extreme, $\ge 13$ Hazard), creating group alerts in `/groups/{groupId}/alerts` and broadcasting multicast FCM push notifications to all participants.

---

### 1.4 Ratings and Reviews Recalculation Flow
Implemented in [`RecalculateTrailRating.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/RecalculateTrailRating.ts) and [`CreateReviewFlow.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/CreateReviewFlow.ts):
* Submitting a hike review computes:
  $$\text{New Rating} = \frac{(\text{Current Count} \times \text{Old Rating}) + \text{User Rating}}{\text{Current Count} + 1}$$
* Writes the updated rating and review count directly to `/trails/{trailId}` alongside saving the document into `/reviews/{reviewId}`.

---

### 1.5 Security Threat Analysis: Trail & Hiking Data
1. **Client-Side Rating Tampering & Race Conditions:**
   * In [`RecalculateTrailRating.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/RecalculateTrailRating.ts#L39-L60), the rating recalculation is executed on the client device. 
   * In [`firestore.rules`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L361-L373), an authenticated user is permitted to update `general.rating` and `general.reviewCount` directly on any trail document as long as the rating is between $0$ and $5$. A malicious client can manipulate rating updates or cause lost updates during concurrent submissions.
   * *Mitigation:* Move rating recalculation to a Firestore Cloud Function triggered `onDocumentCreated('reviews/{reviewId}')` using distributed transactions or field increments.
2. **Missing Rate Limiting on External Weather API:**
   * [`fetchWeatherFromApi`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/repositories/weatherRepository.ts#L10) invokes Open-Meteo from client devices. While cached in `AsyncStorage`, rapid app restarts or coordinates fuzzing can trigger upstream rate limits or IP bans.
3. **Unrestricted Trail Creation Rules Bypass:**
   * [`firestore.rules`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L349-L353) permits trail document creation if `request.auth.token.role in ['superadmin', 'admin']` OR if `get(/databases/.../users/$(request.auth.uid)).data.role in ['superadmin', 'admin']`. Relying on Firestore document checks rather than verified custom claims adds document read latency and risk of role spoofing if user doc write rules ever regress.

---

## 2. Business and Hiker Connectivity: Booking, Messaging, and Community Feed

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HIKER / USER CLIENT                              │
└───────┬───────────────────────────────┬──────────────────────────────┬──────┘
        │ 1. Book Offer                 │ 4. Initiate GCash/Maya       │ 6. Send Msg
        ▼                               ▼                              ▼
┌──────────────────┐            ┌──────────────────┐           ┌──────────────┐
│ /users/{uid}/    │            │ Cloud Function:  │           │ /groups/     │
│ bookings/{bid}   │            │ createPaymongo   │           │ {groupId}/   │
└───────┬──────────┘            └───────┬──────────┘           │ messages     │
        │ 2. Trigger onAddBooking       │ 5. Hosted Checkout   └──────┬───────┘
        ▼                               ▼                             │ 7. Trigger
┌──────────────────┐            ┌──────────────────┐                  │ onNewMessage
│ Admin Push Alert │            │ PayMongo Gateway │                  ▼
│ (FCM to Business)│            └───────┬──────────┘           ┌──────────────┐
└──────────────────┘                    │ 8. payment.paid      │ FCM Push to  │
                                        ▼    Webhook           │ Participants │
                                ┌──────────────────┐           └──────────────┘
                                │ Cloud Function:  │
                                │ paymentWebhook   │
                                └───────┬──────────┘
                                        │ 9. Update status to 'paid'/'downpayment'
                                        │    Self-heal /groups/{groupId}/members
                                        ▼
                                ┌──────────────────┐
                                │ /payments &      │
                                │ /bookings Sync   │
                                └──────────────────┘
```

### 2.1 Commercial Lifecycle: Offers & Bookings
* **Offers:** Created by verified business admins ([`CreateOfferFlow.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/CreateOfferFlow.ts)) under `/businesses/{businessId}/offers/{offerId}` and mirrored to root `/offers/{offerId}`. Holds `price`, `date`, `endDate`, `maxPax`, `minPax`, and `reservedPax`.
* **Booking Creation:** Implemented in [`CreateBookingFlow.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/CreateBookingFlow.ts):
  * Hikers verify contact numbers, emergency contacts, and upload required documents (IDs, medical clearances).
  * Validates single booking per hike date.
  * Writes to `/users/{userId}/bookings/{bookingId}` with initial status `'for-reservation'`.
* **State Machine:**
  `for-reservation` $\rightarrow$ `for-payment` (admin approves requirements) $\rightarrow$ `paid` or `downpayment` (gateway capture) $\rightarrow$ `completed` $\rightarrow$ `finished`.
  *Alternates:* `reservation-rejected`, `for-cancellation`, `refunded`, `for-reschedule`.
* **Slot Locking (`reservedPax`):** When reservations are confirmed or refunded, offer slots are adjusted (`increment(1)` / `increment(-1)`) via transactions or Cloud Function hooks to prevent overbooking past `maxPax`.

---

### 2.2 Payment Gateway Pipeline (PayMongo & Cloud Functions)
Payment processing is handled via serverless functions in [`functions/index.js`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/functions/index.js) and provider abstraction [`PayMongoProvider.js`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/functions/services/providers/PayMongoProvider.js):
1. **Checkout Creation (`createPaymongoCheckout`):**
   * Authenticates caller and loads booking record.
   * Invokes PayMongo API to create a hosted Checkout Session for GCash, Maya, or Credit/Debit card.
   * Appends session ID and sets initial status to `'pending'`.
2. **Webhook Verification (`paymentWebhook`):**
   * Listens on HTTP POST endpoint for `payment.paid` events.
   * Validates `paymongo-signature` HMAC SHA-256 header using the `PAYMONGO_WEBHOOK_SECRET`.
   * Locates target booking across collections using `collectionGroup('bookings').where('paymentIntentId', '==', id)`.
   * Marks payment as `captured`, calculates cumulative paid amount against offer price to transition status to `paid` or `downpayment`, and writes receipt records to `/payments`.
3. **Refund Orchestration (`refundBooking`):**
   * Enforces dual authorization: hikers can only request within a 10-day cancellation window for partial refunds (10%), while business admins can issue full (100%) or custom refunds.
   * Employs an in-flight distributed state lock (`status: 'processing_refund'`) across captured installments to prevent double refunds under concurrent execution.
   * Implements a **Waterfall Drain Allocation Loop** draining payments across multiple installment IDs until the target refund amount is satisfied.
   ``` 
   This shouldn't be a waterfall. The approach should be to apply the same refund percentage to each transaction record. 
   
   For example:
   Refund: 30%

   Payment A: 500
   Refund A: 150

   Payment B: 300
   Refund B: 90

   Total Refund: A + B = 240
   ```

---

### 2.3 Real-Time Messaging & Live GPS Hiker Tracking
* **Chat Architecture:** Managed in [`MessageRepository.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Message/repositories/MessageRepository.ts). Chats exist inside `/groups/{groupId}/messages` using Firestore real-time listeners (`onSnapshot`) with descending timestamps and pagination limits.
* **Notification Automation (`onNewMessage` Cloud Function):**
  * When a new message document is created in `/groups/{groupId}/messages`, the function resolves participant UIDs, retrieves their push notification tokens (`fcmTokens`), and sends multicast push alerts via Firebase Admin Messaging.
* **Live Location Mesh:**
  * Groups feature a subcollection `/groups/{groupId}/liveLocations/{userId}` for active hikers.
  * During an active hike, coordinates are updated to provide real-time group tracking and proximity monitoring.
  ```
  Ensure that location data, once shared, will always be available to all authorized users. This way we can ensure that the 'last known location' will always be visible even if the user lost their signal. 
  
  The marker should also provide the hiker's status: paused, stopped, signal lost, etc.
  ```

---

### 2.4 Community Feed & Social Interactivity
Implemented in [`CommunityScreen.tsx`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/features/Community/screens/CommunityScreen.tsx):
* Combines hike logs, trail photos, and ratings into a unified feed.
* Provides real-time likes via array updates (`likes` field on `/reviews/{reviewId}`).
* Ties into the **Leaderboard Module** ([`src/core/models/Leaderboard/`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Leaderboard/)), ranking hikers across metrics such as total distance covered, elevation gained, and completed trails.

---

### 2.5 Security Threat Analysis: Connectivity, Booking & Messaging
1. **Critical Privilege Escalation in Group Security Rules:**
   * In [`firestore.rules`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L73-L80):
     ```firestore
     match /groups/{groupId} {
       allow read: if request.auth != null;
       allow create: if request.auth != null;
       allow update: if request.auth != null;
     }
     ```
   * **Vulnerability:** Any authenticated user can modify *any* group document in the database, allowing unauthorized users to overwrite `participantsIds`, change the `businessId`, or alter offer prices.
   * *Mitigation:* Restrict group updates strictly to business owners (`request.auth.token.businessId == resource.data.business.id`) or superadmins.
2. **Live Location Privacy Leak:**
   * In [`firestore.rules`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L89-L90):
     ```firestore
     match /liveLocations/{userId} {
       allow read: if request.auth != null;
     }
     ```
   * **Vulnerability:** Any authenticated user can read real-time GPS locations of all hikers in any group, exposing coordinates to individuals who are not members of that hike.
   * *Mitigation:* Require `request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.participantsIds`.
3. **Unprotected Direct Booking Modification:**
   * In [`firestore.rules`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L278-L286):
     ```firestore
     match /{path=**}/bookings/{bookingId} {
       allow read: if request.auth != null;
       allow create, update: if request.auth != null && (
         request.auth.uid == request.resource.data.user.id || request.auth.token.role == 'admin'
       );
     }
     ```
   * **Vulnerability:** A user can directly modify their booking status to `'paid'` or alter payment array objects without completing payment gateway transactions.
   * *Mitigation:* Restrict client updates on critical fields (`status`, `payment`, `cancellationReason`) using `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` or manage status transitions exclusively via backend Cloud Functions.
4. **Conditional Bypass on Webhook Signature Verification:**
   * In [`functions/index.js`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/functions/index.js#L920-L928), if `WEBHOOK_SECRET` or the signature header is omitted, the webhook logs a warning and proceeds with processing:
     ```javascript
     } else {
         console.warn('[paymentWebhook] Processing webhook without secret/signature verification.');
     }
     ```
   * **Vulnerability:** If the environment secret is unset or misconfigured, an attacker could forge payment success webhooks to mark bookings as paid without actual funds transfer.
   * *Mitigation:* Terminate immediately with `res.status(500).send('Webhook secret unconfigured')` if secrets are absent.

---

## 3. Offline Functionality

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE RUNTIME ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────────────┘
            │
            ├─► 1. Map Tiles & Vector Geometries (Protomaps / MapLibre)
            │      • Local PMTiles container (pmtiles://protocol)
            │      • Local PBF Font Glyphs (NotoSans) in device storage
            │      • Vector styling layer stack (offlineStyle.ts)
            │
            ├─► 2. Domain & Application Data (Zustand + AsyncStorage)
            │      • 'trail-storage': Cached trails, offline points & details
            │      • 'hike-storage': Active hike metrics & offline route history
            │      • Open-Meteo weather forecast caching (1h local TTL)
            │
            └─► 3. Background GPS Telemetry & Crash Recovery
                   • Expo TaskManager ('background-location-task')
                   • Raw coordinate appending to CSV (thrail_current_hike.csv)
                   • Scatter & noise filtering (<25m accuracy, 0,0 rejection)
```

### 3.1 Offline Map Rendering (MapLibre & Protomaps PMTiles)
Offline maps are driven by **MapLibre Native** and **Protomaps PMTiles** in [`offlineStyle.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/features/Map/offlineStyle.ts) and [`TrailMap.native.tsx`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/features/Map/TrailMap.native.tsx):
* **Vector Archive Delivery:** Base map data is stored as a single `.pmtiles` archive bundled or downloaded locally, bypassing tile server connectivity requirements.
* **Local Font Glyphs:** Typography glyphs are resolved from device storage (`${fontBaseDir}{fontstack}/{range}.pbf`) via [`resolveOfflineFonts.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/utils/resolveOfflineFonts.ts).
* **Layer Stacking Strategy:**
  1. Base background (`#C4DFF0` ocean color).
  2. Earth layer (`#EFE9E1` land base).
  3. Landuse & Natural foliage (forests `#2E8B32`, parks `#5DAA40`, rocky areas `#8D7B6A`).
  4. Water bodies (lakes/rivers `#80deea`).
  5. Building footprints (`#C8C0B0`).
  6. Roads & Trails (`#8B5E3C` dashed line style for hiking tracks).
  7. Points of Interest (`pois-labels` and `places-labels`).

---

### 3.2 Offline Waypoints & Map POIs
* Each Trail contains an optional `offlinePoints` array:
  ```typescript
  export interface IOfflinePoint {
      id: string;
      name: string;
      type: 'checkpoint' | 'viewpoint' | 'water' | 'shelter' | 'summit' | 'hazard';
      description: string;
      x: number; // horizontal percentage coordinate (0-100)
      y: number; // vertical percentage coordinate (0-100)
  }
  ```
* Percentage-based mapping enables rendering POI pins accurately over static raster overviews or vector map canvases without coordinate skew.

---

### 3.3 State Persistence & Data Caching
Offline persistence operates on two tiers:
1. **Zustand Persistence:** Stores like `useTrailStore` ([`trailStore.native.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/stores/trailStore.native.ts)) use `createJSONStorage(() => AsyncStorage)` under key `'trail-storage'`.
   * On boot without internet, `fetchAll()` checks `NetInfo.fetch()`; if offline, it serves cached data without throwing network exceptions.
2. **Weather Caching:** [`weatherRepository.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/repositories/weatherRepository.ts) stores responses in local storage with timestamps. When network requests fail, stale cached weather forecasts are returned with an `isStale: true` flag.

---

### 3.4 Resilient Background GPS Tracking & Storage
Implemented in [`locationTask.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/utility/locationTask.ts) and [`hikeStorage.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/utility/hikeStorage.ts):
* **Headless Background Location Task:** Registered via `expo-task-manager` as `LOCATION_TASK = "background-location-task"`. Captures background location events even when the phone screen is locked or the app is minimized.
* **Telemetry Quality Gate:**
  * Rejects Null Island fixes (`lat == 0 && lon == 0`) and invalid coordinate bounds.
  * Rejects low-precision or noisy fixes where accuracy is $> 25\text{ m}$.
* **Local CSV Crash Recovery:**
  * Location fixes are serialized and written directly to disk via `expo-file-system` at `${documentDirectory}thrail_current_hike.csv`.
  * If the operating system terminates the app due to memory constraints, the session state is reconstructed from this CSV on relaunch.

---

### 3.5 Security Threat Analysis: Offline Functionality
1. **Unencrypted File Storage for GPS Trails & Documents:**
   * Coordinates and tracking logs are appended in cleartext CSV files (`thrail_current_hike.csv`) in `documentDirectory`.
   * Downloaded user verification files and identity images are retained unencrypted in device cache.
   * *Mitigation:* Use Encrypted Storage (e.g. `expo-secure-store` or SQLCipher) for sensitive trajectory metadata.
2. **Stale Cache Vulnerabilities During Trail Closures:**
   * If an admin marks a trail as inactive or issues an emergency hazard alert in Firestore, an offline device relies entirely on cached state, potentially leading hikers onto hazardous trails without visibility into newly published warnings.
   * *Mitigation:* Implement high-priority SMS fallbacks or time-bound cache expiration warnings alerting users that offline trail status is older than 24–48 hours.

---

## 4. Recommendation System (TARS 2.0 Microservice)

> **Implementation Status:**  
> The mathematical recommendation engine exists in the repository as a standalone Python microservice under the [`recommendation_engine/`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/) directory (named **TARS 2.0**).  
> In the live mobile application, the user-facing store methods (`setRecommendedTrail` and `setDiscoverTrail` in [`trailStoreCreator.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Trail/stores/trailStoreCreator.ts#L249-L257)) currently return empty arrays (`[]`), and the frontend recommendation store acts as an empty facade awaiting production service integration.

```
┌────────────────────────────────────────────────────────────────────────┐
│               TARS 2.0 RECOMMENDATION PIPELINE (PYTHON)                │
└────────────────────────────────────────────────────────────────────────┘

User Onboarding Preferences ────► [ P_e (Easy Anchor Profile) ]
                                              │
Past Hike History & Logs    ────► [ P_d (Difficult Anchor Profile) ]
                                              │
                                              ▼
                                 [ 17-Feature Normalization ]
                                 (Provinces, Peaks, LASCO,
                                  Length, Elevation, Amenities)
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [ Content-Based (CB) ]                              [ Collaborative (CF) ]
         Gower / Manhattan Distance                         Cosine / Pearson Sim
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                             [ Alpha Tuner Dynamic Blending ]
                             R_tu = [ α(CB) + (1-α)(CF) ] / √17
                                              │
                                              ▼
                           [ Top-3 Pe & Top-2 Pd Ranked Output ]
                                              │
                                              ▼
                           [ Feedback: Beta Corrector Update ]
                           P_xu = P_xo + (1/k) ∑ β_i (H_xi - P_xo)
```

### 4.1 Architectural Design of the Engine
The recommendation service is located in [`recommendation_engine/`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/):
* **FastAPI Entry Point:** [`app.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/app.py) provides endpoints `/recommend`, `/train`, `/health`, and `/batch-recommend`.
* **Core Recommendation Engine:** [`core/recommender.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/core/recommender.py) implements the hybrid recommendation pipeline.
* **Distance Strategies:** [`core/distance_strategies.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/core/distance_strategies.py) implements Strategy Pattern metrics (Gower Distance, Euclidean, Cosine, Manhattan across 23 benchmark variants).
* **Profile Manager:** [`core/profile_manager.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/core/profile_manager.py) manages vector translations, anchor generation, and profile learning updates.

---

### 4.2 17-Dimensional Feature Vector Space ($p=17$)
Every trail $t$ and user state $u$ is transformed into a continuous normalized vector $V \in [0, 1]^{17}$ across six categories:
1. **Provinces ($v_1 - v_5$):** One-hot or multi-hot distribution across key hiking provinces (Batangas, Cavite, Laguna, Rizal, Benguet).
2. **Mountain Affinities ($v_6 - v_{10}$):** Proximity weights for major peaks (Makiling, Batulao, Tagapo, Maculot, Daraitan).
3. **LASCO Technical Rating ($v_{11}$):** Normalized trail difficulty score $\frac{\text{lascoRating}}{9}$.
4. **Trail Length Index ($v_{12}$):** Scaled length against max regional trail length $\frac{\text{length}}{\text{length}_{\max}}$.
5. **Elevation Gain Index ($v_{13}$):** Scaled ascent $\frac{\text{gain}}{\text{gain}_{\max}}$.
6. **Tourism Infrastructure ($v_{14} - v_{17}$):** Presence of drinking water, shelter, cellular reception, and river crossings.

---

### 4.3 Dual-Anchor Profiling: $P_e$ and $P_d$
To balance user comfort with progression, the engine establishes two profile anchors:
* **$P_e$ (Easy / Onboarding Baseline Anchor):** Built from initial user onboarding selections (preferences, comfortable difficulty, desired amenities). Target: Comfortable, high-confidence matches.
* **$P_d$ (Difficult / Progression Anchor):** Reverse-engineered from the user's highest completed hikes and elevation profiles. Target: Challenging aspirational trails.
* **Categorization Output:** Produces **Top-3 trails matching $P_e$** and **Top-2 trails matching $P_d$**, giving the user a 3:2 balance of accessible vs. challenging hikes.

---

### 4.4 Hybrid Blending & The Dynamic Alpha Tuner ($\alpha$)
The final ranking score $R_{tu}$ merges Content-Based filtering ($CB$) and Collaborative Filtering ($CF$):
$$R_{tu} = \frac{\alpha \cdot CB_{tu} + (1 - \alpha) \cdot CF_{tuv}}{\sqrt{17}}$$

* **Alpha Tuner Equation:**  
  Controls the balance based on user log history $u$ relative to cold-start threshold $m$ ($m=5$ recorded hikes):
  $$\alpha = \begin{cases} 1 - \frac{m}{2u} & \text{if } u \le m \\ 0.5 & \text{if } u > m \end{cases}$$
  *For a novice ($u=1$), $\alpha \approx 1.0$, relying almost entirely on Content-Based matching. As the hiker logs more trails ($u > 5$), $\alpha \rightarrow 0.5$, balancing collaborative community preferences equally.*

---

### 4.5 Continuous Profile Evolution (Beta Corrector Factor $\beta$)
When a hiker completes a hike $H$ and provides feedback, the user profile is updated using the **Beta Corrector Function**:
$$P_{xu} = P_{xo} + \frac{1}{k} \sum_{i=1}^k \beta_i (H_{xi} - P_{xo})$$
Where:
* $\beta_i = \frac{R_{tu}}{2}$ if the hike outcome matched user expectations.
* $\beta_i = -\frac{1 - R_{tu}}{2}$ if the user reported dissatisfaction or technical mismatch.

---

### 4.6 Security Threat Analysis: Recommendation Microservice
1. **Missing Authentication on FastAPI Endpoints:**
   * In [`recommendation_engine/app.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/app.py), the API routes (`/recommend`, `/batch-recommend`, `/train`) currently do not validate Firebase Auth JWT bearer tokens. Anyone with network access to the port can query user profiles or trigger retraining.
   * *Mitigation:* Require Firebase Admin SDK token verification (`firebase_admin.auth.verify_id_token`) as a FastAPI dependency.
2. **Profile Poisoning via Rating Ingestion:**
   * Since the microservice ingests user ratings to update feature weights, an attacker creating multiple fake accounts or manipulated review logs could distort collaborative filtering scores for specific business offers.
   * *Mitigation:* Introduce minimum account verification thresholds and outlier rejection filters before feedback is factored into the $\beta$-corrector update matrix.

---

## 5. Comprehensive Security Audit & Threat Matrix

| Severity | Threat / Vulnerability | Affected Component | File Reference | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | **Unrestricted Group Updates** | Firestore Rules | [`firestore.rules:79`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L79) | Change `allow update: if request.auth != null;` to check caller role or require business ownership. |
| **CRITICAL** | **Live Location Privacy Exposure** | Group Live Tracking | [`firestore.rules:89`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L89) | Restrict read permissions on `/liveLocations` to authenticated group participants only. |
| **HIGH** | **Direct Client Booking Status & Payment Manipulation** | Booking Rules | [`firestore.rules:278`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/firestore.rules#L278) | Restrict client updates from writing `status` or `payment` arrays directly; enforce updates via Cloud Functions. |
| **HIGH** | **Bypassable Webhook Signature Verification** | Payment Functions | [`functions/index.js:920`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/functions/index.js#L920) | Throw a 500 error if `PAYMONGO_WEBHOOK_SECRET` is unset rather than processing unverified webhooks. |
| **HIGH** | **Storage Rule Logic Flaw** | Firebase Storage | [`storage.rules:10`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/storage.rules#L10) | Fix `request.auth.token == 'superadmin'` to `request.auth.token.role == 'superadmin'`. |
| **MEDIUM** | **Direct Client Rating Recalculation** | Reviews & Ratings | [`RecalculateTrailRating.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/RecalculateTrailRating.ts#L52) | Move rating calculations to Firestore triggers (`onDocumentCreated`) to prevent race conditions and rating inflation. |
| **MEDIUM** | **Unauthenticated Recommendation Endpoints** | Python Microservice | [`app.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/recommendation_engine/app.py) | Integrate Firebase Admin Bearer token authorization in FastAPI route dependencies. |
| **MEDIUM** | **Unencrypted Local GPS Track Storage** | Native Device Storage | [`hikeStorage.ts:24`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/utility/hikeStorage.ts#L24) | Encrypt cached trajectory CSV files and cached identity documents stored on device storage. |

---

## 6. Summary and Next Architectural Steps

1. **Rule Hardening:** Address the group and live location permission gaps in `firestore.rules` before public launch to protect hiker location privacy and booking state integrity.
2. **Service Integration:** Connect the React Native client with the Python TARS microservice by deploying `app.py` (via Cloud Run or containerized compute) and calling it through Cloud Functions or authenticated API client hooks.
3. **Rating Recalculation Migration:** Move the client-driven rating aggregation in `RecalculateTrailRating.ts` to background Firestore triggers using atomic field updates (`FieldValue.increment`).
