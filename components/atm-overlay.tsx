import React, { useState, useEffect } from "react"
import { useCoins } from "../hooks/use-coins"

export default function ATMOverlay({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) {
  const { coins, addCoins, removeCoins } = useCoins()
  const [selectedAction, setSelectedAction] = useState<string>("")
  const [amount, setAmount] = useState<number>(10)
  const [connected, setConnected] = useState<boolean>(false)

  // Aggiungi listener per INVIO
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, isOpen])

  if (!isOpen) return null

  const connectWallet = (walletType: string) => {
    setConnected(true)
    setSelectedAction(`Connected to ${walletType}`)
    // Simulate wallet connection
    setTimeout(() => {
      alert(`Successfully connected to ${walletType}!`)
    }, 1000)
  }

  const deposit = () => {
    if (connected && amount > 0) {
      addCoins(amount)
      alert(`Deposited ${amount} coins successfully!`)
      setAmount(10)
    }
  }

  const withdraw = () => {
    if (connected && coins >= amount && amount > 0) {
      removeCoins(amount)
      alert(`Withdrew ${amount} coins successfully!`)
      setAmount(10)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-gray-900 p-8 rounded-lg max-w-md w-full mx-4 border-2 border-green-500 relative"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-400">CRYPTO ATM</h2>
          <button 
            onClick={onClose}
            className="text-white text-2xl font-bold hover:text-red-400"
          >
            ×
          </button>
        </div>
        
        {/* COMING SOON - Tutto bloccato */}
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-4xl font-bold text-green-400 mb-2">COMING SOON</h3>
          <p className="text-white text-lg text-center max-w-md">
            Crypto ATM functionality is under development. 
            <br />
            Check back soon for deposits and withdrawals!
          </p>
          <div className="mt-4 text-gray-400 text-sm">
            Press ENTER to exit
          </div>
        </div>

        {/* Vecchio codice commentato per riferimento futuro */}
        {false && !connected ? (
          <div className="space-y-4">
            <h3 className="text-xl text-white mb-4">Connect Your Wallet</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "MetaMask", icon: "🦊", desc: "Ethereum Wallet" },
                { name: "Phantom", icon: "👻", desc: "Solana Wallet" }, 
                { name: "Coinbase", icon: "💙", desc: "Multi-chain" },
                { name: "Trust Wallet", icon: "💎", desc: "Mobile Wallet" }
              ].map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => connectWallet(wallet.name)}
                  className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg border border-green-500 hover:border-green-400 transition-all duration-200"
                >
                  <div className="text-2xl mb-2">{wallet.icon}</div>
                  <div className="font-bold">{wallet.name}</div>
                  <div className="text-sm text-gray-400">{wallet.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : false && (
          <div className="space-y-6">
            <div className="text-green-400 text-center">
              <p>{selectedAction}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-white block mb-2">Amount (Coins):</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  max="1000"
                  className="w-full bg-gray-800 text-white p-3 rounded border border-green-500 focus:border-green-400 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={deposit}
                  disabled={amount <= 0}
                  className="bg-green-600 hover:bg-green-500 text-white py-3 px-6 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  💰 DEPOSIT
                </button>
                <button
                  onClick={withdraw}
                  disabled={amount <= 0 || coins < amount}
                  className="bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  💸 WITHDRAW
                </button>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-bold mb-2">Quick Actions:</h4>
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors duration-200"
                  >
                    {quickAmount}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setConnected(false)
                setSelectedAction("")
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors duration-200"
            >
              🔌 Disconnect Wallet
            </button>
          </div>
        )}
        
        <div className="mt-4 text-center text-yellow-400 text-sm">
          Press ENTER to exit
        </div>
      </div>
    </div>
  )
}