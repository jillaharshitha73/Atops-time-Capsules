"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { Wallet, LogOut } from "lucide-react"

export function WalletButton() {
  const { isConnected, address, isLoading, connect, disconnect } = useWallet()

  if (isConnected && address) {
    return (
      <Button onClick={disconnect} variant="outline" className="border-slate-300 bg-white/80 backdrop-blur-sm">
        <LogOut className="mr-2 h-4 w-4" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    )
  }

  return (
    <Button onClick={connect} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
      <Wallet className="mr-2 h-4 w-4" />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
