# Booking Feature

```
Allow users to reserve and book hiking offers from businesses and for admins to review and process reservations.
```

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


## Use Case

### Users
- Reserve spots in hiking business offers. 

### Admin
- Process reservation requests and payments.

## Test Cases

### Users
#### Create/Update

> Do's
1. Users must be able to reserve for available hiking offers.
2. `Users must be able to create another reservation on the same offer if their previous reservation is rejected.`
    - Blocked for now; testing
3. `Users must be able to update their contact number and emergency contact person upon creation and submission of booking reservations.` 
    - Issue [#26](https://github.com/arREY-N/thrail_app/issues/26)
4. Users must be able to either enter the information of their contact person in case of emergency or select them from the application's user database, if they have an existing account.
5. Users must be able to submit all the documents required by the business and the application before proceeding with the reservation.
6. `Users must be able to add or update any of the documents they have submitted for the reservation during creation of request.`
    - Issue [#33](https://github.com/arREY-N/thrail_app/issues/33)
7. Users must be able to agree to the terms and conditions of the business and the application before submitting a reservation.
8. `Users must be able to update booking reserved pax upon reservation.`

> Dont's
1. Users must not be able to create reservations on expired offers.
2. `Users must not be able to create multiple reservations under one offer.`
    - Issue [#28](https://github.com/arREY-N/thrail_app/issues/28)
3. Users must not be able to create reservations without submitting the following requirements: 
    - Name and number or the app ID of a designated emergency contact person.
    - The user's own phone number.
    - A picture of the user's valid ID.
    - Medical certificate, if required by the hiking offer.
    - Parent/Guardian Valid ID for users that is not of legal age.
4. Users must not be able to submit reservation without reading and accepting the terms and conditions of the application and the business.
5. Users must not be able to submit reservations with incomplete contact information.

#### Read
> Do's
1. Users must be able to view all currently available offers.
2. Users must be able to view all of the documents they have submitted for the reservation.
3. Users must be able to view their current contact information saved in the application database.
4. Users must be able to view the contact information of their emergency contact person for the reservation.

> Dont's
1. Users must not be able to view expired offers.
2. `Users must not be able to view cancelled offers.`
    - Cancellation not yet fully done

#### Delete
> Do's
1. Users must be able to delete booking reservations that has not been processed.
> Dont's
1. Users must not be able to delete approved/rejected reservations.
2. Users must not be able to delete booking records after the scheduled hike.

#### Others
> Do's

> Dont's

### Admins
#### Create/Update
> Do's
1. Admins must be able to approve or reject status based on the documents attached to the user's request.
> Dont's
1. Admins must not be able to create requests for their own business offers.

#### Read
> Do's
1. Admins must be able to read only the requests made by user for offers owned by the business.
> Dont's
1. Admins must not be able to read user bookings for other businesses.

#### Delete
> Dont's
1. Admins must not be able to delete any user booking.

#### Others
> Do's
> Dont's