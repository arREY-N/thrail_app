import { Business } from "@/src/core/models/Business/Business";
import { IBusinessSummary } from "@/src/core/models/Business/Business.types";

export const BusinessLogic = {
    toSummary(business: Business): IBusinessSummary {
        return {
            id: business.id,
            name: business.name,
        }
    }
}