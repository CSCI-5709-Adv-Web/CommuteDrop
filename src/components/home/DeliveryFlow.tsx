"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchForm from "./SearchForm";
import PaymentForm from "./PaymentForm";
import DeliveryEstimate from "./DeliveryEstimate";
import ConfirmDelivery from "./ConfirmDelivery";
import { deliveryService } from "../../services/delivery-service";
import { useLocation } from "../../context/LocationContext";

type FlowStep = "search" | "confirm" | "payment" | "estimate";

interface DeliveryFlowProps {
  onLocationUpdate?: (pickup: string, dropoff: string) => void;
  onCalculateRoute?: () => void;
}

export interface DeliveryFormData {
  pickup: string;
  dropoff: string;
  pickupCoordinates?: { lat: number; lng: number };
  dropoffCoordinates?: { lat: number; lng: number };
  weight: string;
  carrier: string;
  estimatedTime: string;
  estimatedPrice: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export default function DeliveryFlow({
  onLocationUpdate,
  onCalculateRoute,
}: DeliveryFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("search");
  const [estimateData, setEstimateData] = useState<any>(null);

  // Get location data from context
  const locationData = useLocation();
  const {
    pickup,
    dropoff,
    pickupCoordinates,
    dropoffCoordinates,
    setShowRoute,
    setRouteInfo,
  } = locationData;

  // Additional form data not related to location
  const [formData, setFormData] = useState<
    Omit<
      DeliveryFormData,
      "pickup" | "dropoff" | "pickupCoordinates" | "dropoffCoordinates"
    >
  >({
    weight: "",
    carrier: "car",
    estimatedTime: "30-45 mins",
    estimatedPrice: "15.99",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  // Combine location data from context with other form data
  const completeFormData: DeliveryFormData = useMemo(
    () => ({
      pickup,
      dropoff,
      pickupCoordinates,
      dropoffCoordinates,
      ...formData,
    }),
    [pickup, dropoff, pickupCoordinates, dropoffCoordinates, formData]
  );

  const steps: FlowStep[] = useMemo(
    () => ["search", "confirm", "payment", "estimate"],
    []
  );

  const progress = useMemo(
    () => (steps.indexOf(currentStep) + 1) * 25,
    [steps, currentStep]
  );

  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Update the handleNavigate function to properly manage state transitions
  const handleNavigate = useCallback(
    async (step: FlowStep) => {
      // When going back to search, reset the route visibility and routeInfo
      if (step === "search") {
        setShowRoute(false);
        setRouteInfo(null); // Reset route info when going back to search
        setCurrentStep(step);
        return;
      }

      // When moving from search to confirm, calculate the route
      if (currentStep === "search" && step === "confirm") {
        if (onCalculateRoute) {
          onCalculateRoute();
        }

        try {
          const requestData = {
            pickup: {
              address: pickup,
              latitude: pickupCoordinates?.lat || 44.6488,
              longitude: pickupCoordinates?.lng || -63.5752,
            },
            dropoff: {
              address: dropoff,
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
            setFormData((prev) => ({
              ...prev,
              estimatedTime: response.data.estimatedTime.text,
              estimatedPrice: response.data.estimatedPrice.total.toFixed(2),
            }));
            setEstimateData(response.data);
          } else {
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
            };

            setFormData((prev) => ({
              ...prev,
              estimatedTime: fallbackData.estimatedTime.text,
              estimatedPrice: fallbackData.estimatedPrice.total.toFixed(2),
            }));
            setEstimateData(fallbackData);
          }

          // Set showRoute to true only when moving to confirm step
          setShowRoute(true);
          setCurrentStep(step);
        } catch (error) {
          console.error("Error in navigation process:", error);
        }
      } else {
        // For other transitions, just update the step
        setCurrentStep(step);
      }
    },
    [
      currentStep,
      pickup,
      dropoff,
      pickupCoordinates,
      dropoffCoordinates,
      formData,
      onCalculateRoute,
      setShowRoute,
      setRouteInfo,
    ]
  );

  const transitionConfig = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      <div className="sticky top-0 z-50 bg-white">
        <div className="h-1.5 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="h-full bg-blue-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full transition-colors">
        <AnimatePresence mode="wait">
          {currentStep === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <SearchForm
                formData={completeFormData}
                onFormDataChange={handleFormDataChange}
                onNext={() => handleNavigate("confirm")}
                onLocationUpdate={onLocationUpdate}
              />
            </motion.div>
          )}
          {currentStep === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <ConfirmDelivery
                formData={completeFormData}
                estimateData={estimateData}
                onBack={() => handleNavigate("search")}
                onNext={() => handleNavigate("payment")}
              />
            </motion.div>
          )}
          {currentStep === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <PaymentForm
                onBack={() => handleNavigate("confirm")}
                onPaymentSuccess={() => handleNavigate("estimate")}
              />
            </motion.div>
          )}
          {currentStep === "estimate" && (
            <motion.div
              key="estimate"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <DeliveryEstimate
                formData={completeFormData}
                estimateData={estimateData}
                onBack={() => handleNavigate("payment")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
