"use client";

import type React from "react";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNotifications } from "../components/notifications/NotificationProvider";
import { useOrder } from "./OrderContext";

// Define the driver location type
export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

// Define the order status update type
export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  timestamp: number;
  estimatedArrival?: string;
  message?: string;
}

// Define the tracking context type
interface TrackingContextType {
  isTracking: boolean;
  driverLocation: DriverLocation | null;
  orderStatus: OrderStatusUpdate | null;
  startTracking: (orderId: string) => void;
  stopTracking: () => void;
}

// Create the context
const TrackingContext = createContext<TrackingContextType | undefined>(
  undefined
);

// Create the provider component
export const TrackingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null
  );
  const [orderStatus, setOrderStatus] = useState<OrderStatusUpdate | null>(
    null
  );

  const { notifications } = useNotifications();
  const { orderId } = useOrder();

  // Start tracking a specific order
  const startTracking = (orderId: string) => {
    setTrackingOrderId(orderId);
    setIsTracking(true);
    console.log(`Started tracking order: ${orderId}`);
  };

  // Stop tracking
  const stopTracking = () => {
    setTrackingOrderId(null);
    setIsTracking(false);
    setDriverLocation(null);
    setOrderStatus(null);
    console.log("Stopped tracking order");
  };

  // Listen for notifications and update tracking state
  useEffect(() => {
    // Only process notifications if we're tracking an order
    if (!isTracking || !trackingOrderId) return;

    // Find the most recent notifications that match our tracking criteria
    const recentNotifications = [...notifications]
      .filter((notification) => {
        // Try to parse the notification message as JSON
        try {
          const data = JSON.parse(notification.message);
          return (
            // Check if this notification is for the order we're tracking
            data.orderId === trackingOrderId &&
            // Check if it's one of our tracking notification types
            (notification.title === "OrderStatusUpdated" ||
              notification.title === "DriverLiveLocation")
          );
        } catch (e) {
          // If we can't parse the message as JSON, it's not a tracking notification
          return false;
        }
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    // Process driver location updates
    const locationUpdate = recentNotifications.find(
      (n) => n.title === "DriverLiveLocation"
    );
    if (locationUpdate) {
      try {
        const locationData = JSON.parse(locationUpdate.message);
        setDriverLocation({
          lat: locationData.lat,
          lng: locationData.lng,
          heading: locationData.heading,
          speed: locationData.speed,
          timestamp: new Date(locationUpdate.timestamp).getTime(),
        });
      } catch (e) {
        console.error("Error parsing driver location data:", e);
      }
    }

    // Process order status updates
    const statusUpdate = recentNotifications.find(
      (n) => n.title === "OrderStatusUpdated"
    );
    if (statusUpdate) {
      try {
        const statusData = JSON.parse(statusUpdate.message);
        setOrderStatus({
          orderId: statusData.orderId,
          status: statusData.status,
          timestamp: new Date(statusUpdate.timestamp).getTime(),
          estimatedArrival: statusData.estimatedArrival,
          message: statusData.message,
        });
      } catch (e) {
        console.error("Error parsing order status data:", e);
      }
    }
  }, [notifications, isTracking, trackingOrderId]);

  // Auto-start tracking when an order is created
  useEffect(() => {
    if (orderId && !isTracking) {
      startTracking(orderId);
    }
  }, [orderId, isTracking]);

  return (
    <TrackingContext.Provider
      value={{
        isTracking,
        driverLocation,
        orderStatus,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

// Create a hook to use the tracking context
export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }
  return context;
};
