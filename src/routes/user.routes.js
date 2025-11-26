// -------------------------------
// IMPORTS
// -------------------------------
import { Router } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncaHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v2 as cloudinary } from "cloudinary";

import {
    changeCurrentPassword,
    getCurrentuser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    registerUser,
    updateAccountDetails,
    updateUserAvater,
    updateUserCoverImage,
    refreshAccessToken
} from "../controllers/user.controller.js";

const router = Router();

// -------------------------------
// ROUTES
// -------------------------------

// ----- Register user (with avatar & optional cover image)
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

// ----- Login user
router.route("/login").post(loginUser);

// ----- Secured routes (require JWT)
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentuser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvater);

// ----- Corrected cover image upload route
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// ----- User channel profile
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

// ----- User watch history
router.route("/watchHistory").get(verifyJWT, getWatchHistory);

export default router;

