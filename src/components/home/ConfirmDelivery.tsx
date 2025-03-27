"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Weight,
  Car,
  Truck,
  Bike,
  Package,
  Clock,
  DollarSign,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useOrder } from "../../context/OrderContext";
import { useLocation } from "../../context/LocationContext";

// Price animation component
const PriceAnimation = ({
  start = 0,
  end = 299.99,
  duration = 2,
}: {
  start?: number;
  end?: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Use easeOutExpo for a more dynamic feel
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const currentCount = start + (end - start) * easeOutExpo;

      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [start, end, duration]);

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-md opacity-20"
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="text-sm font-bold text-primary mr-0.5"
        animate={{
          y: [0, -3, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.5,
          delay: 0.5,
          ease: "easeOut",
        }}
      >
        $
      </motion.div>
      <motion.div
        className="text-base font-bold text-primary"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {count.toFixed(2)}
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: 2,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
    </div>
  );
};

interface ConfirmDeliveryProps {
  formData: any;
  onBack: () => void;
  onNext: () => void;
}

type ConfirmStep =
  | "initial"
  | "estimating"
  | "estimated"
  | "confirming"
  | "confirmed"
  | "error";

// Update the ConfirmDelivery component to maintain state when returning from payment
export default function ConfirmDelivery({
  formData,
  onBack,
  onNext,
}: ConfirmDeliveryProps) {
  const { routeInfo } = useLocation();
  const {
    orderId,
    orderData,
    status,
    isLoading,
    error,
    estimatedPrice,
    calculateEstimate,
    confirmOrder,
  } = useOrder();

  // Initialize step based on existing order status
  const [step, setStep] = useState<ConfirmStep>(() => {
    // If we already have an order ID and status is CONFIRMED or higher,
    // set the step to confirmed
    if (orderId && (status === "CONFIRMED" || status === "PAID")) {
      return "confirmed";
    } else if (orderId && status === "CREATED") {
      return "estimated";
    } else {
      return "initial";
    }
  });

  const estimatedDistance =
    routeInfo?.distance || formData.estimatedDistance || "Calculating...";
  const estimatedTime =
    routeInfo?.duration || formData.estimatedTime || "Calculating...";

  // Format price for display
  const displayPrice =
    typeof estimatedPrice === "number"
      ? estimatedPrice.toFixed(2)
      : typeof formData.estimatedPrice === "string"
      ? formData.estimatedPrice
      : "Calculating...";

  // Handle calculate estimate
  const handleCalculateEstimate = useCallback(async () => {
    setStep("estimating");
    const success = await calculateEstimate();
    if (success) {
      setStep("estimated");
    } else {
      setStep("error");
    }
  }, [calculateEstimate]);

  // Handle confirm order
  const handleConfirmOrder = useCallback(async () => {
    setStep("confirming");
    const success = await confirmOrder();
    if (success) {
      setStep("confirmed");
      // Wait a moment to show success message before proceeding
      setTimeout(() => {
        onNext();
      }, 2000);
    } else {
      setStep("error");
    }
  }, [confirmOrder, onNext]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setStep("initial");
  }, []);

  // DeliveryDetailCard component
  const DeliveryDetailCard = ({
    icon,
    title,
    value,
    bgColor = "bg-gray-50",
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    bgColor?: string;
  }) => (
    <div className={`${bgColor} p-3 rounded-lg`}>
      <div className="flex items-start">
        {icon}
        <div className="ml-2 flex-1">
          <p className="font-medium text-sm text-gray-900">{title}</p>
          <p className="text-sm text-gray-700 break-words">{value}</p>
        </div>
      </div>
    </div>
  );

  // Get carrier icon
  const getCarrierIcon = (carrierType: string) => {
    switch (carrierType.toLowerCase()) {
      case "car":
        return <Car className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />;
      case "truck":
        return <Truck className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />;
      case "bike":
        return <Bike className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />;
      case "walk":
        return <Package className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />;
      default:
        return <Car className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />;
    }
  };

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-3 h-full flex flex-col"
    >
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-full mr-3"
          disabled={isLoading || step === "estimating" || step === "confirming"}
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Confirm Delivery</h1>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Error</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-3 flex-grow">
        <DeliveryDetailCard
          icon={<MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />}
          title="Pickup Location"
          value={formData.pickup}
          bgColor="bg-blue-50"
        />
        <DeliveryDetailCard
          icon={<MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />}
          title="Dropoff Location"
          value={formData.dropoff}
          bgColor="bg-red-50"
        />
        <div className="grid grid-cols-2 gap-2">
          <DeliveryDetailCard
            icon={
              <Weight className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
            }
            title="Weight"
            value={`${formData.weight || "0"} kg`}
            bgColor="bg-purple-50"
          />
          <DeliveryDetailCard
            icon={getCarrierIcon(formData.carrier)}
            title="Carrier"
            value={formData.carrier || "Car"}
            bgColor="bg-blue-50"
          />
        </div>
        <DeliveryDetailCard
          icon={
            <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
          }
          title="Distance"
          value={estimatedDistance}
          bgColor="bg-green-50"
        />
        <div className="grid grid-cols-2 gap-2">
          <DeliveryDetailCard
            icon={
              <Clock className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
            }
            title="Estimated Time"
            value={estimatedTime}
            bgColor="bg-orange-50"
          />
          {step !== "initial" && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-start">
                <DollarSign className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                <div className="ml-2 w-full">
                  <p className="font-medium text-sm text-gray-900">
                    Estimated Cost
                  </p>
                  {step === "estimating" ? (
                    <div className="mt-1">
                      <div className="relative h-6 w-full overflow-hidden rounded-md bg-yellow-50 flex items-center justify-center">
                        <PriceAnimation
                          start={0}
                          end={
                            typeof estimatedPrice === "number"
                              ? estimatedPrice
                              : 65.22
                          }
                          duration={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 font-medium">
                      ${displayPrice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {(step === "estimated" || step === "confirmed") && orderData && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <div className="ml-2">
                <p className="font-medium text-sm text-gray-900">
                  Order Details
                </p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Order ID:</span>{" "}
                    {orderData.orderId}
                  </p>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Status:</span>{" "}
                    {orderData.status}
                  </p>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Delivery Window:</span>{" "}
                    {orderData.estimatedDelivery?.timeWindow || "N/A"}
                  </p>
                  {orderData.tracking && (
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">Tracking ID:</span>{" "}
                      {orderData.tracking.trackingId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4">
        {step === "initial" && (
          <button
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            onClick={handleCalculateEstimate}
          >
            Calculate Estimate Price
          </button>
        )}
        {step === "estimating" && (
          <button
            className="w-full bg-gray-400 text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center cursor-wait"
            disabled
          >
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Calculating Estimate...
          </button>
        )}
        {step === "estimated" && (
          <button
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            onClick={handleConfirmOrder}
          >
            Confirm Order
          </button>
        )}
        {step === "confirming" && (
          <button
            className="w-full bg-gray-400 text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center cursor-wait"
            disabled
          >
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Confirming Order...
          </button>
        )}
        {step === "confirmed" && (
          <button
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            onClick={onNext}
          >
            Continue to Payment
          </button>
        )}
        {step === "error" && (
          <button
            className="w-full bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            onClick={handleRetry}
          >
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}
