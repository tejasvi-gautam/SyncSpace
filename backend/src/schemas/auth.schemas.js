//2 schema register schema and login schema
import {z} from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, {message: "Name is required"}).max(200, {message: "Name must be less than 200 characters"}),
  email: z.string().trim().toLowerCase().email({message: "Invalid email address"}),
  password: z.string().min(8, {message: "Password must be at least 8 characters long"}).regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  role: z.enum(["interviewer", "interviewee"]),
});
export const loginSchema = z.object({
  email: z.string().email({message: "Invalid email address"}),
  password: z.string().min(8, {message: "Password must be at least 8 characters long"})
});