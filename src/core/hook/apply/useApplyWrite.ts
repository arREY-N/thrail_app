import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { Application } from "@/src/core/models/Application/Application";
import { useApplicationsStore } from "@/src/core/stores/applicationsStore";

export interface IApplyWrite extends IBaseWriteHook<Application> {

}

export type UseApplyWriteParams = {

}

export default function useApplyWrite(params: UseApplyWriteParams): IApplyWrite {
    const current = useApplicationsStore(s => s.current) || new Application();

    async function edit(edit: TEdit){
        const { id, value } = edit;
    }

    async function save(){

    }

    async function remove(){

    }
    
    return {
        current,
        edit,
        save,
        remove,
    }
}