# Thrail App Feature Scope

### User Role Definitions
- General user: Collective, regardless of roles
- Superadmin: developer, codebase access, all functionalities
- Admin: Business owners/managers/personnel, business functionalities
- User: General public users

## Objective 1: Hiking data source

| Feature | Superadmin | Admin | User | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Hiking Trail Database**
| ↳ Geographical information (Location, MASL, Start/End points) | O | O | O | |
| ↳ Difficulty information (Length, Elevation gain, Slope, Obstacles, Trail type/Circularity, Terrain quality, Points of difficulty) | 0 | O | O | |
| ↳ Tourism infrastructure (Shelters, Resting places, Viewpoints, Info boards, Clean water access, Natural & Cultural values, Network connectivity) | O | O | O | |
| ↳ Trail photos | X | X | X | Blocked by current Firebase plan |
| ↳ Trail status (Closures & notices) | O | O | O | |
| **Weather Information** | | | | |
| ↳ View current weather updates for a given trail | O | O | O | |
| ↳ Cancel / reschedule hikes based on extreme weather scenarios | X | X | X | |
| **Local Laws, Rules & Regulations** | | | | |
| ↳ View local laws, rules, trail management, and regulations | O | O | O | |
| **Safety Tips & Alerts** | | | | |
| ↳ Alerts for extreme weather conditions on booked trails | X | X | X | |
| ↳ Location-relevant hiking tips and reminders | O | O | O | |

## Objective 2: Social connectivity and business

| Feature | Superadmin | Admin | User | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Trail Reviews & Post-hike Survey** | | | | |
| ↳ View relevant reviews for a given trail | O | O | O | |
| ↳ Like trail reviews | O | O | O | |
| ↳ Create reviews / post-hike survey (Q1, Q2, Q3) for hiked trails | O | X | X | |
| ↳ Update own reviews | O | O | O | |
| ↳ Delete own reviews | X | X | X | |
| **Booking Hiking Offers** | | | | Reference: [BookingFeature.md](Booking/BookingFeature.md) |
| ↳ Create hiking offers | - | O | - | |
| ↳ View / read hiking offers | O | X | X | |
| ↳ Update own offers | - | X | - | |
| ↳ Soft delete own offers | - | X | - | |
| ↳ Delete own offers (strictly no booking/transaction history) | - | X | - | |
| ↳ Process user bookings upon submission of necessary documents | - | X | - | |
| ↳ Cancel offers | X | X | X | Missing details |
| ↳ Reschedule offers | X | X | X | Missing details |
| ↳ View and agree to organizer guidelines | X | X | X | No organizer guidelines, only app guidelines |
| ↳ Create booking reservation | X | X | X | Excl. admins |
| ↳ Upload necessary documents | O | X | X | Blocked by Firebase plan |
| ↳ Unconditionally cancel pending reservations | X | X | X | Excl. admins |
| ↳ Pay for a booking | X | X | X | Excl. admins |
| ↳ Request refunding | X | X | X | Excl. admins |
| ↳ Request cancellation | X | X | X | |
| ↳ Request rescheduling | X | X | X | |
| **Emergency Response** | | | | |
| ↳ Messaging between businesses/organizers and hikers | X | X | X | |
| ↳ Live location feed | X | X | X | |
| ↳ Emergency location message dispatcher (SOS) | X | X | X | |

## Objective 3: Offline accessibility

| Feature | Superadmin | Admin | User | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Offline Map** | | | | Downloadable / cached map data |
| **Offline Access to Trail Information** | X | X | X | |
| ↳ Area-specific tips | X | X | X | |
| ↳ Safety guidelines | X | X | X | |

## Objective 4: Recommendation System

| Feature | Superadmin | Admin | User | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Recommendation Engine** | | | | |
| ↳ Generate monthly top-$n$ recommendations for users | X | X | X | |