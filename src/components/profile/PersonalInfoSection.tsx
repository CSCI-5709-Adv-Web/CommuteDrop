"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Edit, Loader, User, Mail, Phone, MapPin, Camera } from "lucide-react";
import { userService } from "../../services/user-service";
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
  // Remove the cropperFile state and related code
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

  // Update the handleFileChange function to properly handle the image URL
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

    setIsLoading(true);
    setError(null);

    try {
      // Create a temporary URL for the selected file
      const tempImageUrl = URL.createObjectURL(file);

      // Process the image - resize and crop automatically
      const processedFile = await processImage(file);

      // Show preview while uploading
      setProfileImage(tempImageUrl);

      // Upload the processed image
      const response = await userService.uploadProfileImage(processedFile);

      if (response.success) {
        // Update the profile image with the URL from the server
        if (response.data.imageUrl) {
          // Revoke the temporary object URL to avoid memory leaks
          URL.revokeObjectURL(tempImageUrl);

          // Set the new image URL from the server response
          setProfileImage(response.data.imageUrl);

          // Show success message
          setSuccessMessage("Profile picture updated successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);

          // Notify parent component that profile was updated
          if (onProfileUpdated) {
            onProfileUpdated();
          }
        } else {
          // If no image URL in response, keep using the temp URL
          console.warn(
            "No image URL returned from server, using local preview"
          );
        }
      } else {
        setError(response.message || "Failed to upload profile image");
        // Revoke the temporary object URL
        URL.revokeObjectURL(tempImageUrl);
        // Revert to the previous image
        setProfileImage(userData.profileImage || DEFAULT_PROFILE_IMAGE);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      // Revert to the previous image
      setProfileImage(userData.profileImage || DEFAULT_PROFILE_IMAGE);
    } finally {
      setIsLoading(false);

      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Update the processImage function to ensure proper image processing
  const processImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create a canvas element
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Determine the size of the square crop (use the smaller dimension)
          const size = Math.min(img.width, img.height);

          // Set canvas size to desired output size (we'll use 300x300 for profile pics)
          const outputSize = 300;
          canvas.width = outputSize;
          canvas.height = outputSize;

          // Calculate crop position (center of the image)
          const sourceX = (img.width - size) / 2;
          const sourceY = (img.height - size) / 2;

          // Draw a circle for the crop
          ctx.beginPath();
          ctx.arc(
            outputSize / 2,
            outputSize / 2,
            outputSize / 2,
            0,
            Math.PI * 2
          );
          ctx.closePath();
          ctx.clip();

          // Draw the image with the crop applied
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            size,
            size, // Source rectangle
            0,
            0,
            outputSize,
            outputSize // Destination rectangle
          );

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not create image blob"));
                return;
              }

              // Create a new file from the blob
              const processedFile = new File([blob], "profile-picture.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              resolve(processedFile);
            },
            "image/jpeg",
            0.9
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(file);
    });
  };

  // Update the image error handler to use the constant
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Only set the default if the current src is not already the default
    if (e.currentTarget.src !== DEFAULT_PROFILE_IMAGE) {
      e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
    }
  };

  return (
    <div className="w-full font-sans">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6">Profile Picture</h2>
      <div className="border-t border-gray-200 mb-6"></div>

      {/* Profile Picture Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 flex items-center">
          <div
            className={`relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 mr-4 ${
              isEditing ? "cursor-pointer" : ""
            }`}
            onClick={handleProfileImageClick}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <Loader className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {/* Update the image display in the JSX to ensure proper rendering */}
            <img
              src={profileImage || "/placeholder.svg?height=150&width=150"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
              fetchPriority="high"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs font-medium">
                <Camera size={16} className="mr-1" />
                Change
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
            <p className="text-gray-900">Your profile picture</p>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, GIF, WEBP (max 5MB)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Personal Information</h2>
        <button
          onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-blue-50">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <label className="font-medium text-gray-900">Full Name</label>
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded font-normal mt-1"
              />
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-green-50">
                  <Mail className="w-5 h-5 text-green-500" />
                </div>
                <label className="font-medium text-gray-900">Email</label>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full p-2 border border-gray-300 rounded font-normal bg-gray-100 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-purple-50">
                  <Phone className="w-5 h-5 text-purple-500" />
                </div>
                <label className="font-medium text-gray-900">
                  Phone Number
                </label>
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded font-normal mt-1"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-orange-50">
                  <MapPin className="w-5 h-5 text-orange-500" />
                </div>
                <label className="font-medium text-gray-900">Address</label>
              </div>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded font-normal mt-1"
                placeholder="Enter your address"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-blue-50">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-medium text-gray-900">Full Name</h3>
              </div>
              <p className="text-gray-700 pl-10">{userData.name}</p>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-green-50">
                  <Mail className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-medium text-gray-900">Email</h3>
              </div>
              <p className="text-gray-700 pl-10">{userData.email}</p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-purple-50">
                  <Phone className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-medium text-gray-900">Phone Number</h3>
              </div>
              <p className="text-gray-700 pl-10">
                {userData.phone || "Not provided"}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-orange-50">
                  <MapPin className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-medium text-gray-900">Address</h3>
              </div>
              <p className="text-gray-700 pl-10">
                {userData.address || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
