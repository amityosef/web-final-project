import mongoose, { Document } from "mongoose";

export interface IComment extends Document {
    _id: mongoose.Types.ObjectId;
    content: string;
    postId: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post",
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

commentSchema.index({ postId: 1, createdAt: -1 });

export default mongoose.model<IComment>("comment", commentSchema);
