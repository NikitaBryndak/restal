"use client";

import * as React from "react";

import { cn, getDateErrorMessage } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";

type FormatType = 'date' | 'time' | 'email' | 'phone' | 'none';

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    labelText?: string;
    containerClassName?: string;
    formatType?: FormatType;
};

const formatDateInput = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Limit to 8 digits (DDMMYYYY)
    const limited = numbers.slice(0, 8);

    const day = limited.slice(0, 2);
    const month = limited.slice(2, 4);
    const year = limited.slice(4);

    // Add slashes
    if (month.length > 0 && day.length === 2) {
        if (year.length > 0) {
            return `${day}/${month}/${year}`;
        }
        return `${day}/${month}`;
    } else if (day.length > 0) {
        return day;
    }

    return '';
};


const formatTimeInput = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Limit to 4 digits (HHMM)
    const limited = numbers.slice(0, 4);

    const hours = limited.slice(0, 2);
    const minutes = limited.slice(2, 4);

    // Add colon
    if (minutes.length > 0 && hours.length === 2) {
        return `${hours}:${minutes}`;
    } else if (hours.length > 0) {
        return hours;
    }

    return '';
};

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ labelText, containerClassName, className, id, name, formatType = 'none', onChange, value, ...rest }, ref) => {
        const controlId = id ?? name;
        const [displayValue, setDisplayValue] = React.useState('');
        const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
        const [isInvalid, setIsInvalid] = React.useState(false);
        const isControlled = value !== undefined;

        React.useEffect(() => {
            if (isControlled && typeof value === 'string') {
                setDisplayValue(value);
            }
        }, [value, isControlled]);

        const getTimeErrorMessage = (timeStr: string): string | null => {
            if (timeStr.length !== 5) return null; // Not complete yet
            const parts = timeStr.split(':');
            if (parts.length !== 2) return null;

            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);

            if (isNaN(hours) || isNaN(minutes)) {
                return 'Invalid time format.';
            }

            if (hours < 0 || hours > 23) {
                return 'Hours must be between 00 and 23.';
            }

            if (minutes < 0 || minutes > 59) {
                return 'Minutes must be between 00 and 59.';
            }

            return null; // Valid time
        };

        const getEmailErrorMessage = (emailStr: string): string | null => {
            if (!emailStr || emailStr.length === 0) return null; // Empty is okay (optional field)

            // Basic email validation regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(emailStr)) {
                return 'Please enter a valid email address.';
            }

            return null; // Valid email
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            let formattedValue = inputValue;

            if (formatType === 'date') {
                formattedValue = formatDateInput(inputValue);
                const error = getDateErrorMessage(formattedValue);
                setErrorMessage(error);
                setIsInvalid(error !== null);
            } else if (formatType === 'time') {
                formattedValue = formatTimeInput(inputValue);
                const error = getTimeErrorMessage(formattedValue);
                setErrorMessage(error);
                setIsInvalid(error !== null);
            } else if (formatType === 'email') {
                formattedValue = inputValue.trim();
                const error = getEmailErrorMessage(formattedValue);
                setErrorMessage(error);
                setIsInvalid(error !== null);
            } else {
                if (onChange) {
                    onChange(e);
                }
                return;
            }

            // For formatted inputs
            setDisplayValue(formattedValue);

            // Create a new event with the formatted value
            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    value: formattedValue,
                },
                currentTarget: {
                    ...e.currentTarget,
                    value: formattedValue,
                },
            } as React.ChangeEvent<HTMLInputElement>;

            if (onChange) {
                onChange(syntheticEvent);
            }
        };

        const inputProps = (formatType !== 'none' && formatType !== 'phone')
            ? {
                value: displayValue,
                onChange: handleChange,
                inputMode: (formatType === 'date' || formatType === 'time') ? 'numeric' as const :
                          formatType === 'email' ? 'email' as const : undefined
              }
            : { onChange, value };

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
                    className={cn(
                        "bg-background",
                        isInvalid && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                        className
                    )}
                    ref={ref}
                    aria-invalid={isInvalid}
                    {...inputProps}
                    {...rest}
                />
                {errorMessage && (
                    <p className="text-xs text-red-500 font-medium">
                        {errorMessage}
                    </p>
                )}
            </div>
        );
    }
);

FormInput.displayName = "FormInput";

export default FormInput;