import { Business, IBusinessSummary } from "@/src/core/models/Business/interfaces/Business.types";

export const BusinessLogic = {
    toSummary(business: Business): IBusinessSummary {
        return {
            id: business.id,
            name: business.name,
        };
    },
};
