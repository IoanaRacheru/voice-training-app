

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({
  className,
  thumbOnlyDrag = false,
  onPointerDownCapture,
  value,
  defaultValue,
  ...props
}, ref) => {
  const values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [0]
  const thumbCount = Math.max(1, values.length)

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event)
        if (!thumbOnlyDrag) return
        const target = event.target instanceof Element ? event.target : null
        if (!target?.closest(".slider-thumb")) {
          event.preventDefault()
        }
      }}
      value={value}
      defaultValue={defaultValue}
      {...props}>
      <SliderPrimitive.Track
        className="relative h-2 w-full grow overflow-hidden rounded-[1px] bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="slider-thumb block h-5 w-5 rounded-[1px] border-2 border-foreground bg-background shadow-[2px_2px_0_#694F5D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
