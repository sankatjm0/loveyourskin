"use client"

import { useState } from "react"
import { generateCSV, downloadCSV, downloadJSON } from "@/lib/export-utils"

export default function ExportStatsButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  async function handleExport(format: "csv" | "json") {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/export-stats")
      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      const { stats } = await response.json()

      if (format === "csv") {
        const csv = generateCSV(stats)
        downloadCSV(
          csv,
          `business_statistics_${new Date().toISOString().split("T")[0]}.csv`
        )
      } else {
        downloadJSON(
          stats,
          `business_statistics_${new Date().toISOString().split("T")[0]}.json`
        )
      }

      setShowMenu(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed")
      console.error("[Export] Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
      >
        <span>📊</span>
        {loading ? "Exporting..." : "Export Stats"}
        <span className={`transform transition ${showMenu ? "rotate-180" : ""}`}>▼</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg z-10">
          <button
            onClick={() => handleExport("csv")}
            disabled={loading}
            className="w-full text-left px-4 py-3 hover:bg-muted transition disabled:opacity-50 flex items-center gap-2"
          >
            <span>📄</span>
            Download as CSV
          </button>
          <hr className="my-0" />
          <button
            onClick={() => handleExport("json")}
            disabled={loading}
            className="w-full text-left px-4 py-3 hover:bg-muted transition disabled:opacity-50 flex items-center gap-2"
          >
            <span>📋</span>
            Download as JSON
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
