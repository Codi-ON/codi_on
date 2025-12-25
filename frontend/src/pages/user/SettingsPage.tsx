
import React from 'react';
import { Card, Button, Input, Badge } from '../../app/DesignSystem';

const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-navy-900">Settings</h1>
        <p className="text-slate-500">Manage your profile and account preferences.</p>
      </div>

      <Card title="Profile Information" subtitle="Update your personal details and photo.">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
             <div className="w-20 h-20 rounded-2xl bg-slate-200 overflow-hidden ring-4 ring-slate-50 shadow-inner">
                <img src="https://picsum.photos/80/80?random=1" alt="Profile" />
             </div>
             <div>
                <Button size="sm" variant="outline" className="mb-2">Change Photo</Button>
                <p className="text-xs text-slate-400">JPG, GIF or PNG. 1MB max.</p>
             </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
             <Input label="First Name" defaultValue="Alex" />
             <Input label="Last Name" defaultValue="Rivera" />
             <Input label="Email" defaultValue="alex.rivera@example.com" disabled />
             <Input label="Location" defaultValue="San Francisco, CA" />
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
             <Button>Save Changes</Button>
          </div>
        </div>
      </Card>

      <Card title="Application Preferences">
        <div className="space-y-6">
           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <div className="font-bold text-navy-900">Dark Mode</div>
                <div className="text-sm text-slate-500">Toggle the interface appearance.</div>
              </div>
              <div className="w-12 h-6 bg-slate-300 rounded-full relative p-1 cursor-pointer">
                 <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
           </div>

           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <div className="font-bold text-navy-900">Push Notifications</div>
                <div className="text-sm text-slate-500">Get daily outfit alerts at 7:00 AM.</div>
              </div>
              <div className="w-12 h-6 bg-orange-500 rounded-full relative p-1 cursor-pointer flex justify-end">
                 <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
           </div>

           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <div className="font-bold text-navy-900">Unit System</div>
                <div className="text-sm text-slate-500">Switch between Celsius and Fahrenheit.</div>
              </div>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                 <button className="px-3 py-1 bg-navy-800 text-white text-xs font-bold rounded">°C</button>
                 <button className="px-3 py-1 text-slate-500 text-xs font-bold rounded">°F</button>
              </div>
           </div>
        </div>
      </Card>

      <div className="flex justify-between items-center py-6">
         <div className="text-sm text-slate-400">CODION v2.1.0 • Build 842</div>
         <Button variant="danger" size="sm">Deactivate Account</Button>
      </div>
    </div>
  );
};

export default SettingsPage;
