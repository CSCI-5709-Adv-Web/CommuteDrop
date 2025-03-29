"use client";

import type { DeliveryFormData } from "./DeliveryFlow";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import SearchStages from "./estimate/SearchStages";
import DriverCard from "./estimate/DriverCard";
import FareBreakdown from "./estimate/FareBreakdown";
import EstimatedTimeCard from "./estimate/EstimatedTimeCard";
import RouteDetailsCard from "./estimate/RouteDetailsCard";

interface DeliveryEstimateProps {
  formData: DeliveryFormData;
  estimateData?: any; // Change to any or the correct type
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
  const [, setError] = useState("");

  // Add a custom back handler that preserves state
  const handleBack = () => {
    // Don't reset any state, just navigate back
    onBack();
  };

  const startSearch = useCallback(() => {
    setStatus("searching");
    setProgress(0);
    setCurrentStage(0);
    setError("");
    const stageInterval = setInterval(() => {
      setCurrentStage((stage) => {
        if (stage >= SEARCH_STAGES.length - 1) {
          clearInterval(stageInterval);
          const createDelivery = async () => {
            try {
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
          if (estimateData) {
            setEstimatedTime(
              estimateData.estimatedTime?.text || "25-30 minutes"
            );
            setDistance(estimateData.distance?.text || "3.2 km");
            setFare(
              estimateData.estimatedPrice || {
                base: 5.0,
                distance: 8.99,
                time: 2.0,
                total: 15.99,
                currency: "USD",
              }
            );
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

  return (
    <motion.div
      key="estimate"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-full bg-gray-50"
    >
      <div className="sticky top-0 z-50 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
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
        {status === "searching" && (
          <SearchStages
            stages={SEARCH_STAGES}
            currentStage={currentStage}
            progress={progress}
          />
        )}
        {status === "success" && driverDetails && (
          <DriverCard driver={driverDetails} />
        )}
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
        {(status === "success" || status === "searching") && (
          <div className="space-y-4">
            <AnimatePresence>
              {(status === "success" || progress > 25) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FareBreakdown fare={fare} distance={distance} />
                </motion.div>
              )}

              {(status === "success" || progress > 50) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <EstimatedTimeCard estimatedTime={estimatedTime} />
                </motion.div>
              )}

              {(status === "success" || progress > 90) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <RouteDetailsCard
                    pickup={formData.pickup}
                    dropoff={formData.dropoff}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
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
