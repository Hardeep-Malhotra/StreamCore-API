// Importing async wrapper to handle try/catch automatically
import { asyncHandler } from "../utils/asyncaHandler.js";

// Custom error class for proper error handling
import { ApiError } from "../utils/ApiError.js";

// User model for DB operations
import { User } from "../models/user.model.js";

// Cloudinary upload helper
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Custom API response format
import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";

// Cloudinary main package
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";


// -------------------------------
// Generate Access & Refresh Tokens
// -------------------------------
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // Find user by ID
        const user = await User.findById(userId);

        // Generate access & refresh tokens using schema methods
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};


// -------------------------------
// Register User
// -------------------------------
const registerUser = asyncHandler(async (req, res) => {

    // Get data from request body
    const { fullName, email, username, password } = req.body;

    // Check if any field is empty
    if ([fullName, email, username, password].some((f) => f?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with email/username already exists");
    }

    // Avatar required
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Cover image is optional
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // Upload avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // Create new user in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // Return user without password & refreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});


// -------------------------------
// Login User
// -------------------------------
const loginUser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body;

    // Email/username + password required
    if ((!email && !username) || !password) {
        throw new ApiError(400, "Email/Username and password required");
    }

    // Find user
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Check password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    // Remove sensitive fields
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // Cookie options
    const options = {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});


// -------------------------------
// Logout User
// -------------------------------
const logoutUser = asyncHandler(async (req, res) => {

    // Remove refresh token from DB
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined },
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});


// -------------------------------
// Refresh Access Token
// -------------------------------
const refreshAccessToken = asyncHandler(async (req, res) => {

    // Get refresh token from cookie/body
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No refresh token found");
    }

    try {
        // Verify token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Find user
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Check if provided refresh token matches stored one
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Expired or invalid refresh token");
        }

        // Generate new tokens
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        };

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


// -------------------------------
// Change Current Password
// -------------------------------
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldpassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(req.user?._id);

    // Check old password
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password.");
    };

    // Set new password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully."));
});


// -------------------------------
// Get Current User Details
// -------------------------------
const getCurrentuser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "current user fetched successfully.")
});


// -------------------------------
// Update Account Details
// -------------------------------
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    };

    // Update DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully."));
});


// -------------------------------
// Update User Avatar
// -------------------------------
const updateUserAvater = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing.");
    }

    // Get user
    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary
    if (user.avatar) {
        const oldPublicId = user.avatar.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(oldPublicId);
    }

    // Upload new avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
        throw new ApiError(400, "Error while uploading avatar.");
    }

    // Update in DB
    const updateAvatar = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, updateAvatar, "Avatar updated successfully."));
});


// -------------------------------
// Update User Cover Image
// -------------------------------
const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is missing.");
    }

    // Get user
    const user = await User.findById(req.user._id);

    // Delete old cover image
    if (user.coverImage) {
        const oldPublicId = user.coverImage.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(oldPublicId);
    }

    // Upload new image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
        throw new ApiError(500, "Error while uploading cover image.");
    }

    // Update DB
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Cover image updated successfully."));
});


// -------------------------------
// Get User Channel Profile
// -------------------------------
const getUserChannelProfile = asyncHandler(async (req, res) => {

    // URL params se username nikal rahe hain (example: /c/hardeep)
    const { username } = req.params;

    // Agar username empty ya missing ho → error
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing.");
    }

    // Aggregate Pipeline start
    const channel = await User.aggregate([

        // -------------------- STAGE 1: MATCH USER --------------------
        {
            $match: {
                // username compare lowercase me ho raha hai
                username: username.toLowerCase()
            }
        },

        // -------------------- STAGE 2: FIND SUBSCRIBERS --------------------
        {
            $lookup: {
                from: "subscriptions",       // subscriptions collection
                localField: "_id",           // current user "_id"
                foreignField: "channel",     // jiska 'channel' field match kare → wo is channel ka subscriber hai
                as: "subscribers"            // result are store in array 
            }
        },

        // -------------------- STAGE 3: FIND CHANNELS USER IS SUBSCRIBED TO --------------------
        {
            $lookup: {
                from: "subscriptions",       // same collection
                localField: "_id",           // user id
                foreignField: "subscriber",  // jahan ye user kisi ko subscribe kar raha hai
                as: "subscribedTo"           // result
            }
        },

        // -------------------- STAGE 4: ADD EXTRA FIELDS --------------------
        {
            $addFields: {
                // Total subscribers count
                subscribersCount: { $size: "$subscribers" },

                // User kitne channels ko subscribe karta hai
                channelsSubscribedToCount: { $size: "$subscribedTo" },

                // Logged-in user already subscribed hai ya nahi
                isSubscribed: {
                    $cond: {
                        // req.user._id subscribers array me exist karta hai?
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },

        // -------------------- STAGE 5: REMOVE SENSITIVE FIELDS --------------------
        {
            $project: {
                password: 0,     // password hide
            }
        }
    ]);

    // Agar user / channel nahi mila → error
    if (!channel?.length) {
        throw new ApiError(404, "Channel not found.");
    }

    // Final Response
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            channel[0],    // first result
            "User channel profile fetched successfully."
        ));
});

const getWatchHistory = asyncHandler(async (req, res) => {

    // Aggregate pipeline on User collection
    const user = await User.aggregate([

        // -------------------- STAGE 1: MATCH CURRENT USER --------------------
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },

        // -------------------- STAGE 2: LOOKUP WATCHED VIDEOS --------------------
        {
            $lookup: {
                from: "videos",                 // collection containing videos
                localField: "watchHistory",     // user's array of video IDs
                foreignField: "_id",            // match video _id
                as: "watchHistory",             // output array field

                // Add nested pipeline to populate video owner
                pipeline: [
                    {
                        $lookup: {
                            from: "users",         // collection containing owners
                            localField: "owner",   // video's owner field
                            foreignField: "_id",  // match owner _id
                            as: "owner",           // output owner field
                            pipeline: [
                                {
                                    $project: {
                                        password: 0 // hide password
                                    }
                                },
                                {
                                    $addFields: {
                                        // After lookup, owner is an array (because $lookup always returns array)
                                        // $first will take the first element from that array, so 'owner' becomes an object
                                        owner: { $first: "$owner" }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]);

    // Return the watch history
    return res.status(200).json({
        success: true,
        data: user[0]?.watchHistory || [],
        message: "Watch history fetched successfully"
    });
});
// Exporting all controllers
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentuser,
    updateAccountDetails,
    updateUserAvater,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
