import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

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
    const safeUser= { 
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
    };
    return safeUser;
};
export const loginUser =async(userData)=>{
    const user =await User.findOne({ email: userData.email });
    if(!user){
        throw new Error("Invalid email or password");
    }
    const match = await bcrypt.compare(userData.password,user.password);
    if(!match){
        throw new Error("Invalid email or password");
    }
    return generateToken(user);
    
}