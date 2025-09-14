import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function chooseRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}