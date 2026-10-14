import { Cancellation } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";

export const flagCancellationRequest = (request: Cancellation, approved: boolean, adminNote?: string): Cancellation => {
    const updated: Cancellation = {
        ...request,
        status: approved ? "approved" : "rejected",
        updatedAt: new Date(),
    };
    
    if (!approved) {
        if (!adminNote || adminNote.trim() === "") {
            throw new Error("Admin note is required when rejecting a cancellation request.");
        }

        updated.adminNote = adminNote;
    }

    return updated;
};