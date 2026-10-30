import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/Group";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Offer } from "@/src/core/models/Offer/Offer";
import { User } from "@/src/core/models/User/User";

export interface IHikerLocation {
    id?: string;
    timestamp: Date | string;
    latitude: number;
    longitude: number;
    altitude?: number;
    hikerName?: string;
    status?: string;
}

export interface IEnrichedHikerLocation extends IHikerLocation {
    hikerName?: string;
}

export type HikerLiveStatus = 'live' | 'signal_lost' | 'offline';

export interface IEnrichedGroupMember {
    id: string;
    firstname: string;
    lastname: string;
    username?: string;
    email?: string;
    bookingId?: string;
    locData?: IHikerLocation;
    status: HikerLiveStatus;
    isInactive: boolean;
}

export interface HikeRecordingScreenProps {
    hike: Hike;
    booking: Booking | null;
    currentGroup: Group | null;
    hikerLocations: IHikerLocation[];
    error: string | null;
    fullOffer?: Offer | null;

    baseElapsedTime: number;
    timerStartTime: number;
    totalDistance: number;
    totalElevationGain: number;

    isLoading: boolean;
    lon?: string | string[];
    lat?: string | string[];
    onStartHike: () => void | Promise<void>;
    onPauseHike: () => void;
    onResumeHike: () => void;
    onCompleteHike: () => void;
    onResetHike?: () => void;
    onAddReview: () => void;
    onBackPress: () => void;
    onTriggerBackendSOS?: () => void;
    onTriggerEmergencySOS: () => void | Promise<{ success: boolean; reason?: string } | void>;
    onOpenSOSCamera?: () => void;
    onSendSMS: () => void;
    emergencyContactNumber?: string;
    shareLocationEnabled?: boolean;
    setShareLocationEnabled?: (enabled: boolean) => Promise<void>;
    profile: User;
}
