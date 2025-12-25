
import React from 'react';
import { Card, Button, Input, Badge } from '../../app/DesignSystem';

const AdminSettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
         <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
         <p className="text-slate-500">Global configurations and administrative controls.</p>
      </div>

      <Card title="Global Configuration">
         <div className="grid md:grid-cols-2 gap-6">
            <Input label="Site Maintenance Mode" placeholder="Disabled" disabled />
            <Input label="Max Closet Storage per User (MB)" defaultValue="500" />
            <Input label="OpenAI Model Version" defaultValue="gpt-4o-mini" />
            <Input label="Weather Refresh Interval (min)" defaultValue="60" />
         </div>
         <div className="flex justify-end mt-6">
            <Button>Apply Changes</Button>
         </div>
      </Card>

      <Card title="Audit Log" subtitle="Last 24 hours of administrative actions.">
         <div className="divide-y divide-slate-100">
            {[
              { admin: 'Root', action: 'Modified Global Storage Limit', time: '10:42 AM' },
              { admin: 'Alex_Admin', action: 'Banned user: Elena_P', time: '09:15 AM' },
              { admin: 'System', action: 'Automated Backup Completed', time: '04:00 AM' },
              { admin: 'Root', action: 'Updated API Keys', time: 'Yesterday' },
            ].map((log, i) => (
              <div key={i} className="py-3 flex justify-between items-center text-sm">
                 <div>
                    <span className="font-bold text-navy-900">{log.admin}</span>
                    <span className="text-slate-500 mx-2">—</span>
                    <span className="text-slate-600">{log.action}</span>
                 </div>
                 <div className="text-slate-400 text-xs">{log.time}</div>
              </div>
            ))}
         </div>
         <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">View Full Audit Log</Button>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
