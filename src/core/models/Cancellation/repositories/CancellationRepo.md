# Cancellation Repository

Used to fetch cancellation data from the database and sync it to the store.

## Use Cases

### User
- CREATE
    - Users can submit cancellation requests for their own bookings.
    - Functions
        1. `write(businessId: string, cancellation: Cancellation)`

- READ
    - Users can read only their own requests.
    - Functions
        1. `fetchCancellation(businessId: string, cancellationId: string)`
            - Fetches a single cancellation.
        2. `fetchAllUserCancellations(userId: string)`
            - Fetches all of the user's cancellation requests, across businesses.

- UPDATE
    - Users can update their own request:
        - A pending request can be withdrawn.
        - A rejected request can be appealed (status reverts to pending).
        - An approved request is immutable — cannot be updated.
    - Functions
        1. `write(businessId: string, cancellation: Cancellation)`

- DELETE
    - Users can hard-delete their own request, as long as it has not been
      approved or rejected (i.e., while still `pending` or `withdrawn`).
    - Approved and rejected requests are immutable and cannot be deleted.
    - Functions
        1. `delete(businessId: string, cancellationId: string)`

### Admin
- CREATE
    - Not allowed.

- READ
    - Admins can read all requests inside their business's folder.
    - Functions
        1. `fetchAllBusinessCancellations(businessId: string)`
            - Fetches all of the business's cancellation requests.
        2. `fetchCancellation(businessId: string, cancellationId: string)`
            - Fetches a single cancellation.
        3. `fetchAllOfferCancellations(businessId: string, offerId: string)`
            - Fetches all cancellation requests tied to a specific offer —
              used for reconciling cancelled/refunded pax against that offer.
            - Admin only; users have no legitimate need to query across
              other users' requests for the same offer.

- UPDATE
    - Admins update a request by approving or rejecting it.
    - Once approved, a request is immutable — the cancellation/refund
      procedure is scheduled immediately upon approval.
    - Functions
        1. `write(businessId: string, cancellation: Cancellation)`

- DELETE
    - Not allowed. Only users may delete their own requests
      (pending or withdrawn only).