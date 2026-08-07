export type ViewMode = 'grid' | 'list';

/**
 * Kart stagger animasyonu — container (initial="hidden" animate="visible")
 * ile orkestre edilir; her kart kendi `custom` index'iyle gecikmeli girer.
 * (Eski popular/category DreamCard'larının birebir birleşimi.)
 */
export const dreamCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.25, 0.25, 0, 1] as [number, number, number, number] },
  }),
};
