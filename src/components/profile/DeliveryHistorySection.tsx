"use client";
import { motion } from "framer-motion";
import DeliveryHistoryItem from "./DeliveryHistoryItem";
import DeliveryHistorySkeleton from "./DeliveryHistorySkeleton";

interface DeliveryHistoryProps {
  deliveryHistory: Array<{
    id: string;
    date: string;
    from: string;
    to: string;
    status: string;
    price: string;
    carrier: string;
  }>;
  isLoading?: boolean;
}

export default function DeliveryHistorySection({
  deliveryHistory,
  isLoading = false,
}: DeliveryHistoryProps) {
  // Create sample skeleton items for loading state
  const skeletonItems = Array(3).fill(0);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Delivery History</h2>
      <div className="border-t border-gray-200 mb-6"></div>

      {isLoading ? (
        <div className="space-y-4">
          {skeletonItems.map((_, index) => (
            <DeliveryHistorySkeleton key={index} />
          ))}
        </div>
      ) : deliveryHistory.length === 0 ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-gray-500 mb-4">
            Your recent deliveries will appear here.
          </p>
          <p className="text-sm text-gray-400">No delivery history found</p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {deliveryHistory.map((delivery, index) => (
            <DeliveryHistoryItem
              key={delivery.id}
              delivery={delivery}
              index={index}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
