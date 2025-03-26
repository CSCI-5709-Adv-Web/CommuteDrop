"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Edit, Loader } from "lucide-react";
import { userService } from "../../services/user-service";
import ImageCropper from "./ImageCropper";
import { DEFAULT_PROFILE_IMAGE } from "../../utils/tokenStorage";

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
  onProfileUpdated?: () => void;
}

export default function PersonalInfoSection({
  userData,
  onProfileUpdated,
}: PersonalInfoSectionProps) {
  // Update the profileImage state initialization to use useMemo
  const [profileImage, setProfileImage] = useState(() => {
    // Only use the actual profile image if it exists and is not the default placeholder
    if (
      userData.profileImage &&
      !userData.profileImage.includes("placeholder.svg")
    ) {
      return userData.profileImage;
    }
    // Otherwise use our data URI
    return DEFAULT_PROFILE_IMAGE;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Add state for image cropping
  const [cropperFile, setCropperFile] = useState<File | null>(null);

  // Update useEffect to use the same logic
  useEffect(() => {
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
    });

    // Only update the profile image if it's not a placeholder
    if (
      userData.profileImage &&
      !userData.profileImage.includes("placeholder.svg")
    ) {
      setProfileImage(userData.profileImage);
    } else {
      setProfileImage(DEFAULT_PROFILE_IMAGE);
    }
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the API to update the profile
      const response = await userService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        // Don't include email as it's not editable
      });

      if (response.success) {
        setIsEditing(false);
        // Notify parent component that profile was updated
        if (onProfileUpdated) {
          onProfileUpdated();
        }
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Update the handleFileChange function to use the cropper
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    // Open the cropper instead of uploading directly
    setCropperFile(file);

    // Clear the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add a function to handle the cropped image
  const handleCroppedImage = async (croppedBlob: Blob) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a File from the Blob
      const croppedFile = new File([croppedBlob], "profile-picture.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      // Create a local URL for preview
      const imageUrl = URL.createObjectURL(croppedBlob);
      setProfileImage(imageUrl);

      // Upload the image to the server
      const response = await userService.uploadProfileImage(croppedFile);

      if (response.success) {
        // Update the profile image with the URL from the server
        setProfileImage(response.data.imageUrl);

        // Show success message
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);

        // Notify parent component that profile was updated
        if (onProfileUpdated) {
          onProfileUpdated();
        }
      } else {
        setError(response.message || "Failed to upload profile image");
        // Revert to the previous image
        setProfileImage(userData.profileImage || DEFAULT_PROFILE_IMAGE);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      // Revert to the previous image
      setProfileImage(userData.profileImage || DEFAULT_PROFILE_IMAGE);
    } finally {
      setIsLoading(false);
      setCropperFile(null);
    }
  };

  // Add the ImageCropper component to the JSX, right before the return statement
  // Add this right before the return statement:

  // Update the image error handler to use the constant
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Only set the default if the current src is not already the default
    if (e.currentTarget.src !== DEFAULT_PROFILE_IMAGE) {
      e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
    }
  };

  return (
    <div className="font-sans">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Profile Picture
          </h2>
        </div>
        <div className="border-t border-gray-200 mb-6"></div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        <div className="flex items-center gap-6">
          <div
            className={`relative w-24 h-24 rounded-full overflow-hidden border-2 ${
              isEditing ? "border-primary cursor-pointer" : "border-gray-200"
            }`}
            onClick={handleProfileImageClick}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <Loader className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <img
              src={profileImage || "/placeholder.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
              fetchPriority="high"
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
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
            />
          </div>
          <div>
            {isEditing ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Click on the image to upload a new profile picture
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, GIF, WEBP (max 5MB)
                </p>
              </div>
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
            disabled={isLoading}
            className="flex items-center gap-2 text-primary font-medium hover:underline disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Edit size={16} />
                {isEditing ? "Save" : "Edit"}
              </>
            )}
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
                disabled
                className="w-full p-2 border border-gray-300 rounded font-normal bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
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
              <p className="mt-1 text-gray-900 font-normal">
                {userData.phone || "Not provided"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-gray-900 font-normal">
                {userData.address || "Not provided"}
              </p>
            </div>
          </div>
        )}
      </div>
      {cropperFile && (
        <ImageCropper
          imageFile={cropperFile}
          onCrop={handleCroppedImage}
          onCancel={() => setCropperFile(null)}
        />
      )}
    </div>
  );
}
