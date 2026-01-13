/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";

const LoadingPage = () => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#ebe5db]"
      style={{ minHeight: "100vh", width: "100vw" }}
    >
      <motion.img
        src="/assets/dhruvalogo.png"
        alt="Logo"
        className="w-32 h-32 object-contain"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.2, 1],
          opacity: [0, 1],
        }}
        transition={{
          duration: 1,
          ease: "easeOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="mt-8 text-black text-xl font-medium font-[glancyr]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        Loading...
      </motion.div>
    </div>
  );
};

export default LoadingPage;
