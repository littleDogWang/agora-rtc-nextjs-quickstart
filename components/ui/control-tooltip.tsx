'use client';

import {
  cloneElement,
  useId,
  type ButtonHTMLAttributes,
  type ReactElement,
} from 'react';

type ControlTooltipProps = {
  label: string;
  children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
};

export function ControlTooltip({ label, children }: ControlTooltipProps) {
  const tooltipId = `control-tooltip-${useId().replaceAll(':', '')}`;
  const describedBy = [children.props['aria-describedby'], tooltipId]
    .filter(Boolean)
    .join(' ');

  return (
    <span className="group relative inline-flex">
      {cloneElement(children, { 'aria-describedby': describedBy })}
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 w-max max-w-48 -translate-x-1/2 rounded-md border border-white/10 bg-[#151515] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        {label}
      </span>
    </span>
  );
}
