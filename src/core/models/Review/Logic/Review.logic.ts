import { DifficultyRating } from "@/src/core/models/Review/Review.types";

export const ReviewLogic = {
    toNumerical(rating: DifficultyRating): number {
        switch (rating) {
            case "Easy":
                return 1;
            case "Just Right":
                return 2;
            case "Moderate":
                return 3;
            case "Hard":
                return 4;
            case "Extreme":
                return 5;
            default:
                throw new Error(`Unhandled difficulty rating: ${rating}`);
        }
    },
    toTextual(rating: number): DifficultyRating {
        switch (rating) {
            case 1:
                return "Easy";
            case 2:
                return "Just Right";    
            case 3:
                return "Moderate";
            case 4:
                return "Hard";  
            case 5: 
                return "Extreme";
            default:
                throw new Error(`Unhandled difficulty rating: ${rating}`);
        }
    }
}