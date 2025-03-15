// src/routes/index.tsx
import type { RouteObject } from "react-router-dom";
import Home from "../pages/Home";
import LoginPage from "../pages/auth/Login";
import VerificationPage from "../pages/auth/Verification";
import SplashScreen from "../pages/SplashScreen";
import SignUpPage from "../pages/auth/Signup";
import Profile from "../pages/user/Profile";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <SplashScreen />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/verify",
    element: <VerificationPage />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
];

export default routes;
