"use client";

import { useState, useEffect } from "react";
import { Plus, Loader, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PaymentMethodCard from "./PaymentMethodCard";
import AddPaymentMethodForm from "./AddPaymentMethodForm";
import { cardService, type Card } from "../../services/card-service";

// Remove the userData parameter since it's not being used
export default function PaymentMethodsSection() {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await cardService.getUserCards();
        if (response.success) {
          setPaymentMethods(response.data);
        } else {
          setError(response.message || "Failed to load payment methods");
        }
      } catch (err) {
        setError("An unexpected error occurred while loading payment methods");
        console.error("Error fetching cards:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  const handleSetDefaultCard = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await cardService.setDefaultCard(id);
      if (response.success) {
        // Update local state to reflect the change
        const updatedPaymentMethods = paymentMethods.map((method) => ({
          ...method,
          isDefault: method.id === id,
        }));
        setPaymentMethods(updatedPaymentMethods);
      } else {
        setError(response.message || "Failed to set default payment method");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error setting default card:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Let's completely rewrite the handleDeleteCard function to fix all type issues
  const handleDeleteCard = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await cardService.deleteCard(id);

      // Check if the response indicates success
      if (response.success) {
        // Remove the deleted card from state
        let updatedPaymentMethods = paymentMethods.filter(
          (method) => method.id !== id
        );

        // If we deleted the default card and there are other cards, make the first one default
        const deletedCardWasDefault = paymentMethods.find(
          (method) => method.id === id
        )?.isDefault;

        if (deletedCardWasDefault && updatedPaymentMethods.length > 0) {
          try {
            const firstCardId = updatedPaymentMethods[0].id;
            const defaultResponse = await cardService.setDefaultCard(
              firstCardId
            );

            if (defaultResponse.success) {
              updatedPaymentMethods = updatedPaymentMethods.map(
                (method, index) => ({
                  ...method,
                  isDefault: index === 0,
                })
              );
            }
          } catch (err) {
            console.error("Error setting new default card:", err);
            // Continue with deletion even if setting default fails
          }
        }

        setPaymentMethods(updatedPaymentMethods);

        // Show success message with AnimatePresence
        setSuccessMessage("Card deleted successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Only set error if the API explicitly returns an error
        setError(response.message || "Failed to delete payment method");
      }
    } catch (err) {
      console.error("Error deleting card:", err);
      setError("An unexpected error occurred while deleting the card");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (cardData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Format card data for API
      const cardRequest = {
        cardNumber: cardData.cardNumber.replace(/\s/g, ""),
        cardholderName: cardData.cardholderName,
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv,
        isDefault: cardData.isDefault,
      };

      const response = await cardService.addCard(cardRequest);
      if (response.success) {
        // If this is set as default, update other cards
        if (cardData.isDefault) {
          const updatedPaymentMethods = paymentMethods.map((method) => ({
            ...method,
            isDefault: false,
          }));
          setPaymentMethods([...updatedPaymentMethods, response.data]);
        } else {
          setPaymentMethods([...paymentMethods, response.data]);
        }
        setIsAddingCard(false);
      } else {
        setError(response.message || "Failed to add payment method");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error adding card:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      },
    },
  };

  const errorVariants = {
    hidden: { opacity: 0, height: 0, marginBottom: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      height: "auto",
      marginBottom: 16,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      },
    },
  };

  return (
    <div>
      <motion.div
        className="flex justify-between items-center mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold">Payment Methods</h2>
        <motion.button
          onClick={() => setIsAddingCard(!isAddingCard)}
          className="flex items-center text-black font-medium"
          disabled={isLoading}
          whileHover={{ scale: 1.05, x: isAddingCard ? 0 : 3 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {isAddingCard ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} className="mr-1" />
              Add Card
            </>
          )}
        </motion.button>
      </motion.div>
      <div className="border-t border-gray-200 mb-6"></div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start"
            variants={errorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start"
            variants={errorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-700 font-medium">Success</p>
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          className="flex justify-center items-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loader className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
      )}

      <AnimatePresence>
        {isAddingCard && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8,
            }}
          >
            <AddPaymentMethodForm
              onAddCard={handleAddCard}
              onCancel={() => setIsAddingCard(false)}
              isSubmitting={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {!isLoading && paymentMethods.length === 0 ? (
            <motion.p className="text-gray-500" variants={itemVariants}>
              Your payment methods will appear here.
            </motion.p>
          ) : (
            paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                variants={itemVariants}
                exit="exit"
                layout
              >
                <PaymentMethodCard
                  method={method}
                  onSetDefault={handleSetDefaultCard}
                  onDelete={handleDeleteCard}
                  isProcessing={isLoading}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
