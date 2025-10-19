import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";

type FormatType = 'date' | 'time' | 'email' | 'none';

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    labelText?: string;
    containerClassName?: string;
    locale?: string;
    formatType?: FormatType;
};

const isValidDate = (day: number, month: number, year: number): boolean => {
    // Check month is valid (1-12)
    if (month < 1 || month > 12) return false;
    
    // Check day is at least 1
    if (day < 1) return false;
    
    // Days in each month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Check for leap year (February can have 29 days)
    if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
        return day <= 29;
    }
    
    // Check day doesn't exceed days in month
    return day <= daysInMonth[month - 1];
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
    ({ labelText, containerClassName, className, id, name, locale, formatType = 'none', onChange, value, ...rest }, ref) => {
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

        const getDateErrorMessage = (dateStr: string): string | null => {
            if (dateStr.length !== 10) return null; // Not complete yet
            const parts = dateStr.split('/');
            if (parts.length !== 3) return null;
            
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            
            // Check if numbers are valid
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                return 'Invalid date format.';
            }
            
            // Check month range
            if (month < 1 || month > 12) {
                return 'Month must be between 01 and 12.';
            }
            
            // Check day range
            if (day < 1 || day > 31) {
                return 'Day must be between 01 and 31.';
            }

            // Check year bounds
            if (year < 1940 || year > 2050) {
                return 'Year must be between 1940 and 2050.';
            }
            
            // Check if date is valid for the specific month
            if (!isValidDate(day, month, year)) {
                const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                let maxDays = daysInMonth[month - 1];
                
                // Adjust for leap year
                if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
                    maxDays = 29;
                }
                
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                return `${monthNames[month - 1]} ${year} only has ${maxDays} days.`;
            }
            
            return null; // Valid date
        };

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

        const inputProps = formatType !== 'none' 
            ? { 
                value: displayValue, 
                onChange: handleChange,
                onInput: handleChange,
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