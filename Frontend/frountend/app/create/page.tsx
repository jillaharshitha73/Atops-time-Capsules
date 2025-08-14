"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Send, AlertCircle, CheckCircle } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { buildCreateCapsulePayload, saveTimeCapsule } from "@/lib/aptos"

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    unlockDate: "",
    recipient: "",
    occasion: "", // Added occasion field
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isConnected, address, signAndSubmitTransaction } = useWallet()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a time capsule",
        variant: "destructive",
      })
      return
    }

    if (!formData.title || !formData.message || !formData.unlockDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const unlockTime = Math.floor(new Date(formData.unlockDate).getTime() / 1000)
      const recipient = formData.recipient || address || ""
      const occasion = formData.occasion || "general"

      const capsuleId = saveTimeCapsule({
        title: formData.title,
        message: formData.message,
        createdAt: new Date().toISOString(),
        unlockDate: formData.unlockDate,
        unlockTime,
        recipient,
        creator: address || "",
        isLocked: unlockTime > Math.floor(Date.now() / 1000),
        is_opened: false,
        occasion,
      })

      try {
        // Try blockchain transaction
        const payload = buildCreateCapsulePayload(formData.title, formData.message, unlockTime, recipient)
        const txHash = await signAndSubmitTransaction(payload)

        toast({
          title: "Time Capsule Created!",
          description: `Your time capsule "${formData.title}" has been created and stored securely. Transaction: ${txHash.slice(0, 8)}...`,
        })
      } catch (blockchainError) {
        console.log("Blockchain transaction failed, using local storage only")
        toast({
          title: "Time Capsule Saved!",
          description: `Your time capsule "${formData.title}" has been saved locally for occasion: ${occasion}`,
        })
      }

      // Reset form
      setFormData({
        title: "",
        message: "",
        unlockDate: "",
        recipient: "",
        occasion: "",
      })
    } catch (error) {
      console.error("Failed to create time capsule:", error)
      toast({
        title: "Creation Failed",
        description: "Failed to create time capsule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Create Your Time Capsule</h1>
            <p className="text-lg text-slate-600">Store a message or memory to be unlocked at a future date</p>
          </div>

          {!isConnected && (
            <Card className="border-orange-200 bg-orange-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Wallet Connection Required</p>
                    <p className="text-sm text-orange-700">Please connect your Aptos wallet to create a time capsule</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Capsule Details
              </CardTitle>
              <CardDescription className="text-slate-600">
                Fill in the information below to create your time capsule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700 font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Give your time capsule a memorable title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={!isConnected}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion" className="text-slate-700 font-medium">
                    Occasion
                  </Label>
                  <Input
                    id="occasion"
                    placeholder="Birthday, Anniversary, New Year, Graduation, etc."
                    value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={!isConnected}
                  />
                  <p className="text-xs text-slate-500">What's the special occasion for this time capsule?</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-700 font-medium">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Write your message, memory, or note for the future..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    disabled={!isConnected}
                  />
                  <p className="text-xs text-slate-500">{formData.message.length}/1000 characters</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unlockDate" className="text-slate-700 font-medium">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Unlock Date *
                    </Label>
                    <Input
                      id="unlockDate"
                      type="datetime-local"
                      value={formData.unlockDate}
                      onChange={(e) => setFormData({ ...formData, unlockDate: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={!isConnected}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-slate-700 font-medium">
                      Recipient Address
                    </Label>
                    <Input
                      id="recipient"
                      placeholder="0x... (optional - defaults to you)"
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={!isConnected}
                    />
                    <p className="text-xs text-slate-500">Leave empty to send to yourself</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Preview
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-blue-700 font-medium">Title:</span> {formData.title || "Untitled"}
                    </p>
                    <p>
                      <span className="text-blue-700 font-medium">Occasion:</span> {formData.occasion || "General"}
                    </p>
                    <p>
                      <span className="text-blue-700 font-medium">Unlock Date:</span>{" "}
                      {formData.unlockDate
                        ? new Date(formData.unlockDate).toLocaleDateString() +
                          " at " +
                          new Date(formData.unlockDate).toLocaleTimeString()
                        : "Not set"}
                    </p>
                    <p>
                      <span className="text-blue-700 font-medium">Recipient:</span> {formData.recipient || "You"}
                    </p>
                    <p>
                      <span className="text-blue-700 font-medium">Message Length:</span> {formData.message.length}{" "}
                      characters
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg h-auto"
                  disabled={!isConnected || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Capsule...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Create Time Capsule
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
