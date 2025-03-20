"use client";

import type { TabType } from "../../pages/user/Profile";

interface ProfileTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function ProfileTabs({
  activeTab,
  setActiveTab,
}: ProfileTabsProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "deliveries", label: "Deliveries" },
    { id: "payment", label: "Payment" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="border-b">
      <div className="container mx-auto px-6">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-6 py-4 font-medium text-center whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
