import { useRef, useState, useMemo, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"
import { gsap } from "gsap"

const CRYPTO_SYMBOLS = ["₿", "Ξ", "◎", "💎", "🚀"]

export default function CryptoATM({
  position,
  rotation,
  onClick,
  index,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  onClick: (index: number) => void
  index: number
}) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [connected, setConnected] = useState(false)

  const createSymbolTexture = useCallback((symbol: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Green theme background
      ctx.fillStyle = "#166534"
      ctx.fillRect(0, 0, 128, 128)
      ctx.fillStyle = "#10b981"
      ctx.font = "60px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(symbol, 64, 64)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])

  const symbolTextures = useMemo(() => {
    return CRYPTO_SYMBOLS.reduce(
      (acc, symbol) => {
        acc[symbol] = createSymbolTexture(symbol)
        return acc
      },
      {} as Record<string, THREE.Texture>,
    )
  }, [createSymbolTexture])

  const createWalletInterface = useCallback(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 512
    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Dark background
      ctx.fillStyle = "#0f172a"
      ctx.fillRect(0, 0, 256, 512)
      
      // Green accent border
      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 4
      ctx.strokeRect(8, 8, 240, 496)
      
      // Title
      ctx.fillStyle = "#10b981"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("CRYPTO ATM", 128, 60)
      
      // Status
      ctx.fillStyle = connected ? "#10b981" : "#ef4444"
      ctx.font = "18px Arial"
      ctx.fillText(connected ? "WALLET CONNECTED" : "CONNECT WALLET", 128, 120)
      
      // Wallet options
      const wallets = ["MetaMask", "Phantom", "Solflare", "Coinbase"]
      wallets.forEach((wallet, i) => {
        ctx.fillStyle = "#1e293b"
        ctx.fillRect(20, 160 + i * 60, 216, 45)
        
        ctx.strokeStyle = "#10b981"
        ctx.lineWidth = 2
        ctx.strokeRect(20, 160 + i * 60, 216, 45)
        
        ctx.fillStyle = "#f8fafc"
        ctx.font = "16px Arial"
        ctx.fillText(wallet, 128, 185 + i * 60)
      })
      
      // Bottom text
      ctx.fillStyle = "#64748b"
      ctx.font = "14px Arial"
      ctx.fillText("Select wallet to connect", 128, 450)
      ctx.fillText("Secure & Encrypted", 128, 480)
    }
    return new THREE.CanvasTexture(canvas)
  }, [connected])

  const interfaceTexture = useMemo(() => createWalletInterface(), [createWalletInterface])

  const handleClick = (event: THREE.Event) => {
    event.stopPropagation()
    onClick(index)
    setConnected(!connected)

    if (groupRef.current) {
      gsap.to(groupRef.current.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      })
    }
  }

  useFrame(() => {
    if (groupRef.current) {
      // Ridotto il lerp factor per meno aggiornamenti
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, hovered ? 1.05 : 1, 0.05)
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, hovered ? 1.05 : 1, 0.05)
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, hovered ? 1.05 : 1, 0.05)
      // Aggiornamento meno frequente della rotazione
      if (Math.random() < 0.1) {
        groupRef.current.quaternion.copy(camera.quaternion)
      }
    }
  })

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main ATM Body */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.4, 2.4, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 1.5, 0.41]}>
        <planeGeometry args={[1, 1.6]} />
        <meshStandardMaterial 
          map={interfaceTexture} 
          emissive="#0f172a" 
          emissiveIntensity={0.3}
          transparent
        />
      </mesh>

      {/* Screen Border */}
      <mesh position={[0, 1.5, 0.4]}>
        <ringGeometry args={[0.52, 0.55]} />
        <meshStandardMaterial color="#10b981" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Crypto Symbol Display */}
      <group position={[0, 0.4, 0.42]}>
        {[
          [-0.3, 0],
          [-0.1, 0],
          [0.1, 0],
          [0.3, 0],
        ].map((pos, i) => {
          const symbol = CRYPTO_SYMBOLS[i % CRYPTO_SYMBOLS.length]
          return (
            <mesh key={i} position={[pos[0], pos[1], 0]}>
              <planeGeometry args={[0.15, 0.15]} />
              <meshStandardMaterial map={symbolTextures[symbol]} transparent alphaTest={0.5} />
            </mesh>
          )
        })}
      </group>

      {/* Status LED */}
      <mesh position={[0, 0.1, 0.41]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial 
          color={connected ? "#10b981" : "#ef4444"} 
          emissive={connected ? "#10b981" : "#ef4444"} 
          emissiveIntensity={2} 
        />
      </mesh>

      {/* Keypad - semplificato */}
      <group position={[0, -0.2, 0.35]}>
        {/* Singolo blocco per la tastiera invece di 12 elementi separati */}
        <mesh position={[0, -0.15, 0.06]}>
          <boxGeometry args={[0.5, 0.4, 0.04]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* Card Slot */}
      <mesh position={[0, -0.7, 0.35]}>
        <boxGeometry args={[0.6, 0.05, 0.1]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* ATM Label */}
      <Text
        position={[0, 2.6, 0.41]}
        fontSize={0.18}
        color="#10b981"
        anchorX="center"
        anchorY="middle"
      >
        CRYPTO ATM
      </Text>

      {/* Connection Status Text */}
      <Text
        position={[0, -1.1, 0.41]}
        fontSize={0.12}
        color={connected ? "#10b981" : "#ef4444"}
        anchorX="center"
        anchorY="middle"
      >
        {connected ? "CONNECTED" : "CONNECT WALLET"}
      </Text>

      {/* Ambient Light - unified */}
      <pointLight 
        position={[0, 1.5, 0.8]} 
        intensity={connected ? 1.2 : 0.8} 
        color={connected ? "#10b981" : "#ef4444"}
        distance={3}
      />
    </group>
  )
}