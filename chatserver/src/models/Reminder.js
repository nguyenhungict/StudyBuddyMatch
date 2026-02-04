import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true, index: true },
        creatorId: { type: String, required: true },
        creatorName: { type: String },
        content: { type: String, required: true },
        scheduledDate: { type: Date, required: true },
        // ID of the message that was created in chat when reminder was added
        messageId: { type: String },
        // Has the notification been sent?
        notificationSent: { type: Boolean, default: false },
        // Is the reminder cancelled?
        isCancelled: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("Reminder", ReminderSchema);
