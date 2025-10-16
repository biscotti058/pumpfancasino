import { useRef, useState, useCallback, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"

const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
]

const getColor = (number: number) => {
  if (number === 0) return "#00ff00"
  return number % 2 === 0 ? "#000000" : "#ff0000"
}

// Global spin trigger
let globalSpinTrigger: ((result: number, hasWon?: boolean, winAmount?: number) => void) | null = null

export default function RouletteTable({ position }: { position: [number, number, number] }) {
  const wheelRef = useRef<THREE.Group>(null)
  const ballRef = useRef<THREE.Mesh>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [hasWon, setHasWon] = useState<boolean>(false)
  const [winAmount, setWinAmount] = useState<number>(0)
  const spinSpeed = useRef(0)
  const ballAngle = useRef(0)
  const ballRadius = useRef(0.9)

  // Register this roulette instance for global spin trigger
  useEffect(() => {
    globalSpinTrigger = (result: number, wonStatus: boolean = false, amount: number = 0) => {
      setSpinning(true)
      setResult(null)
      setHasWon(wonStatus)
      setWinAmount(amount)
      
      // Calculate the target position for the winning number
      const targetIndex = numbers.indexOf(result)
      const rotations = 5 + Math.random() * 3 // More rotations for dramatic effect
      const targetRotation = rotations * Math.PI * 2 + (targetIndex / 37) * Math.PI * 2
      
      if (wheelRef.current && ballRef.current) {
        const startRotation = wheelRef.current.rotation.y
        const startTime = Date.now()
        const duration = 4000 // 4 seconds for smooth animation
        
        // Reset ball position
        ballAngle.current = 0
        ballRadius.current = 0.9
        
        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // Custom easing: fast start, slow end (ease-out-cubic with extra smoothness)
          const easeOut = 1 - Math.pow(1 - progress, 4)
          
          if (wheelRef.current && ballRef.current) {
            // Animate wheel rotation
            wheelRef.current.rotation.y = startRotation + targetRotation * easeOut
            
            // Animate ball - it spins opposite direction and gradually falls inward
            const ballSpeed = (1 - easeOut) * 0.3 // Slows down as wheel slows
            ballAngle.current -= ballSpeed
            
            // Ball gradually moves inward
            ballRadius.current = 0.9 - (easeOut * 0.2) // Ends at radius 0.7
            
            // Update ball position
            ballRef.current.position.x = Math.cos(ballAngle.current) * ballRadius.current
            ballRef.current.position.z = Math.sin(ballAngle.current) * ballRadius.current
            
            // Ball bounces slightly at the end
            if (progress > 0.85) {
              const bounceProgress = (progress - 0.85) / 0.15
              const bounce = Math.sin(bounceProgress * Math.PI * 3) * 0.02 * (1 - bounceProgress)
              ballRef.current.position.y = 0.1 + bounce
            }
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            // Animation complete - show result
            setSpinning(false)
            setResult(result)
          }
        }
        
        animate()
      }
    }
    
    return () => {
      globalSpinTrigger = null
    }
  }, [])

  useFrame((state, delta) => {
    if (wheelRef.current && !spinning) {
      // Gentle idle rotation when not spinning
      wheelRef.current.rotation.y = state.clock.getElapsedTime() * 0.05
    }
  })

  return (
    <group position={position} scale={0.8}>
      {/* Base del tavolo roulette - più grande e dettagliata */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[7.2, 3, 4.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Gambe del tavolo */}
      {[
        [-3.4, -3, -1.9],
        [3.4, -3, -1.9],
        [-3.4, -3, 1.9],
        [3.4, -3, 1.9],
      ].map((legPosition, index) => (
        <mesh key={index} position={legPosition as [number, number, number]}>
          <cylinderGeometry args={[0.15, 0.15, 3, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Piano del tavolo */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[7.2, 0.2, 4.2]} />
        <meshStandardMaterial color="#166534" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Superficie del tavolo - verde casino */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Bordo dorato del tavolo */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.5]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* RUOTA DELLA ROULETTE - COMPONENTE PRINCIPALE */}
      <group position={[-2.5, 0.3, 0]}>
        {/* Base della ruota */}
        <mesh>
          <cylinderGeometry args={[1.3, 1.3, 0.15, 32, 1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Bordo esterno dorato */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[1.25, 1.25, 0.05, 32, 1]} />
          <meshStandardMaterial color="#eab308" metalness={0.4} roughness={0.6} />
        </mesh>

        {/* Ruota rotante con numeri */}
        <group ref={wheelRef} position={[0, 0.06, 0]}>
          {numbers.map((number, index) => (
            <group key={index} rotation={[0, (index / 37) * Math.PI * 2, 0]}>
              <mesh position={[1.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[0.18, 0.08, 0.05]} />
                <meshStandardMaterial color={getColor(number)} metalness={0.2} roughness={0.8} />
              </mesh>
              <Text
                position={[1.15, 0.04, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.05}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
              >
                {number.toString()}
              </Text>
            </group>
          ))}
        </group>

        {/* Pallina */}
        <mesh ref={ballRef} position={[1.1, 0.1, 0]}>
          <sphereGeometry args={[0.04, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.9} />
        </mesh>

        {/* Centro della ruota */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.12, 32]} />
          <meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.7} />
        </mesh>

        {/* Logo centrale */}
        <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 32]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Risultato display */}
        {result !== null && (
          <>
            <Text 
              position={[0, 0.7, 0]} 
              fontSize={0.25} 
              color={hasWon ? "#22c55e" : "#ef4444"} 
              outlineWidth={0.01} 
              outlineColor="#000000"
              fontWeight="bold"
            >
              {hasWon ? `WON ${winAmount}!` : `LOST!`}
            </Text>
            <Text 
              position={[0, 0.45, 0]} 
              fontSize={0.15} 
              color="#eab308" 
              outlineWidth={0.01} 
              outlineColor="#000000"
            >
              {`Number: ${result}`}
            </Text>
            {/* Glow effect */}
            <pointLight 
              position={[0, 0.6, 0]} 
              color={hasWon ? "#22c55e" : "#ef4444"} 
              intensity={2} 
              distance={2} 
              decay={2} 
            />
          </>
        )}
      </group>

      {/* Illuminazione */}
      <spotLight
        position={[0, 5, 0]}
        angle={Math.PI / 3}
        penumbra={0.8}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <ambientLight intensity={0.4} />
    </group>
  )
}

export const triggerRouletteSpin = (result: number, hasWon?: boolean, winAmount?: number) => {
  if (globalSpinTrigger) {
    globalSpinTrigger(result, hasWon, winAmount)
  }
}

