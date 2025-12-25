
import React from 'react';
import { Card, Badge, Input, Button } from '../../app/DesignSystem';

const AdminUsersPage: React.FC = () => {
  const users = [
    { name: 'Alex Rivera', email: 'alex@example.com', plan: 'Premium', status: 'Active', joined: 'May 12, 2024' },
    { name: 'Sarah Chen', email: 'sarah.c@gmail.com', plan: 'Free', status: 'Inactive', joined: 'Apr 28, 2024' },
    { name: 'Marcus Miller', email: 'marcus.m@outlook.com', plan: 'Premium', status: 'Active', joined: 'Apr 25, 2024' },
    { name: 'Elena Petrova', email: 'elena@petrova.io', plan: 'Free', status: 'Banned', joined: 'Mar 15, 2024' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
         <div className="flex gap-2">
            <Button variant="outline" size="sm">Export CSV</Button>
            <Button size="sm">+ Invite User</Button>
         </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="p-4 border-b border-slate-100 flex gap-4">
           <Input placeholder="Filter by name or email..." className="max-w-xs" />
           <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
              <option>All Plans</option>
              <option>Premium</option>
              <option>Free</option>
           </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
               <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {users.map((u, i) => (
                 <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs">{u.name.charAt(0)}</div>
                          <div>
                             <div className="text-sm font-bold text-navy-900">{u.name}</div>
                             <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                       <Badge variant={u.plan === 'Premium' ? 'success' : 'slate'}>{u.plan}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                       <Badge variant={u.status === 'Active' ? 'success' : u.status === 'Inactive' ? 'orange' : 'error'}>{u.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.joined}</td>
                    <td className="px-6 py-4">
                       <button className="text-slate-400 hover:text-navy-900 font-bold text-xs">Edit</button>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
           <div>Showing 4 of 12,402 users</div>
           <div className="flex gap-2">
              <Button variant="outline" size="sm" className="px-2 py-1">Previous</Button>
              <Button variant="outline" size="sm" className="px-2 py-1">Next</Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
