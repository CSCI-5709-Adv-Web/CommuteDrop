"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import NotificationToast from "./NotificationToast";
import io from "socket.io-client";

// Define the notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

// Define the context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  sendTestNotification: (
    type: "info" | "success" | "warning" | "error",
    title?: string,
    message?: string
  ) => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Create the provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Remove the incorrect import inside the component:
  // Replace:
  //   import type { Socket } from "socket.io-client";
  //   const [socket, setSocket] = useState<Socket | null>(null);
  // With:
  const [socket, setSocket] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Update the useEffect that connects to the WebSocket server to handle connection errors gracefully

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let socketInstance: any = null;
    let connectionAttempts = 0;
    const maxAttempts = 3;

    const connectSocket = () => {
      try {
        // Try to connect to the WebSocket server
        // IMPORTANT: Make sure we're using the user's ID, not email
        const userId = user.id || user.email; // Prefer ID, fall back to email if ID not available

        console.log("Connecting with user ID:", userId, "Type:", typeof userId);

        socketInstance = io(
          import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:3001",
          {
            query: {
              userId: userId, // Use the user's ID instead of email
            },
            reconnection: false, // Disable automatic reconnection
            timeout: 5000, // Set connection timeout to 5 seconds
          }
        );

        // Set up event listeners
        socketInstance.on("connect", () => {
          console.log("Connected to notification server");
        });

        socketInstance.on("disconnect", () => {
          console.log("Disconnected from notification server");
        });

        socketInstance.on("connect_error", (error: any) => {
          console.warn("Socket connection error:", error);
          connectionAttempts++;

          if (connectionAttempts < maxAttempts) {
            console.log(
              `Retrying connection (${connectionAttempts}/${maxAttempts})...`
            );
            setTimeout(connectSocket, 2000); // Retry after 2 seconds
          } else {
            console.error(
              "Failed to connect to notification server after multiple attempts"
            );
            // Continue without WebSocket functionality
            setSocket(null);
          }
        });

        socketInstance.on("notification", (notification: Notification) => {
          console.log("Received notification:", notification);

          // Add the notification to the state
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast for the new notification
          setCurrentNotification(notification);
          setShowToast(true);

          // Auto-hide toast after 5 seconds
          setTimeout(() => {
            setShowToast(false);
          }, 5000);
        });

        // Save the socket instance
        setSocket(socketInstance);
      } catch (error) {
        console.error("Error initializing socket connection:", error);
        setSocket(null);
      }
    };

    connectSocket();

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(
      (notification) => !notification.read
    ).length;
    setUnreadCount(count);
  }, [notifications]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Update the sendTestNotification function to work even when socket is not available
  const sendTestNotification = (
    type: "info" | "success" | "warning" | "error",
    title?: string,
    message?: string
  ) => {
    if (socket) {
      socket.emit("send-test-notification", { type, title, message });
    } else {
      // Create a local notification when socket is not available
      const notification = {
        id: Date.now().toString(),
        title: title || `Test ${type} Notification`,
        message:
          message ||
          `This is a test ${type} notification sent at ${new Date().toLocaleString()}`,
        type,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setCurrentNotification(notification);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 5000);

      console.log(
        "Created local notification (socket unavailable):",
        notification
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        sendTestNotification,
      }}
    >
      {children}

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <NotificationToast
              notification={currentNotification}
              onClose={() => setShowToast(false)}
              onMarkAsRead={() => {
                markAsRead(currentNotification.id);
                setShowToast(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

// Create a hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
