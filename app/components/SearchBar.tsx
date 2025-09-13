"use client";

import { useState, useEffect } from "react";
import { Input } from "@/app/components/ui/input";

const texts = [
    "Погода в Єгипті...",
    "Кращі місця для відпочинку в Італії...",
    "Тури до Греції...",
    "Погода в Туреччині...",
    "Відпочинок на Мальдівах...",
    "Екскурсії по Франції...",
];

export default function SearchBar({ className }: { className?: string }) {
    const [displayText, setDisplayText] = useState("");
    const [index, setIndex] = useState(0); 
    const [subIndex, setSubIndex] = useState(0); 
    const [deleting, setDeleting] = useState(false);

    // typing and deleting effect
    useEffect(() => {
        if (index >= texts.length) return;

        const timeout = setTimeout(() => {
        setSubIndex((prev) => prev + (deleting ? -1 : 1));

        // when finished typing
        if (!deleting && subIndex === texts[index].length) {
            setTimeout(() => setDeleting(true), 1000); // pause before deleting
        }
        // when finished deleting
        else if (deleting && subIndex === 0) {
            setDeleting(false);
            setIndex((prev) => (prev + 1) % texts.length);
        }
        }, deleting ? 50 : 100);

        return () => clearTimeout(timeout);
    }, [subIndex, deleting, index]);

    // update displayed text    
    useEffect(() => {
        setDisplayText(texts[index].substring(0, subIndex));
    }, [subIndex, index]);

    return (
        <div className="relative w-full max-w-md">
        <Input type="text" placeholder={displayText} className={`w-full ${className}`} />
        </div>
    );
}
