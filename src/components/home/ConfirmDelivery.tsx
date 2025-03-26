"use client";

import { useState, useCallback } from "react";
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
import { deliveryService } from "../../services/delivery-service";

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
  const { routeInfo, pickupCoordinates, dropoffCoordinates } = useLocation();

  // State to track the current step within the component
  const [step, setStep] = useState<ConfirmStep>("initial");

  // State to store the estimate data from API
  const [estimateData, setEstimateData] = useState<
    DeliveryEstimateResponse | undefined
  >(initialEstimateData);

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
    estimateData?.estimatedPrice?.total.toFixed(2) || "Calculating...";

  // Function to calculate price estimate
  const calculateEstimate = useCallback(async () => {
    setStep("estimating");
    setError(null);

    try {
      const requestData = {
        pickup: {
          address: formData.pickup,
          latitude: pickupCoordinates?.lat || 44.6488,
          longitude: pickupCoordinates?.lng || -63.5752,
        },
        dropoff: {
          address: formData.dropoff,
          latitude: dropoffCoordinates?.lat || 32.532,
          longitude: dropoffCoordinates?.lng || 75.971,
        },
        packageDetails: {
          weight: Number.parseFloat(formData.weight) || 0,
        },
        carrierType: formData.carrier as any,
      };

      const response = await deliveryService.getEstimate(requestData);

      if (response.success && response.data) {
        setEstimateData(response.data);
        setStep("estimated");
      } else {
        // If API call fails, use fallback data
        const fallbackData = {
          estimatedTime: { text: "3-5 days" },
          estimatedPrice: {
            total: 299.99,
            base: 50,
            distance: 229.99,
            time: 20,
            currency: "USD",
          },
          distance: { text: "7,500 km", meters: 7500000 },
          route: { points: [] },
          availableCarriers: [
            {
              type: formData.carrier,
              name:
                formData.carrier.charAt(0).toUpperCase() +
                formData.carrier.slice(1),
              estimatedTime: "3-5 days",
              price: 299.99,
            },
          ],
        };

        setEstimateData(fallbackData as any);
        setStep("estimated");
      }
    } catch (error) {
      console.error("Error calculating estimate:", error);
      setError("Failed to calculate price estimate. Please try again.");
      setStep("error");
    }
  }, [formData, pickupCoordinates, dropoffCoordinates]);

  // Function to confirm order
  const confirmOrder = useCallback(async () => {
    setStep("confirming");
    setError(null);

    try {
      // In a real app, you would call the API to create the delivery
      // For this demo, we'll simulate a successful response

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock order ID
      const mockOrderId = `ORD-${Math.floor(Math.random() * 10000)}`;
      setOrderId(mockOrderId);
      setStep("confirmed");
    } catch (error) {
      console.error("Error confirming order:", error);
      setError("Failed to confirm your order. Please try again.");
      setStep("error");
    }
  }, []);

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
              <p className="text-gray-700">
                {step === "estimating" ? (
                  <span className="flex items-center">
                    <Loader className="w-3 h-3 mr-2 animate-spin" />
                    Calculating...
                  </span>
                ) : (
                  estimatedDistance
                )}
              </p>
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
                <p className="text-gray-700">
                  {step === "estimating" ? (
                    <span className="flex items-center">
                      <Loader className="w-3 h-3 mr-2 animate-spin" />
                      Calculating...
                    </span>
                  ) : (
                    estimatedTime
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <DollarSign className="w-5 h-5 mr-3 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Estimated Cost</p>
                <p className="text-gray-700">
                  {step === "estimating" ? (
                    <span className="flex items-center">
                      <Loader className="w-3 h-3 mr-2 animate-spin" />
                      Calculating...
                    </span>
                  ) : (
                    `$${estimatedPrice}`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
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
