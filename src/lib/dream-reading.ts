export type TextSize = 'sm' | 'base' | 'lg';
export type LineSpacing = 'normal' | 'relaxed' | 'loose';

export const textSizeClasses: Record<TextSize, string> = {
  sm: 'prose-base',
  base: 'prose-lg',
  lg: 'prose-xl',
};

export const lineSpacingClasses: Record<LineSpacing, string> = {
  normal: 'prose-p:leading-[1.75] prose-li:leading-[1.75]',
  relaxed: 'prose-p:leading-[1.95] prose-li:leading-[1.9]',
  loose: 'prose-p:leading-[2.15] prose-li:leading-[2.05]',
};
