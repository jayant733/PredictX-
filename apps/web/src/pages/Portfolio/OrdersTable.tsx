import React from 'react';

interface OrdersTableProps {
  openOrders: any[];
  formatCurrency: (val: number) => string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ openOrders, formatCurrency }) => {
  return (
    <div className="portfolio-glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">MARKET</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">SIDE</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">PRICE</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">FILLED</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">VALUE</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {openOrders.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">No open orders found.</td></tr>
            ) : (
              openOrders.map(order => (
                <tr key={order.id}>
                  <td className="px-6 py-5 text-sm font-bold">{order.marketTitle}</td>
                  <td className="px-6 py-5">
                    <span className={`text-xs font-bold uppercase ${order.side.includes('YES') ? 'text-secondary' : 'text-error'}`}>{order.side}</span>
                  </td>
                  <td className="px-6 py-5 font-data-mono text-sm">${order.price.toFixed(2)}</td>
                  <td className="px-6 py-5">
                    <div className="w-32 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${(order.filledShares / order.totalShares) * 100}%` }}></div>
                    </div>
                    <div className="text-[10px] text-on-surface-variant mt-1">{order.filledShares} / {order.totalShares} SHARES</div>
                  </td>
                  <td className="px-6 py-5 font-data-mono text-sm text-right">{formatCurrency(order.value)}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-error text-xs font-bold hover:underline cursor-pointer">Cancel</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
