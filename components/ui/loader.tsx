"use client";
import { motion, easeInOut } from "motion/react";

const DOT_COUNT = 3;
const DOT_CLASS = "h-4 w-4 rounded-full border border-neutral-300 bg-linear-to-b from-neutral-400 to-neutral-300";

const createBounceTransition = (index: number) => ({
  duration: 1,
  repeat: Infinity,
  repeatType: "loop" as const,
  delay: index * 0.2,
  ease: easeInOut,
});

export const LoaderOne = () => (
  <div className="flex items-center gap-2">
    {Array.from({ length: DOT_COUNT }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: 0 }}
        animate={{ y: [0, 10, 0] }}
        transition={createBounceTransition(i)}
        className={DOT_CLASS}
      />
    ))}
  </div>
);

export const Loader = LoaderOne;
