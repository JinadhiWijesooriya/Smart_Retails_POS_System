import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, User } from 'lucide-react';
import { api } from '../../services/api';

export const AuditScreen: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit/');
        setLogs(res.data);
      } catch (err) {
        console.error('Failed fetching audit logs', err);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 text-slate-800">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-display">System Security & Audit Trail</h1>
        <p className="text-xs text-slate-500 font-medium">Chronological log of sensitive operations, price changes, and stock overrides</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Metadata / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 text-slate-500 font-mono">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {log.username || 'System'}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {log.entity} #{log.entity_id}
                </td>
                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                  {JSON.stringify(log.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
