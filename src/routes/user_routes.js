import express from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
} from "../controllers/user_controller.js";
import { upload } from "../middlewares/multer_middleware.js";
import { verifyJWT } from "../middlewares/auth_middleware.js";

const router = express.Router();
router.route("/hello").get((req, res) => {
    console.log(req.body);
    res.send("Hello");
});
router.route("/register").post(
    upload.fields([
        // name should be same in frontend also
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-Token", refreshAccessToken);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);
router.patch("/update-account",verifyJWT, updateAccountDetails);
router.patch("/avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);
router.patch(
    "/coverImage",
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
);
router.get("/channel/:username", verifyJWT, getUserChannelProfile);
router.get("/watch-history", verifyJWT, getWatchHistory);

export default router;  