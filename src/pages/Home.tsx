"use client"

import { useState } from "react"
import Navbar from "../components/Navbar"
import DeliveryFlow from "../components/home/DeliveryFlow"
import Map from "../components/home/Map"

export default function Home() {
  const [pickup, setPickup] = useState("Quinpool Tower")
  const [dropoff, setDropoff] = useState("Dalhousie Dentistry Faculty Practice")

  const positions = [
    { lat: 44.6454, lng: -63.5918 },
    { lat: 44.6366, lng: -63.585 },
  ]

  const center = { lat: 44.6414, lng: -63.5827 }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden" style={{maxHeight:"100vh"}}>
      <Navbar />
      <div className="flex flex-1 p-6 gap-6 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-full md:w-[400px] overflow-hidden">
          <DeliveryFlow />
        </div>
        <div className="hidden md:block flex-1 rounded-lg overflow-hidden">
          <Map positions={positions} center={center} />
        </div>
      </div>
    </div>
  )
}