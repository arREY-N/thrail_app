import { OPTIONS } from "@/src/constants/constants";
import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { Application, newApplication, useApplicationsStore } from "@/src/core/models/Application/Application";
import { User, useAuthStore } from "@/src/core/models/User/User";
import { validate } from "@/src/core/utility/validate";
import { ApplicationUIConfig, IApplicationFormField } from "@/src/fields/applicationFields";
import { produce } from "immer";
import { useState } from "react";

export interface IApplyWrite extends Omit<IBaseWriteHook<Application>, 'information'> {
    information: IApplicationFormField[];
    onApproveApplication: (profile: User) => Promise<void>;
    onRejectApplication: (profile: User) => Promise<void>;
}

export type UseApplyWriteParams = {
    applicationId?: string;
    userId?: string;
};

export default function useApplyWrite(params: UseApplyWriteParams = {}): IApplyWrite {
    const { applicationId, userId } = params;
    const profile = useAuthStore(s => s.profile);

    const data = useApplicationsStore(s => s.data);

    const isLoading = useApplicationsStore(s => s.isLoading);
    const create = useApplicationsStore(s => s.create);
    const [localError, setLocalError] = useState<string | null>(null);
    const [application, setApplication] = useState<Application>(() => {
        const existing = data.find(d => d.id === applicationId || d.owner.id === userId);
        return existing
            ? newApplication({ ...existing })
            : newApplication({
                owner: {
                    id: profile?.id || '',
                    name: `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim(),
                    email: profile?.email || '',
                    validId: [],
                    validIdFront: '',
                    validIdBack: '',
                }
            });
    });

    const information = ApplicationUIConfig;

    const options = {
        provinces: [...OPTIONS.provinces],
    };

    async function onUpdatePress(params: TEdit<Application>) {
        const { section, id, value } = params;

        try {
            if (section !== 'root' && !id) {
                throw new Error(`Missing key for ${String(section)}`);
            }

            setApplication(prev =>
                produce(prev, (draft) => {
                    if (section === 'root') {
                        (draft as unknown as Record<string, unknown>)[id] = value;
                    } else if (section === 'owner') {
                        (draft.owner as unknown as Record<string, unknown>)[id] = value;
                        if (id === 'validIdFront' || id === 'validIdBack') {
                            const front = id === 'validIdFront' ? (value as string) : draft.owner.validIdFront;
                            const back = id === 'validIdBack' ? (value as string) : draft.owner.validIdBack;
                            const validList: string[] = [];
                            if (front) validList.push(front);
                            if (back) validList.push(back);
                            draft.owner.validId = validList;
                        }
                    } else if (section === 'permits') {
                        (draft.permits as unknown as Record<string, unknown>)[id] = value;
                    }
                })
            );
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed saving application');
        }
    }

    async function onSubmitPress(): Promise<void> {
        try {
            if (!profile) throw new Error('Applicant must be logged in to apply for a business account.');

            const errors = validate(application, information);

            if (errors.length > 0) {
                throw new Error(`${errors.join(', ')} missing`);
            }

            const targetOwnerId = application.owner?.id?.trim() || profile?.id || '';
            const appToSubmit: Application = {
                ...application,
                owner: {
                    ...application.owner,
                    id: targetOwnerId,
                    email: application.owner?.email?.trim() || profile?.email || '',
                    name: application.owner?.name?.trim() || `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim() || '',
                }
            };

            const submitted = await create(appToSubmit);

            if (!submitted) throw new Error('An error occurred while submitting application.');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed submitting application.';
            setLocalError(msg);
            throw error;
        }
    }

    async function onRemovePress() {

    }

    async function onRejectApplication(user: User) {
        try {
            if (user.role !== 'superadmin') {
                throw new Error('Only superadmins are allowed to reject applications');
            }
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed rejecting application');
        }
    }

    async function onApproveApplication(user: User) {
        try {
            if (user.role !== 'superadmin') {
                throw new Error('Only superadmins are allowed to approve applications');
            }
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed approving application');
        }
    }

    return {
        information,
        object: application,
        error: localError,
        isLoading,
        options,
        onRemovePress,
        onSubmitPress,
        onUpdatePress,
        onRejectApplication,
        onApproveApplication,
    };
}