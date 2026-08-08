import { ImageSourcePropType } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { ITrail } from '@/src/core/models/Trail/Trail.types';

export interface GlossaryData {
    title: string;
    points: Array<{ label: string; text: string }>;
    col: number;
}

export const STAT_GLOSSARY: Record<string, GlossaryData> = {
    distance: { 
        title: "Distance", 
        points: [{ label: "Total Length", text: "The full distance of the trail." }], 
        col: 0 
    },
    peak: { 
        title: "Peak (MASL)", 
        points: [
            { label: "MASL", text: "Meters Above Sea Level." },
            { label: "Summit", text: "The highest elevation point you will reach." }
        ], col: 1 
    },
    gain: { 
        title: "Elevation Gain", 
        points: [
            { label: "Ascent", text: "The total upward climb in meters." },
            { label: "Impact", text: "Higher gain means a steeper, more strenuous hike." }
        ], col: 2 
    },
    class: { 
        title: "Classification", 
        points: [
            { label: "Minor", text: "Easier day-hikes suitable for beginners." },
            { label: "Major", text: "Requires high endurance, prep, and multi-day trekking." }
        ], col: 0 
    },
    difficulty: { 
        title: "Difficulty (1-9)", 
        points: [
            { label: "1-2", text: "Beginner Friendly" },
            { label: "3-5", text: "Moderate / Intermediate" },
            { label: "6-7", text: "Hard / Steep Terrain" },
            { label: "8-9", text: "Extreme / Technical" }
        ], col: 1 
    },
    status: { 
        title: "Trail Status", 
        points: [
            { label: "Open", text: "Ready for visitors." },
            { label: "Closed", text: "Temporarily restricted by authorities." }
        ], col: 2 
    }
};

export const ROUTE_GLOSSARY: Record<string, string> = {
    "Out and Back": "You will hike to the destination and return using the exact same path.",
    "Out-and-Back": "You will hike to the destination and return using the exact same path.",
    "Point-to-Point": "The hike starts at one location and ends at a completely different location.",
    "Circular": "The trail forms a loop, returning to the start without repeating the exact same path.",
    "Loop": "The trail forms a loop, returning to the start without repeating the exact same path."
};

export const getClassColor = (classification?: string | null): string => {
    if (!classification) return Colors.TRAIL_STATS_GRAY;
    return classification.toLowerCase() === 'minor' ? Colors.TRAIL_STATS_GRAY : Colors.TRAIL_STATS_RED;
};

export const getDifficultyColor = (diffString?: string | null): string => {
    if (!diffString || diffString === "--/9") return Colors.TRAIL_STATS_GRAY;
    const val = parseInt(diffString.split('/')[0], 10);
    if (val <= 2) return Colors.TRAIL_STATS_GREEN;
    if (val <= 5) return Colors.TRAIL_STATS_BLUE;
    if (val <= 7) return Colors.TRAIL_STATS_YELLOW;
    return Colors.TRAIL_STATS_RED;
};

export const getStatusColor = (status?: string | null): string => {
    if (!status) return Colors.TRAIL_STATS_GRAY;
    return status.toLowerCase() === 'open' ? Colors.TRAIL_STATS_GREEN : Colors.TRAIL_STATS_RED;
};

export const getStatusIconInfo = (status?: string | null): { lib: string; name: string } => {
    if (!status) return { lib: "FontAwesome5", name: "minus-circle" };
    return status.toLowerCase() === 'open' 
        ? { lib: "FontAwesome5", name: "walking" } 
        : { lib: "FontAwesome5", name: "ban" };
};

export const isFeatureEnabled = (nestedValue?: unknown, flatValue?: unknown): boolean => {
    if (nestedValue === true || String(nestedValue).toLowerCase() === 'true') return true;
    if (flatValue === true || String(flatValue).toLowerCase() === 'true') return true;
    return false;
};

export const getArray = <T>(nestedValue?: unknown, flatValue?: unknown): T[] => {
    if (Array.isArray(nestedValue) && nestedValue.length > 0) return nestedValue as T[];
    if (Array.isArray(flatValue) && flatValue.length > 0) return flatValue as T[];
    return [];
};

export const getFeatureIcon = (label: string): { library: string; name: string } => {
    const lower = label.toLowerCase();
    if (lower.includes('shelter')) return { library: 'MaterialCommunityIcons', name: 'tent' };
    if (lower.includes('rest')) return { library: 'FontAwesome5', name: 'wheelchair' }; 
    if (lower.includes('info')) return { library: 'Feather', name: 'info' };
    if (lower.includes('water') || lower.includes('drink') || lower.includes('lake') || lower.includes('fall')) return { library: 'Ionicons', name: 'water' };
    if (lower.includes('river')) return { library: 'MaterialCommunityIcons', name: 'waves' };
    if (lower.includes('monument')) return { library: 'FontAwesome6', name: 'monument' };
    if (lower.includes('community')) return { library: 'FontAwesome5', name: 'users' };
    if (lower.includes('scenic') || lower.includes('view') || lower.includes('hill')) return { library: 'FontAwesome6', name: 'mountain' };
    return { library: 'Feather', name: 'check-circle' }; 
};

export const getHeroImageSource = (item?: Partial<ITrail> | null): ImageSourcePropType => {
    if (item?.coverImage) return { uri: item.coverImage };
    if (item?.routeMapImage) return { uri: item.routeMapImage };
    return require('@/src/assets/images/Mt.Tagapo.jpg'); 
};

export const isUsingMapFallback = (item?: Partial<ITrail> | null): boolean => {
    return !item?.coverImage && !!item?.routeMapImage;
};

export const formatRouteType = (routeType?: string | null): string => {
    let display = routeType || "--";
    if (display === "Out and Back" || display === "Out-and-Back") return "Out & Back"; 
    if (display === "Point-to-Point") return "Pt to Pt"; 
    return display;
};