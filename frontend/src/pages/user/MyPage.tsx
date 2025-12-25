
import React from 'react';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/components/Button';
import { Badge } from '../../app/DesignSystem';
import { User, Shield, Bell, Moon, LogOut } from 'lucide-react';

const MyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">마이페이지</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">계정 정보 및 서비스 설정을 관리합니다.</p>
      </div>

      <Card>
        <div className="flex items-center gap-8 py-4">
           <div className="w-24 h-24 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="profile" />
           </div>
           <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-black text-[#0F172A]">김코디</h2>
                 <Badge variant="orange">Premium User</Badge>
              </div>
              <p className="text-sm text-slate-500 font-bold">kim_style@codion.com</p>
              <div className="flex gap-2 pt-2">
                 <Button size="sm" variant="outline">프로필 수정</Button>
              </div>
           </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
         <Card title="계정 보안">
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <Shield size={18} className="text-slate-400" />
                     <span className="text-sm font-bold">비밀번호 변경</span>
                  </div>
                  <Button variant="ghost" size="sm">변경하기</Button>
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl opacity-50">
                  <div className="flex items-center gap-3">
                     <Shield size={18} className="text-slate-400" />
                     <span className="text-sm font-bold">2단계 인증</span>
                  </div>
                  <Badge variant="slate">비활성화</Badge>
               </div>
            </div>
         </Card>

         <Card title="서비스 환경">
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <Bell size={18} className="text-slate-400" />
                     <span className="text-sm font-bold">푸시 알림</span>
                  </div>
                  <div className="w-10 h-6 bg-[#F97316] rounded-full relative p-1 flex justify-end">
                     <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <Moon size={18} className="text-slate-400" />
                     <span className="text-sm font-bold">다크 모드</span>
                  </div>
                  <div className="w-10 h-6 bg-slate-200 rounded-full relative p-1">
                     <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
               </div>
            </div>
         </Card>
      </div>

      <div className="flex justify-between items-center py-6 border-t border-slate-200">
         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">CODION V2.4.0 Built on May 2024</p>
         <Button variant="ghost" icon={LogOut} className="text-red-500 hover:bg-red-50 hover:text-red-600">로그아웃</Button>
      </div>
    </div>
  );
};

export default MyPage;
