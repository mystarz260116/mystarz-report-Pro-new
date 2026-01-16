
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyReport } from '../types';
import { DEPARTMENT_CONFIGS, SHOW_DANGER_ZONE } from '../constants';
import { Search, Download, Upload, Database, Trash2, Edit2, Loader2 } from 'lucide-react';
import { downloadCSV, exportDataJSON, importDataJSON, clearAllReports, deleteReport } from '../services/reportService';

interface ReportListProps {
  reports: DailyReport[];
}

const ReportList: React.FC<ReportListProps> = ({ reports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredReports = reports.filter(r => 
    r.staffName.includes(searchTerm) || 
    r.department.includes(searchTerm) ||
    DEPARTMENT_CONFIGS[r.department].label.includes(searchTerm)
  );

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!window.confirm("選択したファイルの内容で、現在のデータをすべて上書き（入れ替え）します。よろしいですか？")) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }
      
      const success = await importDataJSON(file);
      if (success) {
          alert('別アカウントのデータを復元しました。');
          window.location.reload();
      } else {
          alert('ファイルの読み込みに失敗しました。正しい形式のファイルか確認してください。');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSingleDelete = async (id: string) => {
    if (!window.confirm("この日報データを削除しますか？\n（Googleスプレッドシートからも削除されます）")) return;
    
    setDeletingId(id);
    try {
      const success = await deleteReport(id);
      if (success) {
        window.location.reload();
      } else {
        alert("削除に失敗しました。ネットワークの状態を確認してください。");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (report: DailyReport) => {
    navigate('/', { state: { editReport: report } });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
       <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            日報履歴
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="検索..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
                />
            </div>
            
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={downloadCSV}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 border border-green-200 transition-colors"
                    title="Excel用にCSV形式でダウンロード"
                >
                    <Download className="w-4 h-4" /> CSV出力
                </button>
                
                <button 
                    onClick={exportDataJSON}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200 transition-colors"
                    title="データのバックアップ（JSON）"
                >
                    <Download className="w-4 h-4" /> 保存
                </button>

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 border border-blue-200 transition-colors"
                    title="バックアップファイルからデータを復元（上書き）"
                >
                    <Upload className="w-4 h-4" /> 復元
                </button>
                
                {SHOW_DANGER_ZONE && (
                  <button 
                      onClick={clearAllReports}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100 border border-rose-200 transition-colors"
                      title="全データを削除してリセット"
                  >
                      <Trash2 className="w-4 h-4" /> 全削除
                  </button>
                )}

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleRestore}
                />
            </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-6 py-3">日付</th>
              <th className="px-6 py-3">部署</th>
              <th className="px-6 py-3">担当者</th>
              <th className="px-6 py-3">主な実績</th>
              <th className="px-6 py-3">備考</th>
              <th className="px-6 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReports.map((report) => {
              const isDeleting = deletingId === report.id;
              
              return (
                <tr key={report.id} className={`hover:bg-gray-50 transition-colors ${isDeleting ? 'opacity-50 pointer-events-none bg-slate-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{report.date}</td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2 py-1 rounded-full text-xs text-white whitespace-nowrap"
                      style={{ backgroundColor: DEPARTMENT_CONFIGS[report.department]?.color || '#999' }}
                    >
                      {DEPARTMENT_CONFIGS[report.department]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">{report.staffName}</td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {report.items.slice(0, 3).map(i => {
                        let text = `${i.itemName}(${i.count})`;
                        if(i.customTimeRange) text += ` [${i.customTimeRange}]`;
                        return text;
                    }).join(', ')}
                    {report.items.length > 3 && '...'}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-400">
                      {report.issues ? <span className="text-red-500 font-bold mr-2">!</span> : null}
                      {report.remarks || report.issues || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(report)}
                        disabled={!!deletingId}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                        title="修正（フォームに読み込む）"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSingleDelete(report.id)}
                        disabled={!!deletingId}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                        title="この行を削除"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  データが見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportList;
