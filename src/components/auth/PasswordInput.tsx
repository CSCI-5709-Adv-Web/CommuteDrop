import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

interface PasswordInputProps {
  label: string;
  password: string;
  setPassword: (value: string) => void;
  error?: boolean;
}

export default function PasswordInput({ label, password, setPassword, error }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={label}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`w-full rounded-lg border p-3 focus:outline-none text-center pr-10 ${
          error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-black"
        }`}
        required
        minLength={8}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}