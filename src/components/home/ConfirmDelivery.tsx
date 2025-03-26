"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Weight,
  Car,
  Clock,
  DollarSign,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { DeliveryEstimateResponse } from "../../services/delivery-service";
import { useLocation } from "../../context/LocationContext";
import {
  orderService,
  type OrderEstimateResponse,
  type CreateOrderRequest,
} from "../../services/order-service";
import { useAuth } from "../../context/AuthContext";

// Replace the CountUp component with this enhanced version
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
      {/* Animated background */}
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

      {/* Dollar sign with bounce effect */}
      <motion.div
        className="text-lg font-bold text-primary mr-1"
        animate={{
          y: [0, -5, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.5,
          delay: 0.5,
          ease: "easeOut",
        }}
      >
        $
      </motion.div>

      {/* The animated number */}
      <motion.div
        className="text-2xl font-bold text-primary"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {count.toFixed(2)}
      </motion.div>

      {/* Shimmer effect */}
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
  estimateData?: DeliveryEstimateResponse;
  onBack: () => void;
  onNext: () => void;
}

// Define the steps within the ConfirmDelivery component
type ConfirmStep =
  | "initial"
  | "estimating"
  | "estimated"
  | "confirming"
  | "confirmed"
  | "error";

export default function ConfirmDelivery({
  formData,
  estimateData: initialEstimateData,
  onBack,
  onNext,
}: ConfirmDeliveryProps) {
  // Get routeInfo from context
  const { routeInfo, pickupCoordinates, dropoffCoordinates, setRouteInfo } =
    useLocation();
  const { user } = useAuth();

  // State to track the current step within the component
  const [step, setStep] = useState<ConfirmStep>("initial");

  // State to store the estimate data from API
  const [estimateData] = useState<DeliveryEstimateResponse | undefined>(
    initialEstimateData
  );

  // State to store the order data from API
  const [orderData, setOrderData] = useState<OrderEstimateResponse | null>(
    null
  );

  // State to store error messages
  const [error, setError] = useState<string | null>(null);

  // State to store order ID after confirmation
  const [orderId, setOrderId] = useState<string | null>(null);

  // Use routeInfo if available, otherwise fall back to estimateData
  const estimatedDistance =
    routeInfo?.distance || estimateData?.distance?.text || "Calculating...";
  const estimatedTime =
    routeInfo?.duration ||
    estimateData?.estimatedTime?.text ||
    "Calculating...";
  const estimatedPrice =
    orderData?.estimatedPrice?.total.toFixed(2) ||
    estimateData?.estimatedPrice?.total.toFixed(2) ||
    "Calculating...";

  // Parse distance and time values for API request
  const parseDistance = useCallback(() => {
    if (!estimatedDistance || estimatedDistance === "Calculating...")
      return { value: 0, unit: "km" };

    // Extract numeric value and unit from string like "1.81 km"
    const match = estimatedDistance.match(/^([\d.]+)\s*(\w+)$/);
    if (match) {
      return {
        value: Number.parseFloat(match[1]),
        unit: match[2],
      };
    }

    return { value: 0, unit: "km" };
  }, [estimatedDistance]);

  const parseTime = useCallback(() => {
    if (!estimatedTime || estimatedTime === "Calculating...")
      return { value: 0, unit: "mins" };

    // Extract numeric value and unit from string like "3.65 mins"
    const match = estimatedTime.match(/^([\d.]+)\s*(\w+)$/);
    if (match) {
      return {
        value: Number.parseFloat(match[1]),
        unit: match[2],
      };
    }

    return { value: 0, unit: "mins" };
  }, [estimatedTime]);

  // Update the calculateEstimate function to call the order service API
  const calculateEstimate = useCallback(async () => {
    setStep("estimating");
    setError(null);

    try {
      // Parse distance and time
      const distance = parseDistance();
      const time = parseTime();

      // Prepare request payload
      const requestData: CreateOrderRequest = {
        pickup: {
          address: formData.pickup,
          latitude: pickupCoordinates?.lat,
          longitude: pickupCoordinates?.lng,
        },
        dropoff: {
          address: formData.dropoff,
          latitude: dropoffCoordinates?.lat,
          longitude: dropoffCoordinates?.lng,
        },
        packageDetails: {
          weight: Number.parseFloat(formData.weight) || 0,
        },
        carrierType: formData.carrier,
        distance,
        estimatedTime: time,
        userId: user?.email, // Use user email as ID for demo
      };

      // Call the order service API
      const response = await orderService.createOrder(requestData);

      if (response.success && response.data) {
        // Store the order data
        setOrderData(response.data);
        setOrderId(response.data.orderId);

        // Update route info if needed
        if (!routeInfo) {
          setRouteInfo({
            distance: estimatedDistance,
            duration: estimatedTime,
          });
        }

        setStep("estimated");
      } else {
        throw new Error(response.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error calculating estimate:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to calculate price estimate. Please try again."
      );
      setStep("error");
    }
  }, [
    formData,
    pickupCoordinates,
    dropoffCoordinates,
    routeInfo,
    setRouteInfo,
    parseDistance,
    parseTime,
    user?.email,
    estimatedDistance,
    estimatedTime,
  ]);

  // Function to confirm order
  const confirmOrder = useCallback(async () => {
    if (!orderId) {
      setError("No order ID found. Please try again.");
      return;
    }

    setStep("confirming");
    setError(null);

    try {
      // Call the order service API to confirm the order
      const response = await orderService.confirmOrder(orderId);

      if (response.success) {
        setOrderData(response.data);
        setStep("confirmed");
      } else {
        throw new Error(response.message || "Failed to confirm order");
      }
    } catch (error) {
      console.error("Error confirming order:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to confirm your order. Please try again."
      );
      setStep("error");
    }
  }, [orderId]);

  // Function to handle retry on error
  const handleRetry = useCallback(() => {
    setStep("initial");
    setError(null);
  }, []);

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
          disabled={step === "estimating" || step === "confirming"}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Confirm Delivery</h2>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Success message after order confirmation */}
      {step === "confirmed" && orderId && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-700 font-medium">Order Confirmed!</p>
            <p className="text-sm text-green-600">Your order ID is {orderId}</p>
            {orderData?.tracking && (
              <p className="text-sm text-green-600">
                Tracking ID: {orderData.tracking.trackingId}
              </p>
            )}
          </div>
        </div>
      )}

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

        {/* Distance Information - now using routeInfo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Distance</p>
              <p className="text-gray-700">{estimatedDistance}</p>
            </div>
          </div>
        </div>

        {/* Delivery Estimates - now using routeInfo */}
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

          {/* Estimated Cost - Only show when calculating or after calculation */}
          {step !== "initial" && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <DollarSign className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
                <div className="w-full">
                  <p className="font-medium text-gray-900">Estimated Cost</p>
                  {step === "estimating" ? (
                    <div className="mt-2">
                      <div className="relative h-16 w-full overflow-hidden rounded-md bg-gray-50 flex items-center justify-center">
                        <PriceAnimation
                          start={0}
                          end={orderData?.estimatedPrice?.total || 15.99}
                          duration={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 font-medium">
                      ${estimatedPrice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details - Show when order is estimated or confirmed */}
        {(step === "estimated" || step === "confirmed") && orderData && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Order Details</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Order ID:</span>{" "}
                    {orderData.orderId}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Status:</span>{" "}
                    {orderData.status}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Delivery Window:</span>{" "}
                    {orderData.estimatedDelivery.timeWindow}
                  </p>
                  {orderData.tracking && (
                    <p className="text-sm text-gray-700">
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

      <div className="mt-6">
        {/* Different buttons based on the current step */}
        {step === "initial" && (
          <button
            className="w-full bg-black text-white py-4 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            onClick={calculateEstimate}
          >
            Calculate Estimate Price
          </button>
        )}

        {step === "estimating" && (
          <button
            className="w-full bg-gray-400 text-white py-4 rounded-lg text-sm font-medium flex items-center justify-center cursor-wait"
            disabled
          >
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Calculating Estimate...
          </button>
        )}

        {step === "estimated" && (
          <button
            className="w-full bg-black text-white py-4 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            onClick={confirmOrder}
          >
            Confirm Order
          </button>
        )}

        {step === "confirming" && (
          <button
            className="w-full bg-gray-400 text-white py-4 rounded-lg text-sm font-medium flex items-center justify-center cursor-wait"
            disabled
          >
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Confirming Order...
          </button>
        )}

        {step === "confirmed" && (
          <button
            className="w-full bg-primary text-white py-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            onClick={onNext}
          >
            Continue to Payment
          </button>
        )}

        {step === "error" && (
          <button
            className="w-full bg-red-600 text-white py-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            onClick={handleRetry}
          >
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}
