import mongoose, { Document } from "mongoose";

export interface IPost extends Document {
    _id: mongoose.Types.ObjectId;
    content: string;
    image: string;
    owner: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            maxlength: 5000,
        },
        image: {
            type: String,
            default: "",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        likesCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ owner: 1, createdAt: -1 });

postSchema.methods.isLikedBy = function (userId: mongoose.Types.ObjectId): boolean {
    return this.likes.some((like: mongoose.Types.ObjectId) => like.equals(userId));
};

export default mongoose.model<IPost>("post", postSchema);
