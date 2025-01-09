import mongoose from "mongoose";

const musicSchema = new mongoose.Schema({
    title:
    {
        type: String,
        required: true,
        trim: true,
    },
    artist:
    {
        type: String,
        required: true,
        trim: true,
    },
    album:
    {
        type: String,
        required: true,
        trim: true,
    },
    albumCover:
    {
        type: String,
        required: true,
        trim: true,
    },
    genre:
    {
        type: String,
        required: true,
        trim: true,
    },
    releaseDate:
    {
        type: Date,
        required: true,
    },
    duration:
    {
        type: Number,
        required: true,
    },
    url:
    {
        type: String,
        required: true,
    },
    cloudinary_music_public_id:
    {
        type: String,
    },
    tages:
    [
        {
            type: String,
            trim: true,
        }
    ],
    views:
    {
        type: Number,
        default: 0,
    },
},{timestamps: true});

const Music = mongoose.model("Music",musicSchema);