import { z } from 'zod';


export const articleSchema = z.object({
    tag: z.enum(["Популярні країни", "Корисно знати", "Шпаргалки мандрівникам", "Інструкції сайта", "Послуги", "Умови бронювання"]),
    images: z.string(),
    title: z.string(),
    description: z.string(),
    content: z.string(),
    creatorPhone: z.string()
});

export type ArticleFormValues = z.infer<typeof articleSchema>;