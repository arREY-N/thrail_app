# Cancellation Store

## Data Buckets
`businessCancellations: Cancellation[]`

`offerCancellations: Record<string, Cancellation[]>`

`userCancellations: Cancellation[]`

## Store Flags
`error: string`

`isFetching: boolean`

`isWriting: boolean`

## Functions
`write()`

`delete()`

`fetchCancellation()`

`fetchAllUserCancellations()`

`fetchAllBusinessCancellations()`

`fetchAllOfferCancellations()`

> add 'refresh: boolean = false' as an optional parameter to functions to force refresh 