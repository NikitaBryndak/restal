import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
	return (
		<input
			type={type}
			className={cn(
				"peer flex h-10 w-full rounded-md border border-white bg-background px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-white transition",
				className
			)}


			ref={ref}
			{...props}
		/>
	)
})
Input.displayName = "Input"

export { Input }
