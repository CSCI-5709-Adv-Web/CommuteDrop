"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
    pickup: "Quinpool Tower",
    dropoff: "Dalhousie Dentistry Faculty Practice",
    weight: "",
    carrier: "car",
    estimatedTime: "30-45 mins",
    estimatedPrice: "15.99",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

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
      // Only update parent component if callback exists and values have changed
      if (
        onLocationUpdate &&
        (pickup !== formData.pickup || dropoff !== formData.dropoff)
      ) {
        onLocationUpdate(pickup, dropoff);
      }
    },
    [onLocationUpdate, formData.pickup, formData.dropoff]
  );

  const handleNavigate = useCallback(
    (step: FlowStep) => {
      setIsLoading(true);

      // Special case for confirm -> payment transition
      // Fetch delivery estimate from API
      if (currentStep === "search" && step === "confirm") {
        const fetchEstimate = async () => {
          try {
            // Prepare request data
            const requestData = {
              pickup: {
                address: formData.pickup,
                latitude: formData.pickupCoordinates?.lat,
                longitude: formData.pickupCoordinates?.lng,
              },
              dropoff: {
                address: formData.dropoff,
                latitude: formData.dropoffCoordinates?.lat,
                longitude: formData.dropoffCoordinates?.lng,
              },
              packageDetails: {
                weight: Number.parseFloat(formData.weight) || 0,
              },
              carrierType: formData.carrier as any,
            };

            const response = await deliveryService.getEstimate(requestData);

            if (response.success && response.data) {
              // Update form data with estimate
              setFormData((prev) => ({
                ...prev,
                estimatedTime: response.data.estimatedTime.text,
                estimatedPrice: response.data.estimatedPrice.total.toFixed(2),
              }));

              // Store full estimate data for later use
              setEstimateData(response.data);
            }
          } catch (error) {
            console.error("Error fetching estimate:", error);
            // Continue anyway with default values
          } finally {
            setCurrentStep(step);
            setIsLoading(false);
          }
        };

        fetchEstimate();
      } else {
        setTimeout(() => {
          setCurrentStep(step);
          setIsLoading(false);
        }, 600);
      }
    },
    [currentStep, formData]
  );

  const transitionConfig = {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1],
  };

  // Initialize map positions on component mount - only once
  useEffect(() => {
    if (onLocationUpdate && formData.pickup && formData.dropoff) {
      onLocationUpdate(formData.pickup, formData.dropoff);
    }
    // Only run this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              className="h-1.5 absolute top-0 left-0 z-10"
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
