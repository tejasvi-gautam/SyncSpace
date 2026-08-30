import { useState } from "react";
import "./Authcard.css";

export default function AuthCard({ mode, setMode, onSubmit }) {
    const isSignUp = mode === "signup";

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "interviewer",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(formData);
        } else {
            console.log(isSignUp ? "Signing Up:" : "Signing In:", formData);
        }
    };

    const toggleMode = (e) => {
        e.preventDefault(); // Prevents form submission when clicking the toggle link
        setMode(isSignUp ? "login" : "signup");
    };

    return (
        <div className="auth-card">
            <h2>{isSignUp ? "SIGN UP" : "SIGN IN"}</h2>

            <form onSubmit={handleSubmit} className="auth-form">
                {isSignUp && (
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                    />
                </div>

                {isSignUp && (
                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="interviewer">Interviewer</option>
                            <option value="interviewee">Interviewee</option>
                        </select>
                    </div>
                )}

                <button type="submit" className="submit-btn">
                    {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
                </button>
            </form>

            <div className="auth-toggle">
                <p>
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </p>
                <button type="button" onClick={toggleMode} className="toggle-btn">
                    {isSignUp ? "Sign in" : "Sign up"}
                </button>
            </div>
        </div>
    );
}