/**
 * @file Permission.ts
 * @description Model class representing a device permission.
 */

import { IPermission, PermissionKey, PermissionStatus } from './Permission.types';
import { immerable } from 'immer';

export class Permission implements IPermission {
    [key: string]: any;
    [immerable] = true;

    key: PermissionKey = 'location';
    status: PermissionStatus = 'undetermined';
    canAskAgain: boolean = true;

    constructor(init?: Partial<IPermission>) {
        Object.assign(this, init);
    }
}
