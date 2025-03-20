"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function ProfileSection({
  title,
  children,
  action,
}: ProfileSectionProps) {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm overflow-hidden mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}
