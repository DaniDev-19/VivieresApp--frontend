"use client";

import React from "react";
import { motion } from "framer-motion";

interface InfiniteMarqueeProps {
    items: React.ReactNode[];
    speed?: number;
    direction?: "left" | "right";
    className?: string;
    itemClassName?: string;
}

export function InfiniteMarquee({
    items,
    speed = 40,
    direction = "left",
    className = "",
    itemClassName = "",
}: InfiniteMarqueeProps) {

    const duplicatedItems = [...items, ...items, ...items, ...items];

    const animateX = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];

    return (
        <div className={`relative overflow-hidden whitespace-nowrap py-4 ${className}`}>
            <motion.div
                className="inline-flex gap-8 md:gap-16 items-center"
                animate={{
                    x: animateX,
                }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                {duplicatedItems.map((item, index) => (
                    <div key={index} className={`shrink-0 ${itemClassName}`}>
                        {item}
                    </div>
                ))}
            </motion.div>

            {/* Gradient Overlays for smooth edges */}
            <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-gray-50 dark:from-gray-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-gray-50 dark:from-gray-950 to-transparent z-10" />
        </div>
    );
}
