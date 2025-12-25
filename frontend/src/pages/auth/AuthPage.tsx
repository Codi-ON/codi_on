
import React, { useState } from 'react';
import { Button, Input, Card } from '../../app/DesignSystem';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <button onClick={() => onNavigate('landing')} className="text-3xl font-black text-navy-800 tracking-tighter mb-4 inline-block">CODION</button>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-500 mt-1">
            {mode === 'login' ? 'Enter your details to access your closet' : 'Start your stylish journey today'}
          </p>
        </div>

        <Card className="shadow-xl">
          <div className="space-y-5">
            {mode === 'signup' && (
              <Input label="Full Name" placeholder="Alex Rivera" />
            )}
            <Input label="Email Address" type="email" placeholder="alex@example.com" />
            <Input label="Password" type="password" placeholder="••••••••" />
            
            <Button size="lg" className="w-full" onClick={() => onNavigate('today')}>
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">Google</Button>
              <Button variant="outline" className="w-full">Apple</Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-slate-600">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            className="text-orange-500 font-bold hover:underline" 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
