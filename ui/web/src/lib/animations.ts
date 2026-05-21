import type { Variants, Transition } from "framer-motion";

const easeOut: [number, number, number, number] = [0.0, 0.0, 0.2, 1.0];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: easeOut } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.1 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const slideInLeft: Variants = {
  hidden: { x: -12, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.18, ease: easeOut } },
  exit: { x: -12, opacity: 0, transition: { duration: 0.12 } },
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.8,
};

export const defaultTransition: Transition = {
  duration: 0.18,
  ease: easeOut,
};
