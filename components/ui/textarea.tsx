import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-dsg-gray-300 bg-white px-3 py-2 text-sm text-dsg-gray-900 placeholder:text-dsg-gray-500 focus:outline-none focus:ring-2 focus:ring-dsg-navy/40 focus:border-dsg-navy disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
