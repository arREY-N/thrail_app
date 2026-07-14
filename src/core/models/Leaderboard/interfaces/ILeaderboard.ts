/**
 * Represents the shape of data stored in the leaderboard collection as used internally. 
*/
export interface HikeSummary {
    userId: string;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    profileImage: string;
    totalDistance: number;
    totalElevation: number;
    totalHikes: number;
    rank: number;
}

/**
 * Represents the shape of data stored in the leaderboard collection in the database.
 */
export interface HikeSummaryInDB extends Omit<HikeSummary, 'userId'> {}

/**
 * Represents the shape of data stored in the leaderboard collection before ranking is applied.
 * This interface is used to facilitate the ranking process without including the rank property.
 */
export interface HikeSummaryPreRankings extends Omit<HikeSummary, 'rank'> {}