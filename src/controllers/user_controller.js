import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user_model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";
// import bcrypt from {bcrypt};

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

export const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     success: true,
    //     message: "Ok"
    // })
    // Take user input
    const { fullName, email, username, password } = req.body;
    // validate input
    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "Fields are required");
    }
    // check if user already exists using user name and email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User already exist");
    }
    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("Files: ", req.files);

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // if cover image is not present it will return an error
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Is required");
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Is required");
    }

    // save user
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url,
        cloudinary_avatar_public_id:avatar?.public_id,
        cloudinary_coverImage_public_id:coverImage?.public_id || "",
        coverImage: coverImage?.url || "",
    });
    // check for user creation
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser) {
        throw new ApiError(500, "User is not created");
    }
    // remove password and refresh token field
    console.log("User: ", user);
    // return res
    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User created successfully"));
});


export const loginUser = asyncHandler(async(req,res) => {
    // get data from user
    const {username,email,password} = req.body;
    console.log(req.body)
    if(!username || !email || !password)
    {
        throw new ApiError(400,"Username email or password is required");
    }
    // check is used is registerd
    const user = await User.findOne({
        $or: [{username},{email}] // check for username or email
    });
    if(!user)
    {
        throw new ApiError(404,"User does not exist");
    }
    // validate password
    const checkPassword = await user.isPasswordCorrect(password);
    // why we are using exisitingUser.compare insted of bcrypt.comapare is that we have created a function in the model which compares the password and it accepts the password which the user has entered and fetches the saved password from the database and this is why we are now using User(model name) or bcrypt here instead we are using user that is returned by the database
    if(!checkPassword)
    {
        throw new ApiError(401,"Incorrect password");
    }
    
    // generate token
    const {accessToken,refreshToken} = await Promise.resolve(generateAccessAndRefereshTokens(user._id));
    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")
    // send cookies
    const options = {
        httpOnly: true,
        secure: true,
        // by default it can be modify by anyone
        // but we can make only server can modify
    }
    // response
    console.log("Token1: ",refreshToken);
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);
    console.log("Cookie",req.cookies);
    return res.status(200).json(
        new ApiResponse(200,{user: loggedinUser,accessToken,refreshToken},"User logged in successfully")
    );
    
})

export const logoutUser = asyncHandler(async (req,res) => {
    const id = req.user._id;
    console.log("User",req.user)
    console.log("Id",id)
    const user = await User.findByIdAndUpdate(id,{
        // $set: {
        //     refreshToken: 1 // this removes the field from document
        // }
        /*
            When we use set operator and we set refresh token as undefined the field is not actually removed from the database but when we mark it as oter value
            it will update the database with that value like if we set refresh token as 1 the value in data base will be 1

            To solve thise we use unset operator when we pass 1 flag
        */
        $unset: {
            refreshToken: 1 // this removes the field from document
        }
    },
    {
        new: true // it will return updated record
    }
    )

    const options = {
        httpOnly: true,
        secure: true,
        // by default it can be modify by anyone
        // but we can make only server can modify
    }
    await res.clearCookie("accessToken",options);
    await res.clearCookie("refreshToken",options);
    
    return res.status(200).json(new ApiResponse(200,{},"User logged out"))
})

export const refreshAccessToken = asyncHandler(async(req,res) => {
    try {
        // get refresh token
        const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if(!incommingRefreshToken)
        {
            throw new ApiError(401,"Error while retrieving token");
        }
        const decodedToken = JWT.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user)
        {
            throw new ApiError(401,"User not found");
        }
    
        // match
        if(incommingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        const options = {
            httpOnly: true,
            secure: true,
        }
        const value = await generateAccessAndRefereshTokens(user._id);
        const newRefreshToken = value.refreshToken;
        const accessToken = value.accessToken;
        res.cookie("accessToken",accessToken,options);
        res.cookie("refreshToken",newRefreshToken,options);
        return res.status(200).json(
            new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Token is updated")
        )
    } catch (error) {
        throw new ApiError(400,error?.message || "Invalid refresh token");
    }

})

