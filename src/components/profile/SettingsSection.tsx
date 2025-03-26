"use client";

import { Bell, Shield, HelpCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { userService } from "../../services/user-service";

interface SettingsSectionProps {
  onLogout: () => void;
}

export default function SettingsSection({ onLogout }: SettingsSectionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const settingsItems = [
    {
      id: "notifications",
      icon: <Bell className="w-5 h-5 text-gray-500" />,
      title: "Notifications",
      description: "Manage your notification preferences",
      action: () => console.log("Notifications clicked"),
    },
    {
      id: "security",
      icon: <Shield className="w-5 h-5 text-gray-500" />,
      title: "Privacy & Security",
      description: "Manage your account security settings",
      action: () => console.log("Security clicked"),
    },
    {
      id: "help",
      icon: <HelpCircle className="w-5 h-5 text-gray-500" />,
      title: "Help & Support",
      description: "Get help with your account",
      action: () => console.log("Help clicked"),
    },
  ];

  const handleDeleteAccount = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

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
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      <div className="border-t border-gray-200 mb-6"></div>

      <div className="space-y-4">
        {settingsItems.map((item) => (
          <div
            key={item.id}
            className="p-4 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
            onClick={item.action}
          >
            <div className="flex items-center">
              {item.icon}
              <div className="ml-3">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="border-t border-gray-200 my-4"></div>

        <button onClick={onLogout} className="text-red-600 font-medium">
          Log Out
        </button>

        <div className="border-t border-gray-200 my-4"></div>

        {/* Delete Account Section */}
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-start">
            <Trash2 className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-red-700">Delete Account</p>
              <p className="text-sm text-red-600 mb-4">
                This will permanently delete your account and all associated
                data. This action cannot be undone.
              </p>

              {deleteError && (
                <p className="text-sm bg-red-100 p-2 rounded mb-3 text-red-800">
                  {deleteError}
                </p>
              )}

              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
