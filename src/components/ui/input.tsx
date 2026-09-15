import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-full border border-gray-400/80 bg-transparent px-6 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-200 focus-visible:border-[#222] focus-visible:ring-1 focus-visible:ring-[#222] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
