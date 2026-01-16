
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, PenTool, History, Menu, X, Activity, BarChart3, Cloud, AlertTriangle, RefreshCw, DatabaseZap } from 'lucide-react';
import ReportForm from './components/ReportForm.tsx';
import Dashboard from './components/Dashboard.tsx';
import ReportList from './components/ReportList.tsx';
import Statistics from './components/Statistics.tsx';
import MigrationAssistant from './components/MigrationAssistant.tsx';
import { getReports, loadReportsFromGoogleSheets } from './services/reportService.ts';
import { DailyReport } from './types.ts';

// Sidebar Link Component
const NavLink = ({ to, icon: Icon, label, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 mb-2 group ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-50'}`} />
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </Link>
  );
};

const AppContent = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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
  }, [refreshTrigger]);

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

  const clearCacheAndReload = () => {
    if(window.confirm("ブラウザのデータを完全に消去してリセットしますか？ (保存済みのデータは消えます)")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const closeSidebar = () => setSidebarOpen(false);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-900 mb-4">読み込みエラーが発生しました</h1>
          <p className="text-slate-500 mb-8 text-sm">古いデータやネットワークエラーが原因でアプリが起動できない可能性があります。</p>
          <button 
            onClick={clearCacheAndReload}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            データをリセットして再起動
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900 antialiased">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-all duration-300 ease-in-out border-r border-white/5 shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
                <span className="font-black text-xl tracking-tighter block leading-none">Mystarz</span>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 block">Report Pro</span>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex flex-col h-[calc(100vh-100px)] justify-between">
            <nav className="p-6">
                <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Operations</p>
                <NavLink to="/" icon={PenTool} label="日報入力" onClick={closeSidebar} />
                <NavLink to="/dashboard" icon={LayoutDashboard} label="ダッシュボード" onClick={closeSidebar} />
                <NavLink to="/history" icon={History} label="履歴の一覧" onClick={closeSidebar} />
                <NavLink to="/import" icon={DatabaseZap} label="他データの移行" onClick={closeSidebar} />
                
                <div className="mt-10">
                    <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Analytics</p>
                    <NavLink to="/statistics" icon={BarChart3} label="月間集計表" onClick={closeSidebar} />
                </div>
            </nav>

            <div className="p-6">
                <button
                  onClick={handleSyncWithSheets}
                  disabled={isLoading}
                  className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-black text-white transition-all shadow-lg"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span className="ml-2">最新データを取得</span>
                </button>

                <div className="bg-emerald-900/30 rounded-2xl p-5 border border-emerald-500/20 text-center">
                    <p className="text-[11px] text-slate-300 font-medium">
                        クラウド同期 稼働中
                    </p>
                </div>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 text-slate-600 rounded-xl">
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-sm font-bold text-slate-400 hidden md:block">Mystarz 日報管理システム</div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900">技工スタッフ</p>
             </div>
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">ST</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#f8fafc]">
          <div className="max-w-[1600px] mx-auto p-6 lg:p-10 pb-20">
            <Routes>
                <Route path="/" element={<ReportForm onSuccess={handleRefresh} />} />
                <Route path="/dashboard" element={<Dashboard reports={reports} />} />
                <Route path="/history" element={<ReportList reports={reports} />} />
                <Route path="/statistics" element={<Statistics reports={reports} />} />
                <Route path="/import" element={<MigrationAssistant />} />
                <Route path="/entry" element={<Navigate to="/" replace />} />
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
