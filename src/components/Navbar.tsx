"use client";

import { Link } from "react-router-dom";
import { Bell, Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-black text-white shadow-md">
      <Link to="/home" className="text-2xl font-bold">
        Commute Drop
      </Link>
      <div className="flex items-center space-x-6">
        <button className="text-white hover:text-gray-300 transition">
          <Bell size={20} />
        </button>
        <Link to="/profile" className="flex items-center gap-3">
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
        </Link>
        <div className="relative">
          <button
            className="md:hidden text-white hover:text-gray-300 transition"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Menu size={20} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowMenu(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
