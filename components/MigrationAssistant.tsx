
import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, FileJson, Zap, ClipboardList, ShieldCheck } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { saveReport, mergeDataJSON } from '../services/reportService';
import { DailyReport, Department } from '../types';

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
        setError("有効なJSONファイルではありません。以前のアプリで「保存」したファイルを選択してください。");
      }
    };
    reader.readAsText(file);
  };

  // AIを使わずに直接マージする（同じシステムのバックアップ用）
  const handleDirectMerge = async () => {
    if (!importedRaw) return;
    
    const success = await mergeDataJSON(importedRaw);
    if (success) {
      alert("データの統合が完了しました！「履歴の一覧」から確認してください。");
      window.location.hash = "/history";
      window.location.reload();
    } else {
      setError("データの形式が合いませんでした。AI移行アシスタントを試してください。");
    }
  };

  const startAiMigration = async () => {
    if (!importedRaw) return;
    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        あなたはデータ移行のエキスパートです。
        以下のデータを、現在の「Mystarz 日報システム」のデータ形式に変換してください。
        
        【移行元データ】
        ${JSON.stringify(importedRaw, null, 2)}
        
        【ルール】
        1. 部署名は以下から選択: 大阪模型, パターン, 埋没・カット計量, 完成A, 完成B, 完成C, CAD/CAM, デンチャー
        2. JSONのみを返してください。
      `;

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
      setError("お支払い設定（プロジェクトのリンク）が完了していないため、AI機能が使えません。上の「直接統合」ボタンを試してください。");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!result) return;
    const success = await saveReport(result);
    if (success) {
      alert("インポートに成功しました！");
      window.location.hash = "/history";
      window.location.reload();
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-[600px] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-2xl max-w-2xl w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-200">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">データの取り込み</h2>
            <p className="text-slate-500 text-sm font-medium">他アカウントで作ったデータやバックアップを移動します</p>
          </div>
        </div>

        {!importedRaw ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-slate-100 rounded-[2rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-white shadow-sm border border-slate-100">
              <Upload className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" />
            </div>
            <p className="text-slate-900 font-black text-xl mb-2">JSONファイルをアップロード</p>
            <p className="text-sm text-slate-400 font-bold">前のアプリで「保存」したファイルを選択してください</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[10px] max-h-40 overflow-auto text-emerald-400 border border-slate-800 shadow-inner relative">
              <div className="sticky top-0 right-0 flex justify-end">
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[8px] font-black uppercase">Data Ready</span>
              </div>
              <pre>{JSON.stringify(importedRaw, null, 2)}</pre>
            </div>

            {error && (
              <div className="p-5 bg-rose-50 text-rose-800 rounded-2xl flex items-start gap-4 border border-rose-100 shadow-sm animate-in fade-in zoom-in-95">
                <AlertTriangle className="w-6 h-6 shrink-0 text-rose-500" />
                <div className="text-xs font-bold leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            {!result ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[1.5rem] shadow-xl">
                  <button
                    onClick={handleDirectMerge}
                    className="w-full py-6 bg-white rounded-[1.4rem] font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <div className="text-left">
                      <p className="text-slate-900 text-lg leading-none mb-1">今すぐデータを統合する</p>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">同じアプリ同士ならこれだけでOK（設定不要）</p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={startAiMigration}
                  disabled={isProcessing}
                  className="w-full py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  AIに形式を変換させて取り込む
                </button>
                
                <button onClick={() => setImportedRaw(null)} className="text-slate-400 text-xs font-bold hover:text-slate-600 underline">別のファイルを選ぶ</button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] mb-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-emerald-900 font-black text-xl mb-4">変換が完了しました！</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <span className="text-slate-400 block mb-1 font-bold">日付</span>
                      <span className="font-black text-slate-800 text-lg">{result.date}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <span className="text-slate-400 block mb-1 font-bold">部署</span>
                      <span className="font-black text-slate-800 text-lg">{result.department}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={confirmImport}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-2xl active:scale-[0.98]"
                >
                  この内容で保存を確定
                </button>
                <button onClick={() => setResult(null)} className="w-full py-4 text-slate-400 text-sm font-bold hover:text-slate-600">やり直す</button>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100">
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Google Cloudでお困りの方</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a 
              href="https://console.cloud.google.com/billing" 
              target="_blank" 
              className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all flex items-center justify-between group"
            >
              <span className="text-[11px] font-black text-slate-600 group-hover:text-indigo-600">1. お支払い権限の確認</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </a>
            <a 
              href="https://console.cloud.google.com/billing/projects" 
              target="_blank" 
              className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all flex items-center justify-between group"
            >
              <span className="text-[11px] font-black text-slate-600 group-hover:text-indigo-600">2. プロジェクトの紐付け</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationAssistant;
