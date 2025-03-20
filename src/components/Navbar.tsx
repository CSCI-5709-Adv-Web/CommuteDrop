"use client";

import { useNavigate } from "react-router-dom";
import { Bell, Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLogoClick = () => {
    navigate("/home");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-black text-white shadow-md h-[72px]">
      <button
        onClick={handleLogoClick}
        className="text-2xl font-bold cursor-pointer"
      >
        Commute Drop
      </button>
      <div className="flex items-center space-x-6">
        <button
          className="text-white hover:text-gray-300 transition"
          aria-label="Notifications"
        >
          <Bell size={20} aria-hidden="true" />
        </button>
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="hidden md:block text-sm text-gray-300">
            {user?.name || user?.email || "Account"}
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            <img
              src="/placeholder.svg?height=32&width=32"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </button>
        <div className="relative" ref={menuRef}>
          <button
            className="md:hidden text-white hover:text-gray-300 transition"
            onClick={() => setShowMenu(!showMenu)}
            aria-expanded={showMenu}
            aria-label="Menu"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  navigate("/profile");
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
              >
                <LogOut size={16} className="mr-2" aria-hidden="true" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
