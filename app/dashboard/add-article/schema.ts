import { z } from 'zod';


export const articleSchema = z.object({
    tag: z.enum(["Каталог Послуг", "Корисно знати", "Шпаргалки мандрівникам", "Інструкції сайта", "Умови бронювання"]),
    images: z.array(z.object({ url: z.string() })).refine(
        (arr) => arr.some((i) => i.url.trim().length > 0),
        { message: "At least one image URL is required" }
    ),
    title: z.string(),
    description: z.string(),
    content: z.string(),
    creatorPhone: z.string(),
    status: z.enum(["draft", "published"]),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;