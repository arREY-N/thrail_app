import { Colors } from '@/src/constants/colors';
import { ITrail } from '@/src/core/models/Trail/Trail';
import { trailMapAssets } from '@/src/features/Map/Map';
import { ImageSourcePropType } from 'react-native';

const DEFAULT_HERO_IMAGE: ImageSourcePropType = require('@/src/assets/images/Mt.Tagapo.jpg');

export const LOCAL_TRAIL_COVER_PHOTOS: Record<string, ImageSourcePropType> = {
    batulaoNew: require('@/src/assets/images/Batulao-New-Trail.jpeg'),
    mariangMakiling: require('@/src/assets/images/Mariang-Makiling-Trail.jpg'),
    makilingTraverse: require('@/src/assets/images/Mt-Makiling-Traverse.jpg'),
    batulao: require('@/src/assets/images/Mt-Batulao.jpg'),
    daraitan: require('@/src/assets/images/Mt-Daraitan.jpg'),
    sembrano: require('@/src/assets/images/Mt-Sembrano.jpg'),
    tagapo: DEFAULT_HERO_IMAGE,
};

export interface GlossaryData {
    title: string;
    points: { label: string; text: string }[];
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
            { label: "1", text: "Very easy" },
            { label: "2", text: "Easy" },
            { label: "3", text: "Mild" },
            { label: "4", text: "Average" },
            { label: "5", text: "Moderate" },
            { label: "6", text: "Challenging" },
            { label: "7", text: "Difficult" },
            { label: "8", text: "Strenuous" },
            { label: "9", text: "Technical" }
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
    "Loop": "The trail forms a loop, returning to the start without repeating the exact same path.",
    "Traverse": "The hikers starts from one location, reaches the summit, then finishes in a different location."
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
    const filterValid = (arr: unknown[]): T[] => {
        return arr.filter(item => typeof item !== 'string' || item.trim().length > 0) as T[];
    };
    if (Array.isArray(nestedValue) && nestedValue.length > 0) {
        const cleaned = filterValid(nestedValue);
        if (cleaned.length > 0) return cleaned;
    }
    if (Array.isArray(flatValue) && flatValue.length > 0) {
        const cleaned = filterValid(flatValue);
        if (cleaned.length > 0) return cleaned;
    }
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

const getTrailSearchTokens = (item?: Partial<ITrail> | null): string => {
    if (!item) return '';
    const idStr = item.id || '';
    const nameStr = item.general?.name || '';
    const mountainArr = Array.isArray(item.general?.mountain)
        ? item.general?.mountain.join(' ')
        : (item.general?.mountain || '');
    return `${idStr} ${nameStr} ${mountainArr}`.toLowerCase();
};

export const isTagapoTrail = (item?: Partial<ITrail> | null): boolean => {
    return getTrailSearchTokens(item).includes('tagapo');
};

export const getMatchedLocalCoverPhoto = (item?: Partial<ITrail> | null): ImageSourcePropType | null => {
    if (!item) return null;
    const tokens = getTrailSearchTokens(item);

    // 1. Specific trail-level matches first
    if (tokens.includes('batulao new') || tokens.includes('batulao-new') || tokens.includes('batulao_new')) {
        return LOCAL_TRAIL_COVER_PHOTOS.batulaoNew;
    }
    if (tokens.includes('mariang makiling') || tokens.includes('mariang-makiling') || tokens.includes('mmt')) {
        return LOCAL_TRAIL_COVER_PHOTOS.mariangMakiling;
    }
    if (tokens.includes('makiling traverse') || tokens.includes('makiling-traverse') || tokens.includes('maktrav')) {
        return LOCAL_TRAIL_COVER_PHOTOS.makilingTraverse;
    }

    // 2. Mountain-level matches
    if (tokens.includes('batulao')) return LOCAL_TRAIL_COVER_PHOTOS.batulao;
    if (tokens.includes('daraitan')) return LOCAL_TRAIL_COVER_PHOTOS.daraitan;
    if (tokens.includes('sembrano')) return LOCAL_TRAIL_COVER_PHOTOS.sembrano;
    if (tokens.includes('tagapo')) return LOCAL_TRAIL_COVER_PHOTOS.tagapo;
    if (tokens.includes('makiling')) return LOCAL_TRAIL_COVER_PHOTOS.mariangMakiling;

    return null;
};

export const getMatchedLocalMapAsset = (item?: Partial<ITrail> | null): ImageSourcePropType | null => {
    if (!item) return null;
    if (item.id && Object.prototype.hasOwnProperty.call(trailMapAssets, item.id)) {
        return trailMapAssets[item.id];
    }
    const tokens = getTrailSearchTokens(item);
    if (tokens.includes('tagapo')) return trailMapAssets['mock_tagapo'];
    if (tokens.includes('marami')) return trailMapAssets['mock_marami'];
    if (tokens.includes('batulao')) return trailMapAssets['mock_batulao'];
    if (tokens.includes('makiling')) return trailMapAssets['mock_makiling'];
    if (tokens.includes('maculot')) return trailMapAssets['mock_maculot'];
    if (tokens.includes('daraitan')) return trailMapAssets['mock_daraitan'];
    if (tokens.includes('kulis')) return trailMapAssets['mock_kulis'];
    return null;
};

export const getCardImageSource = (item?: Partial<ITrail> | null): ImageSourcePropType | null => {
    if (item?.coverImage && item.coverImage.trim().length > 0) {
        return { uri: item.coverImage };
    }
    const localCoverPhoto = getMatchedLocalCoverPhoto(item);
    if (localCoverPhoto) {
        return localCoverPhoto;
    }
    if (item?.routeMapImage && item.routeMapImage.trim().length > 0) {
        return { uri: item.routeMapImage };
    }
    return getMatchedLocalMapAsset(item);
};

export const getTrailHeroPhoto = (item?: Partial<ITrail> | null): ImageSourcePropType | null => {
    if (item?.coverImage && item.coverImage.trim().length > 0) {
        return { uri: item.coverImage };
    }
    return getMatchedLocalCoverPhoto(item);
};

export const getHeroImageSource = (item?: Partial<ITrail> | null): ImageSourcePropType => {
    return getCardImageSource(item) ?? DEFAULT_HERO_IMAGE;
};

export const isUsingMapFallback = (item?: Partial<ITrail> | null): boolean => {
    if (item?.coverImage && item.coverImage.trim().length > 0) return false;
    if (getMatchedLocalCoverPhoto(item)) return false;
    return Boolean(
        (item?.routeMapImage && item.routeMapImage.trim().length > 0) ||
        getMatchedLocalMapAsset(item)
    );
};

export const formatRouteType = (routeType?: string | null): string => {
    let display = routeType || "--";
    if (display === "Out and Back" || display === "Out-and-Back") return "Out & Back";
    if (display === "Point-to-Point") return "Pt to Pt";
    return display;
};

const normalizeListTokens = (value?: string[] | string | null): string[] => {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw
        .map((s) => String(s).toLowerCase().trim())
        .filter((s) => s.length > 0);
};

/**
 * Computes a weighted similarity score (0-100) for other trails compared to `currentTrail`
 * and returns up to `maxCount` most similar active trails:
 * - Same Mountain: +35 pts
 * - Same Province: +25 pts
 * - Same Classification (Minor/Major): +20 pts
 * - Similar Difficulty (lascoRating within ±0/1/2): +15 / +10 / +5 pts
 * - Same Route Type (circularity): +5 pts
 */
export const getSimilarTrails = (
    currentTrail?: ITrail | null,
    allTrails?: ITrail[] | null,
    maxCount = 4
): ITrail[] => {
    if (!currentTrail || !allTrails || allTrails.length === 0) return [];

    const currentMountains = normalizeListTokens(currentTrail.general?.mountain);
    const currentNameLower = (currentTrail.general?.name || '').toLowerCase();
    const currentProvinces = normalizeListTokens(currentTrail.general?.province);
    const currentClass = (currentTrail.difficulty?.classification || '').toLowerCase().trim();
    const currentRatingDiff = Number(currentTrail.difficulty?.lascoRating) || 0;
    const currentRoute = formatRouteType(currentTrail.difficulty?.circularity);

    const scoredCandidates = allTrails
        .filter((candidate) => candidate.id !== currentTrail.id && candidate.general?.active !== false)
        .map((candidate) => {
            let score = 0;

            // 1. Same Mountain (+35 pts)
            const candidateMountains = normalizeListTokens(candidate.general?.mountain);
            const candidateNameLower = (candidate.general?.name || '').toLowerCase();
            const sharesMountain =
                (currentMountains.length > 0 &&
                    candidateMountains.some((m) =>
                        currentMountains.some((cm) => cm === m || cm.includes(m) || m.includes(cm))
                    )) ||
                (currentNameLower.includes('batulao') && candidateNameLower.includes('batulao')) ||
                (currentNameLower.includes('makiling') && candidateNameLower.includes('makiling'));

            if (sharesMountain) {
                score += 35;
            }

            // 2. Same Province (+25 pts)
            const candidateProvinces = normalizeListTokens(candidate.general?.province);
            const sharesProvince =
                currentProvinces.length > 0 &&
                candidateProvinces.some((p) =>
                    currentProvinces.some((cp) => cp === p || cp.includes(p) || p.includes(cp))
                );

            if (sharesProvince) {
                score += 25;
            }

            // 3. Same Classification (+20 pts)
            const candidateClass = (candidate.difficulty?.classification || '').toLowerCase().trim();
            if (currentClass && candidateClass && currentClass === candidateClass) {
                score += 20;
            }

            // 4. Similar Difficulty Rating (+15 / +10 / +5 pts)
            const candidateRatingDiff = Number(candidate.difficulty?.lascoRating) || 0;
            if (currentRatingDiff > 0 && candidateRatingDiff > 0) {
                const diffDelta = Math.abs(currentRatingDiff - candidateRatingDiff);
                if (diffDelta === 0) score += 15;
                else if (diffDelta === 1) score += 10;
                else if (diffDelta === 2) score += 5;
            }

            // 5. Same Route Type (+5 pts)
            const candidateRoute = formatRouteType(candidate.difficulty?.circularity);
            if (currentRoute !== '--' && currentRoute === candidateRoute) {
                score += 5;
            }

            return {
                trail: candidate,
                score,
                reviewRating: Number(candidate.general?.rating) || 0,
            };
        });

    scoredCandidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.reviewRating - a.reviewRating;
    });

    return scoredCandidates.slice(0, maxCount).map((entry) => entry.trail);
};
