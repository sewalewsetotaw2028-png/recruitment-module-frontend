import React from 'react';

interface FrDemoPanelProps {
  screenKey: string;
  requirements: string[];
}

export const FrDemoPanel: React.FC<FrDemoPanelProps> = ({
  screenKey,
  requirements,
}) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
        <div>
          <h4 className="font-semibold text-amber-900 text-sm mb-1">
            Functional Requirements Demo
          </h4>
          <p className="text-amber-800 text-xs mb-2">
            Screen: <span className="font-mono">{screenKey}</span>
          </p>
          {requirements.length > 0 && (
            <ul className="text-amber-800 text-xs space-y-1 list-disc list-inside">
              {requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrDemoPanel;
