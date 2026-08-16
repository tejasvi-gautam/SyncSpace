import { registerSchema,loginSchema } from "../schemas/auth.schemas";
import registerUser from "../services/auth.services";
export const register =(req,res,next)=>{
    const {name,email,password}=req.body;
    console.log("Register request received:", { name, email, password });
    res.json({message:"Register route is working"});
}