import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());


// routes
import userRouter from "./routes/user_routes.js";
import musicRouter from "./routes/music_routes.js";

// routes declaration
app.use("/api/v1/users",userRouter);
app.use("/api/v1/music",musicRouter);
// When we write exact name of the function then the function is not exported using default
// when we export using deault we can name the function anything

export { app };