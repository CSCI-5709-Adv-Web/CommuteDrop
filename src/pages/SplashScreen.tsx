import { useNavigate } from 'react-router-dom';
import SplashScreenButton from '../components/splash_screen/SplashScreenButton';

export default function SplashScreen() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 space-y-8">
        <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tighter text-center">
            Commute Drop
        </h1>
        < SplashScreenButton
            buttonText="Get Started"
            onClick={() => navigate('/login')}
        />
        </div>
    );
}