import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { articleSchema, ArticleFormValues } from '@/app/add-article/schema';
import { useRouter } from 'next/navigation';
import { PreviewState } from '../types';

export const useAddArticleForm = () => {
    const router = useRouter();

    const form = useForm<ArticleFormValues>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            tag: "All",
            images: "",
            title: "",
            description: "",
            content: "",
            creatorEmail: "",
        },
        mode: 'onChange',
    });

    const formValues = useWatch<ArticleFormValues>({
        control: form.control,
    });


    const mapToPreview = (values: Partial<ArticleFormValues>): PreviewState => ({
        title: (values.title as string) || "Untitled article",
        description: (values.description as string) || "No description provided",
        content: (values.content as string) || "Start writing your article...",
        images: (values.images as string) || "",
        tag: (values.tag as "First" | "Second" | "Third" | "Fourth" | "Fifth" | "All") || "All",
        creatorEmail: values.creatorEmail || "Unknown author",
    });

    const previewState = mapToPreview(formValues);
    
    
    const onSubmit = async (data: ArticleFormValues) => {
        const payload = {
            tag: data.tag,
            images: data.images,
            title: data.title,
            description: data.description,
            content: data.content,
            creatorEmail: data.creatorEmail,
        };
        
        try {
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const resData = await res.json().catch(() => ({}));
                alert('Error creating article: ' + (resData.message || res.statusText));
                return;
            }
            alert('Article created');
            router.push('/dashboard');
        } catch (err) {
            console.error('Create article error', err);
            alert('Error creating article');
        }
    };
    
    const onError = (errors: any) => {
        console.error('Form validation errors:', errors);
        const errorMessages = Object.values(errors)
        .map((error: any) => error.message)
        .filter(Boolean);
        
        if (errorMessages.length > 0) {
            alert(`Please fix the following errors:\n${errorMessages.join('\n')}`);
        } else {
            alert('Please check the form for errors.');
        }
    };
    
    return {
        form,
        previewState,
        onSubmit: form.handleSubmit(onSubmit, onError),
    };

}
