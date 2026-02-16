import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    name: string;
    profileImage: string;
    googleId?: string;
    refreshToken: string[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: function (this: IUser) {
                return !this.googleId;
            },
        },
        name: {
            type: String,
            default: "",
        },
        profileImage: {
            type: String,
            default: "",
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        refreshToken: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IUser>("user", userSchema);
