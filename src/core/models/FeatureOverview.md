# Thrail App Feature Scope

## Objective 1: Hiking data source
1. Hiking trail database
2. Weather information
3. Local laws, rules, and regulations
4. Safety tips

## Objective 2: Social connectivity and business
1. Booking hiking offers
    - Reserve hiking offers ([@/src/core/models/Booking/BookingFeature.md](Booking/BookingFeature.md))
    - Pay reserved offers
    - Cancellation of reserved hikes
    - Rescheduling of reserved hikes
    - Refund for cancelled hikes
2. Connecting to other hikers
    - Social media feed from other hikers
    - Messaging between businesses and other hikers
3. Emergency response 
    - Live location feed
    - Emergency location message dispatcher

## Objective 3: Offline accessibility
1. Offline map

## Objective 4: Recommendation System
1. Recommendation engine



# Feature Functionalities

## Booking 
1. Booking of available offers
2. Payments 
3. Cancellation
4. Refund

### Flows
1. Normal Flow [Tested, Done]
    - Admin publishes offer for a trail 
    - User reserves offer
    - Admin approves the booking
    - User pays the hike fee

2. Admin rejects due to error in document submitted [Tested]
    - Admin publishes offer for a trail
    - User reserves offer
    - Admin rejects document submitted
    - User resubmits [#33](https://github.com/arREY-N/thrail_app/issues/33)
    - Admin checks 
        - Rejected: repeat resubmission
        - Approved: proceed to payment
    - Users pays the hike fee

3. Admin cancels approved reservation [Tested]
    - Admin publishes offer for a trail
    - User reserves an offer
    - Admin approves the booking
    - Admin cancels the booking, give options to user
        - Reschedule: book another hike [TBI] 
        - Cancel: no more booking [Done]

4. User cancels approved booking [Tested, Done]
    - Admin publishes offer for a trail
    - User reserves an offer
    - Admin approves the booking
    - User cancels approved booking, give reason
    - Admin checks
        - Approved: cancel reservation 
        - Rejected: indicate reason, user can reappeal

5. Admin cancels paid reservation [Tested]
    - Admin publishes offer for a trail
    - User reserves an offer
    - Admin approves the booking
    - User pays the amount (full/down)
    - Admin receives payment
    - Admin cancels, give reason
        - Reschedule: choose another offer [TBI]
        - Refund: refund amount paid [TBI]

6. User cancels paid reservation [Tested]
    - Admin publishes offer for a trail
    - User reserves an offer
    - Admin approves the reservation
    - User pays the amount
    - Admin receives payment
    - User cancels booking, give reason
        - Reschedule: choose another offer [TBI]
        - Refund: refund amount paid [TBI]

7. User cancel reservation [Tested, Done]
    - Admin publishes offer for a trail
    - User reserves an offer
    - User cancels
    - Reservation removed