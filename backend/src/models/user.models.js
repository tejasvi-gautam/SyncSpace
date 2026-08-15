import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["interviewer", "interviewee"],
      required: true,
    },

    avatar: {
      type: String,
    },
  },
  {
    timestamps: true, // correct way to enable createdAt & updatedAt
  }
);

// create model here
const User = mongoose.model("User", userSchema); 
//  This line compiles the schema into a Mongoose model called "User".
//    It tells Mongoose: "Use the userSchema to create documents in the 'users' collection."

export default User; 
//    This line exports the model so you can import it in other files.
//    Example