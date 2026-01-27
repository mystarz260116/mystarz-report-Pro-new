
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, PenTool, History, Menu, X, BarChart3, Cloud, AlertTriangle, RefreshCw, ShieldCheck, Lock, ArrowRight, Delete } from 'lucide-react';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import ReportList from './components/ReportList';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import { getReports, loadReportsFromGoogleSheets } from './services/reportService';
import { DailyReport } from './types';

// パスワード認証コンポーネント
const AuthScreen = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const correctPin = '7551';

  const handleInput = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin === correctPin) {
        setTimeout(() => {
          localStorage.setItem('mystarz_auth', 'true');
          onAuthenticated();
        }, 300);
      } else if (newPin.length === 4) {
        setTimeout(() => {
          setError(true);
          setPin('');
        }, 300);
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 shadow-2xl text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-blue-500/20">
          <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">認証が必要です</h1>
        <p className="text-slate-400 font-bold text-sm mb-10">4桁のパスワードを入力してください</p>

        <div className="flex justify-center gap-4 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > i ? 'bg-blue-500 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
              } ${error ? 'bg-rose-500 animate-shake' : ''}`} 
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleInput(num.toString())}
              className="h-16 w-16 bg-white/5 hover:bg-white/10 active:bg-blue-600/20 text-white text-2xl font-black rounded-2xl border border-white/5 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div />
          <button onClick={() => handleInput('0')} className="h-16 w-16 bg-white/5 hover:bg-white/10 text-white text-2xl font-black rounded-2xl border border-white/5 flex items-center justify-center">0</button>
          <button onClick={handleDelete} className="h-16 w-16 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded-2xl border border-white/5 flex items-center justify-center transition-all">
            <Delete className="w-8 h-8" />
          </button>
        </div>

        {error && <p className="text-rose-500 font-black text-xs mt-8 animate-bounce">パスワードが正しくありません</p>}
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// Mystarz ロゴコンポーネント (URLを統一)
const MystarzLogo = ({ className }: { className?: string }) => {
  const LOGO_URL = 'http://www.mystarz.co.jp/M.png';

  return (
    <div className={`${className} overflow-hidden flex items-center justify-center bg-transparent`}>
      <img 
        src={LOGO_URL} 
        alt="Mystarz Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

const NavLink = ({ to, icon: Icon, label, color, onClick, sublabel }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-200 mb-3 group ${
        isActive 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
          : 'text-slate-600 hover:bg-white hover:shadow-md hover:text-blue-600'
      }`}
    >
      <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
        <Icon className={`w-7 h-7 ${isActive ? 'text-white' : color || 'text-slate-500'}`} />
      </div>
      <div>
        <span className="font-black text-lg tracking-tight block leading-tight">{label}</span>
        {sublabel && <span className={`text-[11px] font-bold block mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{sublabel}</span>}
      </div>
    </Link>
  );
};

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('mystarz_auth') === 'true');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadReportsFromGoogleSheets();
        const data = getReports();
        setReports(data);
      } catch (error) {
        console.error('Data loading error:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger, isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const handleSyncWithSheets = async () => {
    setIsLoading(true);
    try {
      await loadReportsFromGoogleSheets();
      setReports(getReports());
      alert('✅ 最新データを取得しました！');
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-900 mb-4">エラーが発生しました</h1>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold">再起動</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-900 antialiased animate-in fade-in duration-700">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={closeSidebar} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-slate-50 text-slate-900 transform transition-all duration-300 border-r border-slate-200 shadow-xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <MystarzLogo className="w-14 h-14" />
            <div>
                <span className="font-black text-2xl tracking-tighter block leading-none text-slate-900">Mystarz</span>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-1 block">Report Pro</span>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-slate-400 hover:text-slate-900"><X className="w-8 h-8" /></button>
        </div>
        
        <div className="flex flex-col h-[calc(100vh-112px)] justify-between overflow-y-auto">
            <nav className="p-6">
                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">メインメニュー</p>
                <NavLink to="/" icon={PenTool} label="日報入力" color="text-blue-500" onClick={closeSidebar} />
                <NavLink to="/statistics" icon={BarChart3} label="月間集計表" color="text-emerald-500" onClick={closeSidebar} />

                <div className="mt-12">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">管理設定</p>
                    <NavLink to="/admin" icon={ShieldCheck} label="管理者メニュー" sublabel="実績グラフ・履歴の確認" color="text-slate-700" onClick={closeSidebar} />
                </div>
            </nav>

            <div className="p-6 space-y-4">
                <button onClick={handleSyncWithSheets} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-5 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] text-lg font-black transition-all shadow-sm active:scale-95">
                  {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Cloud className="w-6 h-6" />} 最新同期
                </button>
                <button onClick={() => { localStorage.removeItem('mystarz_auth'); window.location.reload(); }} className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors">
                  <Lock className="w-3 h-3" /> ログアウトして画面をロック
                </button>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 text-slate-600 rounded-xl hover:bg-slate-100"><Menu className="w-8 h-8" /></button>
          <div className="text-sm font-black text-slate-400 hidden md:block tracking-widest uppercase">MYSTARZ 日報管理システム</div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block"><p className="text-base font-black text-slate-900 leading-none">技工スタッフ</p></div>
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg">ST</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-[1600px] mx-auto p-6 lg:p-10 pb-24">
            <Routes>
                <Route path="/" element={<ReportForm onSuccess={() => setRefreshTrigger(t => t + 1)} />} />
                <Route path="/statistics" element={<Statistics reports={reports} />} />
                <Route path="/admin" element={<Settings reports={reports} onSuccess={() => setRefreshTrigger(t => t + 1)} />} />
                <Route path="/entry" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
