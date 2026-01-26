
import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, FileJson, Zap, DatabaseZap, ArrowRight, AlertTriangle, HelpCircle, Menu as MenuIcon, RefreshCcw, MousePointer2 } from 'lucide-react';
import { mergeDataJSON, importDataJSON } from '../services/reportService';

const MigrationAssistant: React.FC = () => {
  const [importedRaw, setImportedRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setImportedRaw(json);
        setError(null);
      } catch (err) {
        setError("ファイルが正しくありません。前のアプリの「履歴一覧」で保存したファイルを選んでください。");
      }
    };
    reader.readAsText(file);
  };

  const handleMerge = async () => {
    if (!importedRaw) return;
    const success = await mergeDataJSON(importedRaw);
    if (success) {
      alert("【完了】現在のデータに、古いデータを追加しました！");
      window.location.hash = "/history";
      window.location.reload();
    }
  };

  const handleOverwrite = async () => {
    if (!importedRaw) return;
    if (!window.confirm("今のデータ（もしあれば）をすべて消去して、読み込んだ古いデータに丸ごと入れ替えます。よろしいですか？")) return;
    
    const success = importDataJSON(importedRaw);
    if (success) {
      alert("【完了】データをこのアプリに復元しました！");
      window.location.hash = "/history";
      window.location.reload();
    } else {
      alert("データの復元に失敗しました。");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
           <DatabaseZap className="w-64 h-64" />
        </div>

        <div className="relative z-10 space-y-10">
          <div className="text-center">
            <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-rose-100">
                <DatabaseZap className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">他アカウントからのデータ移行</h2>
            <p className="text-slate-500 font-bold">バックアップファイルを使って、これまでの日報データを引き継ぎます</p>
          </div>

          {!importedRaw ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">1</div>
                  <p className="font-black text-slate-900 text-sm mb-2 underline decoration-blue-500 decoration-4 underline-offset-4">旧アプリで書き出す</p>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    別のアカウントで開いているアプリの「履歴の一覧」にある <span className="text-slate-900">「保存」</span> ボタンを押し、ファイルをダウンロードしてください。
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">2</div>
                  <p className="font-black text-blue-900 text-sm mb-2 underline decoration-blue-400 decoration-4 underline-offset-4">新アプリで読み込む</p>
                  <p className="text-[11px] text-blue-600 font-bold leading-relaxed">
                    下の点線の枠をクリックして、1で保存した「lab_reports_backup_... .json」という名前のファイルを選んでください。
                  </p>
                </div>
              </div>

              <div className="relative pt-4 group">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-slate-200 rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-slate-50/50"
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-100 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <p className="text-slate-400 font-black text-xl group-hover:text-blue-600 transition-colors">ここをクリックしてファイルを選択</p>
                  <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest">Select .json backup file</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-emerald-900 font-black text-xl">ファイルの読み込みに成功しました！</p>
                <button onClick={() => setImportedRaw(null)} className="text-emerald-600 text-xs font-bold underline mt-2 hover:text-emerald-800">別のファイルにする</button>
              </div>

              {error && (
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-rose-900">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={handleOverwrite}
                  className="py-10 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-slate-800 transition-all shadow-xl flex flex-col items-center justify-center gap-2 group"
                >
                  <RefreshCcw className="w-8 h-8 text-rose-400 group-hover:rotate-180 transition-transform duration-700" />
                  <span className="text-lg">丸ごと入れ替える</span>
                  <span className="text-[10px] text-white/50">今あるデータを消して、読み込んだデータにします</span>
                </button>

                <button
                  onClick={handleMerge}
                  className="py-10 bg-white border-2 border-slate-900 text-slate-900 rounded-[2rem] font-black hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <Zap className="w-8 h-8 text-amber-500 group-hover:scale-125 transition-transform" />
                  <span className="text-lg">今のデータに追加する</span>
                  <span className="text-[10px] text-slate-400">今のデータを残したまま、読み込んだデータを足します</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-100 rounded-[2rem] p-6 flex items-start gap-4">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
          ※ 移行が完了すると、これまでの日報履歴が表示されるようになります。万が一反映されない場合は、一度ページを読み込み直してください。
        </p>
      </div>
    </div>
  );
};

export default MigrationAssistant;
