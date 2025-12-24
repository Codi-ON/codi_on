/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { 
  Check, ChevronDown, Calendar, Search, X, 
  AlertCircle, CheckCircle2, Loader2, MoreHorizontal,
  Mail, Bell, Shield, User, Filter, Download, Trash2,
  Inbox, WifiOff, LayoutGrid, Sliders
} from 'lucide-react';
import { Button, Card, Input, Chip, SectionTitle } from './DesignSystem';

// Helper for grid sections
const GridSection = ({ title, children, className="" }: any) => (
  <div className={`col-span-12 ${className}`}>
    <h3 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
      <div className="w-2 h-6 bg-brand-primary rounded-full"></div>
      {title}
    </h3>
    <div className="grid grid-cols-12 gap-8">
      {children}
    </div>
  </div>
);

const ComponentBlock = ({ title, children, className="col-span-12 md:col-span-6 lg:col-span-4" }: any) => (
  <div className={`space-y-4 ${className}`}>
    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
      {title}
    </h4>
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 items-start justify-center transition-all hover:border-slate-300">
      {children}
    </div>
  </div>
);

export const WebComponentKit = () => {
  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto bg-slate-50 min-h-screen font-sans">
      <div className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-4">
            <LayoutGrid size={12} />
            <span>DESIGN SYSTEM v2.0</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">UI Component Kit</h1>
        <p className="text-slate-500 max-w-2xl">
            A centralized library of all UI atoms, molecules, and organisms used in the Codion platform. 
            Designed for consistency, accessibility, and performance.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-y-16 gap-x-8">
        
        {/* --- SECTION 1: BUTTONS --- */}
        <GridSection title="Buttons & Interaction">
             <ComponentBlock title="Primary Button" className="col-span-12 md:col-span-4">
                <Button>Default State</Button>
                <Button className="hover:shadow-glow brightness-110">Hover State</Button>
                <Button className="scale-95">Active / Pressed</Button>
                <Button className="opacity-50 cursor-not-allowed">Disabled</Button>
                <Button><Loader2 className="animate-spin" size={18} /> Processing</Button>
             </ComponentBlock>

             <ComponentBlock title="Secondary Button" className="col-span-12 md:col-span-4">
                <Button variant="secondary">Default State</Button>
                <Button variant="secondary" className="bg-slate-50 border-slate-300">Hover State</Button>
                <Button variant="secondary" className="bg-slate-100 scale-95">Active / Pressed</Button>
                <Button variant="secondary" className="opacity-50 cursor-not-allowed">Disabled</Button>
                <Button variant="secondary"><Loader2 className="animate-spin text-slate-400" size={18} /> Loading</Button>
             </ComponentBlock>

             <ComponentBlock title="Ghost / Tertiary" className="col-span-12 md:col-span-4">
                <Button variant="ghost">Default State</Button>
                <Button variant="ghost" className="bg-slate-100/50 text-brand-primary">Hover State</Button>
                <Button variant="ghost" className="text-brand-primary-dark bg-brand-primary/10">Active / Pressed</Button>
                <Button variant="ghost" className="text-slate-300 cursor-not-allowed">Disabled</Button>
             </ComponentBlock>
        </GridSection>

        {/* --- SECTION 2: FORMS --- */}
        <GridSection title="Forms & Inputs">
            <ComponentBlock title="Text Fields" className="col-span-12 md:col-span-6">
                <Input placeholder="Default Input Placeholder" />
                <Input placeholder="Input with Icon" icon={Search} />
                <div className="relative w-full">
                    <label className="text-xs font-bold text-brand-primary mb-1.5 block ml-1">Focused State</label>
                    <Input placeholder="Focused..." className="ring-2 ring-brand-primary/20 border-brand-primary" />
                </div>
                <div className="relative w-full">
                     <label className="text-xs font-bold text-red-500 mb-1.5 block ml-1">Error State</label>
                     <div className="relative">
                        <Input placeholder="Invalid input" className="border-red-500 text-red-900 placeholder:text-red-300 pr-10" />
                        <AlertCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"/>
                     </div>
                     <p className="text-xs text-red-500 mt-1 ml-1">Please enter a valid email address.</p>
                </div>
                <Input placeholder="Disabled Input" className="bg-slate-100 text-slate-400 cursor-not-allowed border-transparent" disabled />
            </ComponentBlock>

            <div className="col-span-12 md:col-span-6 space-y-8">
                <ComponentBlock title="Selection Controls" className="col-span-12">
                     {/* Select */}
                     <div className="relative w-full">
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1">Dropdown Select</label>
                        <div className="relative">
                            <select className="w-full appearance-none bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-700 focus:outline-none focus:border-brand-primary transition-all cursor-pointer">
                                <option>Option 1</option>
                                <option>Option 2</option>
                                <option>Option 3</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        </div>
                     </div>
                     
                     {/* Date Picker Trigger */}
                     <div className="relative w-full">
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1">Date Picker</label>
                        <div className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 flex items-center justify-between text-slate-700 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all">
                            <span>2023. 10. 27</span>
                            <Calendar size={20} className="text-slate-400" />
                        </div>
                     </div>
                </ComponentBlock>

                <ComponentBlock title="Toggles & Switches" className="col-span-12">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium text-slate-600">Off State</span>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer transition-colors hover:bg-slate-300"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-all"></div></div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-bold text-slate-900">On State</span>
                        <div className="w-12 h-6 bg-brand-primary rounded-full relative cursor-pointer transition-colors shadow-glow"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm transition-all"></div></div>
                    </div>
                    <div className="flex items-center justify-between w-full opacity-50">
                        <span className="text-sm font-medium text-slate-500">Disabled</span>
                        <div className="w-12 h-6 bg-slate-100 rounded-full relative cursor-not-allowed"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div></div>
                    </div>
                </ComponentBlock>
            </div>

            <ComponentBlock title="Chips & Tabs" className="col-span-12">
                <div className="flex gap-2 flex-wrap">
                    <Chip>Default Chip</Chip>
                    <Chip active>Active Chip</Chip>
                    <div className="px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-300 border border-transparent cursor-not-allowed">Disabled</div>
                </div>
                
                <div className="w-full h-px bg-slate-100 my-2"></div>

                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full max-w-sm">
                    <button className="flex-1 py-2 bg-white rounded-lg shadow-sm text-sm font-bold text-slate-900 transition-all">Daily</button>
                    <button className="flex-1 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">Weekly</button>
                    <button className="flex-1 py-2 text-sm font-medium text-slate-400 cursor-not-allowed">Monthly</button>
                </div>
            </ComponentBlock>
        </GridSection>

        {/* --- SECTION 3: DATA DISPLAY --- */}
        <GridSection title="Data Display">
             <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <h4 className="font-bold text-slate-900">Users Table</h4>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">24</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><Filter size={16}/></button>
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><Download size={16}/></button>
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {/* Row 1 */}
                        <tr className="group hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">AK</div>
                                    <span className="font-medium text-slate-900">Alex Kim</span>
                                </div>
                            </td>
                            <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Active</span></td>
                            <td className="px-6 py-4 text-slate-500">Administrator</td>
                            <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal size={16}/></button></td>
                        </tr>
                        {/* Row 2 */}
                         <tr className="group hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">SJ</div>
                                    <span className="font-medium text-slate-900">Sarah Jones</span>
                                </div>
                            </td>
                            <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>Pending</span></td>
                            <td className="px-6 py-4 text-slate-500">Editor</td>
                            <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal size={16}/></button></td>
                        </tr>
                        {/* Skeleton Row */}
                        <tr>
                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div><div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div></div></td>
                            <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-8 w-8 bg-slate-100 rounded ml-auto animate-pulse"></div></td>
                        </tr>
                    </tbody>
                </table>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span>Showing 1-3 of 24 users</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 font-medium transition-colors" disabled>Previous</button>
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors">Next</button>
                    </div>
                </div>
             </div>

             <div className="col-span-12 lg:col-span-4 space-y-6">
                 <ComponentBlock title="List Rows" className="col-span-12 w-full">
                     <div className="w-full space-y-2">
                         <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 group">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all"><User size={20}/></div>
                             <div className="flex-1">
                                 <p className="font-bold text-sm text-slate-900">User Profile</p>
                                 <p className="text-xs text-slate-500">Manage account settings</p>
                             </div>
                             <ChevronDown size={16} className="-rotate-90 text-slate-300 group-hover:text-slate-500 transition-colors"/>
                         </div>
                         <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 group">
                             <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all"><Bell size={20}/></div>
                             <div className="flex-1">
                                 <p className="font-bold text-sm text-slate-900">Notifications</p>
                                 <p className="text-xs text-slate-500">2 unread messages</p>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-brand-primary shadow-glow"></div>
                         </div>
                     </div>
                 </ComponentBlock>

                 <ComponentBlock title="Badges & Tags" className="col-span-12 w-full">
                     <div className="flex flex-wrap gap-2">
                         <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">Neutral</span>
                         <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">Info</span>
                         <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100">Success</span>
                         <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-100">Warning</span>
                         <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">Error</span>
                         <span className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold border border-brand-primary/20">Brand</span>
                     </div>
                 </ComponentBlock>
             </div>
        </GridSection>

        {/* --- SECTION 4: FEEDBACK --- */}
        <GridSection title="Feedback & States">
            <div className="col-span-12 md:col-span-6 space-y-6">
                <ComponentBlock title="Inline Alerts" className="col-span-12 w-full">
                    <div className="w-full space-y-3">
                         <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-900">
                             <AlertCircle size={20} className="shrink-0 text-blue-600"/>
                             <div className="text-sm">
                                 <p className="font-bold">Information</p>
                                 <p className="opacity-80 text-xs mt-0.5 leading-relaxed">System maintenance is scheduled for tonight at 02:00 AM.</p>
                             </div>
                         </div>
                         <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-900">
                             <AlertCircle size={20} className="shrink-0 text-red-600"/>
                             <div className="text-sm">
                                 <p className="font-bold">Critical Error</p>
                                 <p className="opacity-80 text-xs mt-0.5 leading-relaxed">Failed to save changes. Please check your connection and try again.</p>
                             </div>
                         </div>
                    </div>
                </ComponentBlock>

                <ComponentBlock title="Tooltip" className="col-span-12 w-full">
                     <div className="relative inline-block my-4 mx-auto">
                         <Button variant="secondary" className="!w-auto">Hover Me</Button>
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                             Helper Text
                             <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                         </div>
                     </div>
                </ComponentBlock>
            </div>

            <div className="col-span-12 md:col-span-6">
                <ComponentBlock title="Empty States" className="col-span-12 w-full h-full">
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border-2 border-dashed border-slate-200">
                            <Inbox size={32}/>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">No Items Found</h4>
                        <p className="text-sm text-slate-500 mt-2 max-w-[240px] leading-relaxed">We couldn't find any items matching your current filters.</p>
                        <div className="flex gap-2 mt-6">
                            <Button variant="secondary" className="!w-auto !py-2 px-4 text-xs">Clear Filters</Button>
                            <Button className="!w-auto !py-2 px-4 text-xs">Add New Item</Button>
                        </div>
                    </div>
                </ComponentBlock>
            </div>
        </GridSection>

      </div>
    </div>
  );
};