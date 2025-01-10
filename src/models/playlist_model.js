import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    music: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Music",
        }
    ]
},{timestamps: true});

const Playlist = mongoose.model("Playlist", playlistSchema);