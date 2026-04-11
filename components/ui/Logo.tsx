import React from 'react';
import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className,
  iconClassName,
  textClassName 
}) => {
  // Define sizing logic
  const sizeMap = {
    sm: { iconBox: 'w-8 h-8 rounded-lg', iconSize: 16, textSize: 'text-xl' },
    md: { iconBox: 'w-10 h-10 rounded-[12px]', iconSize: 20, textSize: 'text-2xl' },
    lg: { iconBox: 'w-14 h-14 rounded-2xl', iconSize: 28, textSize: 'text-4xl' },
    xl: { iconBox: 'w-24 h-24 rounded-[32px]', iconSize: 48, textSize: 'text-6xl' },
  };

  const currentSize = sizeMap[size];

  const IconPart = () => (
    <div className={cn(
      "bg-[#0F7A60] flex items-center justify-center text-white shrink-0 shadow-sm",
      currentSize.iconBox,
      iconClassName
    )}>
      <Store size={currentSize.iconSize} strokeWidth={2.5} />
    </div>
  );

  const TextPart = () => (
    <span className={cn(
      "font-display font-black tracking-tighter leading-none text-current",
      currentSize.textSize,
      textClassName
    )}>
      Yayyam
    </span>
  );

  if (variant === 'icon') {
    return <div className={cn("inline-flex", className)}><IconPart /></div>;
  }

  if (variant === 'text') {
    return <div className={cn("inline-flex", className)}><TextPart /></div>;
  }

  if (variant === 'badge') {
    return (
       <div className={cn("inline-flex items-center relative", className)}>
         <TextPart />
         <div className="absolute top-0 -right-2 transform translate-x-full -translate-y-1/4 scale-[0.6]">
            <IconPart />
         </div>
       </div>
    );
  }

  // Full default (Icon on left, Text on right)
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <IconPart />
      <TextPart />
    </div>
  );
};
