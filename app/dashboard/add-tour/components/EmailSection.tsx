import { ChangeEvent } from 'react';

import FormInput from '@/components/ui/form-input';

type EmailSectionProps = {
    variant?: 'create' | 'edit';
    value?: string;
    onChange?: (value: string) => void;
    title?: string;
    description?: string;
};

export const EmailSection = ({
    variant = 'create',
    value,
    onChange,
    title = 'Email',
    description = 'Who is the primary contact for this tour?',
}: EmailSectionProps) => {
    const controlled = variant === 'edit' && onChange;

    const inputProps = controlled
        ? {
              value: value ?? '',
              onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
          }
        : {};

    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-foreground/60">{description}</p>
            </div>

            <FormInput
                labelText="Email"
                placeholder="e.g. john.doe@example.com"
                name="ownerEmail"
                type="email"
                autoComplete="off"
                formatType="email"
                {...inputProps}
            />
        </section>
    );
};
