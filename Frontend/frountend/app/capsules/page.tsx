"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Package, Unlock, Calendar, User, Eye, AlertCircle, Send, Inbox, Bell, BellRing } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { CapsuleDetailsModal } from "@/components/capsule-details-modal"
import { CapsuleFilters } from "@/components/capsule-filters"
import { LoadingSpinner } from "@/components/loading-spinner"
import { filterCapsules, sortCapsules, getTimeRemaining, getCapsuleStatus } from "@/lib/capsule-utils"
import {
  getUserCapsules,
  getCapsule,
  buildOpenCapsulePayload,
  formatAddress,
  formatTimestamp,
  getCapsulesByType,
  updateCapsuleStatus,
  getUserNotifications,
  markNotificationAsRead,
  markCapsuleAsRead,
  getUnreadNotificationsCount,
} from "@/lib/aptos"

export default function CapsulesPage() {
  const [selectedCapsule, setSelectedCapsule] = useState<string | null>(null)
  const [detailsCapsule, setDetailsCapsule] = useState<any>(null)
  const [capsules, setCapsules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created-desc")
  const [capsuleType, setCapsuleType] = useState<"all" | "created" | "received">("all")

  const { isConnected, address, signAndSubmitTransaction } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    if (isConnected && address) {
      loadUserCapsules()
      loadNotifications()
    }
  }, [isConnected, address, capsuleType])

  const loadNotifications = () => {
    if (!address) return

    const userNotifications = getUserNotifications(address)
    setNotifications(userNotifications)
    setUnreadCount(getUnreadNotificationsCount(address))
  }

  const loadUserCapsules = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const userCapsules = await getCapsulesByType(address, capsuleType)

      if (userCapsules.length > 0) {
        const capsulesData = userCapsules.map((capsule) => ({
          id: capsule.id,
          title: capsule.title,
          message: capsule.message,
          createdAt: capsule.createdAt,
          unlockDate: capsule.unlockDate,
          isLocked: capsule.isLocked,
          recipient: capsule.recipient,
          creator: capsule.creator,
          unlock_time: capsule.unlockTime,
          is_opened: capsule.is_opened,
          occasion: capsule.occasion || "General",
          messageHash: capsule.messageHash,
          isRead: capsule.isRead || false,
        }))

        setCapsules(capsulesData)
        setIsLoading(false)
        return
      }

      const capsuleIds = await getUserCapsules(address)
      const capsulesData = []

      for (const id of capsuleIds) {
        const capsule = await getCapsule(address, id)
        if (capsule) {
          capsulesData.push({
            id: capsule.id,
            title: capsule.title,
            message: capsule.message,
            createdAt: formatTimestamp(capsule.created_at),
            unlockDate: new Date(capsule.unlock_time * 1000).toISOString(),
            isLocked: !capsule.is_opened && capsule.unlock_time > Math.floor(Date.now() / 1000),
            recipient: formatAddress(capsule.recipient),
            creator: capsule.creator,
            unlock_time: capsule.unlock_time,
            is_opened: capsule.is_opened,
            occasion: capsule.occasion || "General",
            messageHash: capsule.messageHash,
            isRead: capsule.isRead || false,
          })
        }
      }

      setCapsules(capsulesData)
    } catch (error) {
      console.error("Failed to load capsules:", error)
      toast({
        title: "Loading Failed",
        description: "Failed to load your time capsules. Showing stored capsules.",
        variant: "destructive",
      })

      setCapsules([
        {
          id: "demo_1",
          title: "Welcome Time Capsule",
          message: "This is a demo capsule. Create your own time capsules to store memories and messages!",
          createdAt: new Date().toISOString(),
          unlockDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isLocked: true,
          recipient: address || "",
          creator: address || "",
          unlock_time: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
          is_opened: false,
          occasion: "Demo",
          messageHash: "demo123",
          isRead: false,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = (notification: any) => {
    markNotificationAsRead(address!, notification.id)
    markCapsuleAsRead(address!, notification.capsuleId)
    loadNotifications()
    loadUserCapsules()

    toast({
      title: "Notification Read",
      description: "Notification marked as read.",
    })
  }

  const openCapsule = async (id: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to open capsules",
        variant: "destructive",
      })
      return
    }

    try {
      setSelectedCapsule(id)

      updateCapsuleStatus(id, true)
      markCapsuleAsRead(address, id)

      try {
        const payload = buildOpenCapsulePayload(address, Number.parseInt(id.replace(/\D/g, "")) || 0)
        const txHash = await signAndSubmitTransaction(payload)

        toast({
          title: "Capsule Opened!",
          description: `Time capsule has been opened successfully. Transaction: ${txHash.slice(0, 8)}...`,
        })
      } catch (blockchainError) {
        console.log("Blockchain transaction failed, using local storage only")
        toast({
          title: "Capsule Opened!",
          description: "Time capsule has been opened and updated locally.",
        })
      }

      setCapsules((prev) =>
        prev.map((capsule) =>
          capsule.id === id ? { ...capsule, isLocked: false, is_opened: true, isRead: true } : capsule,
        ),
      )

      if (detailsCapsule?.id === id) {
        setDetailsCapsule({ ...detailsCapsule, isLocked: false, is_opened: true, isRead: true })
      }

      loadNotifications()
    } catch (error) {
      console.error("Failed to open capsule:", error)
      toast({
        title: "Opening Failed",
        description: "Failed to open time capsule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSelectedCapsule(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSortBy("created-desc")
    setCapsuleType("all")
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset to default values.",
    })
  }

  const filteredCapsules = filterCapsules(capsules, searchQuery, statusFilter)
  const sortedCapsules = sortCapsules(filteredCapsules, sortBy)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-800 mb-2">Connect Your Wallet</h3>
                <p className="text-slate-600 mb-6">Connect your Aptos wallet to view your time capsules</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm font-medium">Wallet Required</p>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    You need an Aptos-compatible wallet like Petra to access your capsules
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">My Time Capsules</h1>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative"
                  >
                    {unreadCount > 0 ? <BellRing className="h-4 w-4 text-blue-600" /> : <Bell className="h-4 w-4" />}
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-500">
                            <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${
                                !notification.isRead ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 ${
                                    !notification.isRead ? "bg-blue-500" : "bg-slate-300"
                                  }`}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                                  <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    From: {formatAddress(notification.senderAddress)}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-lg text-slate-600">Manage and view your stored memories and messages</p>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <Button
                  variant={capsuleType === "all" ? "default" : "outline"}
                  onClick={() => setCapsuleType("all")}
                  className="text-sm"
                >
                  <Package className="mr-2 h-4 w-4" />
                  All Capsules
                </Button>
                <Button
                  variant={capsuleType === "created" ? "default" : "outline"}
                  onClick={() => setCapsuleType("created")}
                  className="text-sm"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Created by Me
                </Button>
                <Button
                  variant={capsuleType === "received" ? "default" : "outline"}
                  onClick={() => setCapsuleType("received")}
                  className="text-sm"
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  Sent to Me
                  {capsuleType !== "received" && unreadCount > 0 && (
                    <Badge className="ml-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs p-0">{unreadCount}</Badge>
                  )}
                </Button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        Loading capsules...
                      </div>
                    ) : (
                      `${sortedCapsules.length} of ${capsules.length} capsules`
                    )}
                  </h2>
                  <p className="text-slate-600 text-sm">
                    {searchQuery && `Filtered by "${searchQuery}"`}
                    {statusFilter !== "all" && ` • Status: ${statusFilter}`}
                    {capsuleType !== "all" && ` • Type: ${capsuleType}`}
                  </p>
                </div>
                <Link href="/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Package className="mr-2 h-4 w-4" />
                    Create New Capsule
                  </Button>
                </Link>
              </div>

              <CapsuleFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={clearFilters}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedCapsules.map((capsule) => {
                const status = getCapsuleStatus(capsule)
                const isReceived = capsule.creator !== address && capsule.recipient === address
                const isSent = capsule.creator === address && capsule.recipient !== address
                const isUnread = isReceived && !capsule.isRead

                return (
                  <Card
                    key={capsule.id}
                    className={`border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105 ${
                      isUnread ? "ring-2 ring-blue-300 bg-blue-50/50" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-1">
                          <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                          {isReceived && (
                            <Badge
                              className={`${isUnread ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"} text-xs`}
                            >
                              <Inbox className="mr-1 h-3 w-3" />
                              {isUnread ? "New" : "Received"}
                            </Badge>
                          )}
                          {isSent && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              <Send className="mr-1 h-3 w-3" />
                              Sent
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {capsule.occasion && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {capsule.occasion}
                            </span>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-800 line-clamp-2">
                        {capsule.title}
                        {isUnread && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600">
                        {new Date(capsule.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Calendar className="h-3 w-3" />
                          <span className="truncate">{new Date(capsule.unlockDate).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {isReceived ? (
                              <>From: {formatAddress(capsule.creator)}</>
                            ) : (
                              <>
                                To:{" "}
                                {capsule.recipient.length > 20
                                  ? `${capsule.recipient.slice(0, 20)}...`
                                  : capsule.recipient}
                              </>
                            )}
                          </span>
                        </div>

                        {capsule.isLocked ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                            <p className="text-xs text-blue-800 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeRemaining(capsule.unlockDate)}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-md p-2">
                            <p className="text-xs text-slate-700 italic line-clamp-2">
                              "{capsule.message.slice(0, 60)}..."
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDetailsCapsule(capsule)
                              if (isUnread) {
                                markCapsuleAsRead(address!, capsule.id)
                                loadNotifications()
                                loadUserCapsules()
                              }
                            }}
                            className="flex-1 text-xs h-8 bg-transparent border-slate-300"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>

                          {status.status === "ready" ? (
                            <Button
                              size="sm"
                              onClick={() => openCapsule(capsule.id)}
                              disabled={selectedCapsule === capsule.id}
                              className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Unlock className="mr-1 h-3 w-3" />
                              {selectedCapsule === capsule.id ? "..." : "Open"}
                            </Button>
                          ) : capsule.isLocked ? (
                            <Button disabled variant="outline" size="sm" className="flex-1 text-xs h-8 bg-transparent">
                              <Clock className="mr-1 h-3 w-3" />
                              Locked
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => openCapsule(capsule.id)}
                              disabled={selectedCapsule === capsule.id}
                              className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Unlock className="mr-1 h-3 w-3" />
                              {selectedCapsule === capsule.id ? "..." : "Mark"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {sortedCapsules.length === 0 && !isLoading && (
              <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-800 mb-2">
                    {capsules.length === 0 ? "No Time Capsules Yet" : "No Matching Capsules"}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {capsules.length === 0
                      ? "Create your first time capsule to get started"
                      : "Try adjusting your search or filters"}
                  </p>
                  {capsules.length === 0 ? (
                    <Link href="/create">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create Your First Capsule</Button>
                    </Link>
                  ) : (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <CapsuleDetailsModal
        capsule={detailsCapsule}
        isOpen={!!detailsCapsule}
        onClose={() => setDetailsCapsule(null)}
        onOpenCapsule={openCapsule}
        isOpening={selectedCapsule === detailsCapsule?.id}
      />
    </div>
  )
}
