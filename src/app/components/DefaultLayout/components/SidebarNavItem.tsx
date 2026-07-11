import React from 'react';

interface SidebarNavItemProps {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  label,
  icon,
  isActive,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
        isActive
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
      }`}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{
          fontVariationSettings: isActive ? "'FILL' 1" : undefined,
        }}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
};
