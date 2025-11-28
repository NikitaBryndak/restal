"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

export const ToursSoldCounter = () => {
  const target = 1420;
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(target);
  }, [spring]);

  return (
    <div className="flex flex-col items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity duration-700 group cursor-default">
      <div className="flex items-baseline gap-1">
        <motion.span className="text-3xl md:text-4xl font-bold text-white tabular-nums tracking-tight group-hover:text-accent transition-colors duration-500">
          {display}
        </motion.span>
        <span className="text-accent text-lg md:text-xl font-light">+</span>
      </div>
      <p className="text-xs md:text-sm text-white/60 uppercase tracking-[0.2em] font-medium group-hover:text-white/80 transition-colors duration-500">
        Journeys Crafted
      </p>
    </div>
  );
};
