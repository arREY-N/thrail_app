import { signUp } from '@/src/core/FirebaseAuthUtil';

export async function onSignUp(
    email, 
    username, 
    password,
    phoneNumber,
    lastname,
    firstname,
    birthday,
    address
) {
    try{
        if(!phoneNumber || !firstname || !lastname || !birthday || !address){
            throw new Error('Please fill up all the necessary information.')
        }

        const user = await signUp(
            email, 
            password, 
            username, 
            phoneNumber, 
            lastname, 
            firstname, 
            birthday, 
            address
        );
        
        if(!user) {
            throw new Error('Sign up failed.');
        }

    } catch (err) {
        console.error('Sign up error: ', err.message)
        throw new Error(err.message);
    }
}

export function saveSignUp(
    email, 
    password, 
    username, 
    confirmPassword,
    setAccount
){  
    if(!email || !password || !username || !confirmPassword) throw new Error('Please fill up all information');
    
    if(password.length < 8) throw new Error('Password must be at least 8 characters');

    if(!/[A-Z]/.test(password)) throw new Error('Password must have at least 1 uppercase character');
    
    if(!/[a-z]/.test(password)) throw new Error('Password must have at least 1 lowercase character');

    if(!/\d/.test(password)) throw new Error('Password must have at least 1 number');
    
    if(!/[!@#$%^&*]/.test(password)) throw new Error('Password must have at least 1 special character');

    if(password !== confirmPassword) throw new Error('Passwords does not match.');

    if(username.length < 6) throw new Error('Username must be at least 6 characters');

    setAccount(prev => ({
        ...prev,
        email,
        password,
        username,
    }))
}
// if(!number || !firstname || !lastname || !birthday || !address){
//     throw new Error('Please fill up all the necessary information.')
// }