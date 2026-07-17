import React from 'react';

interface CategoryAllocationsProps {
  allocations: Record<string, number>;
}

export const CategoryAllocations: React.FC<CategoryAllocationsProps> = ({ allocations }) => {
  return (
    <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/20 animate-fade-in">
      <h3 className="text-xs text-on-surface-variant font-label-caps mb-4">CATEGORY ALLOCATIONS</h3>
      <div className="space-y-4">
        {Object.entries(allocations || {}).map(([category, percentage]: any) => (
          <div key={category}>
            <div className="flex justify-between text-xs font-bold mb-1.5 text-on-surface">
              <span>{category} Markets</span>
              <span className="font-data-mono">{percentage}%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  category.toLowerCase() === 'crypto' 
                    ? 'bg-primary' 
                    : category.toLowerCase() === 'sports' 
                      ? 'bg-secondary' 
                      : 'bg-[#ff0055]'
                }`} 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
