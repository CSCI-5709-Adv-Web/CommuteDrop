import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/home/Sidebar";
import Map from "../components/home/Map";

export default function Home() {
  const [pickup, setPickup] = useState("Quinpool Tower");
  const [dropoff, setDropoff] = useState("Dalhousie Dentistry Faculty Practice");

  const positions = [
    { lat: 44.6454, lng: -63.5918 },
    { lat: 44.6366, lng: -63.585 },
  ];

  const center = { lat: 44.6414, lng: -63.5827 };

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 gap-6 p-6">
        <Sidebar pickup={pickup} setPickup={setPickup} dropoff={dropoff} setDropoff={setDropoff} />
        <Map positions={positions} center={center} />
      </div>
    </div>
  );
}