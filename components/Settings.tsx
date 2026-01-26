
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  History 
} from 'lucide-react';
import Dashboard from './Dashboard';
import ReportList from './ReportList';
import { DailyReport } from '../types';

interface SettingsProps {
  reports: DailyReport[];
  onSuccess: () => void;
}

type TabType = 'charts' | 'history';

const Settings: React.FC<SettingsProps> = ({ reports, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<TabType>('charts');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ヘッダーエリア */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-100 pb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">管理者メニュー</h2>
            <p className="text-slate-500 font-bold text-base mt-1">実績データと履歴の確認</p>
          </div>
        </div>

        {/* タブ切り替えボタン */}
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'charts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart3 className="w-4 h-4" /> 統計グラフ
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <History className="w-4 h-4" /> 履歴の確認
          </button>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="animate-in fade-in zoom-in-95 duration-300">
        {activeTab === 'charts' && (
          <div className="bg-white rounded-[2.5rem] p-4 lg:p-10 border border-slate-200 shadow-sm">
            <Dashboard reports={reports} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
            <ReportList reports={reports} />
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] py-10">
        Mystarz Report Pro Management Hub
      </div>
    </div>
  );
};

export default Settings;
