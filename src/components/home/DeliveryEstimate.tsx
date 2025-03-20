"use client";

import type { DeliveryFormData } from "./DeliveryFlow";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  ArrowLeft,
  Car,
  Star,
  Phone,
  Receipt,
  AlertCircle,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { DeliveryEstimateResponse } from "../../services/delivery-service";

interface DeliveryEstimateProps {
  formData: DeliveryFormData;
  estimateData?: DeliveryEstimateResponse;
  onBack: () => void;
}

interface DriverDetails {
  name: string;
  rating: number;
  trips: number;
  vehicleType: string;
  vehicleNumber: string;
  image: string;
}

type SearchStatus = "searching" | "not_found" | "error" | "success";

const SEARCH_STAGES = [
  "Locating nearby drivers",
  "Calculating best routes",
  "Checking traffic conditions",
  "Finalizing estimates",
  "Connecting with driver",
];

export default function DeliveryEstimate({
  formData,
  estimateData,
  onBack,
}: DeliveryEstimateProps) {
  const [status, setStatus] = useState<SearchStatus>("searching");
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(
    null
  );
  const [estimatedTime, setEstimatedTime] = useState(
    estimateData?.estimatedTime?.text || "25-30 minutes"
  );
  const [distance, setDistance] = useState(
    estimateData?.distance?.text || "3.2 km"
  );
  const [fare, setFare] = useState(
    estimateData?.estimatedPrice || {
      base: 5.0,
      distance: 8.99,
      time: 2.0,
      total: 15.99,
      currency: "USD",
    }
  );
  const [error, setError] = useState("");

  const startSearch = useCallback(() => {
    setStatus("searching");
    setProgress(0);
    setCurrentStage(0);
    setError("");

    const stageInterval = setInterval(() => {
      setCurrentStage((stage) => {
        if (stage >= SEARCH_STAGES.length - 1) {
          clearInterval(stageInterval);

          // Simulate calling the delivery creation API
          const createDelivery = async () => {
            try {
              // In a real app, we would call the API
              // const response = await deliveryService.createDelivery(requestData);

              // For demo, we'll simulate a successful response
              // Simulate random success (70% chance)
              const outcome = Math.random();
              if (outcome < 0.7) {
                setDriverDetails({
                  name: "Michael Chen",
                  rating: 4.8,
                  trips: 1243,
                  vehicleType: "Toyota Prius",
                  vehicleNumber: "ABC 123",
                  image: "src/assets/profile.jpeg?height=100&width=100",
                });
                setStatus("success");
              } else if (outcome < 0.9) {
                setStatus("not_found");
              } else {
                setStatus("error");
                setError("Network error occurred. Please try again.");
              }
            } catch (error) {
              console.error("Error creating delivery:", error);
              setStatus("error");
              setError("Failed to create delivery. Please try again.");
            }
          };

          createDelivery();
          return stage;
        }
        return stage + 1;
      });
    }, 1500);

    const progressInterval = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(progressInterval);

          // Use real data from the estimate if available
          if (estimateData) {
            setEstimatedTime(estimateData.estimatedTime.text);
            setDistance(estimateData.distance.text);
            setFare(estimateData.estimatedPrice);
          } else {
            setEstimatedTime("25-30 minutes");
            setDistance("3.2 km");
            setFare({
              base: 5.0,
              distance: 8.99,
              time: 2.0,
              total: 15.99,
              currency: "USD",
            });
          }
          return 100;
        }
        return Math.min(oldProgress + 2, 100);
      });
    }, 100);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, [formData, estimateData]);

  useEffect(() => {
    const cleanup = startSearch();
    return cleanup;
  }, [startSearch]);

  const handleRetry = () => {
    const cleanup = startSearch();
    return cleanup;
  };

  return (
    <motion.div
      key="estimate"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-full bg-gray-50"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                Delivery Estimate
              </h2>
            </div>
            {status === "searching" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Searching...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6" style={{ marginTop: 10 }}>
        {/* Error State */}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-red-200 shadow-lg shadow-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error Finding Drivers</p>
              <p className="text-sm mt-1 text-red-600">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-3 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* No Drivers Found State */}
        {status === "not_found" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-yellow-200 shadow-lg shadow-yellow-50 text-yellow-700 p-4 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">No Drivers Available</p>
              <p className="text-sm mt-1 text-yellow-600">
                We couldn't find any drivers in your area. Please try again in a
                few minutes.
              </p>
              <button
                onClick={handleRetry}
                className="mt-3 text-sm font-medium bg-yellow-50 px-4 py-2 rounded-lg hover:bg-yellow-100 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Search Progress Indicator */}
        {status === "searching" && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-shrink-0">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <motion.div
                  className="absolute inset-0 bg-primary rounded-full"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
              </div>
              <span className="font-medium text-gray-800">
                {SEARCH_STAGES[currentStage]}
              </span>
            </div>
            <div className="space-y-4">
              {SEARCH_STAGES.map((stage, index) => (
                <motion.div
                  key={stage}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: index <= currentStage ? 1 : 0.5 }}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                      index <= currentStage ? "bg-primary" : "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1 h-[2px] bg-gray-100" />
                  <span className="text-sm text-gray-600 flex-shrink-0">
                    {stage}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Driver Details Card */}
        {status === "success" && driverDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={
                    driverDetails.image ||
                    "/placeholder.svg?height=100&width=100"
                  }
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
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
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
                  <button className="bg-primary text-white p-3 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {driverDetails.vehicleType}
                      </p>
                      <p className="text-sm text-gray-600">
                        {driverDetails.vehicleNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading Progress Bar */}
        {status === "searching" && (
          <div className="w-full bg-gray-100 rounded-full h-2">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              className="bg-primary h-full rounded-full relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/30"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
            </motion.div>
          </div>
        )}

        {/* Delivery Details */}
        {(status === "success" || status === "searching") && (
          <div className="space-y-4">
            <AnimatePresence>
              {(status === "success" || progress > 25) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-gray-900">
                        Fare Breakdown
                      </span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      ${fare.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                      <span className="text-gray-600">Base Fare</span>
                      <span className="font-medium text-gray-900">
                        ${fare.base.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                      <span className="text-gray-600">
                        Distance ({distance})
                      </span>
                      <span className="font-medium text-gray-900">
                        ${fare.distance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Time</span>
                      <span className="font-medium text-gray-900">
                        ${fare.time.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {(status === "success" || progress > 50) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Time</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {estimatedTime}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {(status === "success" || progress > 90) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-4">
                        Route Details
                      </p>
                      <div className="relative space-y-6">
                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                        <div className="flex items-start gap-4 relative">
                          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                          <div>
                            <p className="font-medium text-gray-900">Pickup</p>
                            <p className="text-sm text-gray-600">
                              {formData.pickup}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 relative">
                          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                          <div>
                            <p className="font-medium text-gray-900">Dropoff</p>
                            <p className="text-sm text-gray-600">
                              {formData.dropoff}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Safety Message */}
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg"
          >
            <Shield className="w-5 h-5" />
            <span className="text-sm">
              Your delivery is insured and tracked in real-time
            </span>
          </motion.div>
        )}

        {/* Confirm Delivery Button */}
        <motion.button
          className={`w-full py-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            status !== "success"
              ? "bg-gray-100 text-gray-500"
              : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
          }`}
          disabled={status !== "success"}
          whileHover={status === "success" ? { scale: 1.01 } : undefined}
          whileTap={status === "success" ? { scale: 0.99 } : undefined}
        >
          {status === "searching" ? (
            <span className="flex items-center justify-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-200" />
              </div>
              Finding Drivers...
            </span>
          ) : status === "success" ? (
            "Confirm Delivery"
          ) : (
            "No Drivers Available"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
