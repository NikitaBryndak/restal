"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { searchTexts } from "@/data";


export default function SearchBar({ className }: { className?: string }) {
    const [displayText, setDisplayText] = useState("");
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [deleting, setDeleting] = useState(false);

    // typing and deleting effect
    useEffect(() => {
        if (index >= searchTexts.length) return;
        const randomTypeDelay = Math.random() * 70 + 50;
        const randomDeleteDelay = Math.random() * 100 + 50;
        const timeout = setTimeout(() => {
        setSubIndex((prev) => prev + (deleting ? -1 : 1));

        // when finished typing
        if (!deleting && subIndex === searchTexts[index].length) {
            setTimeout(() => setDeleting(true), 1000); // pause before deleting
        }
        // when finished deleting
        else if (deleting && subIndex === 0) {
            setDeleting(false);
            setIndex((prev) => (prev + 1) % searchTexts.length);
        }
        }, deleting ? randomDeleteDelay : randomTypeDelay);

        return () => clearTimeout(timeout);
    }, [subIndex, deleting, index]);

    // update displayed text
    useEffect(() => {
        setDisplayText(searchTexts[index].substring(0, subIndex));
    }, [subIndex, index]);

    return (
        <div className="relative w-full max-w-md">
            <label htmlFor="search-query" className="sr-only">Пошук турів</label>
            <Input
                name="search-query"
                id="search-query"
                type="text"
                placeholder={displayText}
                aria-label="Пошук турів"
                className={`w-full ${className}`}
            />
        </div>
    );
}
