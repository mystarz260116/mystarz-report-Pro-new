
import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Image as ImageIcon, Trash2, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

const Settings: React.FC = () => {
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
      
      // 他のタブやコンポーネントに通知するためのイベント
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
    if (window.confirm("【警告】ブラウザのキャッシュを完全にクリアします。保存されていない日報データなどは消去されますが、動作が不安定な場合に有効です。実行しますか？")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
          <SettingsIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">アプリの設定</h2>
          <p className="text-slate-500 font-bold text-sm">表示設定とメンテナンス</p>
        </div>
      </div>

      {message && (
        <div className={`p-5 rounded-2xl flex items-center gap-4 animate-in zoom-in-95 duration-300 border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
          <p className="font-black text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-black text-slate-800">会社のロゴ設定</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Logo</p>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                サイドバー上部に表示されるロゴ画像をアップロードできます。<br/>
                背景が透明なPNG形式、またはJPG形式が推奨されます。
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> 画像を選択して更新
                </button>
                {logoPreview && (
                  <button 
                    onClick={handleRemoveLogo}
                    className="px-6 py-3 bg-white text-rose-500 border border-rose-100 rounded-xl font-black text-sm hover:bg-rose-50 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> デフォルトに戻す
                  </button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-slate-800">メンテナンス</h3>
          </div>
          
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
            <p className="text-xs text-amber-800 font-bold mb-4">
              アプリが正常に動かない、またはデータを完全にリセットしたい場合に使用します。
              この操作は取り消せません。
            </p>
            <button 
              onClick={clearCache}
              className="px-6 py-3 bg-white text-amber-700 border border-amber-200 rounded-xl font-black text-xs hover:bg-amber-100 transition-all"
            >
              キャッシュとデータの全消去
            </button>
          </div>
        </section>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Mystarz Report Pro v1.5.0
      </div>
    </div>
  );
};

export default Settings;
