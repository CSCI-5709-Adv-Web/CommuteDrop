import { useState } from "react";

interface SidebarProps {
  pickup: string;
  setPickup: (value: string) => void;
  dropoff: string;
  setDropoff: (value: string) => void;
}

export default function Sidebar({ pickup, setPickup, dropoff, setDropoff }: SidebarProps) {
    const [activeButton, setActiveButton] = useState<"send" | "receive">("send");
    return (
        <div className="p-8 w-full md:w-[400px] bg-white shadow-lg rounded-lg z-10">
        <h1 className="text-[32px] font-bold mb-4">Deliver a package</h1>
        <p className="text-gray-600 mb-6 text-[15px]">
            Have a courier deliver something for you. Get packages delivered in the time it takes to drive there.
        </p>
        <div className="mb-6 flex p-2 bg-gray-100 rounded-lg">
            <button
            className={`flex-1 py-3 text-center rounded-md transition-colors ${
                activeButton === "send" ? "bg-white shadow-sm" : ""
            }`}
            onClick={() => setActiveButton("send")}
            >
            Send
            </button>
            <button
            className={`flex-1 py-3 text-center rounded-md transition-colors ${
                activeButton === "receive" ? "bg-white shadow-sm" : ""
            }`}
            onClick={() => setActiveButton("receive")}
            >
            Receive
            </button>
        </div>
        <div className="space-y-4">
            <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full" />
            <input
                className="w-full p-4 pl-8 bg-gray-100 rounded-lg text-sm"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup location"
            />
            </div>
            <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 border-2 border-black rounded-full" />
            <input
                className="w-full p-4 pl-8 bg-gray-100 rounded-lg text-sm"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Dropoff location"
            />
            </div>
        </div>
        <button className="w-full bg-black text-white py-4 rounded-lg mt-6 text-sm font-medium">
            Search
        </button>
        </div>
    );
}