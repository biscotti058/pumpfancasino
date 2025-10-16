"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import LandingPage from "@/components/landing-page"

// Dinamically import CasinoVirtuale to avoid SSR issues with Three.js
const CasinoVirtuale = dynamic(
  () => import("@/components/casino-virtuale"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }
)

export default function Home() {
  const [isEntered, setIsEntered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure this only runs on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleEnter = () => setIsEntered(true)
  const handleReturnHome = () => setIsEntered(false)

  // Don't render anything until mounted on client
  if (!isMounted) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isEntered) {
    return <LandingPage onEnter={handleEnter} />
  }

  return <CasinoVirtuale onReturnHome={handleReturnHome} />
}

