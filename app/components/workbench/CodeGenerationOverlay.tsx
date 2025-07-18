import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeGenerationOverlayProps {
  isVisible: boolean;
}

const GENERATION_MESSAGES = [
  "Just relax — GameTerminal is building your game...",
  "Have a sip of coffee ☕ — we're working.",
  "Your game is almost ready...",
  "Preview incoming any moment now..."
];

export function CodeGenerationOverlay({ isVisible }: CodeGenerationOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
    }, 10000); // 10 seconds interval as requested

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        backdropFilter: 'blur(6px)',
        pointerEvents: 'all'
      }}
    >
      <div className="text-center max-w-md mx-auto px-6">
        {/* Rotating Messages with Typewriter Effect */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessageIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <motion.h3 
              className="text-2xl font-light text-white leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 2,
                ease: "easeOut"
              }}
            >
              {GENERATION_MESSAGES[currentMessageIndex]}
            </motion.h3>
          </motion.div>
        </AnimatePresence>

        {/* Glowing Progress Bar */}
        <div className="relative">
          <div className="w-80 h-1 bg-gray-800/50 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400 rounded-full"
              style={{
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
              }}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          
          {/* Glowing dots */}
          <div className="flex justify-center items-center space-x-3 mt-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400"
                style={{
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 