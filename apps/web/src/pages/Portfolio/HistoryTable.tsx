import React from 'react';

interface HistoryTableProps {
  transactionHistory: any[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ transactionHistory }) => {
  return (
    <div className="portfolio-glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">DATE/TIME</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">TYPE</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">AMOUNT</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">STATUS</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">TX ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 font-data-mono text-xs">
            {transactionHistory.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">No transaction history found.</td></tr>
            ) : (
              transactionHistory.map(tx => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 text-on-surface-variant">{tx.date}</td>
                  <td className="px-6 py-4 font-bold text-on-surface uppercase">{tx.type}</td>
                  <td className={`px-6 py-4 font-bold ${tx.isPositive ? 'text-secondary' : 'text-on-surface'}`}>{tx.amount}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-xs">check_circle</span> {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-on-surface-variant">{tx.txId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
