import { cn } from "@/lib/utils"
import { Label } from "./label"
import { Input } from "./input"

type FormProps = {
    labelText?: string,
    placeholder: string,
    name: string,
    value?: string,
    id: string,
    className?: string
}

export default function FormInput(props:FormProps) {
    return (
        <div className={cn("", props.className)}>
            {props.labelText &&
            <Label
                htmlFor={props.name}
            >
                {props.labelText}
            </Label>
            }
            <Input
                placeholder={props.placeholder}
                name = {props.name}
                value = {props.value}
                id  = {props.id}
            >

            </Input>
        </div>
    )
}