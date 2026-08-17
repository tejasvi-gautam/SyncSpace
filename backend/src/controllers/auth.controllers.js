import { registerUser,loginUser } from "../services/auth.services.js";

export const register = async (req, res) => {
    try {
        const user = await registerUser(req.body);

        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
export const login =async(req,res)=>{
    try{
        const token = await loginUser(req.body);
        res.cookie("token",token,{
            httpOnly: true,
            secure : false,
            sameSite: "lax"
        })
        res.status(200).json({
            message: "login successful"
        })

    }
    catch(error){
        res.status(400).json({
            message: error.message,
        });
    }
}