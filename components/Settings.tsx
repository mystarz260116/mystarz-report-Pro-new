
import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  BarChart3, 
  History, 
  DatabaseZap, 
  Settings as GearIcon 
} from 'lucide-react';
import Dashboard from './Dashboard';
import ReportList from './ReportList';
import MigrationAssistant from './MigrationAssistant';
import { DailyReport } from '../types';

interface SettingsProps {
  reports: DailyReport[];
  onSuccess: () => void;
}

type TabType = 'charts' | 'history' | 'migration' | 'general';

const Settings: React.FC<SettingsProps> = ({ reports, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<TabType>('charts');
  const [logoPreview, setLogoPreview] = useState<string | null>(localStorage.getItem('app_custom_logo'));
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ text: "画像ファイルを選択してください", type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      localStorage.setItem('app_custom_logo', base64);
      setMessage({ text: "ロゴを更新しました。サイドバーに反映されます。", type: 'success' });
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (window.confirm("カスタムロゴを削除してデフォルトに戻しますか？")) {
      localStorage.removeItem('app_custom_logo');
      setLogoPreview(null);
      setMessage({ text: "ロゴをデフォルトに戻しました。", type: 'success' });
      window.dispatchEvent(new Event('storage'));
    }
  };

  const clearCache = () => {
    if (window.confirm("【警告】ブラウザのキャッシュを完全にクリアします。保存されていない日報データなどは消去されます。よろしいですか？")) {
      localStorage.clear();
      window.location.reload();
    }
  };

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
            <p className="text-slate-500 font-bold text-base mt-1">各種データの確認とアプリ設定</p>
          </div>
        </div>

        {/* タブ切り替えボタン */}
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'charts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart3 className="w-4 h-4" /> 統計グラフ
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <History className="w-4 h-4" /> 履歴の確認
          </button>
          <button 
            onClick={() => setActiveTab('migration')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'migration' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <DatabaseZap className="w-4 h-4" /> データ移行
          </button>
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <GearIcon className="w-4 h-4" /> 基本設定
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

        {activeTab === 'migration' && (
          <MigrationAssistant />
        )}

        {activeTab === 'general' && (
          <div className="max-w-4xl mx-auto space-y-10">
            {message && (
                <div className={`p-5 rounded-2xl flex items-center gap-4 animate-bounce border ${
                message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
                <p className="font-black text-sm">{message.text}</p>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <ImageIcon className="w-6 h-6 text-blue-500" />
                  <h3 className="text-xl font-black text-slate-800">会社のロゴ設定</h3>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">No Logo</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-6 text-center md:text-left">
                    <p className="text-base text-slate-500 font-bold leading-relaxed">
                      サイドバー上部に表示される画像をアップロードできます。JPG/PNG形式に対応しています。
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-base shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
                      >
                        <Save className="w-5 h-5" /> 画像を選んで更新
                      </button>
                      {logoPreview && (
                        <button 
                          onClick={handleRemoveLogo}
                          className="px-8 py-4 bg-white text-rose-500 border-2 border-rose-100 rounded-2xl font-black text-base hover:bg-rose-50 transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" /> 削除
                        </button>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6 pt-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-black text-slate-800">メンテナンス</h3>
                </div>
                <div className="bg-amber-50 rounded-[1.5rem] p-8 border border-amber-100">
                  <p className="text-sm text-amber-900 font-bold mb-6">
                    動作が不安定な場合や、全データを削除したい場合に使用します。
                  </p>
                  <button 
                    onClick={clearCache}
                    className="px-8 py-4 bg-white text-amber-700 border-2 border-amber-200 rounded-2xl font-black text-base hover:bg-amber-100 transition-all shadow-sm active:scale-95"
                  >
                    ブラウザの保存データを完全に消去
                  </button>
                </div>
              </section>
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
