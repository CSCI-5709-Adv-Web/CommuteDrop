"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Weight,
  Car,
  Clock,
  DollarSign,
} from "lucide-react";
import type { DeliveryEstimateResponse } from "../../services/delivery-service";

interface ConfirmDeliveryProps {
  formData: any;
  estimateData?: DeliveryEstimateResponse;
  onBack: () => void;
  onNext: () => void;
}

export default function ConfirmDelivery({
  formData,
  estimateData,
  onBack,
  onNext,
}: ConfirmDeliveryProps) {
  // Use real estimated data if available
  const estimatedDistance = estimateData?.distance?.text || "7,500 km";
  const estimatedTime = estimateData?.estimatedTime?.text || "3-5 days";
  const estimatedPrice =
    estimateData?.estimatedPrice?.total.toFixed(2) || "299.99";

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 h-full flex flex-col"
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

      <div className="space-y-4 flex-grow">
        {/* Pickup Location */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Pickup Location</p>
              <p className="text-gray-700">{formData.pickup}</p>
            </div>
          </div>
        </div>

        {/* Dropoff Location */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Dropoff Location</p>
              <p className="text-gray-700">{formData.dropoff}</p>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Weight className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Weight</p>
                <p className="text-gray-700">{formData.weight || "0"} kg</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Car className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Carrier</p>
                <p className="text-gray-700">{formData.carrier || "Car"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distance Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Distance</p>
              <p className="text-gray-700">{estimatedDistance}</p>
            </div>
          </div>
        </div>

        {/* Delivery Estimates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Clock className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Estimated Time</p>
                <p className="text-gray-700">{estimatedTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <DollarSign className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Estimated Cost</p>
                <p className="text-gray-700">${estimatedPrice}</p>
              </div>
            </div>
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
