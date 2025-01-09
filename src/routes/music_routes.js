import {
    createMusic,
    getMusic,
    getMusicById,
    getMusicByGenre,
    getMusicByArtist,
    updateMusic,
    deleteMusic,
} from "../controllers/music_controller.js";
import express from "express";
import {upload} from "../middlewares/multer_middleware.js";

const router = express.Router();

router.post("/create",upload.fields([
    {
        name: "music",
        maxCount: 1,
    },
    {
        name: "albumCover",
        maxCount: 1,
    },
    
]), createMusic);
router.get("/getmusic", getMusic);
router.get("/:id", getMusicById);
router.get("/genre/:genre", getMusicByGenre);
router.get("/artist/:artist", getMusicByArtist);
router.put("/update/:id", updateMusic);
router.delete("/delete/:id", deleteMusic);

export default router;