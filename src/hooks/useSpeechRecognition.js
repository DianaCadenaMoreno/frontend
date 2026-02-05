"use client"

import { useState, useEffect, useRef } from "react"

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech Recognition no está soportado en este navegador")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = "es-ES"

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece
        } else {
          interimTranscript += transcriptPiece
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognitionRef.current.onerror = (event) => {
      console.error("Error de reconocimiento de voz:", event.error)
      setIsListening(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.start()
    } else {
      recognitionRef.current.stop()
      setTranscript("")
    }
  }, [isListening])

  return {
    isListening,
    transcript,
    setIsListening,
  }
}

export default useSpeechRecognition
