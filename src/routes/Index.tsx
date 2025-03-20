import Home from "../pages/Home";
import LoginPage from "../pages/auth/Login";
import VerificationPage from "../pages/auth/Verification";
import SplashScreen from "../pages/SplashScreen";
import SignUpPage from "../pages/auth/Signup";
import Profile from "../pages/user/Profile";
import type { ReactNode } from "react";

// Define a custom interface with all needed properties
interface AppRouteObject {
  path: string;
  element: ReactNode;
  protected?: boolean;
  redirectIfAuthenticated?: boolean;
  children?: AppRouteObject[];
}

const routes: AppRouteObject[] = [
  {
    path: "/",
    element: <SplashScreen />,
    protected: false,
    redirectIfAuthenticated: true,
  },
  {
    path: "/login",
    element: <LoginPage />,
    protected: false,
    redirectIfAuthenticated: true,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
    protected: false,
    redirectIfAuthenticated: true,
  },
  {
    path: "/verify",
    element: <VerificationPage />,
    protected: false,
  },
  {
    path: "/home",
    element: <Home />,
    protected: true,
  },
  {
    path: "/profile",
    element: <Profile />,
    protected: true,
  },
];

export default routes;
export type { AppRouteObject };
