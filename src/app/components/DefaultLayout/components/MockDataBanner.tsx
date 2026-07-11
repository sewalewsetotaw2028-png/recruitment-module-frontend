import React from 'react';
import { useToast } from '@/components/common';

interface MockDataBannerProps {
  onTryApi: () => void;
}

export const MockDataBanner: React.FC<MockDataBannerProps> = ({ onTryApi }) => {
  const { toast } = useToast();

  const handleTryApi = () => {
    onTryApi();
    toast(
      'Switched to API mode. Reloading to attempt backend fetch...',
      'info',
    );
    setTimeout(() => window.location.reload(), 350);
  };

  return (
    <div className="w-full bg-yellow-50 text-yellow-800 text-sm py-1 text-center border-b border-yellow-200 flex items-center justify-center gap-3">
      <span>Running in mock mode — backend unavailable</span>
      <button
        type="button"
        onClick={handleTryApi}
        className="text-xs px-2 py-1 bg-yellow-100 rounded border border-yellow-200 hover:bg-yellow-200"
      >
        Try API
      </button>
    </div>
  );
};
