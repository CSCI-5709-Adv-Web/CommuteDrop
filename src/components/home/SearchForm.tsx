import { motion } from "framer-motion"
import { Send, Inbox, Car, Truck, Bike, Package, ArrowRight } from "lucide-react"
import { useState } from "react"

interface SearchFormProps {
  formData: any
  setFormData: (data: any) => void
  onNext: () => void
}

export default function SearchForm({ formData, setFormData, onNext }: SearchFormProps) {
  const [activeButton, setActiveButton] = useState<"send" | "receive">("send")
  const carriers = [
    { type: 'car', icon: <Car className="w-5 h-5" />, label: 'Car' },
    { type: 'truck', icon: <Truck className="w-5 h-5" />, label: 'Truck' },
    { type: 'bike', icon: <Bike className="w-5 h-5" />, label: 'Bike' },
    { type: 'walk', icon: <Package className="w-5 h-5" />, label: 'Walk' }
  ]

  return (
    <motion.div
      key="search"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <h2 className="text-[32px] font-bold text-gray-800 mb-4">Deliver a package</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Have a courier deliver something for you. Get packages delivered in the time it takes to drive there.
      </p>
      
      <div className="mb-6 flex p-2 bg-gray-100 rounded-lg">
        <button
          className={`flex-1 py-3 text-center rounded-md transition-colors flex items-center justify-center ${
            activeButton === "send" ? "bg-white shadow-sm text-primary" : "text-gray-600"
          }`}
          onClick={() => setActiveButton("send")}
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </button>
        <button
          className={`flex-1 py-3 text-center rounded-md transition-colors flex items-center justify-center ${
            activeButton === "receive" ? "bg-white shadow-sm text-primary" : "text-gray-600"
          }`}
          onClick={() => setActiveButton("receive")}
        >
          <Inbox className="w-4 h-4 mr-2" />
          Receive
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full" />
          <input
            className="w-full p-4 pl-8 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.pickup}
            onChange={(e) => setFormData({...formData, pickup: e.target.value})}
            placeholder="Pickup location"
          />
        </div>
        
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 border-2 border-black rounded-full" />
          <input
            className="w-full p-4 pl-8 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.dropoff}
            onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
            placeholder="Dropoff location"
          />
        </div>

        <div className="relative">
          <input
            type="number"
            className="w-full p-4 pr-12 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.weight}
            onChange={(e) => setFormData({...formData, weight: e.target.value})}
            placeholder="Item weight"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">kg</span>
        </div>

        <div className="space-y-2">
        <p className="text-sm text-gray-600 ml-1">Select carrier type:</p>
        <div className="grid grid-cols-2 gap-2">
            {carriers.map((carrier) => (
            <button
                key={carrier.type}
                onClick={() => setFormData({...formData, carrier: carrier.type})}
                className={`p-3 rounded-lg flex items-center justify-center space-x-2 transition-all
                border-2 ${
                    formData.carrier === carrier.type 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-gray-200 hover:border-primary/30 text-gray-800'
                }`}
            >
                {carrier.icon}
                <span className="text-sm">{carrier.label}</span>
            </button>
            ))}
        </div>
        </div>
      </div>
      
      <button
        className="w-full bg-black text-white py-4 rounded-lg mt-6 text-sm font-medium hover:bg-gray-900 transition-colors flex items-center justify-center"
        onClick={onNext}
      >
        Calculate Delivery
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </motion.div>
  )
}