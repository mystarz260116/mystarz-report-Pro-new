
import { Department, DeptConfig } from './types';

// ⚠️ 新しいアカウントのGAS WebアプリURLに更新しました
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0vDSNGeTNWmXcDtBHCfHzY6jiljHmxG_MdIVYaxN4iMjcX5NHaZq_ZVEnV3i7KnARDg/exec';

// 🛠️ 運用開始時にここを true にすると「全削除」ボタンが表示されます
export const SHOW_DANGER_ZONE = false;

// 🎌 日本の祝日リスト（2026年）
export const JAPAN_HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20', '2026-04-29',
  '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06', '2026-07-20',
  '2026-08-11','2026-08-12','2026-08-13', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12',
  '2026-11-03', '2026-11-23','2026-12-28', '2026-12-29','2026-12-30', '2026-12-31',
]);

// 🏢 会社の休暇日（年末年始その他）
export const COMPANY_NEW_YEAR_HOLIDAYS = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04',
  '2026-08-14', '2026-08-15',
  '2026-10-24',
]);

export const isHoliday = (date: Date): boolean => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const isSunday = date.getDay() === 0;
  return isSunday || JAPAN_HOLIDAYS_2026.has(dateStr) || COMPANY_NEW_YEAR_HOLIDAYS.has(dateStr);
};

export const STAFF_GROUPS = [
  { groupName: '模型', items: ['西口', '阿波', '佐々木', '寺本', '町田', '山本'] },
  { groupName: 'メタル①', items: ['小野', '清水', '三国', '杉野', '小林', '山村', '可畑'] },
  { groupName: 'メタル②', items: ['天正', '島村'] },
  { groupName: 'メタル③', items: ['上野', '玉城', '森田', '可畑', '江藤'] },
  { groupName: '自費', items: ['武知', '小畠', '小谷', '酒井', '高木', '中村', '中西（京）', '白山', '加藤'] },
  { groupName: 'CAD/CAM①', items: ['松田（尚）', '吉村', '徳永', '黒田', '中西（涼）'] },
  { groupName: 'CAD/CAM②', items: ['新村', '久原', '日根', '荒木', '森田', '林原'] },
  { groupName: 'CAD/CAM③', items: ['成田', '荒木', '木村', '村井', '松田（晃）', '徳永', '森山', '松尾'] },
  { groupName: 'デンチャー', items: ['松尾', '松田（晃）', '森山', '南出', '西村', '林原', '松田（尚）', '好村', '浦本', '木澤', '長原', '山口'] },
];

