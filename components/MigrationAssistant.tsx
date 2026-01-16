
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
    
    // 修正: サービス層の関数を使用するように変更
    const success = importDataJSON(importedRaw);
    if (success) {
      alert("【完了】別のアカウントのデータをこのアプリに復元しました！");
      window.location.hash = "/history";
      window.location.reload();
    } else {
      alert("データの復元に失敗しました。");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6">
      {/* どこにあるかナビ */}
      <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-lg flex items-center gap-6">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <MenuIcon className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold leading-snug">
          画面左上の <span className="inline-block p-1 bg-white/20 rounded">三</span> ボタンからメニューを開き、<br />
          <span className="text-yellow-300">「他データの移行」</span> を選ぶとこの画面が表示されます。
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <DatabaseZap className="w-40 h-40" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-2">別アカウントからの移行</h2>
            <p className="text-slate-500 font-bold">保存したファイルを読み込んで、データを復元します</p>
          </div>

          {!importedRaw ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">1</div>
                  <p className="font-black text-slate-900 text-sm mb-2">前のアプリでファイルを保存</p>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    別アカウントの「履歴の一覧」→「保存」ボタンで、ファイルをパソコンにダウンロードします。
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">2</div>
                  <p className="font-black text-blue-900 text-sm mb-2">このアプリで読み込む</p>
                  <p className="text-[11px] text-blue-600 font-bold leading-relaxed">
                    下の大きな点線の枠をクリックして、1で保存したファイルを選びます。
                  </p>
                </div>
              </div>

              {/* 読み込み場所を強調 */}
              <div className="relative pt-4">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 text-slate-900 px-6 py-1.5 rounded-full font-black text-sm shadow-lg flex items-center gap-2 animate-bounce">
                  <MousePointer2 className="w-4 h-4" />
                  ここをクリックしてファイルを選択
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-blue-200 rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group bg-slate-50/30 relative overflow-hidden"
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl border border-blue-50">
                    <Upload className="w-10 h-10 text-blue-500" />
                  </div>
                  <p className="text-slate-900 font-black text-2xl">ファイルを開く</p>
                  <p className="text-xs text-slate-400 font-bold mt-3">lab_reports_backup_... .json という名前のファイルです</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-emerald-900 font-black text-xl">ファイルの準備完了！</p>
                <button onClick={() => setImportedRaw(null)} className="text-emerald-600 text-xs font-bold underline mt-2">ファイルを変更する</button>
              </div>

              {error && (
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-rose-900 leading-relaxed">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 pt-4">
                <div className="p-1 bg-gradient-to-br from-rose-500 to-orange-500 rounded-[2rem] shadow-xl">
                  <button
                    onClick={handleOverwrite}
                    className="w-full py-8 bg-white rounded-[1.8rem] font-black flex items-center justify-center gap-6 hover:bg-rose-50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                       <RefreshCcw className="w-7 h-7 text-rose-600 group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-rose-600 text-xl font-black">【丸ごと入れ替え】データを復元する</p>
                      <p className="text-slate-400 text-[10px] font-bold">以前の全データをこのアプリに上書きコピーします</p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={handleMerge}
                  className="w-full py-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[1.8rem] font-black flex items-center justify-center gap-4 transition-all"
                >
                  <Zap className="w-5 h-5 text-indigo-500" />
                  今のデータに「追加」して統合する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-100 rounded-[2rem] p-6 flex items-start gap-4">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
          ※ 読み込みが終わったら、画面を一度リロード（更新）するか、「履歴の一覧」を確認してください。データが反映されています。
        </p>
      </div>
    </div>
  );
};

export default MigrationAssistant;
