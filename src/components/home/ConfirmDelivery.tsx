"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  ArrowLeft,
  Package,
  Weight,
  Clock,
  DollarSign,
  Car,
  Truck,
  Bike,
} from "lucide-react";
import type { DeliveryEstimateResponse } from "../../services/delivery-service";

interface ConfirmDeliveryProps {
  formData: any;
  estimateData?: DeliveryEstimateResponse;
  onBack: () => void;
  onNext: () => void;
}

const carriers = {
  car: { icon: <Car className="w-5 h-5 mr-3 text-primary" />, label: "Car" },
  truck: {
    icon: <Truck className="w-5 h-5 mr-3 text-primary" />,
    label: "Truck",
  },
  bike: { icon: <Bike className="w-5 h-5 mr-3 text-primary" />, label: "Bike" },
  walk: {
    icon: <Package className="w-5 h-5 mr-3 text-primary" />,
    label: "Walk",
  },
};

export default function ConfirmDelivery({
  formData,
  estimateData,
  onBack,
  onNext,
}: ConfirmDeliveryProps) {
  const selectedCarrier =
    carriers[formData.carrier as keyof typeof carriers] || carriers.car;

  // Use real estimated data if available
  const estimatedDistance = estimateData?.distance?.text || "3.2 km";
  const estimatedTime =
    estimateData?.estimatedTime?.text || formData.estimatedTime || "30-45 mins";
  const estimatedPrice =
    estimateData?.estimatedPrice?.total.toFixed(2) ||
    formData.estimatedPrice ||
    "15.99";

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 h-full flex flex-col"
    >
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-full mr-4"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Confirm Delivery</h2>
      </div>

      <div className="space-y-6 flex-grow">
        {/* Pickup Location */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 mr-3 text-primary" />
            <p className="font-medium">Pickup Location</p>
          </div>
          <p className="text-gray-800 pl-8">{formData.pickup}</p>
        </div>

        {/* Dropoff Location */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 mr-3 text-primary" />
            <p className="font-medium">Dropoff Location</p>
          </div>
          <p className="text-gray-800 pl-8">{formData.dropoff}</p>
        </div>

        {/* Package Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <Weight className="w-5 h-5 mr-3 text-primary" />
              <p className="font-medium">Weight</p>
            </div>
            <p className="text-gray-800 pl-8">{formData.weight || "0"} kg</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              {selectedCarrier.icon}
              <p className="font-medium">Carrier</p>
            </div>
            <p className="text-gray-800 pl-8">{selectedCarrier.label}</p>
          </div>
        </div>

        {/* Distance Information (New) */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 mr-3 text-primary" />
            <p className="font-medium">Distance</p>
          </div>
          <p className="text-gray-800 pl-8">{estimatedDistance}</p>
        </div>

        {/* Delivery Estimates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 mr-3 text-primary" />
              <p className="font-medium">Estimated Time</p>
            </div>
            <p className="text-gray-800 pl-8">{estimatedTime}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <DollarSign className="w-5 h-5 mr-3 text-primary" />
              <p className="font-medium">Estimated Cost</p>
            </div>
            <p className="text-gray-800 pl-8">${estimatedPrice}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          className="w-full bg-black text-white py-4 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
          onClick={onNext}
        >
          Continue to Payment
        </button>
      </div>
    </motion.div>
  );
}
