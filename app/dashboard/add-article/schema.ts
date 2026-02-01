import { z } from 'zod';


export const articleSchema = z.object({
    tag: z.enum(["First", "Second", "Third", "Fourth", "Fifth","All"]),
    images: z.string(),
    title: z.string(),
    description: z.string(),
    content: z.string(),
    creatorPhone: z.string()
});

export type ArticleFormValues = z.infer<typeof articleSchema>;