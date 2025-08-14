"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, MessageSquare, Unlock, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TimeCapsule {
  id: number
  title: string
  message: string
  createdAt: string
  unlockDate: string
  isLocked: boolean
  recipient: string
  creator?: string
}

interface CapsuleDetailsModalProps {
  capsule: TimeCapsule | null
  isOpen: boolean
  onClose: () => void
  onOpenCapsule: (id: number) => void
  isOpening: boolean
}

export function CapsuleDetailsModal({ capsule, isOpen, onClose, onOpenCapsule, isOpening }: CapsuleDetailsModalProps) {
  const { toast } = useToast()

  if (!capsule) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    })
  }

  const timeRemaining = () => {
    const now = new Date()
    const unlockTime = new Date(capsule.unlockDate)
    const diff = unlockTime.getTime() - now.getTime()

    if (diff <= 0) return "Ready to unlock!"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} days, ${hours} hours remaining`
    return `${hours} hours remaining`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl text-slate-800">{capsule.title}</DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">Time Capsule #{capsule.id}</DialogDescription>
            </div>
            <Badge
              variant={capsule.isLocked ? "secondary" : "default"}
              className={capsule.isLocked ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}
            >
              {capsule.isLocked ? "Locked" : "Unlocked"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm">{new Date(capsule.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Unlock Date</p>
                  <p className="text-sm">{new Date(capsule.unlockDate).toLocaleDateString()}</p>
                  {capsule.isLocked && <p className="text-xs text-blue-600 font-medium">{timeRemaining()}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Recipient</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono">{capsule.recipient}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(capsule.recipient)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-600" />
              <h3 className="font-medium text-slate-800">Message</h3>
            </div>

            {capsule.isLocked ? (
              <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Clock className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Message is locked</p>
                <p className="text-sm text-slate-500">This message will be revealed when the capsule unlocks</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-slate-700 whitespace-pre-wrap">{capsule.message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {capsule.isLocked ? (
              <Button disabled variant="outline" className="flex-1 bg-transparent">
                <Clock className="mr-2 h-4 w-4" />
                Still Locked
              </Button>
            ) : (
              <Button
                onClick={() => onOpenCapsule(capsule.id)}
                disabled={isOpening}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Unlock className="mr-2 h-4 w-4" />
                {isOpening ? "Opening..." : "Mark as Opened"}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
