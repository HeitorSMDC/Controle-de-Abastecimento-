// src/components/ui/progress.tsx
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// 1. Define a nova prop 'indicatorClassName' na interface
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps // 2. Usa a nova interface
>(({ className, value, indicatorClassName, ...props }, ref) => ( // 3. Extrai 'indicatorClassName' das props
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      // 4. Usa o cn() para aplicar a 'indicatorClassName'
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all",
        indicatorClassName, // <-- APLICA AQUI
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };