import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  minLength?: number;
  className?: string;
}

export function FormField({
  id,
  label,
  type,
  required = false,
  disabled = false,
  placeholder,
  minLength,
  className
}: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm text-foreground/60 mb-1.5 block">
        {label}
      </Label>
      <Input
        type={type}
        id={id}
        name={id}
        required={required}
        disabled={disabled}
        className={`h-11 bg-background/50 border border-foreground/10 focus:border-foreground/30 ${className}`}
        minLength={minLength}
        placeholder={placeholder}
      />
    </div>
  );
}