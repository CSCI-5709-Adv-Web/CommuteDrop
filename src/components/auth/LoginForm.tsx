import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordInput from "./PasswordInput";
import GoogleButton from "./GoogleButton";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim().length > 3 && password.trim().length >= 8) {
            navigate("/home", { state: { email } });
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-medium text-center">
                What's your email and password?
            </h2>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-black text-center"
                required
                autoComplete="email"
            />
            <PasswordInput label="Enter your password" password={password} setPassword={setPassword} />
            <button
                type="submit"
                disabled={!email.trim() || !password.trim()}
                className="w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continue
            </button>
            <div className="flex items-center before:flex-1 before:border-t after:flex-1 after:border-t">
                <span className="mx-4 text-gray-500">or</span>
            </div>
            <GoogleButton />
            <div className="text-center text-sm text-gray-600">
                New to Commute Drop?{" "}
                <a href="/signup" className="text-black hover:underline font-medium">
                    Sign In instead
                </a>
            </div>
        </form>
    );
}