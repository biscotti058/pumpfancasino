"use client"

import { Text, useFont } from "@react-three/drei"
import { Suspense } from "react"

interface SafeTextProps {
  children: string
  position?: [number, number, number]
  fontSize?: number
  color?: string
  [key: string]: any
}

function SafeTextInner({ children, ...props }: SafeTextProps) {
  try {
    const font = useFont("/fonts/Geist-Bold.ttf")
    
    // Return null if font is not loaded
    if (!font) {
      return null
    }

    return (
      <Text font={font as any} {...props}>
        {children}
      </Text>
    )
  } catch (error) {
    // Fallback text without custom font
    return (
      <Text {...props}>
        {children}
      </Text>
    )
  }
}

export default function SafeText(props: SafeTextProps) {
  return (
    <Suspense fallback={null}>
      <SafeTextInner {...props} />
    </Suspense>
  )
}