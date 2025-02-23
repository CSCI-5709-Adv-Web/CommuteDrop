"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import SearchForm from "./SearchForm"
import PaymentForm from "./PaymentForm"
import DeliveryEstimate from "./DeliveryEstimate"
import ConfirmDelivery from "./ConfirmDelivery"

type FlowStep = "search" | "confirm" | "payment" | "estimate"

export default function DeliveryFlow() {
  const [currentStep, setCurrentStep] = useState<FlowStep>("search")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    pickup: "Quinpool Tower",
    dropoff: "Dalhousie Dentistry Faculty Practice",
    weight: "",
    carrier: "car",
    estimatedTime: "30-45 mins",
    estimatedPrice: "15.99",
    cardNumber: "",
    expiry: "",
    cvc: "",
  })

  const steps: FlowStep[] = ["search", "confirm", "payment", "estimate"]
  const progress = (steps.indexOf(currentStep) + 1) * 25

  const handleNavigate = (step: FlowStep) => {
    setIsLoading(true)
    setTimeout(() => {
      setCurrentStep(step)
      setIsLoading(false)
    }, 600)
  }

  const transitionConfig = {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1],
  }

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
                <SearchForm formData={formData} setFormData={setFormData} onNext={() => handleNavigate("confirm")} />
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
                <DeliveryEstimate formData={formData} onBack={() => handleNavigate("payment")} />
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  )
}

