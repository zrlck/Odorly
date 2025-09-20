"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BoMeter } from "./bo-meter"

export function MainMenu() {
  const [activeSection, setActiveSection] = useState("home")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Odor.ly</h1>
            <nav className="flex space-x-6">
              <Button
                variant={activeSection === "home" ? "default" : "ghost"}
                onClick={() => setActiveSection("home")}
                className="font-medium"
              >
                Home
              </Button>
              <Button
                variant={activeSection === "about" ? "default" : "ghost"}
                onClick={() => setActiveSection("about")}
                className="font-medium"
              >
                About
              </Button>
              <Button
                variant={activeSection === "contact" ? "default" : "ghost"}
                onClick={() => setActiveSection("contact")}
                className="font-medium"
              >
                Contact
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {activeSection === "home" && <BoMeter />}

        {activeSection === "about" && (
          <div className="space-y-12">
            <section className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-foreground text-balance">About Odor.ly</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {"Revolutionizing the way people realize they stink — using janky sensors, questionable code, and zero expertise."}
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-primary">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {
                    "At Odor.ly, our mission is to detect the world’s most powerful smells — from suspicious leftovers to questionable roommates — and bring science to the funk. We believe every stench tells a story, and we’re here to translate it… one beep at a time."
                  }
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {
                    "We combine half-baked smell detection code with our unmatched ability to roast stinky people, giving you recommendations that perfectly match your unique funk and questionable lifestyle."
                  }
                </p>
              </div>
              <div>
                <img
                  src="/modern-perfume-laboratory-with-scientists-working.jpg"
                  alt="Our mission"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <img
                  src="/diverse-team-of-fragrance-experts-and-technologist.jpeg"
                  alt="Our values"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
              <div className="space-y-6 order-1 md:order-2">
                <h3 className="text-2xl font-semibold text-primary">Our Values</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground">Innovation</h4>
                    <p className="text-sm text-muted-foreground">
                      {"Continuously pushing the boundaries of how bad someone can smell, with technology that barely works and analysis done by our traumatized noses."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Personalization</h4>
                    <p className="text-sm text-muted-foreground">
                      {"Every recommendation is tailored to your unique scent profile — whether that’s gym socks, instant ramen breath, or straight-up ‘computer science major’ vibes."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Quality</h4>
                    <p className="text-sm text-muted-foreground">
                      {"Partnering only with premium dumpsters and certified experts in identifying mystery smells."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Accessibility</h4>
                    <p className="text-sm text-muted-foreground">
                      {"Making the discovery of who stinks like shit available to everyone, everywhere."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "contact" && (
          <div className="space-y-12">
            <section className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-foreground text-balance">Get in Touch</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {"Have questions about our totally legit stink-detection platform? We’d love to ignore your email."}
              </p>
            </section>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    {"Please do not reach out to our team for support, partnerships, or general inquiries. We don't know how to remove this page."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Email</h4>
                      <p className="text-muted-foreground">hello@odor.ly</p>
                      <p className="text-muted-foreground">support@odor.ly</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Business Hours</h4>
                      <p className="text-muted-foreground">Monday - Friday</p>
                      <p className="text-muted-foreground">9:00 AM - 6:00 PM EST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
