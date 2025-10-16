import { useRef, useState, useMemo, useEffect, useCallback } from "react"
import * as THREE from "three"
import { Vector2, Vector3 } from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Text, Instances, Instance } from "@react-three/drei"
import { gsap } from "gsap"
import SlotMachine from "./slot-machine"
import CryptoATM from "./crypto-atm"
import RouletteTable, { triggerRouletteSpin } from "./roulette-table"
import SlotMiniGame from "./slot-mini-game"
import PlinkoMiniGame from "./plinko-mini-game"
import CoinFlipMiniGame from "./coin-flip-mini-game"
import Ceiling from "./ceiling"
import TVScreen from "./tv-screen"
import SafeText from "./safe-text"
import { useCoins } from "../hooks/use-coins"

export default function CasinoScene({ onSlotEnlarge, onSlotClose, isSlotEnlarged, onRouletteClick, onATMClick, onRouletteSpin, onSlotSpin, onMiniGameChange, onPlinkoButtons, onCoinFlipButtons }: {
  onSlotEnlarge: () => void
  onSlotClose: () => void  
  isSlotEnlarged: boolean
  onRouletteClick?: () => void
  onATMClick?: () => void
  onRouletteSpin?: (spinHandler: (result: number) => void) => void
  onSlotSpin?: (spinHandler: () => void, spinning: boolean) => void
  onMiniGameChange?: (gameType: 'slot' | 'plinko' | 'coinflip' | null) => void
  onPlinkoButtons?: (drop: () => void, reset: () => void, isPlaying: boolean) => void
  onCoinFlipButtons?: (chooseHeads: () => void, chooseTails: () => void, bet10: () => void, bet20: () => void, flip: () => void, isFlipping: boolean, currentChoice: string | null, currentBet: number) => void
}) {
  const { camera } = useThree()
  const sceneRef = useRef()
  const enlargedSlotRef = useRef()
  const { coins } = useCoins()
  const [enlargedSlot, setEnlargedSlot] = useState<number | null>(null)
  // Pass the spin handler to parent
  useEffect(() => {
    if (onRouletteSpin) {
      onRouletteSpin(triggerRouletteSpin)
    }
  }, [onRouletteSpin])

  // Create procedural textures
  const wallTexture = useMemo(() => createDynamicWallTexture(), [])
  const casinoFloorTexture = useMemo(() => createCasinoFloorTexture(), [])

  const handleSlotClick = (index: number) => {
    // Non permettere di cliccare su altre slot se una è già aperta
    if (isSlotEnlarged) {
      console.log('⚠️ Una slot è già aperta, ignoro il click')
      return
    }
    
    if (index === 0 || index === 1 || index === 2 || index === 3) {
      setEnlargedSlot(index)
      onSlotEnlarge()
      // Comunica quale tipo di gioco è stato aperto
      if (onMiniGameChange) {
        if (index === 1) {
          onMiniGameChange('plinko')
        } else if (index === 2) {
          onMiniGameChange('coinflip')
        } else {
          onMiniGameChange('slot')
        }
      }
    }
  }

  const handleATMClick = (index) => {
    if (onATMClick) {
      onATMClick()
    }
  }

  const handleRouletteClick = () => {
    if (onRouletteClick) {
      onRouletteClick()
      // Prevent pointer lock from triggering when clicking on roulette
      event?.stopPropagation()
    }
  }

  const closeEnlargedSlot = () => {
    setEnlargedSlot(null)
    onSlotClose()
    if (onMiniGameChange) {
      onMiniGameChange(null)
    }
  }

  // Create instances for repetitive elements - reduced for performance
  const enableCeilingPanels = false // Disabled for better performance
  const ceilingPanels: number[][] = []
  if (enableCeilingPanels) {
    for (let x = -10; x <= 10; x += 4) {  // Reduced from 2 to 4
      for (let z = -10; z <= 10; z += 4) {  // Reduced from 2 to 4
        ceilingPanels.push([x, 4, z, 0, 0, 0])
      }
    }
  }

  // Create floor tiles
  const floorTiles: number[][] = []
  for (let x = -10; x <= 10; x += 2) {
    for (let z = -10; z <= 10; z += 2) {
      floorTiles.push([x, 0, z])
    }
  }

  const wallPanels = useMemo(() => {
    const panels = []
    // Front and back walls - reduced for performance
    for (let x = -10; x <= 10; x += 4) {  // Reduced from 2 to 4
      panels.push([x, 2, -10, 0, 0, 0]) // Back wall
      panels.push([x, 2, 10, 0, Math.PI, 0]) // Front wall
    }
    // Side walls - reduced for performance
    for (let z = -10; z <= 10; z += 4) {  // Reduced from 2 to 4
      panels.push([-10, 2, z, 0, Math.PI / 2, 0]) // Left wall
      panels.push([10, 2, z, 0, -Math.PI / 2, 0]) // Right wall
    }
    return panels
  }, [])

  useFrame(() => {
    if (enlargedSlot !== null && enlargedSlotRef.current) {
      const cameraDirection = new Vector3()
      camera.getWorldDirection(cameraDirection)
      const screenPosition = camera.position.clone().add(cameraDirection.multiplyScalar(1.5))
      enlargedSlotRef.current.position.copy(screenPosition)
      enlargedSlotRef.current.quaternion.copy(camera.quaternion)
    }
  })

  useEffect(() => {
    if (enlargedSlot !== null && enlargedSlotRef.current) {
      gsap.from(enlargedSlotRef.current.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      })
    }
  }, [enlargedSlot])

  // Create parquet textures
  const { map: parquetTexture, normalMap: parquetNormalMap } = useMemo(() => createParquetTexture(), [])

  return (
    <group ref={sceneRef}>
      {/* Lighting optimized for green and white theme */}
      <ambientLight intensity={0.5} color="#f0fdf4" />
      <directionalLight position={[5, 5, 5]} intensity={0.7} color="#ffffff" castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#22c55e" />

      {/* Updated Floor with casino marble texture */}
      <Instances>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial
          map={casinoFloorTexture}
          metalness={0.3}
          roughness={0.6}
          envMapIntensity={0.5}
          color="#1e293b" // Dark base color
        />
        {floorTiles.map(([x, y, z], index) => (
          <Instance key={index} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} />
        ))}
      </Instances>

      {/* Walls with white and green theme */}
      <Instances>
        <boxGeometry args={[2, 4, 0.1]} />
        <meshStandardMaterial 
          map={wallTexture} 
          metalness={0.1} 
          roughness={0.9} 
          color="#f8f9fa" // More muted white for walls
          normalScale={new Vector2(0.1, 0.1)} 
        />
        {wallPanels.map(([x, y, z, rotX, rotY, rotZ], index) => (
          <Instance key={index} position={[x, y, z]} rotation={[rotX, rotY, rotZ]} />
        ))}
      </Instances>

      {/* Baseboards in green */}
      <Instances>
        <boxGeometry args={[2, 0.2, 0.05]} />
        <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.4} />
        {wallPanels.map(([x, y, z, rotX, rotY, rotZ], index) => (
          <Instance key={`baseboard-${index}`} position={[x, 0.1, z]} rotation={[0, rotY, 0]} />
        ))}
      </Instances>

      {/* Crown molding in green */}
      <Instances>
        <boxGeometry args={[2, 0.2, 0.05]} />
        <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.4} />
        {wallPanels.map(([x, y, z, rotX, rotY, rotZ], index) => (
          <Instance key={`crown-${index}`} position={[x, 3.9, z]} rotation={[0, rotY, 0]} />
        ))}
      </Instances>

      {/* Wall decorative elements */}
      <WallDecorations />

      {/* Add ceiling here */}
      <Ceiling />

      {/* Nascondi tutti gli oggetti interattivi quando una slot è aperta */}
      {!isSlotEnlarged && (
        <>
          {/* Roulette - with click handler */}
          <group onClick={(e) => {
            e.stopPropagation()
            handleRouletteClick()
          }}>
            <RouletteTable 
              position={[0, 0, -4]} 
            />
          </group>

          {/* Slot machines - positioned closer */}
          <SlotMachine position={[-5, 0, -1]} rotation={[0, Math.PI / 6, 0]} onClick={handleSlotClick} index={0} />
          <SlotMachine position={[5, 0, -1]} rotation={[0, -Math.PI / 6, 0]} onClick={handleSlotClick} index={1} />
          <SlotMachine position={[-1.5, 0, 5]} rotation={[0, Math.PI * 0.8, 0]} onClick={handleSlotClick} index={2} />
          {/* Slot index 3 removed - replaced with ATM */}

          {/* Crypto ATM - solo quello dietro */}
          <CryptoATM position={[1.5, 0, 5]} rotation={[0, Math.PI * 1.2, 0]} onClick={handleATMClick} index={0} />
        </>
      )}

      {/* TV Screen */}
      <TVScreen position={[4.3, 0, -3.7]} initialRotation={[0, -Math.PI / 3, 0]} />

      {/* Enlarged slot machine */}
      {enlargedSlot !== null && (
        <group ref={enlargedSlotRef}>
          {enlargedSlot === 0 && (
            <SlotMiniGame onClose={closeEnlargedSlot} isSlotEnlarged={isSlotEnlarged} onSpinClick={onSlotSpin} />
          )}
          {enlargedSlot === 1 && (
            <PlinkoMiniGame onClose={closeEnlargedSlot} isSlotEnlarged={isSlotEnlarged} onButtonsReady={onPlinkoButtons} />
          )}
          {enlargedSlot === 2 && <CoinFlipMiniGame onClose={closeEnlargedSlot} isSlotEnlarged={isSlotEnlarged} onButtonsReady={onCoinFlipButtons} />}
          {enlargedSlot === 3 && (
            <SlotMiniGame onClose={closeEnlargedSlot} isSlotEnlarged={isSlotEnlarged} onSpinClick={onSlotSpin} />
          )}
        </group>
      )}

      {/* Optimized decorations */}
      <Chandelier position={[0, 3.8, 0]} />
      <NeonSign position={[0, 3.3, -9.5]} />

      {/* Player position indicator - green theme */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#22c55e" opacity={0.6} transparent />
      </mesh>
    </group>
  )
}

