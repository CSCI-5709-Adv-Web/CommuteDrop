import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function VerificationPage() {
    const [code, setCode] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(30);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';
    useEffect(() => {
        if (!email) {
        navigate('/signup');
        return;
        }
        const interval = setInterval(() => {
        setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        
        return () => clearInterval(interval);
    }, [email, navigate]);
    const handleCodeChange = (index: number, value: string) => {
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        
        if (value && index < 3) {
        document.getElementById(`code-input-${index + 1}`)?.focus();
        }
    };
    const handleSubmit = () => {
        if (code.join('').length === 4) {
        navigate('/home', { state: { email } }); // Pass email to home
        }
    };
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-md space-y-6">
            <div className="space-y-6">
                <h1 className="text-2xl font-medium text-center">
                Verify Your Account
                </h1>
                <p className="text-center text-gray-600">
                Enter the 4-digit code sent to
                <br />
                <span className="font-medium break-all">{email}</span>
                </p>
                <div className="flex justify-center space-x-3">
                {code.map((digit, index) => (
                    <input
                    key={index}
                    id={`code-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                    className="w-16 h-16 text-3xl text-center rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    />
                ))}
                </div>
                <div className="text-center">
                <button 
                    className={`text-blue-600 ${timer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
                    disabled={timer > 0}
                >
                    Resend code via email ({Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' : ''}{timer % 60})
                </button>
                </div>
                <button
                onClick={handleSubmit}
                disabled={code.join('').length !== 4}
                className="w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Verify Account
                </button>
            </div>
            </div>
        </div>
        </div>
    );
}