export const DEPARTMENT_CONFIGS: Record<Department, DeptConfig> = {
  [Department.OSAKA_MODEL]: {
    id: Department.OSAKA_MODEL,
    label: '大阪模型',
    color: '#3b82f6',
    sections: [
      { 
        title: '製作品目', 
        items: [
          'ノーマル模型【メタル】(総製作)',
          'ノーマル模型【CAD】(総製作)',
          '貼り付け模型【メタル】(総製作)',
          '貼り付け模型【CAD】(総製作)',
          'インレー・コア模型(総製作)',
          '総数(総製作)'
        ]
      }
    ],
  },
  [Department.PATTERN]: {
    id: Department.PATTERN,
    label: 'パターン',
    color: '#10b981',
    sections: [
      { title: '製作品目 (本数)', items: ['HB', 'HR', 'FCK', 'インレー', 'コア', 'その他', 'ラミネート', '3Dプリンター'] },
    ],
  },
  [Department.INVEST_CUT]: {
    id: Department.INVEST_CUT,
    label: '埋没・カット計量',
    color: '#f59e0b',
    sections: [
      { title: '工程処理数', items: ['スプルー植立', '埋没', 'キャスト', '割り出し', 'カット計量', 'パターン', 'その他'] },
    ],
  },
  [Department.METAL_1]: {
    id: Department.METAL_1,
    label: 'メタル①',
    color: '#10b981',
    sections: [
      { title: 'WAX', items: ['HR', 'FMC', 'インレー', 'コア', 'その他'] },
      { title: '埋没', items: ['スプルー植立', '埋没', 'キャスト', '割り出し', 'カット計量', '埋没 その他'] },
    ],
  },
  [Department.METAL_2]: {
    id: Department.METAL_2,
    label: 'メタル②',
    color: '#6366f1',
    sections: [
      { title: '品目', items: ['クラウン', 'インレー', 'コア', '自費クラウン', '自費インレー', '自費コア'] },
      { title: '調整・適合', items: ['調整・適合', '調整・コンタクト', '調整・バイト', 'ネジ付け・FMC/In', '研磨・FMC/In', '研磨・ブリッジ', '研磨・コア', 'ネジ外し・FMC/In', 'レーズ・ブリッジ'] },
    ],
  },
  [Department.METAL_3]: {
    id: Department.METAL_3,
    label: 'メタル③',
    color: '#ec4899',
    sections: [
      { title: '製作品目', items: ['HR', 'HJC', 'CRインレー', 'FMC', 'インレー', 'HB金属裏装', 'HBジャケット', 'HBインレー', 'ファイバーコア', 'ホワイトWAX'] },
      { title: '工程', items: ['メタル(適合～オペーク)', '築盛(築盛)', '形態(コンタクト～形態)'], hideFromStats: true },
    ],
  },
  [Department.COMPLETE_A]: {
    id: Department.COMPLETE_A,
    label: '自費',
    color: '#8b5cf6',
    sections: [
      { title: 'e.max', items: ['マウント(e.max)', 'トリミング(e.max)', 'パターン Cr(e.max)', 'パターン インレー(e.max)', 'パターン ラミネート(e.max)', '植立：埋没・プレス(e.max)','適合・調整(e.max)', 'ステイン・完成 Cr(e.max)', 'ステイン・完成 インレー(e.max)', 'ステイン・完成 ラミネート(e.max)'] },
      { title: 'MB', items: ['マウント(MB)', 'トリミング(MB)', 'パターン(フルカントゥア)', 'パターン(キャップ)', '植立・埋没・キャスト(MB)', 'メタル調整(MB)', '前ロウ(ヶ所)', '築盛(MB)', '形態修正・完成(MB)'] },
      { title: 'Zirconia', items: ['マウント(Zir)', 'トリミング(Zir)', '設計・Cr(Zir)', '設計・In(Zir)', '適合・調整(Zir)', 'フルジルコニア ステイン・完成(Cr)', 'フルジルコニア ステイン・完成(インレー)', 'レイヤリング(築盛)(Zir)', 'レイヤリング(形成修正・完成)(Zir)'] },
      { title: 'インプラント', items: ['模型作り', 'マウント', 'アバットメント設計', 'アバットメント調整', 'セメンテーション（スクリュー）', 'トランスファージグ'] },
    ],
  },
  [Department.COMPLETE_B]: {
    id: Department.COMPLETE_B,
    label: '完成B',
    color: '#ec4899',
    sections: [
      { title: '工程', items: ['メタル(適合～オペーク)', '築盛(築盛)', '形態(コンタクト～形態)', '研磨(シリコン～)', 'ホワイトWAX(築盛～形態)', 'トリミング(チェック～)'] },
      { title: '製作品目', items: ['トリミング', 'ハードレジン', 'HJK', 'HB（インレー）', 'HB(アンレー)', 'HB(ジャケット)', 'HB(金属裏装)', 'ファイバーコア(自費)', 'ファイバーコア(保険)', 'CRインレー', 'CRアンレー', 'クラウン', 'インレー', 'ホワイトWAX'] },
      { title: 'CAD製作品目', items: ['CAD/CAM(スキャン)', 'CAD/CAM(設計)', 'CAD/CAM(完成)'] }
    ],
  },
  [Department.COMPLETE_C]: {
    id: Department.COMPLETE_C,
    label: '完成C',
    color: '#6366f1',
    sections: [
      { title: '品目', items: ['クラウン', 'インレー', 'コア', '自費クラウン', '自費インレー', '自費コア'] },
      { title: '調整・適合', items: ['調整・適合', '調整・コンタクト', '調整・バイト', 'ネジ付け・FMC/In', '研磨・FMC/In', '研磨・ブリッジ', '研磨・コア', 'ネジ外し・FMC/In', 'レーズ・ブリッジ'] }
    ],
  },
  [Department.CAD_CAM]: {
    id: Department.CAD_CAM,
    label: 'CAD/CAM',
    color: '#06b6d4',
    sections: [
      { title: '工程', items: ['CAD/CAM(スキャン)', 'CAD/CAM(設計)', 'CAD/CAM(完成)', 'IOS', 'AI/Zir'] },
      { title: 'データ送り', items: ['3D (データ送り)', 'CAD/CAM冠 (データ送り)'] }
    ],
  },
  [Department.CAD_CAM_1]: {
    id: Department.CAD_CAM_1,
    label: 'CAD/CAM①',
    color: '#22d3ee',
    sections: [
      { title: '実績入力', items: ['トリミング', 'スキャン', 'CAM', '3Dプリンター'] }
    ],
  },
  [Department.CAD_CAM_2]: {
    id: Department.CAD_CAM_2,
    label: 'CAD/CAM②（設計）',
    color: '#06b6d4',
    sections: [
      { title: '模型あり', items: ['模型あり 前歯', '模型あり クラウン', '模型あり インレー'] },
      { title: '模型なし', items: ['模型なし 前歯', '模型なし クラウン', '模型なし インレー'] },
      { title: 'AI設計', items: ['AI設計 前歯', 'AI設計 クラウン', 'AI設計 インレー'] },
    ],
    computedRows: [
      { afterItem: '模型あり インレー', name: '模型あり 合計', sumItems: ['模型あり 前歯', '模型あり クラウン', '模型あり インレー'] },
      { afterItem: '模型なし インレー', name: '模型なし 合計', sumItems: ['模型なし 前歯', '模型なし クラウン', '模型なし インレー'] },
      { afterItem: 'AI設計 インレー', name: 'AI設計 合計', sumItems: ['AI設計 前歯', 'AI設計 クラウン', 'AI設計 インレー'] },
    ],
  },
  [Department.CAD_CAM_3]: {
    id: Department.CAD_CAM_3,
    label: 'CAD/CAM③（完成）',
    color: '#0891b2',
    sections: [
      { title: '実績入力', items: ['模型あり', '模型なし'] }
    ],
    computedRows: [
      { afterItem: '模型なし', name: '合計', sumItems: ['模型あり', '模型なし'] },
    ],
  },
  [Department.CAD_CAM_ALL]: {
    id: Department.CAD_CAM_ALL,
    label: 'CAD/CAM①②③',
    color: '#22d3ee',
    sections: [
      {
        title: '①（スキャン/トリミング）',
        items: ['トリミング', 'スキャン', 'CAM', '3Dプリンター'],
      },
      {
        title: '②（設計）',
        items: [
          '模型あり 前歯', '模型あり クラウン', '模型あり インレー',
          '模型なし 前歯', '模型なし クラウン', '模型なし インレー',
          'AI設計 前歯', 'AI設計 クラウン', 'AI設計 インレー',
        ],
        innerSections: [
          { title: '模型あり', items: ['模型あり 前歯', '模型あり クラウン', '模型あり インレー'] },
          { title: '模型なし', items: ['模型なし 前歯', '模型なし クラウン', '模型なし インレー'] },
          { title: 'AI設計', items: ['AI設計 前歯', 'AI設計 クラウン', 'AI設計 インレー'] },
        ],
      },
      {
        title: '③（完成）',
        items: ['模型あり', '模型なし'],
      },
    ],
  },
  [Department.DENTURE]: {
    id: Department.DENTURE,
    label: 'デンチャー',
    color: '#ef4444',
    sections: [
      { title: '基本', items: ['台付(個)', 'トリミング(個)', 'バイト(ケース)', 'マウント(ケース)', '印象(個)'] },
      { title: '3D/CAD', items: ['3Dデンチャー 設計(本)', '3Dデンチャー 完成(本)', 'CAD/CAM(設計)', 'CAD/CAM(完成)'] },
      { title: '製作', items: ['ベース', 'ロー堤', 'トレー', 'クラスプ・バー設計(本)', 'クラスプ・バー パターン(本)', 'クラスプ・バー 埋没(本)', 'クラスプ ワイヤー屈曲(本)', 'サンドブラスト(本)', 'クラスプ・バー 研磨(本)', 'クラスプ適合(本)', 'ソルダーロー着(ヶ所)', 'コバルトロー着(ヶ所)', '補強床※(枚)'] },
      { title: '排列', items: ['試適排列(1-4歯)(床)', '試適排列(5-8歯)(床)', '試適排列(9-12歯)(床)', '試適排列(13-総義歯)(床)', '重合排列-咬合調整(1-4歯)(床)', '重合排列-咬合調整(5-8歯)(床)', '重合排列-咬合調整(9-12歯)(床)', '重合排列-咬合調整(13-総義歯)(床)', '組み立て(床)', '試適形成(床)', '重排形成(床)', '補強線屈曲(床)', '補強線ロー着(床)'] },
      { title: '設計', items: ['デンチャー設計(ブロックアウト含む)(床)', '副模型製作(個)'] },
      { title: '維持屈曲', items: ['デンチャー埋没(床)', '脱漏(自費は１人・保険２人当たりの数)(床)', '墳入(リング)', '割り出し　前工程(リング)', '対合はずし・洗浄(床)', '流し込み　前処理(シリコン型取り)(床)', '流し込み(人工歯置き換え含む)(ケース)'] },
      { title: 'プレス', items: ['カスタムトレー(ホワイトニング用)(床)', 'ナイトガードソフト(プレス)(床)', '咬合調整(ナイトガードソフトラミネート処理・有)(床)', '咬合調整(ナイトガードソフトラミネート処理・無)(床)', 'ナイトガードハード(プレス)(床)', '咬合調整(ナイトガードハード)(床)', 'スポーツマウスピース(ラミネート処理・有)(床)', 'スポーツマウスピース(ラミネート処理・無)(床)'] },
      { title: '修理研磨', items: ['ソフトリライニング(墳入～仕上まで)(床)', '義歯修理(破折・増歯・補強線追加)(床)', '適合(床)', '床研磨(床)'] },
      { title: 'その他', items: ['ネーム入れ(デンチャー・プレス)(床)', 'メッシュプレート(動揺歯固定)(枚)', 'バリオ(床)', 'チェック', '矯正', 'その他'] }
    ],
  },
};

