
import React from 'react';
import { SectionHeader, Card, Badge, Button } from '../../app/DesignSystem';
import { MOCK_ADMIN_KPI, MOCK_ADMIN_STATS } from '../../shared/ui/mock/data';
import { LineChartPlaceholder, BarChartPlaceholder } from '../../shared/ui/charts/ChartPlaceholders';
import { Download, Users, Activity, Package, TrendingUp, ArrowUpRight, ArrowDownRight, HardDrive, Cpu, Globe, Zap } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <SectionHeader 
        title="시스템 컨트롤 센터" 
        subtitle="전체 플랫폼의 사용자 활동 데이터와 인프라 자원 상태를 실시간으로 모니터링합니다."
        action={
           <>
              <Button variant="outline" size="sm" icon={Activity}>서버 로그</Button>
              <Button variant="primary" size="sm" icon={Download}>데이터 내보내기 (.XLSX)</Button>
           </>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {MOCK_ADMIN_KPI.map((kpi, i) => (
          <Card key={i} className="group hover:bg-navy-900 transition-all duration-500 cursor-default border-2 border-transparent hover:border-navy-800">
             <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-navy-900 group-hover:bg-white/10 group-hover:text-white transition-all duration-500 shadow-sm">
                   {i === 0 ? <Users size={24} /> : i === 1 ? <Zap size={24} /> : i === 2 ? <Package size={24} /> : <TrendingUp size={24} />}
                </div>
                <Badge variant={kpi.trendUp ? 'success' : 'error'}>
                   <div className="flex items-center gap-1 font-black">
                      {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {kpi.trend}
                   </div>
                </Badge>
             </div>
             <div className="text-[10px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</div>
             <div className="text-3xl font-black text-navy-900 group-hover:text-white transition-all duration-500">{kpi.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Main Analytics Area */}
        <div className="lg:col-span-8 space-y-10">
           <Card title="스타일 추천 엔진 트래픽" subtitle="최근 30일간의 AI 추천 생성 및 수락 트렌드 분석">
              <div className="h-80 w-full mb-8">
                <LineChartPlaceholder />
              </div>
              <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-50">
                 <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">일일 평균 추천</div>
                    <div className="text-2xl font-black text-navy-900">4,281건</div>
                 </div>
                 <div className="space-y-1 border-x border-slate-100 px-8">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">추천 수락률</div>
                    <div className="text-2xl font-black text-orange-500">68.5%</div>
                 </div>
                 <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API 응답 지연</div>
                    <div className="text-2xl font-black text-navy-900">142ms</div>
                 </div>
              </div>
           </Card>

           <div className="grid md:grid-cols-2 gap-8">
              <Card title="데이터베이스 분포" subtitle="카테고리별 아이템 비중">
                 <BarChartPlaceholder />
              </Card>
              <Card title="지역별 활성도" subtitle="실시간 날씨 동기화 지역">
                 <div className="space-y-6 py-2">
                    {[
                      { area: '서울 강남구', active: 2402, perf: 98 },
                      { area: '경기 성남시', active: 1840, perf: 92 },
                      { area: '부산 해운대구', active: 942, perf: 85 }
                    ].map((loc, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between text-xs font-black text-navy-900">
                            <span>{loc.area}</span>
                            <span>{loc.active} users</span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-navy-900" style={{ width: `${loc.perf}%` }} />
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>

        {/* Sidebar: System Infrastructure */}
        <div className="lg:col-span-4 space-y-10">
           <Card title="인프라 실시간 상태">
              <div className="space-y-10">
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                          <HardDrive size={14} className="text-slate-400" /> Storage (AWS S3)
                       </div>
                       <Badge variant="navy">{MOCK_ADMIN_STATS.storageUsed} / 5TB</Badge>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500 rounded-full" style={{ width: '24%' }} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                          <Cpu size={14} className="text-slate-400" /> GPU Clustering
                       </div>
                       <Badge variant="navy">42.4% Load</Badge>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-navy-900 rounded-full" style={{ width: '42%' }} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                          <Globe size={14} className="text-slate-400" /> Network I/O
                       </div>
                       <Badge variant="navy">Active</Badge>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }} />
                    </div>
                 </div>

                 <div className="pt-8 border-t border-slate-50">
                    <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-4">
                       <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                       <div className="space-y-0.5">
                          <p className="text-xs font-black text-emerald-900 uppercase tracking-widest leading-none">Healthy</p>
                          <p className="text-[11px] text-emerald-700 font-bold leading-none">All clusters operational</p>
                       </div>
                    </div>
                 </div>
              </div>
           </Card>

           <Card title="최근 관리자 활동" padding="none">
              <div className="divide-y divide-slate-100">
                 {[
                   { msg: 'Global Maintenance Finished', time: '12m ago', admin: 'Root' },
                   { msg: 'New User Tier Assigned: User_142', time: '45m ago', admin: 'Support_A' },
                   { msg: 'System Backup Initiated', time: '2h ago', admin: 'Auto_Bot' }
                 ].map((log, i) => (
                   <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="space-y-1">
                         <div className="text-xs font-bold text-navy-900 group-hover:text-orange-500 transition-colors">{log.msg}</div>
                         <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{log.admin}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">{log.time}</div>
                   </div>
                 ))}
              </div>
              <div className="p-6 border-t border-slate-100">
                 <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest">전체 로그 확인</Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