function Chandelier({ position }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
      <pointLight color="#22c55e" intensity={0.7} distance={12} />
    </group>
  )
}

function NeonSign({ position }) {
  return (
    <group position={position}>
      {/* Cornice esterna */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[4.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#16a34a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cornice interna */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[4, 1, 0.1]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>

      {/* Testo principale - PUMP */}
      <SafeText 
        position={[0, 0.1, 0.1]} 
        fontSize={0.4}
        letterSpacing={0.1}
        lineHeight={1}
        color="#ffffff"
      >
        PUMP CASINO
      </SafeText>

      {/* Effetto glow */}
      <SafeText 
        position={[0, 0.1, 0.09]} 
        fontSize={0.4}
        letterSpacing={0.1}
        lineHeight={1}
        color="#ffffff"
        material-transparent 
        material-opacity={0.4}
      >
        PUMP CASINO
      </SafeText>

      {/* Sottotitolo */}
      <SafeText 
        position={[0, -0.3, 0.1]} 
        fontSize={0.15} 
        color="#22c55e"
      >
        Pills & Thrills
      </SafeText>

      {/* Luci decorative verdi */}
      <pointLight position={[-1.8, 0, 0.2]} color="#22c55e" intensity={0.5} distance={3} />
      <pointLight position={[1.8, 0, 0.2]} color="#22c55e" intensity={0.5} distance={3} />
      <pointLight position={[0, 0, 0.2]} color="#ffffff" intensity={0.3} distance={2} />
    </group>
  )
}

function WallDecorations() {
  // Create individual textures for each painting
  const frameTextures = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map(num => createCustomFrameTexture(`/quadro${num}.jpeg`))
  }, [])

  return (
    <group>
      {/* Small frames - solo sulle pareti laterali */}
      {[
        { position: [-9.9, 2, -5], rotation: [0, Math.PI / 2, 0], textureIndex: 0 }, // West wall (SLOT) 
        { position: [9.9, 2, 2], rotation: [0, -Math.PI / 2, 0], textureIndex: 1 }, // East wall (PLINKO)
      ].map((props, index) => (
        <group key={index} position={props.position as [number, number, number]} rotation={props.rotation as [number, number, number]}>
          {/* Outer frame - green theme */}
          <mesh position={[0, 0, -0.05]} scale={[1.1, 1.1, 1]}>
            <planeGeometry args={[1.5, 2]} />
            <meshStandardMaterial color="#16a34a" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Middle frame */}
          <mesh position={[0, 0, -0.03]} scale={[1.05, 1.05, 1]}>
            <planeGeometry args={[1.5, 2]} />
            <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Inner frame with custom image */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.5, 2]} />
            <meshStandardMaterial map={frameTextures[props.textureIndex]} />
          </mesh>
        </group>
      ))}

      {/* Large centerpiece frames - solo 2 quadri davanti alla roulette */}
      {[
        { position: [-5, 2, -9.85], textureIndex: 3, scale: [1.8, 1.8, 1] }, // Large on the left 
        { position: [4, 2, -9.85], textureIndex: 4, scale: [1.3, 1.3, 1] }, // Small on the right
      ].map((props, index) => (
        <group key={`large-${index}`} position={props.position as [number, number, number]}>
          {/* Outer frame */}
          <mesh position={[0, 0, -0.05]} scale={props.scale as [number, number, number]}>
            <planeGeometry args={[1.5, 2]} />
            <meshStandardMaterial color="#16a34a" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Middle frame */}
          <mesh position={[0, 0, -0.03]} scale={[props.scale[0] * 0.94, props.scale[1] * 0.94, 1]}>
            <planeGeometry args={[1.5, 2]} />
            <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Inner frame with custom image */}
          <mesh position={[0, 0, 0]} scale={[props.scale[0] * 0.88, props.scale[1] * 0.88, 1]}>
            <planeGeometry args={[1.5, 2]} />
            <meshStandardMaterial map={frameTextures[props.textureIndex]} />
          </mesh>

          {/* Frame lighting - green theme */}
          <pointLight position={[0, 2, 1]} color="#22c55e" intensity={0.3} distance={3} />
          <pointLight position={[0, -2, 1]} color="#22c55e" intensity={0.3} distance={3} />
        </group>
      ))}

      {/* Additional frame on back wall - spostato per evitare COIN FLIP */}
      <group position={[3, 2, 9.85]} rotation={[0, Math.PI, 0]}>
        {/* Outer frame */}
        <mesh position={[0, 0, -0.05]} scale={[1.4, 1.4, 1]}>
          <planeGeometry args={[1.5, 2]} />
          <meshStandardMaterial color="#16a34a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Middle frame */}
        <mesh position={[0, 0, -0.03]} scale={[1.32, 1.32, 1]}>
          <planeGeometry args={[1.5, 2]} />
          <meshStandardMaterial color="#22c55e" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Inner frame with 6th image */}
        <mesh position={[0, 0, 0]} scale={[1.24, 1.24, 1]}>
          <planeGeometry args={[1.5, 2]} />
          <meshStandardMaterial map={frameTextures[5]} />
        </mesh>
        {/* Frame lighting */}
        <pointLight position={[0, 2, 1]} color="#22c55e" intensity={0.3} distance={3} />
      </group>

      {/* Rest of the decorations... */}
      <group position={[-8, 0, -8]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.4, 0.5, 16]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      </group>
      <group position={[8, 0, 8]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.4, 0.5, 16]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      </group>

      {/* Applique decorative with green theme */}
      <WallLamp position={[-9.9, 2.5, -2]} rotation={[0, Math.PI / 2, 0]} />
      <WallLamp position={[9.9, 2.5, 2]} rotation={[0, -Math.PI / 2, 0]} />
      <WallLamp position={[2, 2.5, -9.9]} rotation={[0, 0, 0]} />
      <WallLamp position={[-2, 2.5, 9.9]} rotation={[0, Math.PI, 0]} />

      {/* Specchi decorativi */}
      <Mirror position={[-9.9, 2, 2]} rotation={[0, Math.PI / 2, 0]} />
      <Mirror position={[9.9, 2, -2]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  )
}

