import { signUp } from '@/src/core/FirebaseAuthUtil';

export async function onSignUp(account) {
    try{
        const user = await signUp(
            account.email, 
            account.password, 
            account.username, 
            account.phoneNumber, 
            account.lastname, 
            account.firstname, 
            account.birthday, 
            account.address
        );
        
        if(!user) {
            throw new Error('Sign up failed.');
        }

    } catch (err) {
        console.error('Sign up error: ', err);
        throw new Error(err);
    }
}

export function validateSignUp(
    email, 
    password, 
    username, 
    confirmPassword,
){  
    if(!email || !password || !username || !confirmPassword) throw new Error('Please fill up all information');
    
    if(password.length < 8) throw new Error('Password must be at least 8 characters');

    if(!/[A-Z]/.test(password)) throw new Error('Password must have at least 1 uppercase character');
    
    if(!/[a-z]/.test(password)) throw new Error('Password must have at least 1 lowercase character');

    if(!/\d/.test(password)) throw new Error('Password must have at least 1 number');
    
    if(!/[!@#$%^&*]/.test(password)) throw new Error('Password must have at least 1 special character');

    if(password !== confirmPassword) throw new Error('Passwords does not match.');

    if(username.length < 6) throw new Error('Username must be at least 6 characters');
}

export function validateInfo(
    phoneNumber,
    firstname,
    lastname,
    birthday,
    address
){

}