import { createContext, useContext, useState } from "react";
import { fetchMonthRecommendation } from "../repositories/recommendationRepository";

const RecommendationContext = createContext(null);

export function useRecommendation(){
    const context = useContext(RecommendationContext);

    if(!context){
        throw new Error('useRecommendation must be within a RecommendationProvider');
    }

    return context;
}

export function RecommendationProvider({children}){
    const [recommendation, setRecommendation] = useState(null);
    const [recommendedTrails, setRecommendedTrails] = useState([]);
    const [isLoaded, setLoaded] = useState(false);

    const loadLatestRecommendation = async (uid, trailList) => {
        try {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const yearMonth = `${now.getFullYear()}-${month}`;
            const latest = await fetchMonthRecommendation(uid, yearMonth);
            setRecommendation(latest);
            if(!latest || !latest.trails) {                
                setRecommendedTrails([]);
                setLoaded(true);
                return;
            }

            console.log('Latest:', latest);
            
            
            const mappedTrails = latest.trails
                .map(t => {
                    const trail = trailList.find(item => item.id === t.trail);
                    if (!trail) return null;
                    return {...trail, score: t.score};
                })
                .filter(Boolean);

            const sort = mappedTrails.sort((a,b) => b.score - a.score);

            setRecommendedTrails(sort);
            setLoaded(true);
        } catch (err) {
            console.error('Error fetching recommendations: ', err);
            setRecommendation(null);
        }
    }

    const resetRecommendations = () => {
        setRecommendation(null);
        setRecommendedTrails(null);
        setLoaded(false);
    }

    const value = {
        recommendation,
        loadLatestRecommendation,
        recommendedTrails,
        resetRecommendations,
        isLoaded
    }

    return <RecommendationContext.Provider value={value}>{children}</RecommendationContext.Provider>
} 