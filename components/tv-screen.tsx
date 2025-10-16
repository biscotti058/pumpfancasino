
import { useState, useRef, useEffect, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"

const icons = [
  { name: "Telegram", url: "https://t.me/Pumpcasinofun", icon: "💎" },
  { name: "X", url: "https://x.com/pumpcasinofun", icon: "�" },
]

export default function TVScreen({ position, initialRotation }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const groupRef = useRef<THREE.Group>()
  const { camera } = useThree()

  // Create materials with enhanced properties
  const frameMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#1a1a1a",
      metalness: 0.7,
      roughness: 0.2,
      envMapIntensity: 1,
    })
    return material
  }, [])

  const screenMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#000000",
      metalness: 0.9,
      roughness: 0.1,
      emissive: new THREE.Color("#000000"),
      emissiveIntensity: 0.3,
    })
    return material
  }, [])

  const standMaterial = useMemo(() => {
    // Create a gradient texture for the stand
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, "#2a2a2a")
    gradient.addColorStop(1, "#1a1a1a")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1,
    })
    return material
  }, [])

  const buttonMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#2a2a2a",
      metalness: 0.6,
      roughness: 0.4,
      envMapIntensity: 1,
    })
  }, [])

  const buttonHoverMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#3a3a3a",
      metalness: 0.7,
      roughness: 0.3,
      emissive: new THREE.Color("#1a1a1a"),
      emissiveIntensity: 0.2,
    })
  }, [])

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2])
      groupRef.current.rotation.set(initialRotation[0], initialRotation[1], initialRotation[2])
    }
  }, [position, initialRotation])

  useFrame(() => {
    if (groupRef.current) {
      const targetRotation = Math.atan2(
        camera.position.x - groupRef.current.position.x,
        camera.position.z - groupRef.current.position.z,
      )

      const minRotation = initialRotation[1] - Math.PI / 6
      const maxRotation = initialRotation[1] + Math.PI / 6
      const clampedRotation = THREE.MathUtils.clamp(targetRotation, minRotation, maxRotation)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, clampedRotation, 0.1)
    }
  })

  return (
    <group ref={groupRef}>
      {/* TV Frame with enhanced bevels */}
      <mesh position={[0, 1.5, 0]} material={frameMaterial}>
        <boxGeometry args={[3, 2, 0.2]} />
      </mesh>

      {/* TV Screen with subtle glow */}
      <mesh position={[0, 1.5, 0.11]} material={screenMaterial}>
        <planeGeometry args={[2.8, 1.8]} />
      </mesh>

      {/* Decorative trim around screen */}
      <mesh position={[0, 1.5, 0.105]}>
        <boxGeometry args={[2.85, 1.85, 0.01]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* TV Stand with gradient */}
      <mesh position={[0, 0.5, 0]} material={standMaterial}>
        <cylinderGeometry args={[0.2, 0.3, 1, 32]} />
      </mesh>

      {/* Base plate for stability */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Icons with enhanced materials */}
      <group position={[0, 1.5, 0.12]}>
        {icons.map((icon, index) => {
          const x = (index % 2) * 1 - 0.5
          const y = Math.floor(index / 2) * -0.6 + 0.3
          return (
            <group key={icon.name} position={[x, y, 0]}>
              <mesh
                onPointerOver={() => setHovered(index)}
                onPointerOut={() => setHovered(null)}
                onClick={() => window.open(icon.url, "_blank")}
              >
                <planeGeometry args={[0.8, 0.5]} />
                <primitive object={hovered === index ? buttonHoverMaterial : buttonMaterial} attach="material" />
              </mesh>
              <Text position={[0, 0.1, 0.01]} fontSize={0.2} color="#ffffff">
                {icon.icon}
              </Text>
              <Text position={[0, -0.15, 0.01]} fontSize={0.08} color="#ffffff">
                {icon.name}
              </Text>
            </group>
          )
        })}
      </group>

      {/* TV Label with enhanced visibility */}
      <Text position={[0, 2.6, 0]} fontSize={0.15} color="#ffffff">
        Social Links
      </Text>

      {/* Ambient light for better visibility */}
      <pointLight position={[0, 1.5, 0.5]} intensity={0.2} color="#ffffff" />
    </group>
  )
}

