import { signUp, updateUserProfile } from '@/src/core/FirebaseAuthUtil';

export async function onSignUp(
    email, 
    username, 
    password, 
    confirmPassword
) {
    try{
        if(!email || !username || !password || !confirmPassword){
            throw new Error('Please fill up all the necessary information.')
        }

        if(password !== confirmPassword){
            throw new Error('Password does not match')
        }

        const user = await signUp(email, password, username);
        
        if(!user) {
            throw new Error('Sign up failed.');
        }
    } catch (err) {
        console.error('Sign up error: ', err.message)
        throw new Error(err);
    }
}

export async function onUpdateUserProfile(
    uid,
    firstname,
    lastname,
    number,
    birthday,
    address
){
    try {
        if(!number || !firstname || !lastname || !birthday || !address){
            throw new Error('Please fill up all the necessary information.')
        }

        await updateUserProfile(
            uid,
            {
                firstname,
                lastname,
                number,
                birthday,
                address
            } 
        );
    } catch (err) {
        console.error('Error updating user profile: ', err.message);
        throw new Error(err);
    }
}