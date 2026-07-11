import React from 'react';
import { useApp } from '@/state';
import { useToast } from '@/components/common';

interface HeaderSearchBarProps {
  currentRole: string;
}

export const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({
  currentRole,
}) => {
  const { setActiveTab } = useApp();
  const { toast } = useToast();

  const getPlaceholder = () => {
    switch (currentRole) {
      case 'candidate':
        return 'Search open roles…';
      case 'recruiter':
      case 'hr':
      case 'hr_admin':
        return 'Search candidates, vacancies…';
      case 'ceo':
        return 'Search plans, requests, reports…';
      case 'hiring_manager':
        return 'Search interviews, requests…';
      default:
        return 'Search…';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentRole === 'candidate') setActiveTab('job_search');
      else if (currentRole === 'recruiter') setActiveTab('screening');
      else toast('Use sidebar navigation to open modules.', 'info');
    }
  };

  return (
    <div className="hidden min-w-0 flex-1 items-center sm:flex sm:max-w-md">
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
          search
        </span>
        <input
          className="input-field w-full rounded-full border-transparent bg-surface-container-low py-2 pl-10 pr-4 text-base text-on-surface focus:bg-white"
          placeholder={getPlaceholder()}
          type="search"
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
