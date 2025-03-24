import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { GoogleMapsProvider } from "./context/GoogleMapsContext";
import "./styles/Globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <GoogleMapsProvider>
        <Router>
          <App />
        </Router>
      </GoogleMapsProvider>
    </AuthProvider>
  </React.StrictMode>
);
