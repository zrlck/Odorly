"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface State {
  iaq: number
  targetIAQ: number
  temp: number
  hum: number
  gas: number
  acc: number
  pBO: number
  csv: any[]
  lastUpdate: number
  soundOn: boolean
  blockchain: boolean
}

// --- Geiger sound helpers --- //
function makeClick(ctx: AudioContext) {
  // short band-limited noise burst to mimic a Geiger click
  const dur = 0.012
  const sampleRate = ctx.sampleRate
  const buffer = ctx.createBuffer(1, Math.floor(dur * sampleRate), sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    // white noise with quick decay
    const t = i / sampleRate
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 1200)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  // Gentle band-pass so it feels like a Geiger tube
  const bp = ctx.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = 14000
  bp.Q.value = 2

  const gain = ctx.createGain()
  gain.gain.value = 0.72

  noise.connect(bp)
  bp.connect(gain)
  gain.connect(ctx.destination)
  noise.start()
}

export function BoMeter() {
  const [state, setState] = useState<State>({
    iaq: 25,
    targetIAQ: 25,
    temp: 24.5,
    hum: 45,
    gas: 80000,
    acc: 0,
    pBO: 0.05,
    csv: [],
    lastUpdate: Date.now(),
    soundOn: false,
    blockchain: false,
  })

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("TOXIC BO DETECTED 🔥")

  // timers (browser setInterval/setTimeout -> number)
  const intervalRef = useRef<number | null>(null)
  const geigerTimeoutRef = useRef<number | null>(null)

  // audio
  const audioCtxRef = useRef<AudioContext | null>(null)
  const tickCountRef = useRef(0) // counts per rolling window

  // Helper functions
  const randn = (mu = 0, sigma = 1) => {
    const u = 1 - Math.random()
    const v = Math.random()
    return mu + sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

  const nextSample = () => {
    setState((prevState) => {
      const drift = randn(0, 1.2)
      let newTargetIAQ = clamp(prevState.targetIAQ + drift, 5, 180)
      if (Math.random() < 0.06) newTargetIAQ = clamp(newTargetIAQ + 25 + Math.random() * 40, 10, 200)

      const newIAQ = prevState.iaq + (newTargetIAQ - prevState.iaq) * 0.18
      const newTemp = clamp(prevState.temp + randn(0, 0.05), 21, 29)
      const newHum = clamp(prevState.hum + randn(0, 0.4), 25, 70)
      const newGas = clamp(prevState.gas + randn(0, 5000), 20000, 200000)
      const newAcc = prevState.acc < 3 && Math.random() < 0.2 ? prevState.acc + 1 : prevState.acc

      const naturalBO = clamp((newIAQ - 20) / 160, 0, 1)
      const newPBO = clamp(prevState.pBO + (naturalBO - prevState.pBO) * 0.2, 0, 1)

      const ts = Date.now()
      const newEntry = {
        timestamp: new Date(ts).toISOString(),
        iaq: newIAQ.toFixed(2),
        temp: newTemp.toFixed(2),
        humidity: newHum.toFixed(2),
        gas_ohm: Math.round(newGas),
        acc: newAcc,
        p_bo: (newPBO * 100).toFixed(1),
      }

      const newCSV = [...prevState.csv, newEntry]
      if (newCSV.length > 1000) newCSV.shift()

      return {
        ...prevState,
        iaq: newIAQ,
        targetIAQ: newTargetIAQ,
        temp: newTemp,
        hum: newHum,
        gas: newGas,
        acc: newAcc,
        pBO: newPBO,
        csv: newCSV,
        lastUpdate: ts,
      }
    })
  }

  // --- Geiger scheduler (Poisson process) --- //
  const scheduleNextGeiger = (rateCPS: number) => {
    // avoid division by zero
    const r = Math.max(0.01, rateCPS)
    // exponential inter-arrival (seconds)
    const dtSec = -Math.log(1 - Math.random()) / r
    const dtMs = Math.max(8, Math.floor(dtSec * 1000))

    if (geigerTimeoutRef.current) window.clearTimeout(geigerTimeoutRef.current)
    geigerTimeoutRef.current = window.setTimeout(() => {
      // play click
      if (audioCtxRef.current) makeClick(audioCtxRef.current)
      // flash UI counter
      tickCountRef.current += 1
      // reschedule using current state (rate may change)
      const nextRate = computeGeigerRate()
      scheduleNextGeiger(nextRate)
    }, dtMs)
  }

  const computeGeigerRate = () => {
    // Base clicks per second + scaled by BO probability
    // Feel free to tweak these numbers for vibe
    const bo = state.pBO * 100 // 0..100
    const base = 0.8 // idle chatter
    const k = 0.06 // intensity coupling
    // add a bit of jitter so it feels organic even at steady BO
    const jitter = (Math.random() - 0.5) * 0.2
    return Math.max(0, base + k * bo + jitter)
  }

  // Start/stop geiger based on sound toggle
  useEffect(() => {
    if (state.soundOn) {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        scheduleNextGeiger(computeGeigerRate())
      } catch (e) {
        console.log("[v0] AudioContext not available")
      }
    } else {
      if (geigerTimeoutRef.current) window.clearTimeout(geigerTimeoutRef.current)
      geigerTimeoutRef.current = null
    }
    return () => {
      if (geigerTimeoutRef.current) window.clearTimeout(geigerTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.soundOn])

  // When BO changes, speed up/slow down the clicks smoothly
  useEffect(() => {
    if (!state.soundOn) return
    const next = computeGeigerRate()
    scheduleNextGeiger(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pBO])

  // Toast logic (visual only now; siren removed)
  useEffect(() => {
    const boPct = state.pBO * 100
    if (boPct >= 66) {
      setShowToast(true)
    } else {
      setShowToast(false)
    }
  }, [state.pBO])

  // Sampling loop
  useEffect(() => {
    const tick = () => nextSample()
    tick()
    intervalRef.current = window.setInterval(tick, 2000 + Math.random() * 600)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      if (geigerTimeoutRef.current) window.clearTimeout(geigerTimeoutRef.current)
    }
  }, [])

  // rolling CPS/CPM display
  const [counters, setCounters] = useState({ cps: 0, cpm: 0 })
  const lastCounterReset = useRef<number>(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      const deltaSec = (now - lastCounterReset.current) / 1000
      const cps = tickCountRef.current / Math.max(1, deltaSec)
      const cpm = cps * 60
      setCounters({ cps: Number(cps.toFixed(1)), cpm: Math.round(cpm) })
      // decay the bucket so it doesn’t explode
      tickCountRef.current = Math.max(0, tickCountRef.current - Math.round(cps))
      lastCounterReset.current = now
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const boPct = state.pBO * 100
  const deg = -90 + (boPct / 100) * 180
  const intensity = clamp((state.iaq / 200) * 100, 0, 100)

  let statusText = "🟢 Fresh",
    statusClass = "bg-green-500/20 text-green-400"
  if (boPct >= 33 && boPct < 66) {
    statusText = "🟡 Funky"
    statusClass = "bg-yellow-500/20 text-yellow-400"
  } else if (boPct >= 66) {
    statusText = "🔴 TOXIC BO DETECTED"
    statusClass = "bg-red-500/20 text-red-400"
  }

  let strength = "Low"
  if (state.iaq >= 50 && state.iaq < 100) strength = "Medium"
  else if (state.iaq >= 100) strength = "Strong"

  const downloadCSV = () => {
    const header = "timestamp,iaq,temp,humidity,gas_ohm,acc,p_bo"
    const rows = state.csv.map((o) => Object.values(o).join(","))
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bo-ometer-log.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const spritzTest = () => {
    setState((prev) => ({
      ...prev,
      targetIAQ: clamp(prev.iaq + 60 + Math.random() * 40, 0, 200),
      pBO: clamp(prev.pBO + 0.25, 0, 1),
    }))
    setToastMessage("SPRITZ TEST: Odor cloud deployed 💨")
    setShowToast(true)
    window.setTimeout(() => {
      setShowToast(false)
      setToastMessage("TOXIC BO DETECTED 🔥")
    }, 1500)
  }

  // tiny LED flash synced to geiger clicks (CSS animation re-trigger via key)
  const [ledKey, setLedKey] = useState(0)
  useEffect(() => {
    // poll every ~120ms: if there were recent ticks, flash
    const id = window.setInterval(() => {
      if (tickCountRef.current > 0) setLedKey((k) => k + 1)
    }, 120)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex gap-4 items-center p-4 border-b border-white/10 sticky top-0 backdrop-blur-sm bg-slate-900/80">
        <h1 className="text-xl font-semibold tracking-wide">🧪 BO‑o‑Meter</h1>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-bold ${statusClass} ${boPct >= 66 ? "animate-pulse" : ""}`}
        >
          {statusText}
        </span>
        <span className="px-3 py-1.5 rounded-full bg-slate-800 text-sm font-semibold" title="Mock Wi‑Fi">
          📶 -{40 + Math.round(Math.random() * 35)} dBm
        </span>
        <span className="px-3 py-1.5 rounded-full bg-slate-800 text-sm font-semibold" title="Last update">
          ⏱ {new Date(state.lastUpdate).toLocaleTimeString()}
        </span>

        <div className="ml-auto flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => document.documentElement.requestFullscreen?.()}>Presentation Mode</Button>
          <Button size="sm" onClick={spritzTest}>Spritz Test</Button>
          <Button size="sm" onClick={downloadCSV}>Download CSV</Button>
          <Button size="sm" onClick={() => setState((prev) => ({ ...prev, soundOn: !prev.soundOn }))}>
            Sound: {state.soundOn ? "Geiger" : "Off"}
          </Button>
          <Button size="sm" onClick={() => setState((prev) => ({ ...prev, blockchain: !prev.blockchain }))}>
            {state.blockchain ? "Disable" : "Enable"} Blockchain Mode
          </Button>
          <Button size="sm" onClick={() => setState((prev) => ({ ...prev, pBO: clamp(prev.pBO - 0.1, 0, 1) }))}>BO −</Button>
          <Button size="sm" onClick={() => setState((prev) => ({ ...prev, pBO: clamp(prev.pBO + 0.1, 0, 1) }))}>BO +</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BO-o-Meter Card */}
        <section className="bg-slate-800 border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="text-sm uppercase tracking-wider text-slate-400 mb-2">BO‑o‑Meter</div>

          {/* Gauge */}
          <svg className="w-full aspect-[2/1] block" viewBox="0 0 100 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ggrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#26c281" />
                <stop offset="50%" stopColor="#f5a623" />
                <stop offset="100%" stopColor="#ff4d4f" />
              </linearGradient>
            </defs>
            <path d="M 0 50 A 50 50 0 0 1 100 50 L 0 50 Z" fill="url(#ggrad)" opacity="0.85" />
            <rect
              x="49.1"
              y="6"
              width="1.8"
              height="44"
              rx="1"
              fill="#fff"
              style={{
                transformBox: "fill-box",
                transformOrigin: "50% 100%",
                transform: `rotate(${deg}deg)`,
                transition: "transform 0.12s linear",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.4))",
              }}
            />
            <circle cx="50" cy="50" r="2.8" fill="#fff" />
          </svg>

          <div className="flex items-baseline gap-2 mt-3">
            <div className="text-4xl font-extrabold">{boPct.toFixed(1)}%</div>
            <div>BO Probability</div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Temp</div>
              <div className="text-xl font-extrabold">{state.temp.toFixed(1)} °C</div>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Humidity</div>
              <div className="text-xl font-extrabold">{state.hum.toFixed(1)} %</div>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Gas Ω</div>
              <div className="text-xl font-extrabold">{state.gas.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">IAQ Acc</div>
              <div className="text-xl font-extrabold">{state.acc}/3</div>
            </div>
          </div>

          {/* Geiger indicators */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">CPS / CPM</div>
                <div className="text-xl font-extrabold">{counters.cps} cps · {counters.cpm} cpm</div>
              </div>
              <div key={ledKey} className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)] animate-ping"></div>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Geiger Rate</div>
              <div className="text-xl font-extrabold">{computeGeigerRate().toFixed(2)} cps</div>
            </div>
          </div>
        </section>

        {/* Smell Intensity Card */}
        <section className="bg-slate-800 border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="text-sm uppercase tracking-wider text-slate-400 mb-2">Smell Intensity</div>
          <div className="h-5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
              style={{ width: `${intensity.toFixed(0)}%` }}
            />
          </div>
          <div className="mt-2 text-lg font-bold">Strength: {strength}</div>
          <div className="text-slate-400 text-sm mt-1">Based on IAQ values. Low = fresh, Medium = noticeable, Strong = intense odor.</div>
        </section>

        {/* Logs Card */}
        <section className="bg-slate-800 border border-white/10 rounded-2xl p-4 shadow-2xl lg:col-span-2">
          <div className="text-sm uppercase tracking-wider text-slate-400 mb-2">Logs</div>
          <pre className="whitespace-pre-wrap max-h-48 overflow-auto bg-slate-900 rounded-xl p-3 border border-white/10 text-sm font-mono">
            {state.csv
              .slice(-10)
              .map(
                (entry) =>
                  `[${new Date(entry.timestamp).toLocaleTimeString()}] BO=${entry.p_bo}%  Strength=${strength}  IAQ=${entry.iaq}  Temp=${entry.temp}°C  RH=${entry.humidity}%  Gas=${entry.gas_ohm}Ω\n`,
              )
              .join("")}
          </pre>
        </section>
      </main>

      {/* Toast */}
      {showToast && (
        <div className="fixed right-4 bottom-4 bg-slate-900 border border-white/20 text-slate-100 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
