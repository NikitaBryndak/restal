"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'

export function ContactButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  const resetInactivityTimer = () => {
    if (timer) clearTimeout(timer)
    if (isVisible) return 
    
    const newTimer = setTimeout(() => {
      setIsVisible(true)
    }, 5000)
    
    setTimer(newTimer)
  }

  useEffect(() => {
    // Initial timer
    const initialTimer = setTimeout(() => {
      setIsVisible(true)
    }, 5000)
    setTimer(initialTimer)

    // Setup event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer)
    })

    return () => {
      if (initialTimer) clearTimeout(initialTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [])

  if (!isVisible) return null

  return (
    <div 
      className="overflow-hidden"
      style={{ 
        '--expanded-width': '130px',
      } as React.CSSProperties}
    >
      <Link 
        href="/contact" 
        className=" py-2 bg-white/90 text-black rounded-md
                   hover:bg-white transition-colors flex items-center justify-center gap-2 text-sm
                   [animation:slideRollIn_0.8s_ease-out_forwards] origin-left"
        style={{
          width: 0,
          marginLeft: 0,
          opacity: 0,
        }}
      >
        Зв'язатись
        <Send className="w-4 h-4 flex-shrink-0" />
      </Link>
    </div>
  )
}