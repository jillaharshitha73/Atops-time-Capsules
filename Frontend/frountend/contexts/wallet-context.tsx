"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => void
  signAndSubmitTransaction: (payload: any) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      if (typeof window !== "undefined" && "aptos" in window) {
        const wallet = (window as any).aptos
        const isConnected = await wallet.isConnected()
        if (isConnected) {
          const account = await wallet.account()
          if (account) {
            setAddress(account.address)
            setIsConnected(true)
          }
        }
      }
    } catch (error) {
      console.log("Wallet not connected or not available:", error)
    }
  }

  const connect = async () => {
    try {
      setIsLoading(true)

      if (typeof window === "undefined" || !("aptos" in window)) {
        toast({
          title: "Wallet Not Found",
          description: "Please install Petra Wallet or another Aptos wallet extension",
          variant: "destructive",
        })
        return
      }

      const wallet = (window as any).aptos

      try {
        const response = await wallet.connect()
        if (response) {
          const account = await wallet.account()
          setAddress(account.address)
          setIsConnected(true)

          // Check if we're on the correct network
          const network = await wallet.network()
          if (network.name !== "Devnet") {
            toast({
              title: "Wrong Network",
              description: "Please switch to Devnet in your wallet",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Wallet Connected",
              description: `Connected to ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
            })
          }
        }
      } catch (connectError: any) {
        if (connectError.code === 4001) {
          toast({
            title: "Connection Rejected",
            description: "You rejected the connection request",
            variant: "destructive",
          })
        } else {
          throw connectError
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect to wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    try {
      if (typeof window !== "undefined" && "aptos" in window) {
        const wallet = (window as any).aptos
        await wallet.disconnect()
      }
      setAddress(null)
      setIsConnected(false)
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      })
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  const signAndSubmitTransaction = async (payload: any): Promise<string> => {
    if (!isConnected || typeof window === "undefined" || !("aptos" in window)) {
      throw new Error("Wallet not connected")
    }

    try {
      const wallet = (window as any).aptos

      const pendingTransaction = await wallet.signAndSubmitTransaction(payload)

      toast({
        title: "Transaction Submitted",
        description: "Your transaction has been submitted to the blockchain",
      })

      return pendingTransaction.hash
    } catch (error: any) {
      console.error("Transaction failed:", error)

      let errorMessage = "Failed to submit transaction. Please try again."
      if (error.code === 4001) {
        errorMessage = "You rejected the transaction"
      } else if (error.message?.includes("insufficient")) {
        errorMessage = "Insufficient funds for transaction"
      } else if (error.message?.includes("gas")) {
        errorMessage = "Gas estimation failed. Please try again."
      }

      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        isLoading,
        connect,
        disconnect,
        signAndSubmitTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
