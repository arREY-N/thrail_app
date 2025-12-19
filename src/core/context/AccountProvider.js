import { createContext, useContext, useState } from "react";

const AccountContext = createContext(null);

export function useAccount(){
    const context = useContext(AccountContext);
    
    if(!context){
        throw new Error('useAccount must be used inside an AccountProvider')
    }

    return context;
}

export function AccountProvider({children}){
    const [account, setAccount] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        firstname: '',
        lastname: '',
        birthday: '',
        address: '', 
    });
    
    const setValue = ({property, value}) => {
        setAccount(prev => ({
            ...prev,
            [property]: value
        }));
    }

    const resetAccount = () => {
        setAccount({
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            firstname: '',
            lastname: '',
            birthday: '',
            address: '', 
        })
    }

    const value = {
        account,
        setValue,
        setAccount,
        resetAccount
    }

    return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}