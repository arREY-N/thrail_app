import { router } from "expo-router"

export function useOfferNavigation() {
    const onSeeTrailOffers = (trailId: string) => {
        router.push({
            pathname: '/(main)/offer/list',
            params: { trailId, mode: 'trail' }
        })
    }

    return {
        onSeeTrailOffers
    }
}