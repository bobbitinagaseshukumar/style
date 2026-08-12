import React from 'react';
import { motion } from 'framer-motion';

/**
 * 3D Floating Animation Wrapper
 * Adds a smooth, floating ease-in-out movement to elements.
 */
const FloatingElement = ({
  children,
  className = '',
  offsetY = 8,
  duration = 5,
  delay = 0,
  ...props
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -offsetY, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FloatingElement;
