import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[18px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_18px_rgba(47,42,38,0.10)] hover:bg-accent",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_10px_18px_rgba(47,42,38,0.10)] hover:bg-destructive/90",
        outline:
          "border-2 border-input bg-secondary shadow-[0_8px_16px_rgba(47,42,38,0.06)] hover:bg-primary/35 hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_8px_16px_rgba(47,42,38,0.06)] hover:bg-primary/35",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[16px] px-3 text-xs",
        lg: "h-10 rounded-[20px] px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
