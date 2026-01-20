import { Department, DeptConfig } from './types';

// ⚠️ 新しいアカウントのGAS WebアプリURLに更新しました
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0vDSNGeTNWmXcDtBHCfHzY6jiljHmxG_MdIVYaxN4iMjcX5NHaZq_ZVEnV3i7KnARDg/exec';

// 🛠️ 運用開始時にここを true にすると「全削除」ボタンが表示されます
export const SHOW_DANGER_ZONE = false;

// 🎌 日本の祝日リスト（2026年）
export const JAPAN_HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-01-12', '2026-02-11', '2026-03-20', '2026-04-29',
  '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06', '2026-07-23',
  '2026-08-10', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12',
  '2026-11-03', '2026-11-23',
]);

// 🏢 会社の年始休暇
export const COMPANY_NEW_YEAR_HOLIDAYS = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04',
]);

export const isHoliday = (date: Date): boolean => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const isSunday = date.getDay() === 0;
  return isSunday || JAPAN_HOLIDAYS_2026.has(dateStr) || COMPANY_NEW_YEAR_HOLIDAYS.has(dateStr);
};

export const STAFF_GROUPS = [
  { groupName: '模型', items: ['西口', '山村', '田村', '阿波', '谷村', '坂田', '北中'] },
  { groupName: 'パターン', items: ['清水', '杉野', '三国', '小野', '田村', '可畑'] },
  { groupName: '埋没', items: ['小林', '山村', '可畑'] },
  { groupName: '完成A', items: ['加藤', '武知', '酒井', '小谷', '髙木', '小畠', '中村', '中西(京)', '白山'] },
  { groupName: '完成B', items: ['玉城', '久原', '森田'] },
  { groupName: '完成C', items: ['島村', '天正'] },
  { groupName: 'CAD/CAM', items: ['木村', '荒木', '新村', '日根', '吉村', '宮田', '村井', '成田', '徳永', '林原', '黒田', '松田', '松尾', '南出', '森山', '三宅', '松田(尚)'] },
  { groupName: 'デンチャー', items: ['好村', '西村', '木澤', '長原', '浦本'] },
];

export const DEPARTMENT_CONFIGS: Record<Department, DeptConfig> = {
  [Department.OSAKA_MODEL]: {
    id: Department.OSAKA_MODEL,
    label: '大阪模型',
    color: '#3b82f6',
    sections: [
      { title: '製作品目', items: ['ノーマル模型(急ぎ)', 'ノーマル模型(総製作)', '貼り付け模型(急ぎ)', '貼り付け模型(総製作)', 'インレー・コア模型(急ぎ)', 'インレー・コア模型(総製作)', '総数(急ぎ)', '総数(総製作)'] }
    ],
  },
  [Department.PATTERN]: {
    id: Department.PATTERN,
    label: 'パターン',
    color: '#10b981',
    sections: [
      { title: '製作品目 (本数)', items: ['ハイブリッド', 'HR', 'FCK', 'インレー', 'ラミネート', 'コア', 'その他'] },
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
  [Department.COMPLETE_A]: {
    id: Department.COMPLETE_A,
    label: '完成A',
    color: '#8b5cf6',
    sections: [
      { title: 'e.max', items: ['マウント(e.max)', 'トリミング(e.max)', 'パターン Cr(e.max)', 'パターン インレー(e.max)', 'パターン ラミネート(e.max)', '植立：埋没・プレス(e.max)','適合・調整(e.max)', 'ステイン・完成 Cr(e.max)', 'ステイン・完成 インレー(e.max)', 'ステイン・完成 ラミネート(e.max)'] },
      { title: 'MB', items: ['マウント(MB)', 'トリミング(MB)', 'パターン(フルカントゥア)', 'パターン(キャップ)', '植立・埋没・キャスト(MB)', 'メタル調整(MB)', '前ロウ(ヶ所)', '築盛(MB)', '形態修正・完成(MB)'] },
      { title: 'Zirconia', items: ['マウント(Zir)', 'トリミング(Zir)', '設計・送り(Zir)', '適合・調整(Zir)', 'フルジルコニア ステイン・完成(Cr)', 'フルジルコニア ステイン・完成(インレー)', 'レイヤリング(築盛)(Zir)', 'レイヤリング(形成修正・完成)(Zir)'] },
      { title: 'CAD/CAM', items: ['CAD/CAM(スキャン)', 'CAD/CAM(設計)', 'CAD/CAM(完成)'] }
    ],
  },
  [Department.COMPLETE_B]: {
    id: Department.COMPLETE_B,
    label: '完成B',
    color: '#ec4899',
    sections: [
      { title: '工程', items: ['メタル(適合～オペーク)', '築盛(築盛)', '形態(コンタクト～形態)', '研磨(シリコン～)', 'ホワイトWAX(築盛～形態)', 'トリミング(チェック～)'] },
      { title: '製作品目', items: ['トリミング', 'ハードレジン', 'HJK', 'HB(インレー/ジャケット)', 'HB(金属裏装)', 'ファイバーコア(自費)', 'ファイバーコア(保険)', 'CRインレー', 'クラウン', 'インレー', 'ホワイトWAX'] },
      { title: 'CAD製作品目', items: ['CAD/CAM(設計)', 'CAD/CAM(完成)'] }
    ],
  },
  [Department.COMPLETE_C]: {
    id: Department.COMPLETE_C,
    label: '完成C',
    color: '#6366f1',
    sections: [
      { title: '調整・適合', items: ['調整・適合', '調整・コンタクト', '調整・バイト', 'ネジ付け・FMC/In', '研磨・FMC/In', '研磨・ブリッジ', '研磨・コア', 'ネジ外し・FMC/In', 'レーズ・ブリッジ'] },
      { title: '品目', items: ['クラウン', 'インレー', 'コア', '自費クラウン', '自費インレー', '自費コア'] }
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

export const DEPARTMENTS_LIST = [
  DEPARTMENT_CONFIGS[Department.OSAKA_MODEL],
  DEPARTMENT_CONFIGS[Department.PATTERN],
  DEPARTMENT_CONFIGS[Department.INVEST_CUT],
  DEPARTMENT_CONFIGS[Department.COMPLETE_A],
  DEPARTMENT_CONFIGS[Department.COMPLETE_B],
  DEPARTMENT_CONFIGS[Department.COMPLETE_C],
  DEPARTMENT_CONFIGS[Department.CAD_CAM],
  DEPARTMENT_CONFIGS[Department.DENTURE],
];
