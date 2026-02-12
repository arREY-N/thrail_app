import { SignUpUI } from "@/src/types/entities/User";
import { FullValidationStructure } from "@/src/types/ValidationStructure";

export function validateTrail(
    object: any, 
    structure: FullValidationStructure,
): string[] {
    let errors: string[] = [];

    for(const groupName in structure){
        const group = structure[groupName];

        for(const fieldKey in group){
            const rule = group[fieldKey];
            const value = object[fieldKey];

            if(rule.required){
                const isInvalid =
                    value === null ||
                    value === undefined ||
                    (typeof value === 'string' && value.trim() === '') ||
                    (Array.isArray(value) && value.length === 0);

                if(isInvalid){
                    errors.push(value.text);
                }
            }
        } 
    }

    return errors;
}

export function validateSignUp(
    signUpData: SignUpUI
){
    const { 
        email, 
        password, 
        username, 
        confirmPassword 
    } = signUpData; 
    
    if(!email || !password || !username || !confirmPassword) throw new Error('Please fill up all information');
    
    if(
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/\d/.test(password) ||
        !/[!@#$%^&*]/.test(password)
    ) throw new Error('Password must be at least 8 characters consists of an uppercase, lowercase, special, and numerical characters');

    if(password !== confirmPassword) throw new Error('Passwords does not match.');

    if(username.length < 6) throw new Error('Username must be at least 6 characters');
}

export function validateInfo(
    userInfo: SignUpUI
){
    const { phoneNumber, firstname, lastname, birthday, address } = userInfo

    if(!phoneNumber && !firstname && !lastname && !birthday && !address) 
        throw new Error('Please fill up all information');

    if(!/^(09|\+639)\d{9}$/.test(phoneNumber)) throw new Error('Invalid phone number');

    if(!firstname.trim()) throw new Error('First name is required');
    
    if(!lastname.trim()) throw new Error('Last name is required');

    if(!birthday) throw new Error('Birthday is required');
    
    if(!address.trim()) throw new Error('Address is required');
}