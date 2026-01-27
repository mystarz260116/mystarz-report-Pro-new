
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  History,
  BookOpen,
  Calendar,
  MousePointer2,
  Keyboard,
  Save,
  Cloud,
  Lock,
  ArrowRight
} from 'lucide-react';
import Dashboard from './Dashboard';
import ReportList from './ReportList';
import { DailyReport } from '../types';

interface SettingsProps {
  reports: DailyReport[];
  onSuccess: () => void;
}

type TabType = 'charts' | 'history' | 'manual';

const ManualStep = ({ step, icon: Icon, title, description, color }: any) => (
  <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm relative group hover:shadow-md transition-all">
    <div className={`absolute -top-3 -left-3 w-10 h-10 ${color} text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg`}>
      {step}
    </div>
    <div className="flex flex-col items-center text-center mt-4">
      <div className={`w-16 h-16 ${color} bg-opacity-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

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
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BookOpen className="w-4 h-4" /> 簡単入力マニュアル
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

        {activeTab === 'manual' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">日報のつけかたガイド</h3>
                  <p className="text-slate-500 text-sm font-bold">誰でもわかる4つのステップ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <ManualStep 
                  step="1" 
                  icon={Calendar} 
                  title="日付と名前" 
                  description="カレンダーから今日を選び、名前リストから自分の名前を選びます。"
                  color="bg-blue-600"
                />
                <ManualStep 
                  step="2" 
                  icon={MousePointer2} 
                  title="部署を選ぶ" 
                  description="自分の所属している部署（大阪模型、完成Aなど）のボタンを押します。"
                  color="bg-emerald-500"
                />
                <ManualStep 
                  step="3" 
                  icon={Keyboard} 
                  title="個数を入力" 
                  description="その日に作った物の個数を数字で入れます。なければ空欄でOKです。"
                  color="bg-amber-500"
                />
                <ManualStep 
                  step="4" 
                  icon={Save} 
                  title="最後に保存" 
                  description="一番下の黒い「保存して報告」ボタンを押したら完了です！"
                  color="bg-slate-900"
                />
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-600" /> 知っておくと便利な機能
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900">最新同期ボタン</p>
                      <p className="text-[11px] font-bold text-slate-500 mt-1">他の人が入れたデータが見えないときは、このボタンを押すと最新状態になります。</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900">画面をロック</p>
                      <p className="text-[11px] font-bold text-slate-500 mt-1">作業を終えるときは、一番下の「画面をロック」を押すと安全に終了できます。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-600 text-white rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xl font-black tracking-tight">困ったときは？</p>
                  <p className="text-sm font-bold opacity-80 mt-1">操作を間違えても「履歴の確認」から修正ができます。</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('history')}
                className="px-8 py-3 bg-white text-blue-600 rounded-xl font-black text-sm shadow-lg hover:scale-105 transition-transform"
              >
                履歴を確認しにいく
              </button>
            </div>
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
