"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchForm from "./SearchForm";
import PaymentForm from "./PaymentForm";
import DeliveryEstimate from "./DeliveryEstimate";
import ConfirmDelivery from "./ConfirmDelivery";
import { deliveryService } from "../../services/delivery-service";

type FlowStep = "search" | "confirm" | "payment" | "estimate";

interface DeliveryFlowProps {
  onLocationUpdate?: (pickup: string, dropoff: string) => void;
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

export default function DeliveryFlow({ onLocationUpdate }: DeliveryFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [estimateData, setEstimateData] = useState<any>(null);
  const [formData, setFormData] = useState<DeliveryFormData>({
    pickup: "",
    dropoff: "",
    weight: "",
    carrier: "car",
    estimatedTime: "30-45 mins",
    estimatedPrice: "15.99",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [hasEnteredLocations, setHasEnteredLocations] = useState(false);
  const [lastNotifiedPickup, setLastNotifiedPickup] = useState("");
  const [lastNotifiedDropoff, setLastNotifiedDropoff] = useState("");

  const steps: FlowStep[] = useMemo(
    () => ["search", "confirm", "payment", "estimate"],
    []
  );
  const progress = useMemo(
    () => (steps.indexOf(currentStep) + 1) * 25,
    [steps, currentStep]
  );

  // Handle location changes and update map
  const handleLocationChange = useCallback(
    (pickup: string, dropoff: string) => {
      console.log("Location update received in DeliveryFlow:", {
        pickup,
        dropoff,
      });

      // Only update if values have changed
      if (pickup !== formData.pickup) {
        setFormData((prev) => ({
          ...prev,
          pickup,
        }));
      }

      if (dropoff !== formData.dropoff) {
        setFormData((prev) => ({
          ...prev,
          dropoff,
        }));
      }

      // Set hasEnteredLocations to true if either location is provided
      if (
        (pickup && pickup.trim().length > 0) ||
        (dropoff && dropoff.trim().length > 0)
      ) {
        setHasEnteredLocations(true);
      }

      // Only notify parent if values have actually changed to prevent unnecessary rerenders
      if (pickup !== lastNotifiedPickup || dropoff !== lastNotifiedDropoff) {
        if (onLocationUpdate) {
          console.log("Notifying parent of location change:", {
            pickup,
            dropoff,
          });
          onLocationUpdate(pickup, dropoff);

          // Update last notified values
          setLastNotifiedPickup(pickup);
          setLastNotifiedDropoff(dropoff);
        }
      }
    },
    [
      formData.pickup,
      formData.dropoff,
      onLocationUpdate,
      lastNotifiedPickup,
      lastNotifiedDropoff,
    ]
  );

  // Update the handleNavigate function to properly handle loading states
  const handleNavigate = useCallback(
    (step: FlowStep) => {
      setIsLoading(true);

      // Special case for confirm -> payment transition
      // Fetch delivery estimate from API
      if (currentStep === "search" && step === "confirm") {
        const fetchEstimate = async () => {
          try {
            // Validate that we have coordinates before proceeding
            if (!formData.pickupCoordinates || !formData.dropoffCoordinates) {
              console.error("Missing coordinates for estimate calculation");
              setIsLoading(false);
              return;
            }

            // Prepare request data
            const requestData = {
              pickup: {
                address: formData.pickup,
                latitude: formData.pickupCoordinates.lat,
                longitude: formData.pickupCoordinates.lng,
              },
              dropoff: {
                address: formData.dropoff,
                latitude: formData.dropoffCoordinates.lat,
                longitude: formData.dropoffCoordinates.lng,
              },
              packageDetails: {
                weight: Number.parseFloat(formData.weight) || 0,
              },
              carrierType: formData.carrier as any,
            };

            console.log("Fetching delivery estimate with data:", requestData);
            const response = await deliveryService.getEstimate(requestData);

            if (response.success && response.data) {
              console.log("Estimate received:", response.data);

              // Update form data with estimate
              setFormData((prev) => ({
                ...prev,
                estimatedTime: response.data.estimatedTime.text,
                estimatedPrice: response.data.estimatedPrice.total.toFixed(2),
              }));

              // Store full estimate data for later use
              setEstimateData(response.data);

              // Proceed to next step
              setCurrentStep(step);
            } else {
              console.error("Failed to get estimate:", response.message);
              alert("Could not calculate delivery estimate. Please try again.");
            }
          } catch (error) {
            console.error("Error fetching estimate:", error);
            alert(
              "An error occurred while calculating your delivery. Please try again."
            );
          } finally {
            setIsLoading(false);
          }
        };

        fetchEstimate();
      } else {
        // For other transitions, just change the step
        setTimeout(() => {
          setCurrentStep(step);
          setIsLoading(false);
        }, 300); // Reduced from 600ms for better responsiveness
      }
    },
    [currentStep, formData]
  );

  // Effect to sync form data coordinates with parent component
  useEffect(() => {
    // If coordinates change, notify parent
    if (formData.pickupCoordinates || formData.dropoffCoordinates) {
      handleLocationChange(formData.pickup, formData.dropoff);
    }
  }, [
    formData.pickupCoordinates,
    formData.dropoffCoordinates,
    handleLocationChange,
    formData.pickup,
    formData.dropoff,
  ]);

  const transitionConfig = {
    duration: 0.3, // Reduced from 0.4 for better responsiveness
    ease: [0.4, 0, 0.2, 1],
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Fixed Header Container */}
      <div className="sticky top-0 z-50 bg-white">
        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="h-full bg-blue-600"
          />
        </div>

        {/* Loading Bar */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="h-1.5 absolute top-0 left-0 z-10 bg-blue-400"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Content */}
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
                formData={formData}
                setFormData={setFormData}
                onNext={() => handleNavigate("confirm")}
                onLocationChange={handleLocationChange}
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
                formData={formData}
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
                formData={formData}
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
