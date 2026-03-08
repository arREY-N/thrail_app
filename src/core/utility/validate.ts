import { IFormField } from "@/src/core/interface/formFieldInterface";
import { SignUp } from "@/src/core/models/User/SignUp";

export function validate<T>(
    object: any, 
    structure: IFormField<T>[],
): string[] {
    let errors: string[] = [];

    structure.forEach((field) => {
        const {section, id, label, required } = field;
        
        if(required) {
            const value = section === 'root'
                ? object[id]
                : object[section][id]
            
            if(!value || 
                (typeof value === 'string' && value.trim() === '') ||
                (Array.isArray(value) && value.length === 0)
            ){
                errors.push(label)
            }
        }
    })

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