"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  HelpCircle,
  Trash2,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { userService } from "../../services/user-service";

interface SettingsSectionProps {
  onLogout: () => void;
}

export default function SettingsSection({ onLogout }: SettingsSectionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });

  // Settings categories
  const settingsCategories = [
    {
      title: "Account",
      items: [
        {
          id: "notifications",
          icon: <Bell className="w-5 h-5 text-blue-500" />,
          title: "Notifications",
          description: "Manage your notification preferences",
          action: () => console.log("Notifications clicked"),
          showToggle: false,
          toggleState: false,
        },
        {
          id: "security",
          icon: <Shield className="w-5 h-5 text-green-500" />,
          title: "Privacy & Security",
          description: "Manage your account security settings",
          action: () => console.log("Security clicked"),
          showToggle: false,
          toggleState: false,
        },
        {
          id: "appearance",
          icon: darkMode ? (
            <Moon className="w-5 h-5 text-indigo-500" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          ),
          title: "Appearance",
          description: `${
            darkMode ? "Dark" : "Light"
          } mode is currently active`,
          action: () => setDarkMode(!darkMode),
          showToggle: true,
          toggleState: darkMode,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          icon: <HelpCircle className="w-5 h-5 text-purple-500" />,
          title: "Help & Support",
          description: "Get help with your account",
          action: () => console.log("Help clicked"),
          showToggle: false,
          toggleState: false,
        },
        {
          id: "language",
          icon: <Globe className="w-5 h-5 text-teal-500" />,
          title: "Language",
          description: "English (US)",
          action: () => console.log("Language clicked"),
          showToggle: false,
          toggleState: false,
        },
      ],
    },
  ];

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await userService.deleteAccount();

      if (response.success) {
        // Account deleted successfully, log the user out
        onLogout();
      } else {
        setDeleteError(response.message || "Failed to delete account");
      }
    } catch (error) {
      setDeleteError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Toggle component
  const Toggle = ({
    isOn,
    onToggle,
  }: {
    isOn: boolean;
    onToggle: () => void;
  }) => (
    <div
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isOn ? "bg-primary" : "bg-gray-200"
      }`}
      onClick={onToggle}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </div>
  );

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

      {/* Settings Categories */}
      {settingsCategories.map((category, categoryIndex) => (
        <div key={category.title} className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {category.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map((item, itemIndex) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: itemIndex * 0.1 + categoryIndex * 0.2,
                }}
                className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full"
              >
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-50">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {item.showToggle ? (
                      <Toggle isOn={item.toggleState} onToggle={item.action} />
                    ) : (
                      <button
                        onClick={item.action}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Account Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          Account Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Logout Button */}
          <motion.button
            onClick={onLogout}
            className="flex items-center gap-3 w-full p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="p-2 rounded-full bg-gray-50">
              <LogOut className="w-5 h-5 text-gray-500" />
            </div>
            <span className="font-medium text-gray-900">Log Out</span>
          </motion.button>
        </div>

        {/* Delete Account Section */}
        <motion.div
          className="p-5 rounded-xl border border-red-200 bg-red-50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="flex items-start">
            <div className="p-2 rounded-full bg-red-100 mr-3 flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-red-700 text-lg">
                Delete Account
              </h4>
              <p className="text-sm text-red-600 mb-4">
                This will permanently delete your account and all associated
                data. This action cannot be undone.
              </p>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-800">{deleteError}</p>
                </div>
              )}

              {!showDeleteConfirm ? (
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete My Account
                </motion.button>
              ) : (
                <div className="p-4 bg-white rounded-lg border border-red-200">
                  <p className="text-sm text-gray-700 mb-4">
                    Are you sure you want to delete your account? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isDeleting ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Deleting...
                        </>
                      ) : (
                        <>Confirm Delete</>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
