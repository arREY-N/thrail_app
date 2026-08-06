import os
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
import faiss

logger = logging.getLogger("recommendation_engine")

# Define categorical ranges and index schemas
PROVINCES = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon']
AMENITY_COLS = ['tourism_shelter', 'tourism_resting', 'tourism_clean_water', 'tourism_river', 'tourism_lake', 'tourism_waterfall', 'tourism_network_connection']

# Min-Max Normalization limits
MAX_LASCO_RATING = 9.0
MAX_LENGTH_KM = 30.0
MAX_GAIN_M = 2000.0
MAX_SLOPE_PCT = 45.0
MAX_HOURS = 12.0

class HybridRecommender:
    """
    @class HybridRecommender
    @description Handles trail recommendation computation blending content-based search (FAISS IndexFlatIP)
                 and collaborative filtering (Pearson Correlation).
    """
    def __init__(self, trails_csv_path: str, ratings_csv_path: str):
        """
        @constructor
        @param {str} trails_csv_path - Absolute path to the trails mock database CSV.
        @param {str} ratings_csv_path - Absolute path to the user reviews/ratings database CSV.
        """
        self.trails_csv_path = trails_csv_path
        self.ratings_csv_path = ratings_csv_path
        
        # Load and clean datasets
        self.trails_df = pd.read_csv(self.trails_csv_path)
        self.ratings_df = pd.read_csv(self.ratings_csv_path)
        
        # Fill missing values and clean types
        self.trails_df['province'] = self.trails_df['province'].fillna('').str.lower()
        for col in AMENITY_COLS:
            if col in self.trails_df.columns:
                self.trails_df[col] = self.trails_df[col].astype(bool).astype(float)
            else:
                self.trails_df[col] = 0.0
        
        # Standardize numeric columns
        self.trails_df['difficulty_lascoRating'] = pd.to_numeric(self.trails_df['difficulty_lascoRating'], errors='coerce').fillna(3.0)
        self.trails_df['difficulty_length'] = pd.to_numeric(self.trails_df['difficulty_length'], errors='coerce').fillna(5.0)
        self.trails_df['difficulty_gain'] = pd.to_numeric(self.trails_df['difficulty_gain'], errors='coerce').fillna(200.0)
        self.trails_df['difficulty_slope'] = pd.to_numeric(self.trails_df['difficulty_slope'], errors='coerce').fillna(10.0)
        self.trails_df['difficulty_hours'] = pd.to_numeric(self.trails_df['difficulty_hours'], errors='coerce').fillna(2.0)
        self.trails_df['general_rating'] = pd.to_numeric(self.trails_df['general_rating'], errors='coerce').fillna(4.0)

        # Build FAISS content vectors matrix
        self.trail_ids, self.trail_vectors = self._build_trail_vectors()
        self.dimension = self.trail_vectors.shape[1]
        
        # Initialize FAISS Index using Inner Product for Cosine Similarity (since vectors are L2-normalized)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(self.trail_vectors)
        logger.info(f"Initialized FAISS IndexFlatIP with {self.index.ntotal} trails, dimensions={self.dimension}")

    def _build_trail_vectors(self) -> Tuple[List[str], np.ndarray]:
        """
        @function _build_trail_vectors
        @description Builds a normalized float32 feature matrix for all trails (17-dimensional vectors).
        @returns {Tuple[List[str], np.ndarray]} Map of index to trail IDs, and the L2 unit-normalized vectors.
        """
        vectors = []
        trail_ids = []
        
        for _, row in self.trails_df.iterrows():
            # Normalized numeric attributes (capped between 0.0 and 1.0)
            lasco = min(row['difficulty_lascoRating'] / MAX_LASCO_RATING, 1.0)
            length = min(row['difficulty_length'] / MAX_LENGTH_KM, 1.0)
            gain = min(row['difficulty_gain'] / MAX_GAIN_M, 1.0)
            slope = min(row['difficulty_slope'] / MAX_SLOPE_PCT, 1.0)
            hours = min(row['difficulty_hours'] / MAX_HOURS, 1.0)
            
            # Province multi-hot (5 dimensions)
            prov_vector = [1.0 if p in row['province'] else 0.0 for p in PROVINCES]
            
            # Amenity flags (7 dimensions)
            amenity_vector = [row[col] for col in AMENITY_COLS]
            
            # Concatenate features and convert to numpy array
            trail_vec = np.array([lasco, length, gain, slope, hours] + prov_vector + amenity_vector, dtype=np.float32)
            
            # L2 Normalize the vector for Cosine Similarity
            norm = np.linalg.norm(trail_vec)
            if norm > 0:
                trail_vec = trail_vec / norm
                
            vectors.append(trail_vec)
            trail_ids.append(row['id'])
            
        return trail_ids, np.array(vectors, dtype=np.float32)

    def _build_user_vector(self, preferences: Dict[str, Any]) -> np.ndarray:
        """
        @function _build_user_vector
        @description Maps user onboarding responses into a unit-normalized query vector.
        @param {Dict[str, Any]} preferences - Onboarding preference values.
        @returns {np.ndarray} A 1x17 dimensional float32 unit query vector.
        """
        # Map experience target points
        exp = preferences.get('experience', 'Beginner').lower()
        if exp == 'beginner':
            lasco, length, gain, slope, hours = 3.0 / MAX_LASCO_RATING, 4.0 / MAX_LENGTH_KM, 200.0 / MAX_GAIN_M, 8.0 / MAX_SLOPE_PCT, 2.0 / MAX_HOURS
        elif exp == 'regular':
            lasco, length, gain, slope, hours = 5.0 / MAX_LASCO_RATING, 10.0 / MAX_LENGTH_KM, 500.0 / MAX_GAIN_M, 15.0 / MAX_SLOPE_PCT, 4.0 / MAX_HOURS
        else: # experienced
            lasco, length, gain, slope, hours = 8.0 / MAX_LASCO_RATING, 18.0 / MAX_LENGTH_KM, 1000.0 / MAX_GAIN_M, 25.0 / MAX_SLOPE_PCT, 7.0 / MAX_HOURS
            
        # Map province preferences
        pref_provs = [p.lower() for p in preferences.get('province', [])]
        prov_vector = [1.0 if p in pref_provs else 0.0 for p in PROVINCES]
        
        # Amenities default (neutral target weights)
        amenity_vector = [0.5] * len(AMENITY_COLS)
        
        user_vec = np.array([lasco, length, gain, slope, hours] + prov_vector + amenity_vector, dtype=np.float32)
        
        # L2 Normalize the vector for Cosine Similarity
        norm = np.linalg.norm(user_vec)
        if norm > 0:
            user_vec = user_vec / norm
            
        return user_vec.reshape(1, -1)

    def get_content_recommendations(self, preferences: Dict[str, Any], top_k: int) -> List[Tuple[str, float]]:
        """
        @function get_content_recommendations
        @description Executes vector search in FAISS Index to identify top matching trails.
        @param {Dict[str, Any]} preferences - User preference profile details.
        @param {int} top_k - Maximum recommendation count.
        @returns {List[Tuple[str, float]]} List of matching trail IDs and similarity score pairs.
        """
        user_vector = self._build_user_vector(preferences)
        distances, indices = self.index.search(user_vector, len(self.trail_ids))
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                trail_id = self.trail_ids[idx]
                # Inner product results return the cosine similarity directly when both vectors are unit normalized
                similarity_score = float(dist)
                similarity_score = max(0.0, min(1.0, similarity_score)) # Clamp to [0.0, 1.0]
                results.append((trail_id, similarity_score))
                
        return results[:top_k]

    def get_collaborative_recommendations(self, user_id: str) -> Dict[str, float]:
        """
        @function get_collaborative_recommendations
        @description Computes collaborative score vectors using Pearson correlations between users.
        @param {str} user_id - Unique ID of target user.
        @returns {Dict[str, float]} Map of trail IDs to rating prediction estimates.
        """
        if self.ratings_df.empty or user_id not in self.ratings_df['user_id'].values:
            return {}
            
        # Create user-trail rating matrix
        pivot_matrix = self.ratings_df.pivot_table(index='user_id', columns='trail_id', values='overallRating')
        
        # Find active user's ratings
        user_ratings = pivot_matrix.loc[user_id]
        
        # Compute Pearson correlation with other users, suppressing NaN/division-by-zero warnings for sparse inputs
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=RuntimeWarning)
            correlations = pivot_matrix.corrwith(user_ratings, axis=1, method='pearson')
            
        correlations = correlations.dropna().drop(index=user_id, errors='ignore')
        
        if correlations.empty:
            return {}
            
        # Predict ratings for unrated trails using weighted averages of other user ratings
        trail_scores = {}
        for trail_id in pivot_matrix.columns:
            if pd.isna(user_ratings[trail_id]): # Only recommend unvisited trails
                other_ratings = pivot_matrix[trail_id].dropna()
                common_users = other_ratings.index.intersection(correlations.index)
                
                if not common_users.empty:
                    sim_weights = correlations.loc[common_users]
                    ratings = other_ratings.loc[common_users]
                    
                    weight_sum = sim_weights.abs().sum()
                    if weight_sum > 0:
                        pred_rating = np.dot(ratings, sim_weights) / weight_sum
                        # Normalize predicted rating (1-5 scale) to [0.0, 1.0]
                        trail_scores[trail_id] = float(pred_rating / 5.0)
                        
        return trail_scores

    def get_hybrid_recommendations(self, user_id: str, preferences: Dict[str, Any], top_k: int, base_alpha: float) -> List[Dict[str, Any]]:
        """
        @function get_hybrid_recommendations
        @description Blends content recommendations with collaborative recommendations using dynamic alpha tuning.
        @param {str} user_id - target user document identifier.
        @param {Dict[str, Any]} preferences - target user profile preferences.
        @param {int} top_k - Maximum recommendation count.
        @param {float} base_alpha - Default fallback content weight.
        @returns {List[Dict[str, Any]]} Sorted recommendation matches.
        """
        # Determine user history count
        user_history = self.ratings_df[self.ratings_df['user_id'] == user_id]
        history_count = len(user_history)
        
        # 1. Dynamic Alpha adjustment to solve Cold Start
        if history_count == 0:
            alpha = 1.0 # Pure content based matching
            logger.info(f"Cold-start detected for user {user_id}. Setting alpha=1.0")
        else:
            # Shift towards collaborative based on rating frequency: alpha = e^(-0.2 * history_count)
            alpha = max(np.exp(-0.2 * history_count) * base_alpha, 0.4)
            logger.info(f"User {user_id} has {history_count} ratings. Dynamic alpha adjusted to {alpha:.4f}")
            
        # 2. Compute Content-Based similarity scores (FAISS)
        content_matches = self.get_content_recommendations(preferences, len(self.trail_ids))
        content_scores = {trail_id: score for trail_id, score in content_matches}
        
        # 3. Compute Collaborative Filtering ratings
        collaborative_scores = self.get_collaborative_recommendations(user_id)
        
        # 4. Hybrid score combination
        hybrid_results = []
        for idx, row in self.trails_df.iterrows():
            trail_id = row['id']
            trail_name = row['name']
            
            c_score = content_scores.get(trail_id, 0.0)
            cf_score = collaborative_scores.get(trail_id, c_score) # Fallback to content similarity if no ratings
            
            hybrid_score = (alpha * c_score) + ((1.0 - alpha) * cf_score)
            
            # Format readable matches
            reason = f"Matches your target onboarding preferences for {row['province'].title()}."
            if trail_id in collaborative_scores:
                reason = f"Highly rated by users with similar hiking interests."
                
            hybrid_results.append({
                "trail_id": trail_id,
                "trail_name": trail_name,
                "match_score": round(float(hybrid_score), 4),
                "reason": reason
            })
            
        # Sort by match score in descending order
        hybrid_results.sort(key=lambda x: x['match_score'], reverse=True)
        return hybrid_results[:top_k]

