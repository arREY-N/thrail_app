# useCancellationHook.md

## For User
- Access to their own cancellation requests
- Requests span through multiple businesses/offers
- User ID is derived internally for each session to prevent other users from passing a different ID
- User must be able to send and view updates on their requests
- User must be able to cancel pending requests; processed requests are immutable

### Read Hooks
1. `useCancellationUserItem(cancellationId: string)`: fetches individual cancellation requests.

2. `useCancellationUserList()`: fetchs all of the user's cancellation requests.

### Mutate Hooks
1. `useCancellationUser()`: exposes functions to create, submit, and/or cancel requests.


## For Admin
- Access cancellation requests for their offers
- Business ID only to access the list of requests
- Cancellation ID is required to fetch individual data 
- Once requests are approved, admins cannot revert the process as the refund procedure is already scheduled
- Admins must indicate the reason for rejected requests

### Read Hooks
1. `useCancellationAdminItem(cancellationId: string)`: fetches a single cancellation item from the business' requests

2. `useCancellationAdminList()`: fetches all cancellation requests for the business

#### Mutate Hooks
1. `useCancellationAdmin()`: exposes functions to approve or reject cancellation requests