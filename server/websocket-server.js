const { Server } = require("socket.io");
const { createServer } = require("http");
const { v4: uuidv4 } = require("uuid");
const { Kafka } = require("kafkajs");

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
});

// Initialize Kafka client
const kafka = new Kafka({
  clientId: "notification-server",
  brokers: ["kafka-service:9092"],
});

// Create a consumer
const consumer = kafka.consumer({ groupId: "notification-group" });

// Map to store connected users
const connectedUsers = new Map();

// Simple logging function with color support
function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: "\x1b[36m%s\x1b[0m", // Cyan
    success: "\x1b[32m%s\x1b[0m", // Green
    warning: "\x1b[33m%s\x1b[0m", // Yellow
    error: "\x1b[31m%s\x1b[0m", // Red
    topic: "\x1b[35m%s\x1b[0m", // Purple for topics
  };

  if (type === "topic") {
    console.log(colors.topic, `[${timestamp}] TOPIC: ${message}`);
  } else {
    console.log(colors[type] || colors.info, `[${timestamp}] ${message}`);
  }
}

async function connectWithRetry(maxRetries = 5, initialDelay = 1000) {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      log(
        `Attempting to connect to Kafka (attempt ${retries + 1}/${maxRetries})`,
        "info"
      );
      await consumer.connect();
      log("Connected to Kafka", "success");
      return true;
    } catch (error) {
      retries++;
      log(`Failed to connect to Kafka: ${error.message}`, "error");

      if (retries >= maxRetries) {
        log(`Max retries (${maxRetries}) reached. Giving up.`, "error");
        throw error;
      }

      log(`Retrying in ${delay}ms...`, "warning");
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 30000); // Exponential backoff, capped at 30 seconds
    }
  }
}

async function startKafkaConsumer() {
  try {
    // Replace the direct connect with the retry function
    await connectWithRetry();

    // Subscribe to user notification topics - now using user-updates-UUID format
    await consumer.subscribe({
      topic: /^user-updates-.*/,
      fromBeginning: false,
    });
    log(
      "Subscribed to user notification topics pattern: user-updates-*",
      "success"
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          // Extract userId from topic (e.g., user-updates-UUID -> UUID)
          const userId = topic.replace("user-updates-", "");
          log(`${topic}`, "topic");
          log(`Received message on topic: ${topic}`);

          // Log the raw message for debugging
          const rawMessage = message.value.toString();
          log(`Raw message: ${rawMessage}`);

          // Parse notification data with error handling
          let notificationData;
          try {
            notificationData = JSON.parse(rawMessage);
            log(
              `Parsed notification data: ${JSON.stringify(notificationData)}`
            );
          } catch (parseError) {
            log(`Error parsing message: ${parseError.message}`, "error");
            return;
          }

          // Check if notificationData is null or undefined
          if (!notificationData) {
            log("Notification data is null or undefined", "error");
            return;
          }

          // Create notification object with the standardized format
          const notification = {
            id: uuidv4(),
            // Use eventType as title if available, otherwise use title or default
            eventType: notificationData.eventType || "",
            title:
              notificationData.title ||
              notificationData.eventType ||
              "New Notification",
            message: notificationData.message || "You have a new notification",
            type: notificationData.type || "info",
            timestamp: new Date(),
            read: false,
            // Pass through the entire data object for client-side processing
            data: notificationData,
          };

          // Send to all connected sockets for this user
          if (connectedUsers.has(userId)) {
            io.to(userId).emit("notification", notification);
            log(
              `Notification sent to user ${userId} from topic ${topic}`,
              "success"
            );
          } else {
            log(
              `User ${userId} not connected, notification from topic ${topic} not delivered`,
              "warning"
            );
          }
        } catch (error) {
          log(
            `Error processing message from topic ${topic}: ${error.message}`,
            "error"
          );
        }
      },
    });
  } catch (error) {
    log(`Kafka error: ${error.message}`, "error");
    log("Continuing without Kafka integration", "warning");

    // Optional: Set up a timer to retry the entire connection process
    setTimeout(() => {
      log("Attempting to reconnect to Kafka...", "info");
      startKafkaConsumer().catch((e) =>
        log(`Reconnection failed: ${e.message}`, "error")
      );
    }, 60000); // Try again after 1 minute
  }
}
// Function to start Kafka consumer
// async function startKafkaConsumer() {
//   try {
//     await consumer.connect();
//     log("Connected to Kafka", "success");

//     // Subscribe to user notification topics - now using user-updates-UUID format
//     await consumer.subscribe({
//       topic: /^user-updates-.*/,
//       fromBeginning: false,
//     });
//     log(
//       "Subscribed to user notification topics pattern: user-updates-*",
//       "success"
//     );

//     await consumer.run({
//       eachMessage: async ({ topic, partition, message }) => {
//         try {
//           // Extract userId from topic (e.g., user-updates-UUID -> UUID)
//           const userId = topic.replace("user-updates-", "");
//           log(`${topic}`, "topic");
//           log(`Received message on topic: ${topic}`);

