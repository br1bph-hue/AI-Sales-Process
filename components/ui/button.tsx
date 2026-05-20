import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-dsg-red text-white hover:bg-[#B82A33] active:bg-[#A4242C] shadow-sm",
        secondary:
          "bg-white border border-dsg-gray-300 text-dsg-gray-900 hover:bg-dsg-gray-50",
        outline:
          "border border-dsg-gray-300 bg-transparent text-dsg-gray-900 hover:bg-dsg-gray-50",
        ghost:
          "text-dsg-gray-700 hover:bg-dsg-gray-100 hover:text-dsg-gray-900",
        link:
          "text-dsg-navy underline-offset-4 hover:underline px-0 h-auto",
        destructive:
          "bg-dsg-red text-white hover:bg-[#B82A33]",
        disabled:
          "bg-dsg-gray-100 text-dsg-gray-500 cursor-not-allowed",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base font-semibold",
        icon: "h-10 w-10",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      block: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, block, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
