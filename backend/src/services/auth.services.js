import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const registerUser = async (userData) => {
    if (await User.findOne({ email: userData.email })) {
        throw new Error("Email already exists");
    }
    const passwordHash = await bcrypt.hash(userData.password, parseInt(process.env.saltRounds));
    const newUser = new User({
        name: userData.name,
        email: userData.email,
        password: passwordHash,
        role: userData.role,
    });
    await newUser.save();   

    return newUser;
};