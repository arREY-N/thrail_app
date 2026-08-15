# Cancellation Feature


- TODO: TO BE CONTINUED

To set proper reservation distinction, the following status are to be followed:
- For reservation: Users who have submitted reservation requests and is under the approval of the admin based on the submission of required information or documents.
- Pending docs: If there are problems with the submitted documents, the user will be asked to resubmit the necessary documents.
- For payment: Once approved, the reservation status will be updated and the user will be prompt to pay either the down payment or the full amount.
- Downpayment: Incomplete payments will mark the reservation with downpayment until the remaining balance is paid.
- Paid: Once the full amount is paid, the reservation will be marked as paid
- Completed/Finished: Once the hike was accomplished, the reservation will be marked as finished.

- For cancellation: users who have sent cancellation requests will have their reservation marked as for-cancellation

For users, the application allows cancellations as long as the offer has not expired or the minimum period set by the admin has not been reached. 

```
Cancellation of booking reservations can be requested by both users and admins, given valid reasons. However, if the business explicitly states in their terms and conditions, as displayed and read by the user before reserving, that such action is not allowed, then the functionality will not be available to the user for that specific reservation. The user can take this up to the business through the chat feature. However, any request in such cases will not be handled by the application any further. 
``` 

## Use Cases

### Users
- Create and submit cancellation requests for reserved/booked hikes. [Done]   
- Receive refunds for approved cancellation requests.
- Appeal for rejected cancellation requests. [Done]

### Admin
- Process cancellation requests. [Done]
- Process appeals for rejected requests. [Done]
- Cancel user bookings without requests.  
- Send cancellation of booking notice to users. 
- Cancel hiking offers. 
- Schedule refund to users for cancelled bookings.
- Update offer information on user cancellation.
- Update offer information on admin cancellation.
- Update booking group chat information on user cancellation. [Done]
- Update booking group chat information on admin cancellation. 

### System
- Notify users for updated on cancellation requests.
- Notify admins for incoming cancellation requests.
- Run cloud refund procedure.

- ReservedPax must only be updated once refund is set by the admin, whether the cancellation is requested by the user or the admin.

## Test Cases

### Users
#### Create/Update
> Do's
1. Users must be able to create new requests.
2. Users must be able to update requests, as long as it's not approved.
3. Users must be able to appeal for rejected requests.
4. Users must be able to create requests for for-payment bookings.
5. `Users must be able to create requests for paid bookings.`
6. `Users must be able to choose between cancellation and rescheduling for admin-cancelled bookings`

> Dont's
1. Users must not be able to send requests to expired offers.
2. Users must not be able to update approved requests.


#### Read
> Do's
1. Users must be able to see all of their requests and its details.

> Dont's
1. Users must not be able to see other user's requests.
2. `Users must not be able to check group chat messages upon approval of cancellation request.`

#### Delete
> Do's
1. Users must be able to delete pending requests.

> Dont's
1. Users must not be able to delete processed requests.

#### Others
> Do's
1. `Users must be able to receive refund on approved cancellation requests.`
2. `Users must be removed from the group chat once cancellation request is approved.`

### Admin
#### Create/Update
> Do's
1. Admins must be able to update cancellation requests, as long as the request is still pending.
2. Admins must be able to process previously rejected requests if the user submitted an appeal.
3. Admins must decrement the current reservedPax in the offer details if user request is approved.
4. Admins must update the associated booking status if request is approved.
5. `Admin must still be able to process unprocessed requests made pre-expiration after the offer's expiration.`
6. Admins must be able to create cancellation notices for user bookings
    - for reservation: go to booking rejection instead
    - for payment: yes, with reschedule option
    - `paid/downpayment: yes, with refund or reschedule option`
        - Issue [#32](https://github.com/arREY-N/thrail_app/issues/32)
    - `completed: no    
7. Admins must be able to revert cancellation notices as long as the notice has not been approved or rejected by the user.
8. `Admins must be able to update the reservedPax in the offer details for admin cancellation once refund is confirmed.`

> Dont's
1. Admins must not be able to update approved or rejected requests anymore.
2. `Admins must not be able to revert approved requests.`


#### Read
> Do's
1. Admins must be able to see all business and offer cancellation requests made by users.

> Dont's
1. Admins must not be able to see other requests aside those that are under their business and offers.

#### Delete
> Dont's
1. Admins must not be able to delete any user requests, regardless of request status.

### System
> Do's
1. `The system must issue the refund for approved cancellation requests two days after the request is approved.`
2. `Users must receive notification for updates regarding the status of their requests.`
3. `Admins must receive notification for booking cancellations for their offers.`