import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8']);

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
