import { useRef, useState, useMemo, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"
import { gsap } from "gsap"

const FRUIT_SYMBOLS = ["🍒", "🍋", "🍇"]  // Ridotto a 3 simboli per performance

export default function SlotMachine({
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
  const groupRef = useRef<THREE.Group>()
  const [hovered, setHovered] = useState(false)

  const createSymbolTexture = useCallback((symbol: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Gradiente verde moderno
      const gradient = ctx.createLinearGradient(0, 0, 0, 128)
      gradient.addColorStop(0, "#10b981")
      gradient.addColorStop(1, "#059669")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 128, 128)
      
      // Bordo meno brillante
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, 124, 124)
      
      // Simbolo
      ctx.fillStyle = "#f1f5f9"
      ctx.font = "bold 70px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(symbol, 64, 64)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])

  const symbolTextures = useMemo(() => {
    return FRUIT_SYMBOLS.reduce(
      (acc, symbol) => {
        acc[symbol] = createSymbolTexture(symbol)
        return acc
      },
      {} as Record<string, THREE.Texture>,
    )
  }, [createSymbolTexture])

  const handleClick = (event: THREE.Event) => {
    event.stopPropagation()
    onClick(index)

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
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, hovered ? 1.05 : 1, 0.1)
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, hovered ? 1.05 : 1, 0.1)
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, hovered ? 1.05 : 1, 0.1)
      groupRef.current.quaternion.copy(camera.quaternion)
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
      {/* Corpo principale slot - meno riflettente */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 2, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.7} />
      </mesh>

      {/* Schermo principale */}
      <mesh position={[0, 1.2, 0.41]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshStandardMaterial color="#0f172a" emissive="#10b981" emissiveIntensity={0.3} />
      </mesh>

      {/* Bordo schermo - meno metallico */}
      <mesh position={[0, 1.2, 0.4]}>
        <ringGeometry args={[0.42, 0.45]} />
        <meshStandardMaterial color="#10b981" metalness={0.3} roughness={0.6} />
      </mesh>

      <group position={[0, 1.2, 0.42]}>
        {[
          [-0.2, 0.1],
          [0, 0.1],
          [0.2, 0.1],
        ].map((pos, i) => {
          const symbol = FRUIT_SYMBOLS[i % FRUIT_SYMBOLS.length]
          return (
            <mesh key={i} position={[pos[0], pos[1], 0]}>
              <planeGeometry args={[0.2, 0.2]} />
              <meshStandardMaterial map={symbolTextures[symbol]} transparent alphaTest={0.5} />
            </mesh>
          )
        })}
      </group>

      {/* LED di stato verde */}
      <mesh position={[0, 0.6, 0.41]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
      </mesh>

      <Text
        position={[0, 2.2, 0.41]}
        fontSize={index === 2 ? 0.18 : 0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#10b981"
        material-emissive="#10b981"
        material-emissiveIntensity={0.3}
      >
        {index === 1 ? "PLINKO" : index === 2 ? "COIN FLIP" : "SLOT"}
      </Text>

      {/* Luce ambientale verde */}
      <pointLight position={[0, 1.2, 0.5]} intensity={0.8} color="#10b981" />
    </group>
  )
}

