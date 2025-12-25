
import React from 'react';
import { Card, Badge, Button } from '../../app/DesignSystem';

const AdminRecoFunnelPage: React.FC = () => {
  const funnelSteps = [
    { label: 'Recommendations Generated', value: '124,500', conv: '100%', color: 'bg-navy-900' },
    { label: 'Users Viewed Recommendations', value: '102,400', conv: '82.2%', color: 'bg-navy-800' },
    { label: 'Outfit Selected (Choice Made)', value: '68,200', conv: '66.6%', color: 'bg-navy-700' },
    { label: 'Look Saved to History', value: '45,100', conv: '66.1%', color: 'bg-orange-500' },
    { label: 'Post-Day Positive Feedback', value: '12,200', conv: '27.0%', color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
         <h1 className="text-2xl font-bold text-slate-800">Recommendation Funnel</h1>
         <p className="text-slate-500">Tracking user actions from generation to feedback.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
         <div className="lg:col-span-7 space-y-4">
            {funnelSteps.map((step, i) => (
               <div key={i} className="flex items-center gap-4">
                  <div className={`h-12 flex items-center justify-between px-6 rounded-xl text-white font-bold shadow-sm ${step.color}`} style={{ width: `calc(${100 - i * 10}% )` }}>
                     <span className="truncate">{step.label}</span>
                     <span>{step.value}</span>
                  </div>
                  <div className="text-sm font-black text-slate-400">{step.conv}</div>
               </div>
            ))}
         </div>
         <div className="lg:col-span-5">
            <Card title="Drop-off Analysis" className="h-full">
               <div className="space-y-6">
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                     <div className="font-bold text-red-800 mb-1">High Drop-off (Step 2-3)</div>
                     <p className="text-sm text-red-700">33.4% of users view recommendations but don't select an outfit. Potential cause: Limited inventory matches.</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                     <div className="font-bold text-green-800 mb-1">Strong Retention (Step 3-4)</div>
                     <p className="text-sm text-green-700">66% of users who select an outfit end up saving it to history. High intent detected.</p>
                  </div>
                  <Button variant="outline" className="w-full">View Detailed Cohort Report</Button>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default AdminRecoFunnelPage;
