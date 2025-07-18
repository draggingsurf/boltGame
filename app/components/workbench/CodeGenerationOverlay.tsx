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
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    // Start typing animation immediately when visible
    setIsTyping(true);
    
    const messageChangeInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
    }, 5000); // 5 seconds between messages

    return () => clearInterval(messageChangeInterval);
  }, [isVisible]);

  // Typewriter effect for current message
  useEffect(() => {
    if (!isVisible) return;

    const currentMessage = GENERATION_MESSAGES[currentMessageIndex];
    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;
    const typewriterInterval = setInterval(() => {
      if (charIndex <= currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, charIndex));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typewriterInterval);
      }
    }, 50); // 50ms per character for smooth typing

    return () => clearInterval(typewriterInterval);
  }, [currentMessageIndex, isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0 } }} // Instant removal
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(5, 5, 5, 0.92)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'all'
      }}
    >
      <div className="text-center max-w-2xl px-8">
        {/* Animated Game Controller */}
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-7xl mb-8"
        >
          🎮
        </motion.div>

        {/* Typewriter Text */}
        <div className="mb-12 h-16 flex items-center justify-center">
          <motion.h2 
            className="text-2xl font-semibold text-emerald-400"
            key={currentMessageIndex}
          >
            {displayedText}
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-emerald-300"
              >
                |
              </motion.span>
            )}
          </motion.h2>
        </div>

        {/* Glowing Progress Animation */}
        <div className="relative">
          {/* Progress Container */}
          <div className="w-80 h-2 bg-slate-800 rounded-full mx-auto mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 rounded-full"
              animate={{
                x: ['-100%', '100%'],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                x: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{ width: '50%' }}
            />
          </div>

          {/* Pulsing Orbs */}
          <div className="flex justify-center items-center space-x-3">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.4, 1, 0.4],
                  boxShadow: [
                    '0 0 5px rgba(16, 185, 129, 0.3)',
                    '0 0 20px rgba(16, 185, 129, 0.8)',
                    '0 0 5px rgba(16, 185, 129, 0.3)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-emerald-400 rounded-full"
              />
            ))}
          </div>

          {/* Status Text */}
          <motion.p 
            className="text-sm text-slate-400 mt-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Generating your game code...
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
} 