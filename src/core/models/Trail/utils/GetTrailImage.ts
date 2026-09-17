import { useTrailStore } from "@/src/core/models/Trail/stores/trailStore";

export const getTrailImage = (trailId: string) => {
    if (trailId === 'diy' || trailId === 'diy_session') return 'https://www.istockphoto.com/photos/photo-placeholder'

    const fetch = async () => {
        await useTrailStore.getState().load(trailId);
    }

    fetch();
    const trail = useTrailStore.getState().data.find(t => t.id === trailId);

    return trail?.coverImage || 'https://www.istockphoto.com/photos/photo-placeholder';
} 