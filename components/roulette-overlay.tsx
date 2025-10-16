import React, { useState, useEffect } from "react"
import { useCoins } from "../hooks/use-coins"

export default function RouletteOverlay({ onClose, isOpen, onSpin }: { 
  onClose: () => void; 
  isOpen: boolean;
  onSpin?: (result: number) => void;
}) {
  const { coins, addCoins, removeCoins } = useCoins()
  const [bets, setBets] = useState<{ [key: number]: number }>({})
  const [selectedBet, setSelectedBet] = useState<number>(5)

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

  const numbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
    28, 12, 35, 3, 26,
  ]

  const getColor = (number: number) => {
    if (number === 0) return "bg-green-600"
    return number % 2 === 0 ? "bg-gray-900" : "bg-red-600"
  }

  const placeBet = (number: number) => {
    if (coins >= selectedBet) {
      removeCoins(selectedBet)
      setBets(prev => ({
        ...prev,
        [number]: (prev[number] || 0) + selectedBet
      }))
    }
  }

  const spin = () => {
    if (Object.keys(bets).length > 0) {
      const result = numbers[Math.floor(Math.random() * numbers.length)]
      
      // Close the overlay to see the animation
      onClose()
      
      // Calculate win/loss before spinning
      const hasWon = bets[result] !== undefined
      const winAmount = hasWon ? bets[result] * 35 : 0
      
      // Notify the 3D roulette to spin with win/loss info
      if (onSpin) {
        // Pass result and win status
        (onSpin as any)(result, hasWon, winAmount)
      }
      
      // Award coins after spin animation
      setTimeout(() => {
        if (hasWon) {
          addCoins(winAmount)
        }
        setBets({})
      }, 4500) // Wait for spin animation (4 seconds) + extra time
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-green-900 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Roulette Betting</h2>
          <button 
            onClick={onClose}
            className="text-white text-2xl font-bold hover:text-red-400"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4 text-white">
          <p>Coins: {coins}</p>
          <p>Total Bet: {Object.values(bets).reduce((sum, bet) => sum + bet, 0)}</p>
        </div>

        <div className="mb-4">
          <label className="text-white mr-2">Bet Amount:</label>
          <select 
            value={selectedBet} 
            onChange={(e) => setSelectedBet(Number(e.target.value))}
            className="bg-gray-700 text-white p-2 rounded"
          >
            <option value={5}>5 Coins</option>
            <option value={10}>10 Coins</option>
            <option value={25}>25 Coins</option>
            <option value={50}>50 Coins</option>
          </select>
        </div>

        <div className="grid grid-cols-12 gap-1 mb-4">
          {numbers.map((number) => (
            <button
              key={number}
              onClick={() => placeBet(number)}
              className={`${getColor(number)} text-white p-2 rounded text-sm font-bold hover:opacity-80 relative`}
            >
              {number}
              {bets[number] && (
                <span className="absolute top-0 right-0 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bets[number]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button 
            onClick={() => placeBet(-1)} 
            className="bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700"
          >
            Red (2:1)
          </button>
          <button 
            onClick={() => placeBet(-2)} 
            className="bg-gray-900 text-white p-3 rounded font-bold hover:bg-gray-800"
          >
            Black (2:1)
          </button>
          <button 
            onClick={() => placeBet(-3)} 
            className="bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
          >
            Even/Odd (2:1)
          </button>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={spin}
            disabled={Object.keys(bets).length === 0}
            className="bg-yellow-500 text-black px-6 py-3 rounded font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SPIN WHEEL
          </button>
          <button 
            onClick={() => setBets({})}
            className="bg-gray-600 text-white px-6 py-3 rounded font-bold hover:bg-gray-700"
          >
            Clear Bets
          </button>
        </div>
        
        <div className="mt-4 text-center text-yellow-400 text-sm">
          Press ENTER to exit
        </div>
      </div>
    </div>
  )
}