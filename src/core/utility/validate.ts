import { IFormField } from "@/src/core/interface/formFieldInterface";
import { SignUp } from "@/src/core/models/User/User";

export function validate<T>(
    object: Record<string, unknown> | object, 
    structure: IFormField<T>[],
): string[] {
    const errors: string[] = [];

    structure.forEach((field) => {
        const { section, id, label, required } = field;
        
        if (required) {
            const sectionRecord = (section as string) === 'root'
                ? (object as Record<string, unknown>)
                : ((object as Record<string, unknown>)?.[section as string] as Record<string, unknown> | undefined);
            
            const value = sectionRecord?.[id];
            
            const isMissing = value === null ||
                value === undefined ||
                (typeof value === 'string' && value.trim() === '') ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === 'number' && isNaN(value));

            // Coordinates cannot be 0 (Null Island)
            const isInvalidCoordinate = (id.toLowerCase().includes('lat') || id.toLowerCase().includes('long')) && value === 0;

            // Trail length cannot be 0 km
            const isInvalidLength = id === 'length' && value === 0;
            
            if (isMissing || isInvalidCoordinate || isInvalidLength) {
                errors.push(label);
            }
        }
    });

    return errors;
}



export function validateSignUp(
    signUpData: SignUp
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
    userInfo: SignUp
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