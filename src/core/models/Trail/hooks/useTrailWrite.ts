import { OPTIONS } from "@/src/constants/constants";
import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { useMountainsStore } from "@/src/core/models/Mountain/Mountain";
import { Trail } from "@/src/core/models/Trail/interfaces/ITrail";
import { useTrailsStore } from "@/src/core/models/Trail/stores/trailStore";
import { newTrail } from "@/src/core/models/Trail/utils/TrailFactory";
import { validate } from "@/src/core/utility/validate";
import { TrailUIConfig } from "@/src/fields/trailFields";
import { router } from "expo-router";
import { useState } from "react";

/** */
type TrailParams = {
    trailId?: string;
}

export type IUseTrailWrite = IBaseWriteHook<Trail>

/** Provide access to write and/or delete trails */
export function useTrailWrite(params: TrailParams = {}): IUseTrailWrite {
    const { trailId } = params;

    const information = TrailUIConfig;

    const trails = useTrailsStore(s => s.data);
    const mountains = useMountainsStore(s => s.data);

    const error = useTrailsStore(s => s.error);
    const isLoading = useTrailsStore(s => s.isLoading);
    const remove = useTrailsStore(s => s.delete);
    const create = useTrailsStore(s => s.create);

    const [localError, setLocalError] = useState<string | null>(null);
    const [trail, setTrail] = useState<Trail>(() => {
        const existing = trails.find(t => t.id === trailId);
        return existing ? newTrail({ ...existing }) : newTrail();
    });
    const [prevSyncedId, setPrevSyncedId] = useState<string | undefined>(undefined);

    const existingTrail = trails.find(t => t.id === trailId);
    if (trailId && existingTrail && existingTrail.id !== prevSyncedId) {
        setPrevSyncedId(existingTrail.id);
        setTrail(newTrail({ ...existingTrail }));
    }

    const options = {
        mountains: [...mountains.map(m => m.name)],
        provinces: [...OPTIONS.provinces],
        circularity: [...OPTIONS.circularity],
        classification: [...OPTIONS.classification],
        quality: [...OPTIONS.quality],
        difficultyPoints: [...OPTIONS.difficulty_points],
        viewpoints: [...OPTIONS.viewpoints],
    };

    /**
     * @param section - checks if property is a root property or an object
     * @param id - property name to edit
     * @param value - the value to be saved
     */
    const onUpdatePress = (params: TEdit<Trail>) => {
        const { section, id, value } = params;
        setLocalError(null);

        try {
            if (section !== 'root' && !id)
                throw new Error(`Missing key for ${String(section)}`);

            const fieldConfig = information.find(f => f.section === section && f.id === id);

            let finalValue: unknown = value;

            const sectionRecord = (section === 'root'
                ? (trail as unknown as Record<string, unknown>)
                : ((trail[section as keyof Trail] as unknown) as Record<string, unknown>));

            if (fieldConfig?.type === 'object-select' && fieldConfig.options === 'mountains') {
                const found = mountains.find(m => m.name === value);
                finalValue = found ? found.name : value;
            } else if (fieldConfig?.type === 'multi-select') {
                const current = Array.isArray(sectionRecord?.[id]) ? (sectionRecord[id] as string[]) : [];
                const valStr = String(value);
                finalValue = current.includes(valStr)
                    ? current.filter(c => c !== valStr)
                    : [...current, valStr];
            } else if (fieldConfig?.type === 'boolean') {
                if (typeof value === 'boolean' || value === null) {
                    finalValue = value;
                } else {
                    const current = sectionRecord?.[id];
                    finalValue = current === null ? true : !current;
                }
            } else if (fieldConfig?.type === 'single-select') {
                const current = sectionRecord?.[id];
                finalValue = current === value ? '' : value;
            } else if (fieldConfig?.type === 'numerical') {
                if (typeof value === 'number') {
                    finalValue = isNaN(value) ? 0 : value;
                } else if (typeof value === 'string') {
                    if (value.trim() === '') {
                        finalValue = 0;
                    } else {
                        let cleaned = value.replace(',', '.').replace(/[^0-9.-]/g, '');
                        const parts = cleaned.split('.');
                        if (parts.length > 2) {
                            cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
                        }
                        const result = parseFloat(cleaned);
                        finalValue = isNaN(result) ? 0 : result;
                    }
                } else {
                    finalValue = 0;
                }
            }

            setTrail(prev => {
                if (section === 'root') {
                    return newTrail({
                        ...prev,
                        [id]: finalValue,
                    });
                }
                const prevSection = (prev[section as keyof Trail] as unknown) as Record<string, unknown>;
                return newTrail({
                    ...prev,
                    [section]: {
                        ...prevSection,
                        [id]: finalValue,
                    },
                });
            });
        } catch (error: unknown) {
            setLocalError(error instanceof Error ? error.message : 'Failed updating trail');
        }
    };

    const onSubmitPress = async () => {
        setLocalError(null);
        try {
            const result = validate(trail, TrailUIConfig);

            if (result.length > 0) {
                throw new Error(`Missing required fields: ${result.join(', ')}`);
            }

            const created = await create(trail);

            if (!created) {
                const storeError = useTrailsStore.getState().error;
                throw new Error(storeError || 'Failed saving trail to database');
            }

            router.back();
        } catch (error: unknown) {
            setLocalError(error instanceof Error ? error.message : 'Failed saving trail');
        }
    };

    const onRemovePress = async (targetId: string) => {
        if (targetId) await remove(targetId);
        router.replace('/');
    };

    return {
        information,
        object: trail,
        error: error || localError,
        isLoading,
        options,
        onSubmitPress,
        onRemovePress,
        onUpdatePress,
    };
}