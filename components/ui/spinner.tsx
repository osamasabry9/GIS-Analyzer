import React from "react"
import { Loader2 } from "lucide-react"

export default function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <Loader2 className="animate-spin h-6 w-6 text-gray-700" />
    </div>
  )
}
