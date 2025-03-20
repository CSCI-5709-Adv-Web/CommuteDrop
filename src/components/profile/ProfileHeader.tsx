"use client";

import { Star, Package, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  userData: {
    name: string;
    email: string;
    rating: number;
    deliveriesCompleted: number;
    joinDate: string;
    profileImage: string;
  };
}

export default function ProfileHeader({ userData }: ProfileHeaderProps) {
  return (
    <motion.div
      className="bg-white border-b shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-6">
          {/* Profile Image */}
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={
                  userData.profileImage || "/placeholder.svg?height=80&width=80"
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {userData.name}
            </h1>
            <p className="text-gray-600">{userData.email}</p>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-1 text-gray-700">
                <Star size={16} className="text-yellow-500" />
                <span>{userData.rating} Rating</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <Package size={16} />
                <span>{userData.deliveriesCompleted} Deliveries</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <Calendar size={16} />
                <span>Since {userData.joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
