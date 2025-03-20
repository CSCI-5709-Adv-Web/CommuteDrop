import { MapPin, ChevronRight, CheckCircle } from "lucide-react";

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
}

export default function DeliveryHistorySection({
  deliveryHistory,
}: DeliveryHistoryProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Delivery History</h2>
      <div className="border-t border-gray-200 mb-6"></div>

      {deliveryHistory.length === 0 ? (
        <p className="text-gray-500">
          Your recent deliveries will appear here.
        </p>
      ) : (
        <div className="space-y-4">
          {deliveryHistory.map((delivery) => (
            <div
              key={delivery.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {delivery.id}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {delivery.status}
                  </span>
                </div>
                <span className="text-gray-500 text-sm">{delivery.date}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">From</div>
                  <div className="text-sm flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                    {delivery.from}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">To</div>
                  <div className="text-sm flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                    {delivery.to}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-600">
                  {delivery.carrier} • {delivery.price}
                </div>
                <button className="text-black text-sm font-medium hover:underline flex items-center">
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
