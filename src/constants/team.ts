/**
 * @file team.ts
 * @description Centralized configuration of Thrail project developers and contributors.
 */

export interface DeveloperMember {
    id: string;
    name: string;
    role: string;
    bio?: string;
    avatar?: string;
}

export const THRAIL_DEVELOPERS: DeveloperMember[] = [
    {
        id: 'dev-1',
        name: 'Reyn Penus',
        role: 'Lead Developer',
    },
    {
        id: 'dev-2',
        name: 'Emmanuel Joseph Caraig',
        role: 'UI/UX Designer',
    },
    {
        id: 'dev-3',
        name: 'Raven Villanueva',
        role: 'Backend Developer',
    },
    {
        id: 'dev-4',
        name: 'Zam Ortega',
        role: 'QA & Testing',
    },
];