//           // Log the raw message for debugging
//           const rawMessage = message.value.toString();
//           log(`Raw message: ${rawMessage}`);

//           // Parse notification data with error handling
//           let notificationData;
//           try {
//             notificationData = JSON.parse(rawMessage);
//             log(
//               `Parsed notification data: ${JSON.stringify(notificationData)}`
//             );
//           } catch (parseError) {
//             log(`Error parsing message: ${parseError.message}`, "error");
//             return;
//           }

//           // Check if notificationData is null or undefined
//           if (!notificationData) {
//             log("Notification data is null or undefined", "error");
//             return;
//           }

//           // Create notification object with the standardized format
//           const notification = {
//             id: uuidv4(),
//             // Use eventType as title if available, otherwise use title or default
//             eventType: notificationData.eventType || "",
//             title:
//               notificationData.title ||
//               notificationData.eventType ||
//               "New Notification",
//             message: notificationData.message || "You have a new notification",
//             type: notificationData.type || "info",
//             timestamp: new Date(),
//             read: false,
//             // Pass through the entire data object for client-side processing
//             data: notificationData,
//           };

//           // Send to all connected sockets for this user
//           if (connectedUsers.has(userId)) {
//             io.to(userId).emit("notification", notification);
//             log(
//               `Notification sent to user ${userId} from topic ${topic}`,
//               "success"
//             );
//           } else {
//             log(
//               `User ${userId} not connected, notification from topic ${topic} not delivered`,
//               "warning"
//             );
//           }
//         } catch (error) {
//           log(
//             `Error processing message from topic ${topic}: ${error.message}`,
//             "error"
//           );
//         }
//       },
//     });
//   } catch (error) {
//     log(`Kafka error: ${error.message}`, "error");
//     log("Continuing without Kafka integration", "warning");
//   }
// }

// Handle socket connections
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    log("Connection rejected - No user ID provided", "error");
    socket.disconnect();
    return;
  }

  log(`User connected: ${userId}`);
  log(`User ID type: ${typeof userId}, length: ${userId.length}`); // Debug line

  // Check if the userId looks like a UUID (36 characters with hyphens)
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );

  // Format the topic name - ensure we use the UUID format if available
  const topicName = `user-updates-${userId}`;
  log(`${topicName}`, "topic");
  log(`User ${userId} will receive notifications from topic: ${topicName}`);

  if (!isUuid) {
    log(
      `Warning: User ID doesn't appear to be a UUID. This may cause notification issues.`,
      "warning"
    );
  }

  // Add socket to the user's room
  socket.join(userId);

  // Store user connection
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socket.id);

  // Handle test notifications (direct Socket.IO method)
  socket.on("send-test-notification", (data) => {
    const { type = "info", eventType, title, message, data: eventData } = data;

    // Create notification object with standardized format
    const notification = {
      id: uuidv4(),
      eventType: eventType || "",
      title: title || eventType || `Test ${type} Notification`,
      message:
        message ||
        `This is a test ${type} notification sent at ${new Date().toLocaleString()}`,
      type,
      timestamp: new Date(),
      read: false,
      data: eventData || data, // Pass through the entire data object
    };

    // Send to all connected sockets for this user
    io.to(userId).emit("notification", notification);
    log(
      `Test notification sent to user ${userId} (direct socket, no Kafka)`,
      "success"
    );
    log(`Notification content: ${JSON.stringify(notification)}`, "info");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    log(`User disconnected: ${userId}`);

    // Remove socket from user connections
    if (connectedUsers.has(userId)) {
      connectedUsers.get(userId).delete(socket.id);
      if (connectedUsers.get(userId).size === 0) {
        connectedUsers.delete(userId);
      }
    }
  });
});

// Start the server and Kafka consumer
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  log(`WebSocket server running on port ${PORT}`, "success");

  // Start Kafka consumer with error handling
  startKafkaConsumer().catch((error) => {
    log(`Failed to start Kafka consumer: ${error.message}`, "error");
  });
});

// Handle process termination
process.on("SIGINT", async () => {
  log("Shutting down server...", "warning");

  try {
    await consumer.disconnect();
    log("Kafka consumer disconnected", "success");
  } catch (e) {
    log(`Error disconnecting Kafka: ${e.message}`, "error");
  }

  io.close(() => {
    log("Server closed", "success");
    process.exit(0);
  });
});

// For testing - log a sample notification
const sampleNotification = {
  eventType: "OrderStatusUpdated",
  orderId: "order_123",
  timestamp: Date.now(),
  data: {
    status: "IN_TRANSIT",
    estimatedArrival: "10 minutes",
    message: "Your order is now in transit",
  },
};
log(
  `Sample notification structure: ${JSON.stringify(sampleNotification)}`,
  "info"
);
