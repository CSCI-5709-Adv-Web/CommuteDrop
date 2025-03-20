"use client";

import type React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import {
  MapPin,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit2,
  Star,
  Package,
  CheckCircle,
  Calendar,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data - would come from API/context in a real app
  const [userData, setUserData] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "+1 (902) 555-0123",
    address: "123 Main Street, Halifax, NS",
    joinDate: "January 2023",
    deliveriesCompleted: 24,
    rating: 4.8,
    profileImage: "/placeholder.svg?height=150&width=150",
    paymentMethods: [
      { id: 1, type: "Visa", last4: "4242", isDefault: true },
      { id: 2, type: "Mastercard", last4: "5555", isDefault: false },
    ],
    stats: {
      totalSpent: 342.5,
      avgDeliveryTime: 28,
      savedLocations: 3,
      completionRate: 98,
    },
  });

  // Mock form state for editing profile
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address,
  });

  // Mock delivery history
  const deliveryHistory = [
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
      id: "DEL-1236",
      date: "Feb 18, 2025",
      from: "Downtown Halifax",
      to: "Fairview",
      status: "Completed",
      price: "$15.20",
      carrier: "Car",
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveProfile = () => {
    setUserData({
      ...userData,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    // In a real app, this would clear auth state
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed header section */}
      <div className="sticky top-0 z-50">
        {/* Navbar is already black in the component */}
        <Navbar />

        {/* Profile Header Card - Fixed */}
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={userData.profileImage || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{userData.name}</h1>
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
        </div>

        {/* Tabs Navigation - Fixed */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex">
              <button
                className={`px-6 py-4 font-medium text-center whitespace-nowrap ${
                  activeTab === "profile"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
              <button
                className={`px-6 py-4 font-medium text-center whitespace-nowrap ${
                  activeTab === "deliveries"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("deliveries")}
              >
                Deliveries
              </button>
              <button
                className={`px-6 py-4 font-medium text-center whitespace-nowrap ${
                  activeTab === "payment"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("payment")}
              >
                Payment
              </button>
              <button
                className={`px-6 py-4 font-medium text-center whitespace-nowrap ${
                  activeTab === "settings"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="container mx-auto px-4 py-6">
        {/* Tab Content */}
        <div className="space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Full Name
                      </h3>
                      <p className="mt-1">{userData.name}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Email
                      </h3>
                      <p className="mt-1">{userData.email}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Phone Number
                      </h3>
                      <p className="mt-1">{userData.phone}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Address
                      </h3>
                      <p className="mt-1">{userData.address}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">
                      Saved Locations
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Home</p>
                          <p className="text-sm text-gray-600">
                            123 Main Street, Halifax, NS
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Work</p>
                          <p className="text-sm text-gray-600">
                            456 Office Tower, Downtown Halifax, NS
                          </p>
                        </div>
                      </div>

                      <button className="text-primary font-medium hover:underline mt-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Add New Location
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deliveries Tab */}
          {activeTab === "deliveries" && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Recent Deliveries</h2>
              </div>

              <div className="divide-y">
                {deliveryHistory.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{delivery.id}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {delivery.status}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {delivery.date}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">From</div>
                        <div className="text-sm flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                          {delivery.from}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">To</div>
                        <div className="text-sm flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                          {delivery.to}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm text-gray-600">
                        {delivery.carrier} • {delivery.price}
                      </div>
                      <button className="text-primary text-sm font-medium hover:underline flex items-center">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 text-center border-t">
                <button className="text-primary font-medium hover:underline">
                  View All Deliveries
                </button>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === "payment" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Methods</h2>

              <div className="space-y-4">
                {userData.paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg flex items-center justify-between ${
                      method.isDefault ? "border-primary bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                        {method.type === "Visa" ? (
                          <span className="text-blue-700 font-bold text-sm">
                            VISA
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold text-sm">
                            MC
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {method.type} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <span className="text-xs text-primary">Default</span>
                        )}
                      </div>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700">
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))}

                <button className="w-full p-4 border border-dashed rounded-lg text-center text-gray-500 hover:text-primary hover:border-primary transition-colors">
                  <CreditCard className="w-5 h-5 mx-auto mb-2" />
                  <span>Add New Payment Method</span>
                </button>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Billing History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Feb 25, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Delivery DEL-1234
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $12.50
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Feb 22, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Delivery DEL-1235
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $8.75
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Feb 18, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Delivery DEL-1236
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $15.20
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Account Settings</h2>
              </div>

              <div className="divide-y">
                <div className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-sm text-gray-500">
                        Manage your notification preferences
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-medium">Privacy & Security</p>
                      <p className="text-sm text-gray-500">
                        Manage your account security settings
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-medium">Help & Support</p>
                      <p className="text-sm text-gray-500">
                        Get help with your account
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={handleLogout}
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium text-red-500">Log Out</p>
                      <p className="text-sm text-gray-500">
                        Sign out of your account
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
