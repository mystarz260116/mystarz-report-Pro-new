
import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, CheckCircle2, FileJson, Zap, ClipboardList, ShieldCheck, DatabaseZap, ArrowRight, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { saveReport, mergeDataJSON } from '../services/reportService';
import { DailyReport } from '../types';

const MigrationAssistant: React.FC = () => {
  const [importedRaw, setImportedRaw] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DailyReport | null>(null);
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
        setResult(null);
      } catch (err) {
        setError("有効なJSONファイルではありません。");
      }
    };
    reader.readAsText(file);
  };

  const handleDirectMerge = async () => {
    if (!importedRaw) return;
    
    const success = await mergeDataJSON(importedRaw);
    if (success) {
      alert("【成功】データを統合しました！履歴一覧を確認してください。");
      window.location.hash = "/history";
      window.location.reload();
    } else {
      setError("データの統合に失敗しました。ファイル形式を確認してください。");
    }
  };

  const startAiMigration = async () => {
    if (!importedRaw) return;
    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Convert this data to the new format: ${JSON.stringify(importedRaw)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              date: { type: Type.STRING },
              department: { type: Type.STRING },
              staffName: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemName: { type: Type.STRING },
                    count: { type: Type.NUMBER }
                  }
                }
              },
              remarks: { type: Type.STRING }
            }
          }
        }
      });

      const migrated = JSON.parse(response.text);
      setResult(migrated);
    } catch (err: any) {
      setError("AI機能の利用に失敗しました。画面上部の『Switch to API Key』ボタンから有効なキーが設定されているか確認してください。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-slate-200 shadow-2xl relative overflow-hidden">
        {/* 装飾用アイコン */}
        <div className="absolute -top-10 -right-10 opacity-5">
           <DatabaseZap className="w-64 h-64" />
        </div>

        <div className="flex flex-col items-center text-center mb-12 relative">
          <div className="p-5 bg-blue-600 rounded-[2rem] text-white shadow-xl mb-6">
            <ClipboardList className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">他データの取り込み</h2>
          <p className="text-slate-500 font-bold max-w-md">
            前のアプリから保存（JSON）したデータを、今のアプリに合体・移行します。
          </p>
        </div>

        {!importedRaw ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all group bg-slate-50/50"
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
              <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500" />
            </div>
            <p className="text-slate-900 font-black text-xl mb-2">バックアップファイルをアップロード</p>
            <p className="text-sm text-slate-400 font-bold tracking-tight">「履歴一覧」の「保存」ボタンで出したファイルを選択</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 rounded-[2rem] p-6 font-mono text-[10px] max-h-40 overflow-auto text-emerald-400 border border-slate-800 shadow-inner">
              <div className="flex justify-between items-center mb-2 sticky top-0 bg-slate-900 pb-2">
                <span className="text-slate-500 font-bold uppercase">Ready to Import</span>
                <button onClick={() => setImportedRaw(null)} className="text-rose-400 hover:text-rose-300 font-bold">ファイルを変更</button>
              </div>
              <pre>{JSON.stringify(importedRaw, null, 2)}</pre>
            </div>

            {error && (
              <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                {/* Fixed missing AlertTriangle import */}
                <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                <p className="text-sm font-bold text-rose-900 leading-relaxed">{error}</p>
              </div>
            )}

            {!result ? (
              <div className="flex flex-col gap-4">
                {/* 直接統合（推奨・設定不要） */}
                <div className="p-1 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-transform">
                  <button
                    onClick={handleDirectMerge}
                    className="w-full py-8 bg-white rounded-[2.3rem] font-black flex items-center justify-center gap-6 hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0">
                       <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-slate-900 text-2xl leading-none mb-2">今すぐデータを直接合体させる</p>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">推奨：API設定不要・待ち時間なしで完了します</p>
                    </div>
                  </button>
                </div>

                <div className="flex items-center py-4">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="px-4 text-slate-300 text-[10px] font-black tracking-widest uppercase">Other Method</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* AI変換 */}
                <button
                  onClick={startAiMigration}
                  disabled={isProcessing}
                  className="w-full py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-blue-400" />}
                  AIに形式を自動変換させて取り込む
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[2.5rem] text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <p className="text-emerald-900 font-black text-2xl mb-2">AI変換完了</p>
                  <p className="text-emerald-700/60 text-sm font-bold">内容を確認して保存を確定してください</p>
                </div>
                <button
                  onClick={() => {
                    saveReport(result);
                    alert("保存しました！");
                    window.location.hash = "/history";
                    window.location.reload();
                  }}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black transition-all"
                >
                  この内容で保存を確定
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex items-center gap-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
           <Zap className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-blue-800 leading-relaxed">
          <p className="mb-1 uppercase tracking-tighter opacity-50">Tips</p>
          <p>「Switch to API Key」ボタンでキーを設定済みであれば、AIボタンが使えます。まだ設定していない場合や、すぐに終わらせたい場合は「虹色ボタン」での直接統合が一番簡単です。</p>
        </div>
      </div>
    </div>
  );
};

export default MigrationAssistant;
