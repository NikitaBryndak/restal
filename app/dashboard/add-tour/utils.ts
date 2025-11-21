// This file contains utility functions for the add-tour feature.
// Most of the previous logic has been replaced by Zod schema validation and React Hook Form.

export const uppercase = (str: string): string => (str ? str.toUpperCase() : '');
