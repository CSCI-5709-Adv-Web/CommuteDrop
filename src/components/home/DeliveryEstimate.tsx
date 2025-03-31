"use client";

import type { DeliveryFormData } from "../home/DeliveryFlow";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  MapPin,
  Clock,
  RefreshCw,
  CheckCircle,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNotifications } from "../notifications/NotificationProvider";

interface DeliveryEstimateProps {
  formData: DeliveryFormData;
  estimateData?: any;
  onBack: () => void;
  onTrack: () => void;
}

interface DriverDetails {
  id: string;
  name: string;
  rating: number;
  trips: number;
  vehicleType: string;
  vehicleNumber: string;
  image: string;
  eta: string;
}

type OrderState =
  | "WAITING_FOR_DRIVER"
  | "AWAITING_PICKUP"
  | "CANCELLED"
  | "DRIVER_FOUND";

export default function DeliveryEstimate({
  formData,
  estimateData,
  onBack,
  onTrack,
}: DeliveryEstimateProps) {
  const [orderState, setOrderState] =
    useState<OrderState>("WAITING_FOR_DRIVER");
  const [waitingTime, setWaitingTime] = useState(0);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(
    null
  );
  const { notifications } = useNotifications();

  // Simulate waiting time counter
  useEffect(() => {
    if (orderState === "WAITING_FOR_DRIVER") {
      const interval = setInterval(() => {
        setWaitingTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [orderState]);

  // Listen for notifications from the driver service
  useEffect(() => {
    // Get the most recent notification that might be relevant to our order
    const orderStatusNotifications = notifications
      .filter((notification) => notification.title === "OrderStatusUpdated")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    if (orderStatusNotifications.length > 0) {
      const latestNotification = orderStatusNotifications[0];

      try {
        // Parse the notification message to get the order status
        const notificationData =
          typeof latestNotification.message === "string"
            ? JSON.parse(latestNotification.message)
            : latestNotification.data;

        // Check if this notification is for our order
        const orderId = estimateData?.orderId || "order_123";
        if (notificationData.orderId === orderId) {
          // Update state based on the notification status
          switch (notificationData.status) {
            case "AWAITING_PICKUP":
              // If we have driver details in the notification
              if (notificationData.driver) {
                setDriverDetails({
                  id: notificationData.driver.id || "driver_id",
                  name: notificationData.driver.name || "Driver Name",
                  rating: notificationData.driver.rating || 4.8,
                  trips: notificationData.driver.trips || 1243,
                  vehicleType:
                    notificationData.driver.vehicleType || "Toyota Prius",
                  vehicleNumber:
                    notificationData.driver.vehicleNumber || "ABC 123",
                  image:
                    notificationData.driver.image ||
                    "/placeholder.svg?height=100&width=100",
                  eta: notificationData.estimatedArrival || "5 minutes",
                });

                // First show the driver found animation
                setOrderState("DRIVER_FOUND");

                // Then after a short delay, show the driver details
                setTimeout(() => {
                  setOrderState("AWAITING_PICKUP");
                }, 2000);
              } else {
                // If no driver details, just update the state
                setOrderState("AWAITING_PICKUP");
              }
              break;

            case "CANCELLED":
              setOrderState("CANCELLED");
              break;

            default:
              // For any other status, keep waiting
              break;
          }
        }
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    }
  }, [notifications, estimateData]);

  // Format waiting time as MM:SS
  const formatWaitingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle retry for cancelled orders
  const handleRetry = () => {
    setWaitingTime(0);
    setOrderState("WAITING_FOR_DRIVER");
  };

  return (
    <motion.div
      key="estimate"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-full bg-gray-50 p-4"
    >
      <div className="sticky top-0 z-50 bg-white -m-4 p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Order Status</h2>
          </div>
          {orderState === "WAITING_FOR_DRIVER" && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Searching for drivers...
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Order ID and basic info */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900">
              Order #{estimateData?.orderId?.substring(0, 8) || "123456"}
            </h3>
            <span
              className={`text-sm font-medium px-2 py-1 rounded-full ${
                orderState === "AWAITING_PICKUP"
                  ? "bg-green-100 text-green-800"
                  : orderState === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {orderState === "AWAITING_PICKUP"
                ? "Driver on the way"
                : orderState === "CANCELLED"
                ? "Cancelled"
                : orderState === "DRIVER_FOUND"
                ? "Driver found"
                : "Finding driver"}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {estimateData?.estimatedPrice && (
              <div className="flex justify-between mt-1">
                <span>Total amount:</span>
                <span className="font-medium">
                  $
                  {typeof estimateData.estimatedPrice === "number"
                    ? estimateData.estimatedPrice.toFixed(2)
                    : estimateData.estimatedPrice}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Route details */}

        {/* Different states */}
        <AnimatePresence mode="wait">
          {/* Waiting for driver state */}
          {orderState === "WAITING_FOR_DRIVER" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Looking for a driver
                </h3>
                <p className="text-gray-600 mb-4">
                  We're finding the best driver for your delivery
                </p>

                <div className="w-full bg-gray-100 h-2 rounded-full mb-2">
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{
                      width: [
                        "0%",
                        "50%",
                        "75%",
                        "85%",
                        "92%",
                        "96%",
                        "98%",
                        "99%",
                      ],
                    }}
                    transition={{
                      duration: 60,
                      times: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.85, 1],
                      ease: "easeOut",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between w-full text-sm text-gray-500">
                  <span>Waiting time</span>
                  <span className="font-mono">
                    {formatWaitingTime(waitingTime)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Driver found animation */}
          {orderState === "DRIVER_FOUND" && (
            <motion.div
              key="driver-found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-6 rounded-lg border border-green-200 shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: 1 }}
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Driver Found!
                </h3>
                <p className="text-gray-600 mb-4">
                  A driver has accepted your delivery request
                </p>
              </div>
            </motion.div>
          )}

          {/* Driver details when awaiting pickup */}
          {orderState === "AWAITING_PICKUP" && driverDetails && (
            <motion.div
              key="driver-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={driverDetails.image || "/placeholder.svg"}
                    alt={driverDetails.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {driverDetails.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-yellow-400 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span className="text-sm ml-1 font-medium">
                            {driverDetails.rating}
                          </span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">
                          {driverDetails.trips} trips
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {driverDetails.vehicleType}
                        </p>
                        <p className="text-sm text-gray-600">
                          {driverDetails.vehicleNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">ETA</p>
                        <p className="text-sm text-green-600">
                          {driverDetails.eta}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Cancelled state */}
          {orderState === "CANCELLED" && (
            <motion.div
              key="cancelled"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-6 rounded-lg border border-red-200 shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Order Rejected
                </h3>
                <p className="text-gray-600 mb-4">
                  No drivers are available at the moment
                </p>

                <div className="bg-green-50 p-3 rounded-lg w-full mb-4">
                  <div className="flex items-center">
                    <RefreshCw className="w-5 h-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Refund Initiated
                      </p>
                      <p className="text-xs text-green-600">
                        Your payment will be refunded within 3-5 business days
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRetry}
                  className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insurance info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg"
        >
          <Shield className="w-5 h-5" />
          <span className="text-sm">
            Your delivery is insured and tracked in real-time
          </span>
        </motion.div>

        {/* Track button - only enabled when driver is found */}
        <motion.button
          className={`w-full py-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            orderState === "AWAITING_PICKUP"
              ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              : "bg-gray-100 text-gray-500 cursor-not-allowed"
          }`}
          disabled={orderState !== "AWAITING_PICKUP"}
          whileHover={
            orderState === "AWAITING_PICKUP" ? { scale: 1.01 } : undefined
          }
          whileTap={
            orderState === "AWAITING_PICKUP" ? { scale: 0.99 } : undefined
          }
          onClick={onTrack}
        >
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" />
            Track Delivery
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
