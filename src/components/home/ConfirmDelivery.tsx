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
import DeliveryLocationCard from "./confirm/DeliveryLocationCard";
import DeliveryDetailCard from "./confirm/DeliveryDetailCard";

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
        <DeliveryLocationCard type="pickup" address={formData.pickup} />

        {/* Dropoff Location */}
        <DeliveryLocationCard type="dropoff" address={formData.dropoff} />

        {/* Package Details */}
        <div className="grid grid-cols-2 gap-4">
          <DeliveryDetailCard
            icon={<Weight className="w-5 h-5 mr-3 text-primary" />}
            title="Weight"
            value={`${formData.weight || "0"} kg`}
          />

          <DeliveryDetailCard
            icon={selectedCarrier.icon}
            title="Carrier"
            value={selectedCarrier.label}
          />
        </div>

        {/* Distance Information */}
        <DeliveryDetailCard
          icon={<MapPin className="w-5 h-5 mr-3 text-primary" />}
          title="Distance"
          value={estimatedDistance}
        />

        {/* Delivery Estimates */}
        <div className="grid grid-cols-2 gap-4">
          <DeliveryDetailCard
            icon={<Clock className="w-5 h-5 mr-3 text-primary" />}
            title="Estimated Time"
            value={estimatedTime}
          />

          <DeliveryDetailCard
            icon={<DollarSign className="w-5 h-5 mr-3 text-primary" />}
            title="Estimated Cost"
            value={`$${estimatedPrice}`}
          />
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
