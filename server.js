import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./database/connection.js";
import router from "./routes/index.js";

dotenv.config();

const app = express();

const cors_config = {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true,
}

app.use(cors(cors_config));
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use("/", router);

const port = process.env.PORT || 5001;

connectDB();

app.listen(port, () => {
    console.log("Backend is working");
});