import { Link } from "react-router-dom";
import { Bell, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-black text-white shadow-md">
      <Link to="/" className="text-2xl font-bold">
        Commute Drop
      </Link>
      <div className="flex items-center space-x-6">
        <button className="text-white hover:text-gray-300 transition">
          <Bell size={20} />
        </button>
        <Link to="/profile" className="flex items-center gap-3">
          <div className="hidden md:block text-sm text-gray-300">
            Alex Johnson
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            <img
              src="/placeholder.svg?height=32&width=32"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
        <button className="md:hidden text-white hover:text-gray-300 transition">
          <Menu size={20} />
        </button>
      </div>
    </nav>
  );
}
