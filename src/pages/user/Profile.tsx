"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoSection from "../../components/profile/PersonalInfoSection";
import PaymentMethodsSection from "../../components/profile/PaymentMethodsSection";
import DeliveryHistorySection from "../../components/profile/DeliveryHistorySection";
import SettingsSection from "../../components/profile/SettingsSection";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Truck, CreditCard, Settings } from "lucide-react";
import Navbar from "../../components/Navbar";

// Mock user data - would come from API/context in a real app
export const userData = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  phone: "+1 (902) 555-0123",
  address: "123 Main Street, Halifax, NS",
  joinDate: "January 2023",
  deliveriesCompleted: 24,
  rating: 4.8,
  profileImage: "/placeholder.svg?height=150&width=150",
  paymentMethods: [
    {
      id: 1,
      type: "visa",
      last4: "4242",
      cardholderName: "Alex Johnson",
      expiryDate: "12/25",
      isDefault: true,
    },
    {
      id: 2,
      type: "mastercard",
      last4: "5555",
      cardholderName: "Alex Johnson",
      expiryDate: "09/26",
      isDefault: false,
    },
  ],
  stats: {
    totalSpent: 342.5,
    avgDeliveryTime: 28,
    savedLocations: 3,
    completionRate: 98,
  },
  savedLocations: [
    {
      id: 1,
      name: "Home",
      address: "123 Main Street, Halifax, NS",
    },
    {
      id: 2,
      name: "Work",
      address: "456 Office Tower, Downtown Halifax, NS",
    },
  ],
};

// Mock delivery history
export const deliveryHistory = [
  {
    id: "DEL-1234",
    date: "Feb 25, 2025",
    from: "Quinpool Tower",
    to: "Dalhousie Dentistry Faculty",
    status: "Completed",
    price: "$12.50",
    carrier: "Car",
  },
  {
    id: "DEL-1235",
    date: "Feb 22, 2025",
    from: "South End",
    to: "North End",
    status: "Completed",
    price: "$8.75",
    carrier: "Bike",
  },
  {
    id: "DEL-1235",
    date: "Feb 22, 2025",
    from: "South End",
    to: "North End",
    status: "Completed",
    price: "$8.75",
    carrier: "Bike",
  },
  {
    id: "DEL-1235",
    date: "Feb 22, 2025",
    from: "South End",
    to: "North End",
    status: "Completed",
    price: "$8.75",
    carrier: "Bike",
  },
  {
    id: "DEL-1235",
    date: "Feb 22, 2025",
    from: "South End",
    to: "North End",
    status: "Completed",
    price: "$8.75",
    carrier: "Bike",
  },
  {
    id: "DEL-1235",
    date: "Feb 22, 2025",
    from: "South End",
    to: "North End",
    status: "Completed",
    price: "$8.75",
    carrier: "Bike",
  },
  {
    id: "DEL-1235",
    date: "Feb 22, 2025",
    from: "South End",
    to: "North End",
    status: "Completed",
    price: "$8.75",
    carrier: "Bike",
  },
  {
    id: "DEL-1235",
    date: "Feb 22, 2025",
    from: "South End",
    to: "North End",
    status: "Completed",
    price: "$8.75",
    carrier: "Bike",
  },
  {
    id: "DEL-1236",
    date: "Feb 18, 2025",
    from: "Downtown Halifax",
    to: "Fairview",
    status: "Completed",
    price: "$15.20",
    carrier: "Car",
  },
];

export type TabType = "profile" | "deliveries" | "payment" | "settings";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <Home size={18} /> },
    { id: "deliveries", label: "Deliveries", icon: <Truck size={18} /> },
    { id: "payment", label: "Payment", icon: <CreditCard size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Use the Navbar component */}
      <Navbar />

      {/* Main content with sticky sidebar */}
      <div className="flex flex-1">
        {/* Sidebar - sticky */}
        <aside className="w-48 border-r bg-white sticky top-[72px] self-start h-[calc(100vh-72px)]">
          <nav className="py-6 px-4">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    className={`w-full px-4 py-2 text-left font-medium rounded-md flex items-center ${
                      activeTab === tab.id
                        ? "bg-gray-100 text-black"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveTab(tab.id as TabType)}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-8">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PersonalInfoSection userData={userData} />
                </motion.div>
              )}

              {activeTab === "deliveries" && (
                <motion.div
                  key="deliveries"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DeliveryHistorySection deliveryHistory={deliveryHistory} />
                </motion.div>
              )}

              {activeTab === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PaymentMethodsSection userData={userData} />
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SettingsSection onLogout={handleLogout} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
