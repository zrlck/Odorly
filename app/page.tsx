"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MainMenu } from "@/components/main-menu"

export default function Home() {
  const [showMainMenu, setShowMainMenu] = useState(false)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  // Guardamos el id del intervalo pa cancelarlo si sales del menú
  useEffect(() => {
    let intervalId

    if (showMainMenu) {
      const fetchComment = async () => {
        try {
          setLoading(true)
          const bo = Math.floor(Math.random() * 101)
          const res = await fetch(`/api/odor?bo=${bo}`, { cache: "no-store" })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "API error")
          setComment(data.comment)
        } catch (e) {
          setComment(`Error: ${e.message}`)
        } finally {
          setLoading(false)
        }
      }

      // Llamada inmediata al entrar
      fetchComment()
      // Repite cada 5s
      intervalId = setInterval(fetchComment, 5000)
    }

    return () => clearInterval(intervalId)
  }, [showMainMenu])

  if (showMainMenu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <MainMenu />
        <div className="max-w-xl mt-6 p-4 bg-white/90 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">AI Verdict 🤖</h2>
          {loading ? <p>Loading...</p> : <p>{comment}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video autoPlay muted loop className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/fragrance-background-video.mp4" type="video/mp4" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-muted" />
      </video>

      {/* Dark overlay */}
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
