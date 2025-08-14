"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Clock,
  Package,
  Plus,
  Send,
  Inbox,
  Eye,
  Unlock,
  Calendar,
  User,
  AlertCircle,
  Trash2,
  Download,
  Search,
} from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { CapsuleDetailsModal } from "@/components/capsule-details-modal"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getTimeRemaining, getCapsuleStatus } from "@/lib/capsule-utils"
import {
  getCapsulesByType,
  updateCapsuleStatus,
  formatAddress,
  markCapsuleAsRead,
  clearAllCapsules,
  getCapsuleStats,
} from "@/lib/aptos"

export default function HomePage() {
  const [selectedCapsule, setSelectedCapsule] = useState<string | null>(null)
  const [detailsCapsule, setDetailsCapsule] = useState<any>(null)
  const [capsules, setCapsules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [capsuleType, setCapsuleType] = useState<"all" | "created" | "received">("all")

  // Added bulk selection and management features
  const [selectedCapsules, setSelectedCapsules] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [capsuleStats, setCapsuleStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created-desc")

  const { isConnected, address, signAndSubmitTransaction } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    if (isConnected && address) {
      loadUserCapsules()
      loadCapsuleStats()
    }
  }, [isConnected, address, capsuleType])

  const loadCapsuleStats = () => {
    if (!address) return
    const stats = getCapsuleStats(address)
    setCapsuleStats(stats)
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
      } else {
        // Show demo capsule when no capsules exist
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
      }
    } catch (error) {
      console.error("Failed to load capsules:", error)
      setCapsules([])
    } finally {
      setIsLoading(false)
    }
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

      toast({
        title: "Capsule Opened!",
        description: "Time capsule has been opened successfully.",
      })

      setCapsules((prev) =>
        prev.map((capsule) =>
          capsule.id === id ? { ...capsule, isLocked: false, is_opened: true, isRead: true } : capsule,
        ),
      )

      if (detailsCapsule?.id === id) {
        setDetailsCapsule({ ...detailsCapsule, isLocked: false, is_opened: true, isRead: true })
      }

      loadCapsuleStats()
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

  const handleClearAllCapsules = () => {
    if (!address) return

    clearAllCapsules(address)
    setCapsules([])
    setSelectedCapsules(new Set())
    loadCapsuleStats()
    toast({
      title: "All Capsules Cleared",
      description: "All your time capsules have been removed.",
    })
  }

  // Added bulk selection handlers
  const handleSelectCapsule = (capsuleId: string, checked: boolean) => {
    const newSelected = new Set(selectedCapsules)
    if (checked) {
      newSelected.add(capsuleId)
    } else {
      newSelected.delete(capsuleId)
    }
    setSelectedCapsules(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedCapsules.map((c) => c.id))
      setSelectedCapsules(allIds)
      setShowBulkActions(true)
    } else {
      setSelectedCapsules(new Set())
      setShowBulkActions(false)
    }
  }

  const handleBulkDelete = () => {
    selectedCapsules.forEach((id) => {
      updateCapsuleStatus(id, true)
    })
    setCapsules((prev) => prev.filter((c) => !selectedCapsules.has(c.id)))
    setSelectedCapsules(new Set())
    setShowBulkActions(false)
    loadCapsuleStats()
    toast({
      title: "Capsules Deleted",
      description: `${selectedCapsules.size} capsules have been removed.`,
    })
  }

  const exportCapsules = () => {
    const dataStr = JSON.stringify(capsules, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `time-capsules-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Your capsules have been exported successfully.",
    })
  }

  // Added filtering and sorting logic
  const filteredAndSortedCapsules = capsules
    .filter((capsule) => {
      const matchesSearch =
        capsule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        capsule.message.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesStatus = true
      if (statusFilter === "locked") matchesStatus = capsule.isLocked
      else if (statusFilter === "unlocked") matchesStatus = !capsule.isLocked
      else if (statusFilter === "ready") {
        const now = new Date()
        const unlockTime = new Date(capsule.unlockDate)
        matchesStatus = unlockTime <= now && capsule.isLocked
      }

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "created-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "created-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "unlock-asc":
          return new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()
        case "unlock-desc":
          return new Date(b.unlockDate).getTime() - new Date(a.unlockDate).getTime()
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "title-desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

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
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">My Time Capsules</h1>
              <p className="text-lg text-slate-600">Manage and view your stored memories and messages</p>

              {/* Added statistics cards */}
              {capsuleStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 max-w-4xl mx-auto">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-slate-800">{capsuleStats.total}</div>
                    <div className="text-xs text-slate-600">Total</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">{capsuleStats.created}</div>
                    <div className="text-xs text-slate-600">Created</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-green-600">{capsuleStats.received}</div>
                    <div className="text-xs text-slate-600">Received</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-orange-600">{capsuleStats.locked}</div>
                    <div className="text-xs text-slate-600">Locked</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-purple-600">{capsuleStats.unread}</div>
                    <div className="text-xs text-slate-600">Unread</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <Button
                  variant={capsuleType === "all" ? "default" : "outline"}
                  onClick={() => setCapsuleType("all")}
                  className={
                    capsuleType === "all" ? "bg-slate-800 text-white" : "bg-white text-slate-700 border-slate-300"
                  }
                >
                  <Package className="mr-2 h-4 w-4" />
                  All Capsules
                </Button>
                <Button
                  variant={capsuleType === "created" ? "default" : "outline"}
                  onClick={() => setCapsuleType("created")}
                  className={
                    capsuleType === "created" ? "bg-slate-800 text-white" : "bg-white text-slate-700 border-slate-300"
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Created by Me
                </Button>
                <Button
                  variant={capsuleType === "received" ? "default" : "outline"}
                  onClick={() => setCapsuleType("received")}
                  className={
                    capsuleType === "received" ? "bg-slate-800 text-white" : "bg-white text-slate-700 border-slate-300"
                  }
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  Sent to Me
                </Button>
              </div>

              {/* Added advanced filtering and search */}
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search capsules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  >
                    <option value="all">All Status</option>
                    <option value="locked">Locked</option>
                    <option value="unlocked">Unlocked</option>
                    <option value="ready">Ready to Open</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                  >
                    <option value="created-desc">Newest First</option>
                    <option value="created-asc">Oldest First</option>
                    <option value="unlock-asc">Unlock Date (Soon)</option>
                    <option value="unlock-desc">Unlock Date (Later)</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          Loading capsules...
                        </div>
                      ) : (
                        `${filteredAndSortedCapsules.length} of ${capsules.length} capsules`
                      )}
                    </h2>
                    <p className="text-slate-600 text-sm">
                      {capsuleType === "all" && "All your time capsules"}
                      {capsuleType === "created" && "Capsules you created"}
                      {capsuleType === "received" && "Capsules sent to you"}
                    </p>
                  </div>

                  {/* Added bulk selection controls */}
                  {filteredAndSortedCapsules.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          selectedCapsules.size === filteredAndSortedCapsules.length &&
                          filteredAndSortedCapsules.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-slate-600">Select All</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Added bulk actions */}
                  {showBulkActions && (
                    <Button
                      variant="outline"
                      onClick={handleBulkDelete}
                      className="border-red-300 text-red-700 hover:bg-red-50 bg-white hover:text-red-800"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedCapsules.size})
                    </Button>
                  )}

                  {capsules.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        onClick={exportCapsules}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white hover:text-slate-800"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearAllCapsules}
                        className="border-red-300 text-red-700 hover:bg-red-50 bg-white hover:text-red-800"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All
                      </Button>
                    </>
                  )}

                  <Link href="/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Capsule
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedCapsules.map((capsule) => {
                const status = getCapsuleStatus(capsule)
                const isReceived = capsule.creator !== address && capsule.recipient === address
                const isSent = capsule.creator === address && capsule.recipient !== address
                const isUnread = isReceived && !capsule.isRead
                const isSelected = selectedCapsules.has(capsule.id)

                return (
                  <Card
                    key={capsule.id}
                    className={`border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105 ${
                      isUnread ? "ring-2 ring-blue-300 bg-blue-50/50" : ""
                    } ${isSelected ? "ring-2 ring-purple-300 bg-purple-50/50" : ""}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {/* Added selection checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectCapsule(capsule.id, checked as boolean)}
                            className="mt-1"
                          />
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
                                loadUserCapsules()
                                loadCapsuleStats()
                              }
                            }}
                            className="flex-1 text-xs h-8 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-800"
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
                            <Button
                              disabled
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs h-8 bg-white border-slate-300 text-slate-500"
                            >
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

            {filteredAndSortedCapsules.length === 0 && !isLoading && (
              <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-800 mb-2">No Capsules Found</h3>
                  <p className="text-slate-600 mb-6">
                    {capsules.length === 0 ? (
                      <>
                        {capsuleType === "all" && "You haven't created any time capsules yet"}
                        {capsuleType === "created" && "You haven't created any time capsules yet"}
                        {capsuleType === "received" && "No one has sent you any time capsules yet"}
                      </>
                    ) : (
                      "No capsules match your current filters"
                    )}
                  </p>
                  {capsules.length === 0 ? (
                    <Link href="/create">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Capsule
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setStatusFilter("all")
                        setSortBy("created-desc")
                      }}
                      variant="outline"
                      className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                    >
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
