"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoSection from "../../components/profile/PersonalInfoSection";
import PaymentMethodsSection from "../../components/profile/PaymentMethodsSection";
import DeliveryHistorySection from "../../components/profile/DeliveryHistorySection";
import SettingsSection from "../../components/profile/SettingsSection";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Truck, CreditCard, Settings, Loader } from "lucide-react";
import Navbar from "../../components/Navbar";
import {
  userService,
  type SavedLocation,
  type PaymentMethod,
} from "../../services/user-service";
import {
  deliveryService,
  type DeliveryHistoryItem,
} from "../../services/delivery-service";

export type TabType = "profile" | "deliveries" | "payment" | "settings";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const { logout, user, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    name: userProfile?.name || user?.name || "User",
    email: userProfile?.email || user?.email || "",
    phone: userProfile?.phone || "",
    address: userProfile?.address || "",
    joinDate: userProfile?.joinDate || "January 2023",
    deliveriesCompleted: userProfile?.deliveriesCompleted || 0,
    rating: userProfile?.rating || 0,
    profileImage:
      userProfile?.profileImage || "/placeholder.svg?height=150&width=150",
    paymentMethods: [] as PaymentMethod[],
    savedLocations: [] as SavedLocation[],
  });
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistoryItem[]>(
    []
  );

  // Update userData when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUserData((prevData) => ({
        ...prevData,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        joinDate: userProfile.joinDate || "January 2023",
        deliveriesCompleted: userProfile.deliveriesCompleted || 0,
        rating: userProfile.rating || 0,
        profileImage:
          userProfile.profileImage || "/placeholder.svg?height=150&width=150",
      }));
    }
  }, [userProfile]);

  // Fetch additional data (payment methods, delivery history)
  useEffect(() => {
    let isMounted = true;
    const fetchAdditionalData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        // Only refresh user profile if we don't already have it
        if (!userProfile || !userProfile.name) {
          await refreshUserProfile();
        }

        // Only fetch payment methods and delivery history if we're on those tabs
        if (activeTab === "payment") {
          const paymentMethodsResponse = await userService.getPaymentMethods();
          if (isMounted && paymentMethodsResponse.success) {
            setUserData((prevData) => ({
              ...prevData,
              paymentMethods: paymentMethodsResponse.data,
            }));
          }
        }

        if (activeTab === "deliveries") {
          const deliveryHistoryResponse = await deliveryService.getHistory();
          if (isMounted && deliveryHistoryResponse.success) {
            setDeliveryHistory(deliveryHistoryResponse.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user data. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAdditionalData();
    return () => {
      isMounted = false;
    };
  }, [refreshUserProfile, userProfile, activeTab]);

  // Add a new useEffect to handle tab changes
  useEffect(() => {
    // When tab changes, fetch data specific to that tab
    const fetchTabData = async () => {
      if (activeTab === "payment" && userData.paymentMethods.length === 0) {
        try {
          const response = await userService.getPaymentMethods();
          if (response.success) {
            setUserData((prev) => ({
              ...prev,
              paymentMethods: response.data,
            }));
          }
        } catch (error) {
          console.error("Error fetching payment methods:", error);
        }
      } else if (activeTab === "deliveries" && deliveryHistory.length === 0) {
        try {
          const response = await deliveryService.getHistory();
          if (response.success) {
            setDeliveryHistory(response.data);
          }
        } catch (error) {
          console.error("Error fetching delivery history:", error);
        }
      }
    };

    fetchTabData();
  }, [activeTab, userData.paymentMethods.length, deliveryHistory.length]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-white shadow rounded-lg">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="flex flex-1">
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
                  <PersonalInfoSection
                    userData={userData}
                    onProfileUpdated={refreshUserProfile}
                  />
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