function WallLamp({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.2, 0.4, 0.1]} />
        <meshStandardMaterial color="#22c55e" metalness={0.7} roughness={0.3} />
      </mesh>
      <pointLight color="#22c55e" intensity={0.4} distance={5} position={[0, 0, 0.1]} />
    </group>
  )
}

function Mirror({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.1, 1.6, 0.05]} />
        <meshStandardMaterial color="#8B4513" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

function createDynamicFloorTexture() {
  const size = 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")

  if (!ctx) return new THREE.CanvasTexture(canvas)

  // White background with reduced saturation
  ctx.fillStyle = "#f8f9fa"
  ctx.fillRect(0, 0, size, size)

  // Checkered pattern with green and off-white
  const squareSize = 64
  for (let i = 0; i < size; i += squareSize) {
    for (let j = 0; j < size; j += squareSize) {
      if ((i / squareSize + j / squareSize) % 2 === 0) {
        ctx.fillStyle = "rgba(34, 197, 94, 0.25)" // Less saturated green
      } else {
        ctx.fillStyle = "rgba(248, 249, 250, 0.08)" // More muted off-white
      }
      ctx.beginPath()
      ctx.arc(i + squareSize / 2, j + squareSize / 2, squareSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Aggiunta di elementi decorativi verdi e bianchi
  const addDecorativeElements = (color: string, count: number) => {
    ctx.fillStyle = color
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = Math.random() * 15 + 5
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  addDecorativeElements("rgba(34, 197, 94, 0.4)", 30) // Verde
  addDecorativeElements("rgba(255, 255, 255, 0.6)", 30) // Bianco

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(5, 5)
  return texture
}

function createDynamicWallTexture() {
  const size = 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")

  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Off-white background with reduced saturation
  ctx.fillStyle = "#f8f9fa"
  ctx.fillRect(0, 0, size, size)

  // Create a muted green wavy lines pattern
  const createWavyPattern = (color: string, amplitude: number, frequency: number, lineWidth: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    for (let x = 0; x < size; x++) {
      const y = amplitude * Math.sin((x / size) * Math.PI * 2 * frequency) + size / 2
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  createWavyPattern("rgba(34, 197, 94, 0.3)", 50, 3, 10) // Verde
  createWavyPattern("rgba(255, 255, 255, 0.4)", 40, 5, 8) // Bianco

  // Aggiungi elementi decorativi con tema pillole
  const addDecorativeElements = (color: string, shape: string, count: number) => {
    ctx.fillStyle = color
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const elementSize = Math.random() * 20 + 10
      ctx.beginPath()
      if (shape === "circle") {
        ctx.arc(x, y, elementSize / 2, 0, Math.PI * 2)
      } else if (shape === "pill") {
        // Disegna una pillola (rettangolo con bordi arrotondati)
        const width = elementSize * 2
        const height = elementSize
        ctx.roundRect(x - width/2, y - height/2, width, height, height/2)
      }
      ctx.fill()
    }
  }

  addDecorativeElements("rgba(34, 197, 94, 0.2)", "pill", 15) // Pillole verdi
  addDecorativeElements("rgba(255, 255, 255, 0.3)", "circle", 20) // Cerchi bianchi

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 1)
  return texture
}

function createCustomFrameTexture(imagePath: string) {
  const size = 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")

  const texture = new THREE.CanvasTexture(canvas)

  if (!ctx) return texture

  // Create and load the custom image
  const img = new Image()
  img.src = imagePath

  // When the image loads, draw it onto the canvas and update the texture
  img.onload = () => {
    // Clear the canvas
    ctx.clearRect(0, 0, size, size)

    // Draw outer frame with green theme
    ctx.fillStyle = "#16a34a" // Dark green
    ctx.fillRect(0, 0, size, size)

    // Draw middle frame with medium green
    ctx.fillStyle = "#22c55e" // Medium green
    ctx.fillRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9)

    // Draw inner frame area
    ctx.fillStyle = "#ffffff" // White background for image
    ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8)

    // Calculate aspect ratio and drawing dimensions to fit the image properly
    const aspectRatio = img.width / img.height
    const frameAspectRatio = 0.8 // The inner frame aspect ratio
    
    let targetWidth = size * 0.8
    let targetHeight = size * 0.8
    
    if (aspectRatio > frameAspectRatio) {
      // Image is wider than frame
      targetHeight = targetWidth / aspectRatio
    } else {
      // Image is taller than frame
      targetWidth = targetHeight * aspectRatio
    }

    // Center the image
    const offsetX = (size - targetWidth) / 2
    const offsetY = (size - targetHeight) / 2

    // Draw the image to fit the frame while maintaining aspect ratio
    ctx.drawImage(img, offsetX, offsetY, targetWidth, targetHeight)

    // Add decorative corners with green theme
    const cornerSize = size * 0.08
    ctx.fillStyle = "#15803d" // Darker green for corners
    ;[
      [0, 0],
      [size, 0],
      [0, size],
      [size, size],
    ].forEach(([x, y]) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(x ? (y ? Math.PI : Math.PI / 2) : y ? -Math.PI / 2 : 0)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(cornerSize, 0)
      ctx.arcTo(0, 0, 0, cornerSize, cornerSize)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    })

    texture.needsUpdate = true
  }

  return texture
}

function createFrameTexture(isSmallFrame = false) {
  const size = 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")

  // Create and load the image
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = isSmallFrame
    ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/photo_2025-02-04_13-43-25.jpg-LwUy0XZqDWn9pGD712dirsFVcUveoj.jpeg"
    : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/photo_2025-02-04_15-26-27(1)(1).jpg-AniyI5SZroWR4GPm8ebGMQ4i93PfiS.jpeg"

  const texture = new THREE.CanvasTexture(canvas)

  // When the image loads, draw it onto the canvas and update the texture
  img.onload = () => {
    // Clear the canvas
    ctx.clearRect(0, 0, size, size)

    // Draw outer frame with dark brown
    ctx.fillStyle = "#8B4513" // Dark brown
    ctx.fillRect(0, 0, size, size)

    // Draw middle frame with medium brown
    ctx.fillStyle = "#A0522D" // Medium brown
    ctx.fillRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9)

    // Draw inner frame with lighter brown
    ctx.fillStyle = "#CD853F" // Light brown
    ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8)

    // Calculate aspect ratio and drawing dimensions
    const aspectRatio = img.width / img.height
    const targetWidth = size * 0.85
    const targetHeight = size * 0.85

    // Center the image
    const offsetX = size * 0.075
    const offsetY = size * 0.075

    // Draw the image to fill the frame while maintaining aspect ratio
    ctx.drawImage(img, offsetX, offsetY, targetWidth, targetHeight)

    // Add decorative corners
    const cornerSize = size * 0.15
    ctx.fillStyle = "#D2691E" // Chocolate brown for corners
    ;[
      [0, 0],
      [size, 0],
      [0, size],
      [size, size],
    ].forEach(([x, y]) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(x ? (y ? Math.PI : Math.PI / 2) : y ? -Math.PI / 2 : 0)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(cornerSize, 0)
      ctx.arcTo(0, 0, 0, cornerSize, cornerSize)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    })

    texture.needsUpdate = true
  }

  return texture
}

