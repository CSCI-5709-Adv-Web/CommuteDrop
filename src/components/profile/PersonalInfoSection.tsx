"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Plus, MapPin, Edit } from "lucide-react";

// Update the PersonalInfoSectionProps interface to include profileImage
interface PersonalInfoSectionProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    profileImage: string;
    savedLocations: Array<{
      id: number;
      name: string;
      address: string;
    }>;
  };
}

export default function PersonalInfoSection({
  userData,
}: PersonalInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address,
  });
  const [profileImage, setProfileImage] = useState(
    userData.profileImage || "/placeholder.svg?height=150&width=150"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveProfile = () => {
    // In a real app, this would update the user data via API
    console.log("Saving profile data:", formData);
    console.log("New profile image:", profileImage);
    setIsEditing(false);
  };

  const handleProfileImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this file to a server
      // For now, we'll just create a local URL for preview
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  return (
    <div className="font-sans">
      {/* Profile Picture Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Profile Picture
          </h2>
        </div>
        <div className="border-t border-gray-200 mb-6"></div>

        <div className="flex items-center gap-6">
          <div
            className={`relative w-24 h-24 rounded-full overflow-hidden border-2 ${
              isEditing ? "border-primary cursor-pointer" : "border-gray-200"
            }`}
            onClick={handleProfileImageClick}
          >
            <img
              src={profileImage || "/placeholder.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs font-medium">
                Change Photo
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div>
            {isEditing ? (
              <p className="text-sm text-gray-600">
                Click on the image to upload a new profile picture
              </p>
            ) : (
              <p className="text-sm text-gray-600">Your profile picture</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Personal Information
          </h2>
          <button
            onClick={() =>
              isEditing ? handleSaveProfile() : setIsEditing(true)
            }
            className="flex items-center gap-2 text-primary font-medium hover:underline"
          >
            <Edit size={16} />
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>
        <div className="border-t border-gray-200 mb-6"></div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded font-normal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded font-normal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded font-normal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded font-normal"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="mt-1 text-gray-900 font-normal">{userData.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-gray-900 font-normal">{userData.email}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Phone Number
              </h3>
              <p className="mt-1 text-gray-900 font-normal">{userData.phone}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-gray-900 font-normal">
                {userData.address}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Saved Locations */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Saved Locations
          </h2>
          <button className="flex items-center text-primary font-medium hover:underline">
            <Plus size={16} className="mr-1" />
            Add Location
          </button>
        </div>
        <div className="border-t border-gray-200 mb-6"></div>

        <div className="space-y-6">
          {userData.savedLocations.map((location) => (
            <div key={location.id} className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{location.name}</p>
                <p className="text-sm text-gray-600 font-normal">
                  {location.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
