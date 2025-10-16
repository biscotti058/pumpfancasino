"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"

// Dynamic imports for Three.js components to avoid SSR issues
const Canvas = dynamic(() => import("@react-three/fiber").then(mod => ({ default: mod.Canvas })), { ssr: false })
const PointerLockControls = dynamic(() => import("@react-three/drei").then(mod => ({ default: mod.PointerLockControls })), { ssr: false })
const PerspectiveCamera = dynamic(() => import("@react-three/drei").then(mod => ({ default: mod.PerspectiveCamera })), { ssr: false })
const OrbitControls = dynamic(() => import("@react-three/drei").then(mod => ({ default: mod.OrbitControls })), { ssr: false })
const EffectComposer = dynamic(() => import("@react-three/postprocessing").then(mod => ({ default: mod.EffectComposer })), { ssr: false })
const Bloom = dynamic(() => import("@react-three/postprocessing").then(mod => ({ default: mod.Bloom })), { ssr: false })

const CasinoScene = dynamic(() => import("./casino-scene"), { ssr: false })
const VirtualCoinInfo = dynamic(() => import("./virtual-coin-info"), { ssr: false })
const NavigationControls = dynamic(() => import("./navigation-controls"), { ssr: false })
const HomeButton = dynamic(() => import("./home-button"), { ssr: false })
const MobileControls = dynamic(() => import("./mobile-controls"), { ssr: false })
const MiniPointer = dynamic(() => import("./mini-pointer"), { ssr: false })
const RouletteOverlay = dynamic(() => import("./roulette-overlay"), { ssr: false })
const ATMOverlay = dynamic(() => import("./atm-overlay"), { ssr: false })

interface CasinoVirtualeProps {
  onReturnHome: () => void
}

