import User from "../models/user_model.js";
import Music from "../models/music_model.js";
import Playlist from "../models/playlist_model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createPlaylist = asyncHandler(async (req,res) => {
    try {
        const {name, description} = req.body;
        const id = req.user._id;
        if(!name || !description)
        {
            throw new ApiError(400,"Name and Description are required");
        }
        const user = await User.findById(id);
        if(!user)
        {
            throw new ApiError(404,"User not found");
        }

        const new_playlist = await Playlist.create({
            name,
            description,
            user_id: id,
        })

        if(!new_playlist)
        {
            throw new ApiError(500,"Failed to create playlist");
        }

        return res.status(200).json(new ApiResponse(200,new_playlist,"Playlist created successfully"));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500,error.message));
    }
});

const addMusicToPlaylist = asyncHandler(async (req,res) => {
    try {
        const {music_id} = req.body;
        const {id} = req.params;
        if(!music_id)
        {
            throw new ApiError(400,"Music ID is required");
        }
        const playlist = await Playlist.findById(id);
        if(!playlist)
        {
            throw new ApiError(404,"Playlist not found");
        }
        const music = await Music.findById(music_id);
        if(!music)
        {
            throw new ApiError(404,"Music not found");
        }

        const updatePlaylist = await Playlist.findByIdAndUpdate(id,{
            $push: {
                music: music_id
            }
        },{new: true});

        return res.status(200).json(new ApiResponse(200,updatePlaylist,"Music added to playlist successfully"));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500,error.message));
    }
});

const updatePlaylist = asyncHandler(async (req,res) => {
    const {id} = req.params;
    const {name, description} = req.body;
    if(!name || !description)
    {
        throw new ApiError(400,"Name and Description are required");
    }
    const playlist = await Playlist.findById(id);
    if(!playlist)
    {
        throw new ApiError(404,"Playlist not found");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(id,{
        name,
        description
    },{new: true});
    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Playlist updated successfully"));
});

const removeMusicFromPlaylist = asyncHandler(async (req,res) => {
    const {id} = req.params;
    const {music_id} = req.body;
    if(!music_id)
    {
        throw new ApiError(400,"Music ID is required");
    }
    const playlist = await Playlist.findById(id);
    if(!playlist)
    {
        throw new ApiError(404,"Playlist not found");
    }
    const music = await Music.findById(music_id);
    if(!music)
    {
        throw new ApiError(404,"Music not found");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(id,{
        $pull: {
            music: music_id
        }
    },{new: true});
    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Music removed from playlist successfully"));
});

export { createPlaylist, addMusicToPlaylist, updatePlaylist, removeMusicFromPlaylist };