// 統計・集計用（旧名は後方互換のため残存、5月以降はStatistics側でフィルタリング）
export const DEPARTMENTS_LIST = [
  DEPARTMENT_CONFIGS[Department.OSAKA_MODEL],
  DEPARTMENT_CONFIGS[Department.METAL_1],
  DEPARTMENT_CONFIGS[Department.METAL_2],
  DEPARTMENT_CONFIGS[Department.METAL_3],
  DEPARTMENT_CONFIGS[Department.COMPLETE_A],
  DEPARTMENT_CONFIGS[Department.CAD_CAM],
  DEPARTMENT_CONFIGS[Department.CAD_CAM_1],
  DEPARTMENT_CONFIGS[Department.CAD_CAM_2],
  DEPARTMENT_CONFIGS[Department.CAD_CAM_3],
  DEPARTMENT_CONFIGS[Department.DENTURE],
  // 旧部署: 過去データ表示用（4月中は混在表示、5月以降はStatisticsで非表示）
  DEPARTMENT_CONFIGS[Department.PATTERN],
  DEPARTMENT_CONFIGS[Department.INVEST_CUT],
  DEPARTMENT_CONFIGS[Department.COMPLETE_B],
  DEPARTMENT_CONFIGS[Department.COMPLETE_C],
];

// フォームボタン用（新部署構成: 大阪模型→メタル①②③→完成A→CAD系→デンチャー）
export const FORM_DEPARTMENTS_LIST = [
  DEPARTMENT_CONFIGS[Department.OSAKA_MODEL],
  DEPARTMENT_CONFIGS[Department.METAL_1],
  DEPARTMENT_CONFIGS[Department.METAL_2],
  DEPARTMENT_CONFIGS[Department.METAL_3],
  DEPARTMENT_CONFIGS[Department.COMPLETE_A],
  DEPARTMENT_CONFIGS[Department.CAD_CAM_ALL],
  DEPARTMENT_CONFIGS[Department.DENTURE],
];
