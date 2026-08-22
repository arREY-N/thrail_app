import { User } from "@/src/core/models/User/utils/UserFactory";
import { UserRepository } from "@/src/core/repositories/userRepository";
import { catchError } from "@/src/core/utility/errorFormatter";
import { useCallback, useState } from "react";

export function useHikerProfile(userId?: string) {
    const [hikerProfile, setHikerProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHikerProfile = useCallback(async () => {
        if (!userId) {
            setHikerProfile(null);
            return null;
        }

        setIsLoading(true);
        try {
            const user = await UserRepository.fetchById(userId);
            if (!user) {
                setHikerProfile(null);
                return null;
            }

            const profile = new User(user);
            setHikerProfile(profile);
            return profile;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onFetchHikerProfile()');
            setHikerProfile(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    return {
        hikerProfile,
        fetchHikerProfile,
        isLoading
    };
}
