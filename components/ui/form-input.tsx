import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    labelText?: string;
    containerClassName?: string;
    locale?: string;
};

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ labelText, containerClassName, className, id, name, locale, ...rest }, ref) => {
        const controlId = id ?? name;

        return (
            <div className={cn("space-y-1.5", containerClassName)}>
                {labelText && (
                    <Label htmlFor={controlId} className="text-sm font-medium text-foreground/80">
                        {labelText}
                    </Label>
                )}
                <Input
                    id={controlId}
                    name={name}
                    className={cn("bg-background", className)}
                    ref={ref}
                    {...rest}
                />
            </div>
        );
    }
);

FormInput.displayName = "FormInput";

export default FormInput;