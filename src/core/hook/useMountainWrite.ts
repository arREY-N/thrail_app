import { MOUNTAIN_INFORMATION } from "@/src/fields/mountainFields";
import { router } from "expo-router";
import { useEffect } from "react";
import { useMountainsStore } from "../stores/mountainsStore";
import { MountainParams } from "./useMountainDomain";

export default function useMountainWrite(params: MountainParams){
    const { mountainId } = params;

    const information = MOUNTAIN_INFORMATION;

    const mountain = useMountainsStore(s => s.current);
    const error = useMountainsStore(s => s.error);
    const isLoading = useMountainsStore(s => s.isLoading);

    const loadMountain = useMountainsStore(s => s.load);
    const create = useMountainsStore(s => s.create);
    const edit = useMountainsStore(s => s.edit);
    const remove = useMountainsStore(s => s.delete);

    useEffect(() => {
        loadMountain(mountainId);
    },[mountainId])

    const onSubmit = async () => {
        const success = await create();
        if(!success) return;
        router.back();
    }

    const onDelete = async () => {
        if(mountainId) await remove(mountainId);
        router.back();
    }

    return {
        mountain,
        information,
        error,
        isLoading,
        onEditProperty: edit,
        onSubmit,
        onDelete,
    }

}