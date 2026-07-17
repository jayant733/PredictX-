import React from 'react';

interface SecurityAlertsPanelProps {
  alerts: any[];
  loadingAlerts: boolean;
  onRefresh: () => void;
}

export const SecurityAlertsPanel: React.FC<SecurityAlertsPanelProps> = ({
  alerts,
  loadingAlerts,
  onRefresh
}) => {
  return (
    <div className="glass-panel mt-6 p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-6 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-error text-2xl animate-pulse">shield</span>
          <div>
            <h3 className="font-headline-sm text-on-surface flex items-center gap-2">
              Security & Risk Audits
              <span className="bg-error/10 text-error border border-error/20 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">FRAUD DETECTOR</span>
            </h3>
            <p className="text-xs text-outline">Real-time ledger security anomalies monitored by PredictX Fraud Agent.</p>
          </div>
        </div>
        <button 
          onClick={onRefresh}
          className="bg-surface-container-highest hover:bg-surface-variant text-on-surface border border-outline-variant/30 p-2 rounded-lg text-xs transition-all flex items-center justify-center active:scale-95 cursor-pointer"
          title="Refresh Audit Logs"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {loadingAlerts ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="h-6 w-6 border-2 border-error border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-outline font-data-mono animate-pulse">SCANNING LEDGER ACTIVITY...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-surface-container-low/40 border border-outline-variant/10 rounded-lg p-6 text-center">
            <span className="material-symbols-outlined text-secondary text-3xl mb-2">verified_user</span>
            <h4 className="font-bold text-sm text-on-surface mb-1">System Ledger Secured</h4>
            <p className="text-xs text-outline">No wash trading, price manipulation, or unusual volume spikes detected in your transaction log.</p>
          </div>
        ) : (
          alerts.map((alert: any) => (
            <div 
              key={alert.id} 
              className="p-4 bg-surface-container-low border border-outline-variant/20 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-surface-container-low/80"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded uppercase border ${
                    alert.severity === 'CRITICAL' 
                      ? 'bg-error/20 text-error border-error/40 animate-pulse' 
                      : alert.severity === 'HIGH' 
                        ? 'bg-error/10 text-error border-error/20' 
                        : alert.severity === 'MEDIUM' 
                          ? 'bg-warning/10 text-warning border-warning/20' 
                          : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs text-on-surface font-bold">
                    {alert.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-outline font-data-mono">
                    • {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {alert.description}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-secondary/10 text-secondary border border-secondary/20 uppercase whitespace-nowrap">
                {alert.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
