
import React from 'react';
import { Card, Badge, Button } from '../../app/DesignSystem';
import { BarChartPlaceholder } from '../../shared/ui/charts/ChartPlaceholders';

const AdminDataPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
         <h1 className="text-2xl font-bold text-slate-800">Closet Insights & Data</h1>
         <p className="text-slate-500">Analyzing wardrobe composition and storage capacity.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
         <Card className="bg-white" title="Top Category" subtitle="Most common item type">
            <div className="text-center py-4">
               <div className="text-4xl mb-2">👕</div>
               <div className="text-2xl font-black text-navy-900">Tops (42%)</div>
               <p className="text-xs text-slate-400 mt-2">+5% growth this month</p>
            </div>
         </Card>
         <Card className="bg-white" title="Seasonal Split" subtitle="Items by season tag">
             <div className="space-y-3 mt-4">
                <div className="flex justify-between text-sm"><span>Spring/Summer</span> <span className="font-bold">58%</span></div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-[58%]"></div></div>
                <div className="flex justify-between text-sm"><span>Autumn/Winter</span> <span className="font-bold">42%</span></div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-navy-800 h-full w-[42%]"></div></div>
             </div>
         </Card>
         <Card className="bg-white" title="Storage Status" subtitle="Object storage (AWS S3)">
             <div className="text-center py-4">
                <div className="text-4xl font-black text-navy-900">1.2 TB</div>
                <div className="text-xs text-slate-400 uppercase mt-1 font-bold">Used Space</div>
                <Button variant="outline" size="sm" className="mt-4">Scale Storage</Button>
             </div>
         </Card>
      </div>

      <Card title="Wardrobe Evolution">
         <p className="text-slate-500 mb-8">Correlation between seasonal change and closet uploads.</p>
         <BarChartPlaceholder />
      </Card>
    </div>
  );
};

export default AdminDataPage;