function createParquetTexture() {
  const size = 2048 // Increased size for better detail
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")

  // Base color for wood
  ctx.fillStyle = "#8B4513"
  ctx.fillRect(0, 0, size, size)

  // Create wood grain pattern
  function createWoodGrain(color1, color2) {
    const grainSize = size / 16
    ctx.fillStyle = color1

    for (let i = 0; i < size; i += grainSize) {
      for (let j = 0; j < size; j += grainSize) {
        const noise = Math.random() * 0.15
        ctx.fillStyle = `rgba(${Number.parseInt(color2)}, ${Number.parseInt(color2 * 0.8)}, ${Number.parseInt(color2 * 0.6)}, ${noise})`
        ctx.fillRect(i, j, grainSize, grainSize)

        // Add wood grain lines
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.1})`
        ctx.beginPath()
        ctx.moveTo(i, j)
        ctx.lineTo(i + grainSize, j + grainSize)
        ctx.stroke()
      }
    }
  }

  // Create herringbone pattern
  function createHerringbonePattern() {
    const boardWidth = size / 8
    const boardLength = boardWidth * 4

    // Create individual wooden boards
    for (let i = -boardLength; i < size + boardLength; i += boardWidth) {
      for (let j = -boardLength; j < size + boardLength; j += boardLength) {
        // Right-pointing board
        ctx.save()
        ctx.translate(i, j)
        ctx.rotate(Math.PI / 4)
        createWoodGrain("#8B4513", 139) // Saddle brown
        ctx.restore()

        // Left-pointing board
        ctx.save()
        ctx.translate(i + boardWidth, j)
        ctx.rotate(-Math.PI / 4)
        createWoodGrain("#8B4513", 139)
        ctx.restore()
      }
    }

    // Add subtle border between boards
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
    ctx.lineWidth = 2
    for (let i = 0; i < size; i += boardWidth) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, size)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(size, i)
      ctx.stroke()
    }
  }

  createHerringbonePattern()

  // Add varnish effect
  ctx.fillStyle = "rgba(255, 248, 220, 0.1)"
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4) // Adjust the repeat pattern

  // Create normal map
  const normalCanvas = document.createElement("canvas")
  normalCanvas.width = size
  normalCanvas.height = size
  const normalCtx = normalCanvas.getContext("2d")

  // Generate normal map from the texture
  const imageData = ctx.getImageData(0, 0, size, size)
  const normalImageData = normalCtx.createImageData(size, size)

  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % size
    const y = Math.floor(i / 4 / size)

    if (x < size - 1 && y < size - 1) {
      const right = imageData.data[i + 4]
      const bottom = imageData.data[i + size * 4]

      normalImageData.data[i] = 127 + (right - imageData.data[i]) // R
      normalImageData.data[i + 1] = 127 + (bottom - imageData.data[i]) // G
      normalImageData.data[i + 2] = 255 // B
      normalImageData.data[i + 3] = 255 // A
    }
  }

  normalCtx.putImageData(normalImageData, 0, 0)

  const normalTexture = new THREE.CanvasTexture(normalCanvas)
  normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping
  normalTexture.repeat.set(4, 4)

  return {
    map: texture,
    normalMap: normalTexture,
  }
}

function createCasinoFloorTexture() {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")

  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Base marmo scuro
  ctx.fillStyle = "#1e293b"
  ctx.fillRect(0, 0, size, size)

  // Venature marmo
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(34, 197, 94, ${0.1 + Math.random() * 0.2})`
    ctx.lineWidth = Math.random() * 3 + 1
    ctx.beginPath()
    
    const startX = Math.random() * size
    const startY = Math.random() * size
    ctx.moveTo(startX, startY)
    
    for (let j = 0; j < 6; j++) {
      const x = Math.random() * size
      const y = Math.random() * size
      ctx.quadraticCurveTo(
        startX + Math.random() * 100 - 50,
        startY + Math.random() * 100 - 50,
        x, y
      )
    }
    ctx.stroke()
  }

  // Bordi delle piastrelle
  ctx.strokeStyle = "#10b981"
  ctx.lineWidth = 2
  
  // Griglia piastrelle
  for (let x = 0; x <= size; x += size / 4) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }
  
  for (let y = 0; y <= size; y += size / 4) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  // Riflessi casuali
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const radius = Math.random() * 10 + 5
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, "rgba(248, 250, 252, 0.1)")
    gradient.addColorStop(1, "rgba(248, 250, 252, 0)")
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)

  return texture
}

