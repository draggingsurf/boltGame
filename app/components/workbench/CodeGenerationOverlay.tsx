import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeGenerationOverlayProps {
  isVisible: boolean;
}

const GENERATION_MESSAGES = [
  "Just relax — GameTerminal is building your game...",
  "Have a sip of coffee ☕ — we're working.",
  "Your game is almost ready...",
  "Preview incoming any moment now...",
  "Compiling your gaming masterpiece...",
  "Assembling pixels and physics...",
  "Brewing some game magic ✨",
  "Turning your ideas into reality...",
  "Loading awesomeness, please wait...",
  "Crafting your digital playground...",
  "Game engines are spinning up...",
  "Almost there — perfecting the details..."
];

// Modern geometric SVG background with improved animations
const ModernSVGBackground = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-8"
    viewBox="0 0 1000 800"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      {/* Enhanced gradient definitions */}
      <linearGradient id="primary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
        <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.3" />
        <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
      </linearGradient>
      
      <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
      </radialGradient>

      {/* Refined patterns */}
      <pattern id="modern-dots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <circle cx="30" cy="30" r="1" fill="#10b981" opacity="0.25">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
        </circle>
      </pattern>

      <pattern id="elegant-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#10b981" strokeWidth="0.3" opacity="0.15" />
      </pattern>

      {/* Filter effects */}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Background layers */}
    <rect width="100%" height="100%" fill="url(#modern-dots)" />
    <rect width="100%" height="100%" fill="url(#elegant-grid)" />

    {/* Elegant floating orbs */}
    <motion.circle
      cx="200"
      cy="200"
      r="80"
      fill="url(#glow-gradient)"
      filter="url(#glow)"
      animate={{
        x: [0, 100, 50, 0],
        y: [0, -50, 30, 0],
        scale: [1, 1.2, 0.8, 1],
        opacity: [0.3, 0.6, 0.4, 0.3]
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />

    <motion.circle
      cx="700"
      cy="150"
      r="60"
      fill="url(#glow-gradient)"
      filter="url(#glow)"
      animate={{
        x: [0, -80, 40, 0],
        y: [0, 60, -30, 0],
        scale: [0.8, 1.1, 0.9, 0.8],
        opacity: [0.2, 0.5, 0.3, 0.2]
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 3
      }}
    />

    <motion.circle
      cx="800"
      cy="600"
      r="50"
      fill="url(#glow-gradient)"
      filter="url(#glow)"
      animate={{
        x: [0, -60, 80, 0],
        y: [0, -40, 20, 0],
        scale: [0.9, 1.3, 0.7, 0.9],
        opacity: [0.25, 0.55, 0.35, 0.25]
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 7
      }}
    />

    {/* Sophisticated geometric shapes */}
    <motion.g
      animate={{
        rotate: [0, 360],
        scale: [1, 1.15, 0.85, 1]
      }}
      transition={{
        duration: 35,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <polygon
        points="150,400 200,350 250,400 200,450"
        fill="url(#primary-gradient)"
        opacity="0.4"
        filter="url(#glow)"
      />
    </motion.g>

    {/* Flowing organic lines */}
    <motion.path
      d="M0,300 Q200,250 400,300 Q600,350 800,300 Q900,280 1000,300"
      stroke="url(#primary-gradient)"
      strokeWidth="2"
      fill="none"
      opacity="0.5"
      filter="url(#glow)"
      animate={{
        pathLength: [0, 1],
        opacity: [0, 0.7, 0]
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />

    <motion.path
      d="M0,500 Q250,450 500,500 Q750,550 1000,500"
      stroke="url(#primary-gradient)"
      strokeWidth="1.5"
      fill="none"
      opacity="0.4"
      filter="url(#glow)"
      animate={{
        pathLength: [0, 1],
        opacity: [0, 0.6, 0]
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 4
      }}
    />

    {/* Animated code elements */}
    <motion.g
      animate={{
        x: [0, 20, 0],
        opacity: [0.2, 0.6, 0.2]
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <rect x="80" y="80" width="60" height="6" rx="3" fill="#10b981" opacity="0.4" />
      <rect x="80" y="95" width="90" height="6" rx="3" fill="#06b6d4" opacity="0.4" />
      <rect x="80" y="110" width="45" height="6" rx="3" fill="#3b82f6" opacity="0.4" />
    </motion.g>

    <motion.g
      animate={{
        x: [0, -15, 0],
        opacity: [0.2, 0.6, 0.2]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2
      }}
    >
      <rect x="820" y="650" width="50" height="5" rx="2.5" fill="#10b981" opacity="0.4" />
      <rect x="820" y="663" width="75" height="5" rx="2.5" fill="#06b6d4" opacity="0.4" />
      <rect x="820" y="676" width="35" height="5" rx="2.5" fill="#3b82f6" opacity="0.4" />
    </motion.g>
  </svg>
);

export function CodeGenerationOverlay({ isVisible }: CodeGenerationOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
    }, 10000); // Changed to 10 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] // Smooth easing curve
      }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ pointerEvents: 'all' }}
    >
      {/* Enhanced gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-slate-950/98 via-slate-900/95 to-slate-950/98 glass-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ backdropFilter: 'blur(16px)' }}
      />
      
      {/* SVG Background Pattern */}
      <ModernSVGBackground />

      {/* Content with enhanced animations */}
      <motion.div 
        className="relative z-10 text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.2,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        {/* Enhanced Game Controller Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
            y: [0, -8, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-7xl mb-8 filter drop-shadow-2xl"
          style={{
            textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          }}
        >
          🎮
        </motion.div>

        {/* Sophisticated message transitions */}
        <div className="mb-12 h-16 flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ 
                opacity: 0, 
                y: 40,
                scale: 0.9,
                filter: "blur(10px)"
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1,
                filter: "blur(0px)"
              }}
              exit={{ 
                opacity: 0, 
                y: -40,
                scale: 1.1,
                filter: "blur(10px)"
              }}
              transition={{ 
                duration: 1.2,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="absolute max-w-2xl"
            >
              <h3 className="text-2xl font-medium text-[#8EFD47] drop-shadow-2xl tracking-wide whitespace-nowrap">
                {GENERATION_MESSAGES[currentMessageIndex]}
              </h3>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced loading animation */}
        <div className="flex justify-center items-center space-x-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
                y: [0, -12, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
              className="w-4 h-4 bg-gradient-to-r from-[#8EFD47] to-cyan-400 rounded-full"
              style={{
                boxShadow: '0 0 20px rgba(142, 253, 71, 0.6)'
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
} 