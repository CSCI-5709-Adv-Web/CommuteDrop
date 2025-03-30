const { Server } = require("socket.io")
const { createServer } = require("http")
const { v4: uuidv4 } = require("uuid")
const { Kafka } = require("kafkajs")

// Create HTTP server
const httpServer = createServer()

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
})

// Initialize Kafka client
const kafka = new Kafka({
  clientId: "notification-server",
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : ["localhost:9092"],
})

// Create a consumer
const consumer = kafka.consumer({ groupId: "notification-group" })

// Map to store connected users
const connectedUsers = new Map()

// Simple logging function with color support
function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString()
  const colors = {
    info: "\x1b[36m%s\x1b[0m", // Cyan
    success: "\x1b[32m%s\x1b[0m", // Green
    warning: "\x1b[33m%s\x1b[0m", // Yellow
    error: "\x1b[31m%s\x1b[0m", // Red
    topic: "\x1b[35m%s\x1b[0m", // Purple for topics
  }

  if (type === "topic") {
    console.log(colors.topic, `[${timestamp}] TOPIC: ${message}`)
  } else {
    console.log(colors[type] || colors.info, `[${timestamp}] ${message}`)
  }
}

// Function to start Kafka consumer
async function startKafkaConsumer() {
  try {
    await consumer.connect()
    log("Connected to Kafka", "success")

    // Subscribe to user notification topics - now using user-updates-UUID format
    await consumer.subscribe({ topic: /^user-updates-.*/, fromBeginning: false })
    log("Subscribed to user notification topics pattern: user-updates-*", "success")

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          // Extract userId from topic (e.g., user-updates-UUID -> UUID)
          const userId = topic.replace("user-updates-", "")
          log(`${topic}`, "topic")
          log(`Received message on topic: ${topic}`)

          // Parse notification data
          const notificationData = JSON.parse(message.value.toString())

          // Create notification object
          const notification = {
            id: uuidv4(),
            title: notificationData.title || "New Notification",
            message: notificationData.message || "You have a new notification",
            type: notificationData.type || "info",
            timestamp: new Date(),
            read: false,
          }

          // Send to all connected sockets for this user
          if (connectedUsers.has(userId)) {
            io.to(userId).emit("notification", notification)
            log(`Notification sent to user ${userId} from topic ${topic}`, "success")
          } else {
            log(`User ${userId} not connected, notification from topic ${topic} not delivered`, "warning")
          }
        } catch (error) {
          log(`Error processing message from topic ${topic}: ${error.message}`, "error")
        }
      },
    })
  } catch (error) {
    log(`Kafka error: ${error.message}`, "error")
    log("Continuing without Kafka integration", "warning")
  }
}

// Handle socket connections
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId

  if (!userId) {
    log("Connection rejected - No user ID provided", "error")
    socket.disconnect()
    return
  }

  log(`User connected: ${userId}`)
  log(`User ID type: ${typeof userId}, length: ${userId.length}`) // Debug line

  // Check if the userId looks like a UUID (36 characters with hyphens)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

  // Format the topic name - ensure we use the UUID format if available
  const topicName = `user-updates-${userId}`
  log(`${topicName}`, "topic")
  log(`User ${userId} will receive notifications from topic: ${topicName}`)

  if (!isUuid) {
    log(`Warning: User ID doesn't appear to be a UUID. This may cause notification issues.`, "warning")
  }

  // Add socket to the user's room
  socket.join(userId)

  // Store user connection
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set())
  }
  connectedUsers.get(userId).add(socket.id)

  // Handle test notifications (direct Socket.IO method)
  socket.on("send-test-notification", (data) => {
    const { type = "info", title, message } = data

    // Create notification object
    const notification = {
      id: uuidv4(),
      title: title || `Test ${type} Notification`,
      message: message || `This is a test ${type} notification sent at ${new Date().toLocaleString()}`,
      type,
      timestamp: new Date(),
      read: false,
    }

    // Send to all connected sockets for this user
    io.to(userId).emit("notification", notification)
    log(`Test notification sent to user ${userId} (direct socket, no Kafka)`, "success")
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    log(`User disconnected: ${userId}`)

    // Remove socket from user connections
    if (connectedUsers.has(userId)) {
      connectedUsers.get(userId).delete(socket.id)
      if (connectedUsers.get(userId).size === 0) {
        connectedUsers.delete(userId)
      }
    }
  })
})

// Start the server and Kafka consumer
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  log(`WebSocket server running on port ${PORT}`, "success")

  // Start Kafka consumer with error handling
  startKafkaConsumer().catch((error) => {
    log(`Failed to start Kafka consumer: ${error.message}`, "error")
  })
})

// Handle process termination
process.on("SIGINT", async () => {
  log("Shutting down server...", "warning")

  try {
    await consumer.disconnect()
    log("Kafka consumer disconnected", "success")
  } catch (e) {
    log(`Error disconnecting Kafka: ${e.message}`, "error")
  }

  io.close(() => {
    log("Server closed", "success")
    process.exit(0)
  })
})

