"use client";

import { motion } from "framer-motion";

interface Props {
  delay?: number;
}

export function SkeletonCard({ delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      className="border border-gray-200 dark:border-gray-700 border-l-4 border-l-gray-200 dark:border-l-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-md w-2/5 animate-pulse" />
        <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-16 animate-pulse" />
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-1/3 animate-pulse" />
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-full animate-pulse" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-4/5 animate-pulse" />
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-3/5 animate-pulse pt-1" />
    </motion.div>
  );
}
