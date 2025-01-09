import Music from "../models/music_model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { cloudinary } from "../utils/cloudinary.js";

const createMusic = asyncHandler(async (req, res) => {
    try {
        const { title, artist, genre, album, releaseDate, tages } = req.body;
        const music_path = req.files.music.path;
        const albumCover_path = req.files.albumCover.path;
        if (!title || !artist || !genre || !album || !releaseDate) {
            throw new ApiError(400, "Please provide all the required fields");
        }
        if (!music_path || !albumCover_path) {
            throw new ApiError(400, "Music and Album Cover is required");
        }
        const music_upload = await cloudinary.uploader.upload(music_path);
        if (!music_upload) {
            throw new ApiError(500, "Error in uploading music");
        }
        const albumCover_upload = await cloudinary.uploader.upload(
            albumCover_path
        );
        if (!albumCover_upload) {
            throw new ApiError(500, "Error in uploading album cover");
        }

        const music = Music.create({
            title,
            artist,
            album,
            genre,
            releaseDate,
            duration: 0,
            url: music_upload.secure_url,
            cloudinary_music_public_id: music_upload.public_id,
            albumCover: albumCover_upload.secure_url,
            tages,
        });

        if (!music) {
            throw new ApiError(500, "Error while creating music entry");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, music, "Music created successfully"));
    } catch (e) {
        return res
            .status(e.code || 500)
            .json(new ApiResponse(e.code || 500, null, e.message));
    }
});

const getMusic = asyncHandler(async (req, res) => {
    try {
        const music = await Music.find();
        if (!music) {
            throw new ApiError(404, "No music found");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, music, "Music fetched successfully"));
    } catch (e) {
        return res
            .status(e.code || 500)
            .json(new ApiResponse(e.code || 500, null, e.message));
    }
});

const getMusicById = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new ApiError(400, "Please provide music id");
        }
        const music = await Music.findById(id);
        if (!music) {
            throw new ApiError(404, "No music found");
        }
        const updatedMusic = await Music.findByIdAndUpdate(
            id,
            { $inc: 1 },
            { new: true }
        );
        if (!updatedMusic) {
            throw new ApiError(500, "Error while updating views");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, music, "Music fetched successfully"));
    } catch (e) {
        return res
            .status(e.code || 500)
            .json(new ApiResponse(e.code || 500, null, e.message));
    }
});

const getMusicByGenre = asyncHandler(async (req, res) => {
    try {
        const genre = req.params.genre;
        if (!genre) {
            throw new ApiError(400, "Please provide genre");
        }
        const music = await Music.find({ genre: genre });
        if (!music) {
            throw new ApiError(404, "No music found");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, music, "Music fetched successfully"));
    } catch (e) {
        return res
            .status(e.code || 500)
            .json(new ApiResponse(e.code || 500, null, e.message));
    }
});

const updateMusic = asyncHandler(async (req, res) => {
    try {
        const { title, artist, genre, album, tages } = req.body;
        const id = req.params.id;
        if (!id) {
            throw new ApiError(400, "Please provide music id");
        }
        let updatedValue = {};
        if (title) {
            updatedValue.title = title;
        }
        if (artist) {
            updatedValue.artist = artist;
        }
        if (album) {
            updatedValue.album = album;
        }
        if (genre) {
            updatedValue.genre = genre;
        }
        if (tages) {
            updatedValue.tages = tages;
        }
        const music = await Music.findByIdAndUpdate(id, updatedValue, {
            new: true,
        });
        if (!music) {
            throw new ApiError(404, "No music found");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, music, "Music updated successfully"));
    } catch (e) {
        return res
            .status(e.code || 500)
            .json(new ApiResponse(e.code || 500, null, e.message));
    }
});

const deleteMusic = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new ApiError(400, "Please provide music id");
        }
        const music = await Music.findByIdAndDelete(id);
        if (!music) {
            throw new ApiError(404, "No music found");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Music deleted successfully"));
    } catch (e) {
        return res
            .status(e.code || 500)
            .json(new ApiResponse(e.code || 500, null, e.message));
    }
});

const getMusicByArtist = asyncHandler(async (req, res) => {
    try {
        const artist = req.params.artist;
        if (!artist) {
            throw new ApiError(400, "Please provide artist name");
        }
        const music = await Music.find({ artist: artist });
        if (!music) {
            throw new ApiError(404, "No music found");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, music, "Music fetched successfully"));
    } catch (e) {
        return res
            .status(e.code || 500)
            .json(new ApiResponse(e.code || 500, null, e.message));
    }
});

export {
    createMusic,
    getMusic,
    getMusicById,
    getMusicByGenre,
    getMusicByArtist,
    updateMusic,
    deleteMusic,
};