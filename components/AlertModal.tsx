"use client"

import { useState, useCallback } from "react"

interface AlertModalState {
  isOpen: boolean
  title: string
  message: string
  type: "info" | "success" | "error" | "warning"
  onClose?: () => void
}

let alertCallback: ((state: AlertModalState) => void) | null = null

export function useAlertModal() {
  return useCallback((message: string, type: "info" | "success" | "error" | "warning" = "info", title: string = "Alert") => {
    if (alertCallback) {
      alertCallback({
        isOpen: true,
        title,
        message,
        type,
      })
    }
  }, [])
}

export function AlertModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertModalState>({
    isOpen: false,
    title: "Alert",
    message: "",
    type: "info",
  })

  alertCallback = (newState: AlertModalState) => {
    setState(newState)
  }

  const handleClose = () => {
    setState(prev => ({ ...prev, isOpen: false }))
    state.onClose?.()
  }

  const getColors = () => {
    switch (state.type) {
      case "success":
        return { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", icon: "✓" }
      case "error":
        return { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", icon: "✕" }
      case "warning":
        return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", icon: "⚠" }
      default:
        return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", icon: "ℹ" }
    }
  }

  const colors = getColors()

  return (
    <>
      {children}
      {state.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${colors.bg} ${colors.border} border rounded-lg p-6 max-w-sm mx-4 shadow-lg`}>
            <div className="flex items-start gap-4">
              <div className={`text-2xl font-bold ${colors.text}`}>{colors.icon}</div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-2 ${colors.text}`}>{state.title}</h3>
                <p className={`${colors.text} text-sm mb-4`}>{state.message}</p>
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 rounded font-medium transition ${
                    state.type === "error"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : state.type === "success"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : state.type === "warning"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
