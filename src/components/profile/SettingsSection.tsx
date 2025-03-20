"use client";

import { Bell, Shield, HelpCircle } from "lucide-react";

interface SettingsSectionProps {
  onLogout: () => void;
}

export default function SettingsSection({ onLogout }: SettingsSectionProps) {
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
      </div>
    </div>
  );
}
