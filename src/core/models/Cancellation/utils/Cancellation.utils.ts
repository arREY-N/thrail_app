import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";

export const flagCancellationRequest = (request: Cancellation, approved: Boolean, adminNote?: string): Cancellation => {
    const updated: Cancellation = {
        ...request,
        status: approved ? "approved" : "rejected",
        updatedAt: new Date(),
    }
    
    if(!approved) {
        if(!adminNote || adminNote.trim() === "") {
            throw new Error("Admin note is required when rejecting a cancellation request.");
        }

        updated.adminNote = adminNote;
    }

    return updated;
}