import type { Variants } from "framer-motion";

/**
 * Fades an element in while translating it upward.
 * Supports a custom index (`i`) for staggered delays.
 *
 * @pattern SharedMotionVariant
 * @usedBy HeroSection, FeaturesSection, HowItWorksContent
 * @example
 * ```tsx
 * import { fadeUp } from "@/lib/motion";
 * <motion.div variants={fadeUp} initial="hidden" whileInView="visible" custom={0} />
 * ```
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: i * 0.1 },
  }),
};

/**
 * Container variant that staggers its children.
 *
 * @pattern SharedMotionVariant
 * @usedBy FeaturesSection, HowItWorksContent
 * @example
 * ```tsx
 * import { stagger } from "@/lib/motion";
 * <motion.div variants={stagger} initial="hidden" animate="visible">
 *   {items.map((item) => <motion.div key={item.id} variants={fadeUp} />)}
 * </motion.div>
 * ```
 */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/**
 * Hero-specific container with longer duration and wider stagger.
 *
 * @pattern SharedMotionVariant
 * @usedBy HeroSection
 */
export const heroContainer: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, staggerChildren: 0.14 } },
};

/**
 * Hero-specific item variant.
 *
 * @pattern SharedMotionVariant
 * @usedBy HeroSection
 */
export const heroItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

/**
 * Stats grid scale-in variant.
 *
 * @pattern SharedMotionVariant
 * @usedBy HeroSection
 */
export const statsContainer: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: "easeOut", staggerChildren: 0.08 },
  },
};

/**
 * Carousel slide variants — full horizontal travel.
 * Pass the slide direction (-1 | 1) as the `custom` prop.
 *
 * @pattern SharedMotionVariant
 * @usedBy JobsCarousel
 * @example
 * ```tsx
 * import { slideVariantsFull, slideVariantsReduced, carouselTransition } from "@/lib/motion";
 * <AnimatePresence custom={direction}>
 *   <motion.div
 *     key={activeIndex}
 *     custom={direction}
 *     variants={reduceMotion ? slideVariantsReduced : slideVariantsFull}
 *     initial="enter" animate="center" exit="exit"
 *     transition={carouselTransition}
 *   />
 * </AnimatePresence>
 * ```
 */
export const slideVariantsFull: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", zIndex: 2 }),
  center: { x: 0, zIndex: 2 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", zIndex: 1 }),
};

/** Carousel slide variants — fade only (used when prefers-reduced-motion is active). */
export const slideVariantsReduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Standard carousel transition config. */
export const carouselTransition = {
  type: "tween" as const,
  duration: 0.45,
  ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
};
