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
import type { DeliveryEstimateResponse } from "../../services/delivery-service";
import { useLocation } from "../../context/LocationContext";
import {
  orderService,
  type OrderEstimateResponse,
  type CreateOrderRequest,
} from "../../services/order-service";
import { useAuth } from "../../context/AuthContext";
import { tokenStorage } from "../../utils/tokenStorage";
import { jwtUtils } from "../../utils/jwtUtils";

// Update the PriceAnimation component to be more compact
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
  estimateData?: DeliveryEstimateResponse;
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

export default function ConfirmDelivery({
  formData,
  estimateData: initialEstimateData,
  onBack,
  onNext,
}: ConfirmDeliveryProps) {
  const { routeInfo, setRouteInfo } = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState<ConfirmStep>("initial");
  const [estimateData] = useState<DeliveryEstimateResponse | undefined>(
    initialEstimateData
  );
  const [orderData, setOrderData] = useState<OrderEstimateResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const estimatedDistance =
    routeInfo?.distance || estimateData?.distance?.text || "Calculating...";
  const estimatedTime =
    routeInfo?.duration ||
    estimateData?.estimatedTime?.text ||
    "Calculating...";
  const estimatedPrice =
    orderData?.pricing_details?.total_cost?.toFixed(2) ||
    orderData?.estimatedPrice?.total.toFixed(2) ||
    estimateData?.estimatedPrice?.total.toFixed(2) ||
    "Calculating...";
  const parseDistance = useCallback(() => {
    if (!estimatedDistance || estimatedDistance === "Calculating...")
      return { value: 0, unit: "km" };
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
    const match = estimatedTime.match(/^([\d.]+)\s*(\w+)$/);
    if (match) {
      return {
        value: Number.parseFloat(match[1]),
        unit: match[2],
      };
    }

    return { value: 0, unit: "mins" };
  }, [estimatedTime]);

  const calculateEstimate = useCallback(async () => {
    setStep("estimating");
    setError(null);
    try {
      const token = tokenStorage.getToken();
      let userId = "";
      if (token) {
        const tokenUserId = jwtUtils.getUserId(token);
        if (tokenUserId) {
          userId = tokenUserId;
        } else {
          userId = user?.email || "";
        }
      }
      const requestData: CreateOrderRequest = {
        from_address: formData.pickup,
        to_address: formData.dropoff,
        user_id: userId, // Use the user ID from token
        package_weight: Number.parseFloat(formData.weight) || 0,
        delivery_instructions: "",
        vehicle_type: formData.carrier.toUpperCase(),
        distance: parseDistance().value,
        time: parseTime().value,
      };
      console.log("Sending order request:", requestData);
      const response = await orderService.createOrder(requestData);
      if (response.success && response.data) {
        setOrderData(response.data);
        setOrderId(response.data.orderId);
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
    routeInfo,
    setRouteInfo,
    parseDistance,
    parseTime,
    estimatedDistance,
    estimatedTime,
    user?.email,
  ]);

  const confirmOrder = useCallback(async () => {
    if (!orderId) {
      setError("No order ID found. Please try again.");
      return;
    }
    setStep("confirming");
    setError(null);
    try {
      const updateResponse = await orderService.updateOrderStatus(
        orderId,
        "ORDER CONFIRMED"
      );
      if (!updateResponse.success) {
        throw new Error(
          updateResponse.message || "Failed to update order status"
        );
      }
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

  const handleRetry = useCallback(() => {
    setStep("initial");
    setError(null);
  }, []);

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
        <div className="ml-2">
          <p className="font-medium text-sm text-gray-900">{title}</p>
          <p className="text-sm text-gray-700">{value}</p>
        </div>
      </div>
    </div>
  );

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
          disabled={step === "estimating" || step === "confirming"}
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-800">Confirm Delivery</h2>
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
      {step === "confirmed" && orderId && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-700">
              Order Confirmed!
            </p>
            <p className="text-xs text-green-600">Your order ID is {orderId}</p>
            {orderData?.tracking && (
              <p className="text-xs text-green-600">
                Tracking ID: {orderData.tracking.trackingId}
              </p>
            )}
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
                            orderData?.pricing_details?.total_cost ||
                            orderData?.estimatedPrice?.total ||
                            15.99
                          }
                          duration={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 font-medium">
                      $
                      {typeof estimatedPrice === "string" &&
                      estimatedPrice === "Calculating..."
                        ? (
                            orderData?.pricing_details?.total_cost ||
                            orderData?.estimatedPrice?.total ||
                            0
                          ).toFixed(2)
                        : estimatedPrice}
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
            onClick={calculateEstimate}
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
            onClick={confirmOrder}
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
            className="w-full bg-primary text-white py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
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
