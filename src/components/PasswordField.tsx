// src/components/PasswordField.tsx

import * as React from "react"; // Importar * as React
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils"; // Importar cn

// A prop 'onChange' do formulário (react-hook-form) é diferente da 'onChange'
// que definimos (que espera um string).
// Vamos separar as props do Input das props customizadas.
export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  // A nossa 'onChange' customizada que só passa o valor string
  onChange: (value: string) => void;
  value: string;
}

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(({ className, value, onChange, placeholder = "••••••••", ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  // Este é o 'handler' nativo do <Input>.
  // Ele vai chamar a nossa prop 'onChange' apenas com o 'e.target.value'.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof onChange === "function") {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={handleChange} // Usa o handler que passa o texto
        placeholder={placeholder}
        className={cn("pr-10", className)}
        ref={ref} // Passa a ref
        {...props} // Passa o resto (id, required, onBlur, etc)
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
});

PasswordField.displayName = "PasswordField";