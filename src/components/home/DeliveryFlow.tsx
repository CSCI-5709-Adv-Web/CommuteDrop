"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchForm from "./SearchForm";
import PaymentForm from "./PaymentForm";
import DeliveryEstimate from "./DeliveryEstimate";
import ConfirmDelivery from "./ConfirmDelivery";
import { deliveryService } from "../../services/delivery-service";
import { mapService } from "../../services/map-service";

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
  const [formData, setFormData] = useState<DeliveryFormData>({
    pickup: "",
    dropoff: "",
    pickupCoordinates: undefined,
    dropoffCoordinates: undefined,
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

  // Improve the coordination between location updates and map rendering
  // Update the handleLocationChange function to be more responsive
  const handleLocationChange = useCallback(
    (pickup: string, dropoff: string) => {
      if (pickup !== formData.pickup) {
        setFormData((prev) => ({ ...prev, pickup }));
      }

      if (dropoff !== formData.dropoff) {
        setFormData((prev) => ({ ...prev, dropoff }));
      }

      if (
        (pickup && pickup.trim().length > 0) ||
        (dropoff && dropoff.trim().length > 0)
      ) {
        setHasEnteredLocations(true);
      }

      if (pickup !== lastNotifiedPickup || dropoff !== lastNotifiedDropoff) {
        if (onLocationUpdate) {
          onLocationUpdate(pickup, dropoff);
          setLastNotifiedPickup(pickup);
          setLastNotifiedDropoff(dropoff);
        }
      }

      // Trigger route calculation when coordinates are available
      if (formData.pickupCoordinates || formData.dropoffCoordinates) {
        if (onCalculateRoute) {
          // Use a short timeout to allow state updates to complete
          setTimeout(() => {
            onCalculateRoute();
          }, 100);
        }
      }
    },
    [
      formData.pickup,
      formData.dropoff,
      formData.pickupCoordinates,
      formData.dropoffCoordinates,
      onLocationUpdate,
      onCalculateRoute,
      lastNotifiedPickup,
      lastNotifiedDropoff,
    ]
  );

  const updateMapWithCoordinates = useCallback(() => {
    if (
      onCalculateRoute &&
      (formData.pickupCoordinates || formData.dropoffCoordinates)
    ) {
      onCalculateRoute();
      setHasEnteredLocations(true);
    }
  }, [
    formData.pickupCoordinates,
    formData.dropoffCoordinates,
    onCalculateRoute,
  ]);

  useEffect(() => {
    if (formData.pickupCoordinates || formData.dropoffCoordinates) {
      updateMapWithCoordinates();
    }
  }, [
    formData.pickupCoordinates,
    formData.dropoffCoordinates,
    updateMapWithCoordinates,
  ]);

  const handleNavigate = useCallback(
    async (step: FlowStep) => {
      if (currentStep === "search" && step === "confirm") {
        if (onCalculateRoute) {
          onCalculateRoute();
        }

        try {
          let pickupCoords = formData.pickupCoordinates;
          let dropoffCoords = formData.dropoffCoordinates;

          if (!pickupCoords && formData.pickup) {
            try {
              const pickupResult = await mapService.geocodeAddress(
                formData.pickup
              );
              if (pickupResult.latitude !== 0 && pickupResult.longitude !== 0) {
                pickupCoords = {
                  lat: pickupResult.latitude,
                  lng: pickupResult.longitude,
                };
              }
            } catch (error) {
              console.error("Error geocoding pickup address:", error);
            }
          }

          if (!dropoffCoords && formData.dropoff) {
            try {
              const dropoffResult = await mapService.geocodeAddress(
                formData.dropoff
              );
              if (
                dropoffResult.latitude !== 0 &&
                dropoffResult.longitude !== 0
              ) {
                dropoffCoords = {
                  lat: dropoffResult.latitude,
                  lng: dropoffResult.longitude,
                };
              }
            } catch (error) {
              console.error("Error geocoding dropoff address:", error);
            }
          }

          const requestData = {
            pickup: {
              address: formData.pickup,
              latitude: pickupCoords?.lat || 44.6488,
              longitude: pickupCoords?.lng || -63.5752,
            },
            dropoff: {
              address: formData.dropoff,
              latitude: dropoffCoords?.lat || 32.532,
              longitude: dropoffCoords?.lng || 75.971,
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

          setCurrentStep(step);
        } catch (error) {
          console.error("Error in navigation process:", error);
        }
      } else {
        setCurrentStep(step);
      }
    },
    [currentStep, formData, onCalculateRoute]
  );

  useEffect(() => {
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
