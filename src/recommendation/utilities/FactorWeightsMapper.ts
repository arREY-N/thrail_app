/**
 * Factor Weights Mapper for Adaptive Profile Updating
 * 
 * Maps user-selected hike review factor chips into the 32-dimensional canonical
 * weight vector, applying Feature Presence Gating so unencountered terrains (0.0)
 * are never modified.
 */

export interface DifficultyFactorOption {
    id: 'slope' | 'length' | 'gain' | 'elevation' | 'terrain';
    legacyLabel: string;
    easyLabel: string;
    difficultLabel: string;
}

export const DIFFICULTY_FACTOR_MAPPINGS: DifficultyFactorOption[] = [
    {
        id: 'slope',
        legacyLabel: 'Trail slope',
        easyLabel: 'The trail is not too steep',
        difficultLabel: 'The trail is too steep',
    },
    {
        id: 'length',
        legacyLabel: 'Trail length',
        easyLabel: 'The length is just right',
        difficultLabel: 'The trail is too long',
    },
    {
        id: 'gain',
        legacyLabel: 'Elevation gain',
        easyLabel: 'Not too much uphill climb',
        difficultLabel: 'Too much uphill climbing',
    },
    {
        id: 'elevation',
        legacyLabel: 'Altitude',
        easyLabel: 'Comfortable altitude & breathing',
        difficultLabel: 'High altitude made it exhausting',
    },
    {
        id: 'terrain',
        legacyLabel: 'Terrain / Footing',
        easyLabel: 'Easy and stable footing',
        difficultLabel: 'Rough, slippery, or rocky ground',
    },
];

// Both old and new factor options kept together to preserve full backward compatibility with past reviews
export const DIFFICULTY_FACTOR_OPTIONS = [
    ...DIFFICULTY_FACTOR_MAPPINGS.map(opt => ({ id: opt.id, label: opt.legacyLabel })),
    ...DIFFICULTY_FACTOR_MAPPINGS.map(opt => ({ id: opt.id, label: opt.easyLabel })),
    ...DIFFICULTY_FACTOR_MAPPINGS.map(opt => ({ id: opt.id, label: opt.difficultLabel })),
];

export const LEGACY_DIFFICULTY_OPTIONS = DIFFICULTY_FACTOR_MAPPINGS.map(opt => ({
    id: opt.id,
    label: opt.legacyLabel,
}));

export type DifficultyFactorId = typeof DIFFICULTY_FACTOR_OPTIONS[number]['id'];

export interface FactorWeightResolutionOptions {
    selectedFactors: string[];
    trailFeatures?: Record<string, any>;
    activeWeight?: number;   // default 1.00
    baselineWeight?: number; // default 0.20
}

/**
 * Resolves selected review factor chips into a dictionary of feature weights.
 * Applies Feature Presence Gating for the terrain block.
 */
export function resolveHikeFactorWeights(
    options: FactorWeightResolutionOptions
): Record<string, number> {
    const {
        selectedFactors = [],
        trailFeatures,
        activeWeight = 1.00,
        baselineWeight = 0.20,
    } = options;

    const weights: Record<string, number> = {};

    // Normalize selections to lowercase
    const normalizedSelected = selectedFactors.map(f => f.trim().toLowerCase());

    const isSelected = (terms: string[]) => {
        return normalizedSelected.some(sel =>
            terms.some(t => sel.includes(t.toLowerCase()))
        );
    };

    // 1. Slope / Steepness
    if (isSelected(['slope', 'steep'])) {
        weights['slope'] = activeWeight;
    }

    // 2. Trail length / Distance
    if (isSelected(['length', 'distance', 'long'])) {
        weights['length'] = activeWeight;
    }

    // 3. Altitude / Peak Elevation
    if (isSelected(['altitude', 'elevation', 'breathing', 'exhausting'])) {
        weights['elevation'] = activeWeight;
    }

    // 4. Elevation gain / Climbing
    if (isSelected(['gain', 'climb', 'uphill'])) {
        weights['gain'] = activeWeight;
    }

    // 5. Terrain block with Feature Presence Gating
    if (isSelected(['terrain', 'footing', 'surface', 'ground', 'rocky', 'slippery', 'stable'])) {
        const terrainKeys = ['muddy', 'rocky', 'grassland', 'ridges'] as const;

        terrainKeys.forEach((key) => {
            // Check if trail actually has this terrain
            let isPresent = true;
            if (trailFeatures && typeof trailFeatures === 'object') {
                const trailTerrain = trailFeatures.terrain || {};
                const val = typeof trailTerrain[key] === 'number' ? trailTerrain[key] : 0;
                isPresent = val > 0.05; // Feature Presence Gating threshold
            }

            if (isPresent) {
                weights[key] = activeWeight;
            } else {
                weights[key] = 0.0; // Unencountered terrain remains completely untouched
            }
        });
    }

    return weights;
}
