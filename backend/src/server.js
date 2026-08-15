import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js"; 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
//health route
app.get("/", (req, res) => {
  res.json({ message: "SyncSpace server is running" });
});
//api  health route
app.get("/api/health", (req, res) => {
  const healthStatus = mongoose.connection.readyState === 1 ? "db_connected" : "db_not_connected";
  res.json({messsage: "SyncSpace API is running", db_status: healthStatus});
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`SyncSpace server running on port ${PORT}`);
  });
};

startServer();
