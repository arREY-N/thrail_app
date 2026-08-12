# Cancellation Feature
```
Allows users to submit cancellation requests for reserved and booked hikes and business admins to process requests.
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
- Update offer information.
- Update booking group chat members.

### System
- Notify users for updated on cancellation requests.
- Notify admins for incoming cancellation requests.
- Run cloud refund procedure.

## Test Cases

### Users
#### Create/Update
> Do's
1. Users must be able to create new requests.
2. Users must be able to update requests, as long as it's not approved.
3. Users must be able to appeal for rejected requests.
4. Users must be able to create requests for for-payment bookings.
5. `Users must be able to create requests for paid bookings.`

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
1. Admins must be able to update cancellation requests, as long as it's pending.
2. Admins must be able to process previously rejected requests if the user submitted an appeal.
3. Admins must decrement the current reservedPax in the offer details if request is approved.
4. `Admins must update the associated booking status if request is approved.`
5. `Admin must still be able to process unprocessed requests made pre-expiration after the offer's expiration.`

> Dont's
1. Admins must not be able to update approved or rejected requests anymore.


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