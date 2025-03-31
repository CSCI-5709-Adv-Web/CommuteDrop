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
  driver?: any; // Add driver property
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

  // Helper function to extract order ID from message
  const extractOrderIdFromMessage = (message: string): string | null => {
    // Try to match the pattern #followed-by-alphanumeric-chars
    const orderIdMatch = message.match(/#([a-zA-Z0-9]+)/);
    if (orderIdMatch && orderIdMatch[1]) {
      return orderIdMatch[1];
    }
    return null;
  };

  // Helper function to check if two order IDs match or are substrings of each other
  const orderIdsMatch = (id1: string, id2: string): boolean => {
    return id1 === id2 || id1.includes(id2) || id2.includes(id1);
  };

  // Update the notification filtering logic in the TrackingContext to handle both eventType and title fields
  // Update the useEffect that listens for notifications
  useEffect(() => {
    // Only process notifications if we're tracking an order
    if (!isTracking || !trackingOrderId) return;

    console.log("Checking notifications for order:", trackingOrderId);
    console.log("Available notifications:", notifications);

    // Find the most recent notifications that match our tracking criteria
    const recentNotifications = [...notifications]
      .filter((notification) => {
        // Check both eventType and title fields
        const eventType = notification.eventType || notification.title;

        // First check if we have data with orderId
        if (notification.data && notification.data.orderId) {
          const notificationOrderId = notification.data.orderId;
          const isMatchingOrder = orderIdsMatch(
            notificationOrderId,
            trackingOrderId
          );

          console.log(
            "Checking notification data.orderId:",
            notificationOrderId,
            "against tracking:",
            trackingOrderId,
            "Match:",
            isMatchingOrder
          );

          return (
            isMatchingOrder &&
            [
              "OrderStatusUpdated",
              "Order Accepted",
              "DriverLiveLocation",
            ].includes(eventType)
          );
        }

        // If no data.orderId, check the message for the order ID
        if (typeof notification.message === "string") {
          const extractedOrderId = extractOrderIdFromMessage(
            notification.message
          );
          console.log("Extracted orderId from message:", extractedOrderId);

          if (extractedOrderId) {
            const isMatchingOrder = orderIdsMatch(
              extractedOrderId,
              trackingOrderId
            );
            console.log(
              "Checking message orderId:",
              extractedOrderId,
              "against tracking:",
              trackingOrderId,
              "Match:",
              isMatchingOrder
            );
            return (
              isMatchingOrder &&
              [
                "OrderStatusUpdated",
                "Order Accepted",
                "DriverLiveLocation",
              ].includes(eventType)
            );
          }

          // If no specific order ID found, check if the message contains our tracking ID
          const containsOrderId =
            notification.message.includes(trackingOrderId);
          console.log("Checking if message contains orderId:", containsOrderId);
          return (
            containsOrderId &&
            [
              "OrderStatusUpdated",
              "Order Accepted",
              "DriverLiveLocation",
            ].includes(eventType)
          );
        }

        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    console.log("Filtered notifications:", recentNotifications);

    // Process driver location updates
    const locationUpdate = recentNotifications.find(
      (n) =>
        n.eventType === "DriverLiveLocation" || n.title === "DriverLiveLocation"
    );

    if (locationUpdate) {
      console.log("Found location update:", locationUpdate);

      try {
        // Check if we have location data in the data object
        if (locationUpdate.data && locationUpdate.data.currentLocation) {
          const locationData = locationUpdate.data.currentLocation;

          setDriverLocation({
            lat: locationData.lat,
            lng: locationData.lng,
            heading: locationData.heading,
            speed: locationData.speed,
            timestamp: new Date(locationUpdate.timestamp).getTime(),
          });
          console.log("Updated driver location from data.currentLocation");
        }
        // If not in data.currentLocation, check if lat/lng are directly in data
        else if (
          locationUpdate.data &&
          locationUpdate.data.lat &&
          locationUpdate.data.lng
        ) {
          setDriverLocation({
            lat: locationUpdate.data.lat,
            lng: locationUpdate.data.lng,
            heading: locationUpdate.data.heading,
            speed: locationUpdate.data.speed,
            timestamp: new Date(locationUpdate.timestamp).getTime(),
          });
          console.log("Updated driver location from data");
        }
        // Last resort: try to parse the message
        else if (typeof locationUpdate.message === "string") {
          try {
            const locationData = JSON.parse(locationUpdate.message);
            if (locationData.lat && locationData.lng) {
              setDriverLocation({
                lat: locationData.lat,
                lng: locationData.lng,
                heading: locationData.heading,
                speed: locationData.speed,
                timestamp: new Date(locationUpdate.timestamp).getTime(),
              });
              console.log("Updated driver location from parsed message");
            }
          } catch (e) {
            console.error("Error parsing location data from message:", e);
          }
        }
      } catch (e) {
        console.error("Error processing driver location data:", e);
      }
    }

    // Process order status updates
    const statusUpdate = recentNotifications.find(
      (n) =>
        n.eventType === "OrderStatusUpdated" ||
        n.eventType === "Order Accepted" ||
        n.title === "OrderStatusUpdated" ||
        n.title === "Order Accepted"
    );

    if (statusUpdate) {
      console.log("Found status update:", statusUpdate);

      try {
        // First check if we have all the data we need in the data object
        if (statusUpdate.data && statusUpdate.data.orderId) {
          console.log("Using data from notification.data:", statusUpdate.data);

          // Map status if needed (e.g., "AWAITING_PICKUP" to "accepted")
          let status = statusUpdate.data.status;
          if (status === "AWAITING_PICKUP") status = "accepted";
          else if (status === "IN_PROGRESS") status = "in_progress";
          else if (status === "DELIVERED") status = "delivered";
          else if (status === "CANCELLED") status = "cancelled";

          setOrderStatus({
            orderId: statusUpdate.data.orderId,
            status: status.toLowerCase(),
            timestamp: new Date(statusUpdate.timestamp).getTime(),
            estimatedArrival: statusUpdate.data.estimatedArrival,
            message: statusUpdate.data.message || statusUpdate.message,
            driver: statusUpdate.data.driver,
          });
        }
        // If no structured data, try to extract from the message
        else {
          console.log("Extracting data from message text");

          // Extract order ID from the message
          const extractedOrderId =
            extractOrderIdFromMessage(statusUpdate.message) || trackingOrderId;

          // Determine status from message content
          let status = "unknown";
          if (statusUpdate.message.includes("accepted")) {
            status = "accepted";
          } else if (statusUpdate.message.includes("picked up")) {
            status = "in_progress";
          } else if (statusUpdate.message.includes("delivered")) {
            status = "delivered";
          } else if (statusUpdate.message.includes("cancelled")) {
            status = "cancelled";
          }

          // Extract driver name if present
          const driverMatch = statusUpdate.message.match(
            /Driver\s+([^\s]+\s+[^\s]+)/
          );
          const driverName = driverMatch ? driverMatch[1] : null;

          setOrderStatus({
            orderId: extractedOrderId,
            status: status,
            timestamp: new Date(statusUpdate.timestamp).getTime(),
            message: statusUpdate.message,
            driver: driverName ? { name: driverName } : undefined,
          });

          console.log("Created order status from message:", {
            orderId: extractedOrderId,
            status: status,
            driver: driverName,
          });
        }
      } catch (e) {
        console.error("Error processing order status data:", e);
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
