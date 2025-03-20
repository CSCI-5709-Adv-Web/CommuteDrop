import { MapPin } from "lucide-react";

interface SavedLocationCardProps {
  location: {
    id: number;
    name: string;
    address: string;
  };
}

export default function SavedLocationCard({
  location,
}: SavedLocationCardProps) {
  return (
    <div className="flex items-start">
      <MapPin className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
      <div>
        <p className="font-medium text-gray-900">{location.name}</p>
        <p className="text-sm text-gray-600">{location.address}</p>
      </div>
    </div>
  );
}
