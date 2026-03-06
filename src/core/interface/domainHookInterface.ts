import { IFormField } from "@/src/core/interface/formFieldInterface";

export interface IBaseDomainHook{
    /** Indicates if a store is currently loading or processing */
    isLoading: boolean;

    /** Shows any error encountered by the store */
    error: string | null;
}

export interface TEdit {
    /**Name of the group for nested objects within an entity.
     * Set to 'root' if the property is on the root level
     */
    section: string;
    
    /**Name of the property to be edited*/
    id: string;
    
    /**Value to be saved */
    value: any;
}

export interface IBaseWriteHook<T> {
    /**Contains an array of members and properties owned by the given 
     * type T.
     */
    information: IFormField<keyof T>[];
    
    /**Actual object writted */
    object: T;
    
    /**Displays any error from the store or from the 
     * controller hook
     */
    error: string | null;
    
    /**Flags the loading status of the store and the controller
     * hook
     */
    isLoading: boolean;

    /** For n-select properties, options are to be provided from
     * the controller hook
     */
    options?: {
        [key: string]: string[] | any[];
    },
    
    /** Handles the validation of the object and 
     * dispatchment to the store.
     */
    onSubmitPress: () => Promise<void>;
    
    /** ID must be provided to remove an object */
    onRemovePress: (id: string) => Promise<void>;
    
    /** Use to edit the properties of an object. 
     * Must include the property name, to be saved value, 
     * and the section name if within a nested group */
    onUpdatePress: (params: TEdit) => void;
}