export const changeCurrentPassword = asyncHandler(async(req,res)=>{
    try
    {
        const {oldPassword,newPassword} = req.body;
        const id = await req.user._id;
       
        const user = await User.findById(id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if(!isPasswordCorrect)
        {
            throw new ApiError(400,"Invalid password");
        }

        // change password
        user.password = newPassword;
        await user.save({validateBeforeSave: false}); // now pre defined bcrypt function will run which is defined in the model and it will hash the password
        return res.status(200).json(
            new ApiResponse(200,{},"Password changed successfully")
        );
    }
    catch(e)
    {
        throw new ApiError(500,error?.message || "Internal server error");
    }
})

// get currentUser
export const getCurrentUser = asyncHandler(async(req,res)=>{
    try
    {
        return res.status(200).json(
            new ApiResponse(200,req.user,"User details fetched successfully")
        )
    }
    catch(e)
    {
        throw new ApiError(500,e?.message || "Error while retrieving the user");
    }
})

export const updateAccountDetails = asyncHandler(async(req,res)=>{
    try
    {
        const {fullName,email} = req.body;
        if(!fullName || !email)
        {
            throw new ApiError(400,"All fileds are required");
        }
        const id = req?.user?._id;
        const user = await User.findByIdAndUpdate(id,{
            $set:
            {
                fullName: fullName,
                email: email,
                // or fullName,email
            }
        },{new: true}).select("-password -refreshToken");

        return res.status(200).json(
            new ApiResponse(200,user,"Account Details Updated Successfully")
        );
    }
    catch(e)
    {
        throw new ApiError(400,e?.message || "Error while updating details");
    }
})

export const updateUserAvatar = asyncHandler(async(req,res) => {
    try
    {
        // accept file
        // validate file
        // update user
        // return user
        const avatarLocalPath = req.file?.path;
        if(!avatarLocalPath)
        {
            throw new ApiError(400,"Avatar is required");
        }

        // upload to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if(!avatar.url)
        {
            throw new ApiError(400,"Error while uploading avatar");
        }
        console.log("User:",req.user)
        const user = await User.findByIdAndUpdate(req.user?._id,{
            $set: 
            {
                avatar:avatar?.url
            }
        },{new:true}).select("-password");

        return res.status(200).json(
            new ApiResponse(200,user,"Avatar is successfully updated")
        );
    }
    catch(e)
    {
        throw new ApiError(400,"Error while updating avatar");
    }
})

export const updateUserCoverImage = asyncHandler(async(req,res)=>{
    try
    {
        // get image
        const thumbnailLocalPath = req.file?.path;
        // validate image
        if(!thumbnailLocalPath)
        {
            throw new ApiError(400,"Cover File is required");
        }

        // upload image to cloudinary
        const coverImage = await uploadOnCloudinary(thumbnailLocalPath);

        if(!coverImage.url)
        {
            throw new ApiError(400,"Error while uploading image");
        }

        // find user
        const id = req.user?._id;
        const user = await User.findByIdAndUpdate(id,{
            $set:
            {
                coverImage: coverImage.url,
            }
        },{new: true}).select("-password");

        return res.status(200).json(
            new ApiResponse(200,user,"Coverimage has been uploaded successfully")
        );

    }
    catch(e)
    {
        throw new ApiError(400,"Error while updating thumbnail");
    }
})

export const getUserChannelProfile = asyncHandler(async(req,res)=>{
    try
    {
        console.log("user")
        const {username} = req.params;
        if(!username?.trim())
        {
            throw new ApiError(400,"User name is required");
        }
        // channel will be an array
        // const channel = await User.aggregate([
        //     {
        //         $match: 
        //         {
        //             /// as we have saved in lowercase
        //             username: username?.toLowerCase()
        //         }
        //     },
        //     {
        //         $lookup:
        //         {
        //             // its like join
        //             // our model was Subscription but here we need to pass how it is stored in mongodb in mongodb schema name is first converted into lowercase then it is made plural
        //             from: "subscriptions",
        //             localField: "_id", // from user
        //             foreignField: "channel", // from Subscription
        //             as: "subscribers",
        //         }
        //     },
        //     {
        //         $lookup:
        //         {
        //             from: "subscriptions",
        //             localField: "_id", // from user
        //             foreignField: "subscriber", // from Subscription
        //             as: "subscribedTo",
        //         }
        //     },
        //     {
        //         $addFields:
        //         {
        //             // adds additional fields
        //             subscriberCount:
        //             {
        //                 // to count
        //                 $size: "$subscribers",
        //                 // we used $subscribers because it is a field
        //             },
        //             channelsSubscribedToCount:
        //             {
        //                 $size: "$subscribedTo",
        //             },
        //             isSubscribed:
        //             {
        //                 $cond:
        //                 {
        //                     if:
        //                     {
        //                         $in: [req.user?._id,"$subscribers.subscriber"]
        //                     },
        //                     then: true,
        //                     else: false,
        //                 }
        //             }
        //         }
        //     },
        //     {
        //         $project:
        //         {
        //             // will return the selected fields
        //             fullName: 1,
        //             username: 1,
        //             subscriberCount: 1,
        //             channelsSubscribedToCount: 1,
        //             isSubscribed: 1,
        //             avatar: 1,
        //             coverImage: 1,
        //             email: 1,
        //             createdAt: 1,
        //         }
        //     }
        // ]);
        console.log("username: ",username);
        const channel = await User.aggregate([
            // Remove the $match stage for testing
            {
                $match:
                {
                    _id: new mongoose.Types.ObjectId(username)
                }
            },
            {
                $lookup: { from: "subscriptions", localField: "_id", foreignField: "channel", as: "subscribers" }
            },
            {
                $lookup: { from: "subscriptions", localField: "_id", foreignField: "subscriber", as: "subscribedTo" }
            },
            {
                $addFields: {
                    subscriberCount: { $size: "$subscribers" },
                    channelsSubscribedToCount: { $size: "$subscribedTo" },
                    isSubscribed: { $cond: { if: { $in: [req.user?._id, "$subscribers.subscriber"] }, then: true, else: false } }
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    subscriberCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
                    createdAt: 1,
                }
            }
        ]);
        
        
        console.log("Aggeregate pipeline: ",channel);
        if(!channel?.length)
        {
            throw new ApiError(404,"Channel does not exist");            
        }
        return res.status(200).json(
            new ApiResponse(200,channel[0],"User channel fetched successfully")
        )
    }
    catch(e)
    {

    }
})

export const getWatchHistory = asyncHandler(async(req,res)=>{
    try
    {
        console.log("User Id:", req.user._id,typeof req.user._id)
        const user = await User.aggregate([
            {
                $match:
                {
                    _id: req.user._id
                },
            },
            {
                $lookup:
                {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup:
                            {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: 
                                [
                                    {
                                        $project:
                                        {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1,
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $addFields:
                            {
                                owner:
                                {
                                    // first element from the array    
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                },
            }
        ]);

        return res.status(200).json(
            new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully")
        );
    }
    catch(e)
    {
        throw new ApiError(400,e?.message || "Error while getting watch history");
    }
})