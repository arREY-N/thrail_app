export type CircularityType = 'Circular' | 'Out-and-Back' | 'Traverse'
export type TrailQualityType = 'Q1' | 'Q2' | 'Q3'
export type DifficultyPointsType = 'D1' | 'D2' | 'D3' | 'D4'
export type ViewpointType = 'V1' | 'V2' | 'V3'
export type RecommendationStatus = 'Hiked' | 'Unhiked'
export type PaymentMode = 'GCash' | 'Maya' | null
export type Mode = 'write' | 'view' | 'list' | null

export enum BookingStatus{
    PENDING = 'Pending',
    APPROVED = 'Approved',
    CANCELLED = 'Cancelled',
    EXPIRED = 'Expired',
}