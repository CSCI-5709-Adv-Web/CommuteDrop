import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PasswordInput from "./PasswordInput";
import GoogleButton from "./GoogleButton";

export default function SignUpForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        setPasswordError(password !== confirmPassword);
    }, [password, confirmPassword]);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === confirmPassword && email.trim().length > 3 && password.trim().length >= 8) {
        navigate("/verify", { state: { email } });
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-medium text-center">Create Your CommuteDrop Account</h2>
        <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-black text-center"
            required
            autoComplete="email"
        />
        <PasswordInput label="Create password" password={password} setPassword={setPassword} />
        <PasswordInput label="Confirm password" password={confirmPassword} setPassword={setConfirmPassword} error={passwordError} />
        {passwordError && <p className="text-red-500 text-sm text-center -mt-4">Passwords do not match</p>}
        <button
            type="submit"
            disabled={!email.trim() || !password.trim() || password !== confirmPassword}
            className="w-full rounded-lg bg-black py-3 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
            Create Account
        </button>
        <div className="flex items-center before:flex-1 before:border-t after:flex-1 after:border-t">
            <span className="mx-4 text-gray-500">or sign up with</span>
        </div>
        <GoogleButton />
        <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-black hover:underline font-medium">Log in instead</a>
        </div>
        </form>
    );
}