export default function CasinoVirtuale({ onReturnHome }: CasinoVirtualeProps) {
  const [isLocked, setIsLocked] = useState(false)
  const [isSlotEnlarged, setIsSlotEnlarged] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [useFallbackControls, setUseFallbackControls] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [rouletteOpen, setRouletteOpen] = useState(false)
  const [atmOpen, setAtmOpen] = useState(false)
  const [rouletteSpinHandler, setRouletteSpinHandler] = useState<((result: number) => void) | null>(null)
  const [currentMiniGame, setCurrentMiniGame] = useState<'slot' | 'plinko' | 'coinflip' | null>(null)
  const [slotSpinHandler, setSlotSpinHandler] = useState<(() => void) | null>(null)
  const [slotSpinning, setSlotSpinning] = useState(false)
  const [plinkoDropHandler, setPlinkoDropHandler] = useState<(() => void) | null>(null)
  const [plinkoResetHandler, setPlinkoResetHandler] = useState<(() => void) | null>(null)
  const [plinkoPlaying, setPlinkoPlaying] = useState(false)
  const [coinFlipHandlers, setCoinFlipHandlers] = useState<{
    chooseHeads: (() => void) | null
    chooseTails: (() => void) | null
    bet10: (() => void) | null
    bet20: (() => void) | null
    flip: (() => void) | null
    isFlipping: boolean
    currentChoice: string | null
    currentBet: number
  }>({ chooseHeads: null, chooseTails: null, bet10: null, bet20: null, flip: null, isFlipping: false, currentChoice: null, currentBet: 10 })
  const lockRef = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerLockControlsRef = useRef<any>(null)
  const onlinePlayersRef = useRef(Math.floor(Math.random() * (90 - 12 + 1) + 12))

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // ====== SISTEMA CONTROLLI MINIMO ======
  
  const handleSlotEnlarge = useCallback(() => {
    console.log('🎮 Apertura slot/gioco')
    // Prima aggiorna lo stato
    setIsSlotEnlarged(true)
    setIsLocked(false)
    lockRef.current = false
    
    // Poi esci dal pointer lock (anche se non era attivo)
    if (document.exitPointerLock) {
      document.exitPointerLock()
    }
    
    // Assicurati che il cursore sia visibile
    document.body.style.cursor = 'default'
    
    console.log('✅ Slot aperto - cursore dovrebbe essere visibile')
  }, [])

  const handleSlotClose = useCallback(() => {
    setIsSlotEnlarged(false)
    // L'utente deve cliccare per riprendere il controllo
  }, [])

  const handleRouletteClose = useCallback(() => {
    setRouletteOpen(false)
    // L'utente deve cliccare per riprendere il controllo
  }, [])

  const handleATMClose = useCallback(() => {
    console.log('💰 Chiusura ATM - inizio')
    setAtmOpen(false)
    // Riattiva il pointer lock usando l'API nativa
    setTimeout(() => {
      console.log('⏰ ATM: provo a fare lock')
      const canvas = canvasRef.current
      if (canvas && canvas.requestPointerLock) {
        try {
          canvas.requestPointerLock()
          console.log('🎯 ATM: lock riuscito!')
        } catch (error) {
          console.log('❌ ATM: errore lock:', error)
        }
      }
    }, 300)
  }, [])

  // Gestione pointer lock quando entri/esci da giochi
  useEffect(() => {
    const isInGame = isSlotEnlarged || rouletteOpen || atmOpen
    
    if (isInGame) {
      // Sei dentro un gioco → forza unlock
      console.log('🎮 Entrato in un gioco, forzo unlock')
      if (document.exitPointerLock) {
        try {
          document.exitPointerLock()
          console.log('🔓 Pointer lock sbloccato')
        } catch (error) {
          console.log('Unlock error:', error)
        }
      }
    }
  }, [isSlotEnlarged, rouletteOpen, atmOpen])



  const handleContextLost = useCallback((event) => {
    event.preventDefault()
    console.warn("WebGL context lost. Attempting to restore...")
  }, [])

  const handleContextRestored = useCallback(() => {
    console.log("WebGL context restored.")
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("webglcontextlost", handleContextLost, false)
      canvas.addEventListener("webglcontextrestored", handleContextRestored, false)
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener("webglcontextlost", handleContextLost)
        canvas.removeEventListener("webglcontextrestored", handleContextRestored)
      }
    }
  }, [handleContextLost, handleContextRestored])

  useEffect(() => {
    const isPointerLockSupported =
      "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document
    if (!isPointerLockSupported) {
      console.warn("Pointer Lock API not supported. Using fallback controls.")
      setUseFallbackControls(true)
    }
  }, [])

  const handleError = (error) => {
    console.error("An error occurred in the 3D scene:", error)
    setHasError(true)
  }

  if (hasError) {
    return <div>An error occurred. Please refresh the page or try again later.</div>
  }

  return (
    <div className="w-screen h-screen bg-green-50">
      <Canvas
        ref={canvasRef}
        onCreated={({ gl }) => {
          gl.setClearColor("#f0fdf4") // Light green background
        }}
        onError={handleError}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1.7, 0]} fov={75} />
          <CasinoScene
            onSlotEnlarge={handleSlotEnlarge}
            onSlotClose={handleSlotClose}
            isSlotEnlarged={isSlotEnlarged}
            onRouletteClick={() => setRouletteOpen(true)}
            onATMClick={() => setAtmOpen(true)}
            onRouletteSpin={(spinHandler) => setRouletteSpinHandler(() => spinHandler)}
            onSlotSpin={(spinHandler, spinning) => {
              console.log('🔄 Slot spin handler updated:', { spinning })
              setSlotSpinHandler(() => spinHandler)
              setSlotSpinning(spinning)
            }}
            onMiniGameChange={(gameType) => {
              console.log('🎮 Mini game changed to:', gameType)
              setCurrentMiniGame(gameType)
            }}
            onPlinkoButtons={(drop, reset, isPlaying) => {
              console.log('🔄 Plinko buttons updated:', { isPlaying })
              setPlinkoDropHandler(() => drop)
              setPlinkoResetHandler(() => reset)
              setPlinkoPlaying(isPlaying)
            }}
            onCoinFlipButtons={(chooseHeads, chooseTails, bet10, bet20, flip, isFlipping, currentChoice, currentBet) => {
              console.log('🔄 CoinFlip buttons updated:', { isFlipping, currentChoice, currentBet })
              setCoinFlipHandlers({
                chooseHeads,
                chooseTails,
                bet10,
                bet20,
                flip,
                isFlipping,
                currentChoice,
                currentBet
              })
            }}
          />
          {!isMobile && (
            <>
              <PointerLockControls
                ref={pointerLockControlsRef}
                onLock={() => {
                  console.log('🔒 PointerLock onLock chiamato')
                  // Se un gioco è aperto, ESCI IMMEDIATAMENTE dal lock
                  if (isSlotEnlarged || rouletteOpen || atmOpen) {
                    console.log('⚠️ Gioco aperto - rifiuto il lock!')
                    setTimeout(() => {
                      if (document.exitPointerLock) {
                        document.exitPointerLock()
                      }
                    }, 0)
                    return
                  }
                  setIsLocked(true)
                  lockRef.current = true
                }}
                onUnlock={() => {
                  console.log('🔓 PointerLock onUnlock chiamato')
                  setIsLocked(false)
                  lockRef.current = false
                }}
              />
              {useFallbackControls && <OrbitControls enableZoom={false} enablePan={false} />}
            </>
          )}
          {isMobile && <OrbitControls enableZoom={false} enablePan={false} />}
          <EffectComposer>
            <Bloom intensity={1.0} luminanceThreshold={0.3} luminanceSmoothing={0.7} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* Message "Click to take control" when not locked - BLOCKS clicks behind */}
      {!isLocked && !isSlotEnlarged && !rouletteOpen && !atmOpen && !isMobile && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            console.log('🖱️ Click on overlay - requesting pointer lock')
            e.preventDefault()
            e.stopPropagation()
            // Request pointer lock directly
            const canvas = canvasRef.current
            if (canvas && canvas.requestPointerLock) {
              canvas.requestPointerLock()
            }
          }}
        >
          <div className="bg-black/70 text-white px-8 py-4 rounded-lg text-xl font-semibold pointer-events-none">
            Click to Take Control
          </div>
        </div>
      )}
      
      {/* Mini Pointer quando sei in controllo visuale */}
      {isLocked && !isSlotEnlarged && !rouletteOpen && !atmOpen && !isMobile && <MiniPointer />}
      {!isSlotEnlarged && <VirtualCoinInfo isSlotEnlarged={isSlotEnlarged} onlinePlayers={onlinePlayersRef.current} />}
      {!isSlotEnlarged && !isMobile && <NavigationControls />}
      {!isSlotEnlarged && <HomeButton onReturn={onReturnHome} />}
      {isMobile && !isSlotEnlarged && <MobileControls />}
      
      {/* Game Overlays */}
      <RouletteOverlay 
        isOpen={rouletteOpen} 
        onClose={handleRouletteClose} 
        onSpin={rouletteSpinHandler || undefined}
      />
      <ATMOverlay isOpen={atmOpen} onClose={handleATMClose} />
      
      {/* MINI-GAME HTML BUTTON OVERLAYS */}
      {isSlotEnlarged && currentMiniGame === 'slot' && (
        <div style={{
          position: 'fixed',
          bottom: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          <button
            onClick={() => {
              console.log('🎯 SLOT SPIN BUTTON CLICKED!')
              if (slotSpinHandler && !slotSpinning) {
                slotSpinHandler()
              }
            }}
            disabled={slotSpinning}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#ffffff',
              backgroundColor: slotSpinning ? '#666666' : '#22c55e',
              border: 'none',
              borderRadius: '8px',
              cursor: slotSpinning ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
              opacity: slotSpinning ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!slotSpinning) {
                e.currentTarget.style.backgroundColor = '#16a34a'
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseOut={(e) => {
              if (!slotSpinning) {
                e.currentTarget.style.backgroundColor = '#22c55e'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {slotSpinning ? 'SPINNING...' : 'SPIN (5 coins)'}
          </button>
        </div>
      )}
      
      {/* PLINKO BUTTONS */}
      {isSlotEnlarged && currentMiniGame === 'plinko' && (
        <div style={{
          position: 'fixed',
          bottom: '22%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'auto',
          display: 'flex',
          gap: '20px'
        }}>
          <button
            onClick={() => {
              console.log('🎯 PLINKO DROP BUTTON CLICKED!')
              if (plinkoDropHandler && !plinkoPlaying) {
                plinkoDropHandler()
              }
            }}
            disabled={plinkoPlaying}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#ffffff',
              backgroundColor: plinkoPlaying ? '#666666' : '#22c55e',
              border: 'none',
              borderRadius: '8px',
              cursor: plinkoPlaying ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
              opacity: plinkoPlaying ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!plinkoPlaying) {
                e.currentTarget.style.backgroundColor = '#16a34a'
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseOut={(e) => {
              if (!plinkoPlaying) {
                e.currentTarget.style.backgroundColor = '#22c55e'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {plinkoPlaying ? 'DROPPING...' : 'DROP (5 coins)'}
          </button>
          <button
            onClick={() => {
              console.log('🎯 PLINKO RESET BUTTON CLICKED!')
              if (plinkoResetHandler) {
                plinkoResetHandler()
              }
            }}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#ffffff',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            RESET
          </button>
        </div>
      )}
      
      {/* COIN FLIP BUTTONS */}
      {isSlotEnlarged && currentMiniGame === 'coinflip' && (
        <div style={{
          position: 'fixed',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center'
        }}>
          {/* Choice buttons */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={() => {
                console.log('🎯 HEADS SELECTED!')
                if (coinFlipHandlers.chooseHeads) coinFlipHandlers.chooseHeads()
              }}
              style={{
                padding: '12px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              HEADS
            </button>
            <button
              onClick={() => {
                console.log('🎯 TAILS SELECTED!')
                if (coinFlipHandlers.chooseTails) coinFlipHandlers.chooseTails()
              }}
              style={{
                padding: '12px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: '#8b5cf6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#8b5cf6'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              TAILS
            </button>
          </div>
          {/* Bet amount buttons */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={() => {
                console.log('🎯 BET 10 SELECTED!')
                if (coinFlipHandlers.bet10) coinFlipHandlers.bet10()
              }}
              style={{
                padding: '10px 25px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: '#f59e0b',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#d97706'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f59e0b'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              10 COINS
            </button>
            <button
              onClick={() => {
                console.log('🎯 BET 20 SELECTED!')
                if (coinFlipHandlers.bet20) coinFlipHandlers.bet20()
              }}
              style={{
                padding: '10px 25px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: '#f59e0b',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#d97706'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f59e0b'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              20 COINS
            </button>
          </div>
          {/* Flip button */}
          <button
            onClick={() => {
              console.log('🎯 FLIP COIN CLICKED!')
              if (coinFlipHandlers.flip && !coinFlipHandlers.isFlipping) coinFlipHandlers.flip()
            }}
            disabled={coinFlipHandlers.isFlipping}
            style={{
              padding: '15px 50px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#ffffff',
              backgroundColor: '#22c55e',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            FLIP COIN
          </button>
        </div>
      )}
    </div>
  )
}

