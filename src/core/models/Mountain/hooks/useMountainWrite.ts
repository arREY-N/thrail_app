import { OPTIONS } from "@/src/constants/constants";
import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { Mountain } from "@/src/core/models/Mountain/interfaces/Mountain.types";
import { useMountainsStore } from "@/src/core/models/Mountain/stores/mountainStore";
import { newMountain } from "@/src/core/models/Mountain/utils/MountainFactory";
import setFinalValue from "@/src/core/utility/setFinalValue";
import { validate } from "@/src/core/utility/validate";
import { MountainUIConfig } from "@/src/fields/mountainFields";
import { router } from "expo-router";
import { useState } from "react";

export interface IUseMountainWriteParams {
    mountainId?: string;
}

export type IUseMountainWrite = IBaseWriteHook<Mountain>

export function useMountainWrite(params: IUseMountainWriteParams): IUseMountainWrite {
    const { mountainId } = params;

    const mountains = useMountainsStore(s => s.data);
    const information = MountainUIConfig;
    const error = useMountainsStore(s => s.error);
    const isLoading = useMountainsStore(s => s.isLoading);

    const [localError, setLocalError] = useState<string | null>(null);
    const [mountain, setMountain] = useState<Mountain>(() => {
        const existing = mountains.find(m => m.id === mountainId);
        return existing ? newMountain(existing) : newMountain();
    });

    const options = {
        provinces: [...OPTIONS.provinces],
    };

    const create = useMountainsStore(s => s.create);
    const edit = useMountainsStore(s => s.edit);
    const remove = useMountainsStore(s => s.delete);

    const onSubmitPress = async () => {
        setLocalError(null);
        console.log(mountain);

        try {
            const errors = validate(mountain, information);

            if (errors.length > 0)
                throw new Error(`${errors.join(', ')} missing`);

            console.log('Create: ', mountain);
            const created = await create(mountain);

            if (created) router.back();
        } catch (error: any) {
            setLocalError(error instanceof Error ? error.message : 'Failed submitting data');
        }
    };

    const onRemovePress = async (mountainId: string) => {
        if (mountainId) await remove(mountainId);
        router.back();
    };

    const onUpdatePress = (params: TEdit<Mountain>) => {
        const { section, id, value } = params;
        try {
            if (section !== 'root' && !id)
                throw new Error(`Missing key for ${String(section)}`);

            const fieldConfig = information.find(f => f.section === section && f.id === id);

            const finalValue = setFinalValue<Mountain>({
                fieldConfig,
                draft: mountain,
                section,
                id,
                value,
            });

            setMountain(prev => {
                return section === 'root'
                    ? newMountain({
                        ...prev,
                        [id]: finalValue,
                    })
                    : newMountain({
                        ...prev,
                        [section]: { ...(prev[section] as object), [id]: finalValue },
                    });
            });

        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed saving mountain');
        }
    };

    return {
        object: mountain,
        information,
        error: error || localError,
        isLoading,
        options,
        onUpdatePress,
        onSubmitPress,
        onRemovePress,
    };
}