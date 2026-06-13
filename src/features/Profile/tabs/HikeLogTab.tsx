import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import PostCard from '@/src/components/PostCard';

import { Colors } from '@/src/constants/colors';
import { Review } from '@/src/core/models/Review/Review';

export interface HikeLogTabProps {
    hikeLog?: Review[];
    onLikeReview: (review: Review) => void;
    isLiked: (review: Review) => boolean;
    onEditReview: (id: string) => void;
}

const HikeLogTab = ({ hikeLog, onLikeReview, isLiked, onEditReview }: HikeLogTabProps) => {
    
    if (!hikeLog || hikeLog.length === 0) {
        return (
            <View style={styles.emptyState}>
                <CustomIcon 
                    library="Feather" 
                    name="edit-3" 
                    size={48} 
                    color={Colors.GRAY_LIGHT} 
                />
                <CustomText style={styles.emptyText}>
                    No hikes logged yet.
                </CustomText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {hikeLog.map((log) => (
                <PostCard 
                    key={log.id} 
                    review={log}
                    variant="profile" 
                    isLiked={Boolean(isLiked(log))}
                    onLike={() => onLikeReview(log)}
                    onEdit={() => onEditReview(log.id)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
    }
});

export default HikeLogTab;
