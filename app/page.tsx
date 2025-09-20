"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MainMenu } from "@/components/main-menu"

export default function Home() {
  const [showMainMenu, setShowMainMenu] = useState(false)

  if (showMainMenu) {
    return <MainMenu />
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video autoPlay muted loop className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/fragrance-background-video.mp4" type="video/mp4" />
        {/* Fallback gradient if video doesn't load */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-muted" />
      </video>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Centered content */}
      <div className="relative z-20 text-center space-y-8 animate-fade-in px-4">
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight drop-shadow-2xl">Odor.ly</h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
            {"Odor.ly – Detecting Funk Since 2025."}
          </p>
        </div>

        <div className="pt-8">
          <Button
            onClick={() => setShowMainMenu(true)}
            size="lg"
            className="px-12 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
          >
            Start Test
          </Button>
        </div>
      </div>
    </div>
  )
}
