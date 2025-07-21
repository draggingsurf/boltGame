import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface PanelHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const PanelHeader = memo(({ className, children }: PanelHeaderProps) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 glass-panel border-b-0 border-t-0 border-l-0 border-r-0 border-b border-bolt-elements-borderColor px-4 py-1 min-h-[34px] text-sm text-bolt-elements-textSecondary',
        className,
      )}
    >
      {children}
    </div>
  );
});
