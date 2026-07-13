import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Volume2, 
  Play, 
  Calendar, 
  Award, 
  BookOpen, 
  Sparkles, 
  Lock, 
  Unlock, 
  Heart, 
  Music, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';

// ==========================================
// 【音声合成エンジン (Web Audio API)】
// 外部ファイル不要で、懐かしい「キーンコーンカーンコーン」の
// チャイムや、テレビの起動音・クリック音を合成します。
// ==========================================
class RetroSoundSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 学校のチャイム（ウェストミンスターの鐘）
  playSchoolChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // キーン コーン カーン コーン (E4 -> G4 -> A4 -> B4 -> E4 -> A4 -> G4 -> E4)
    // 音高周波数: E4(329.63Hz), G4(392.00Hz), A4(440.00Hz), B4(493.88Hz)
    const melody = [
      { f: 329.63, d: 0.65 }, // ミ
      { f: 392.00, d: 0.65 }, // ソ
      { f: 440.00, d: 0.65 }, // ラ
      { f: 493.88, d: 1.10 }, // シ
      
      { f: 329.63, d: 0.65 }, // ミ
      { f: 440.00, d: 0.65 }, // ラ
      { f: 392.00, d: 0.65 }, // ソ
      { f: 329.63, d: 1.10 }  // ミ
    ];

    let time = now;
    melody.forEach(note => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle'; // やわらかく懐かしい音色
      osc.frequency.setValueAtTime(note.f, time);
      
      // エンベロープ設定
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + note.d - 0.05);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(time);
      osc.stop(time + note.d);
      
      time += note.d + 0.1; // 音の間隔
    });
  }

  // ブラウン管テレビの起動スイッチ音 (高周波のうなり ＋ カチッ)
  playTvOn() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 1. スイッチの「カチッ」
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sawtooth';
    clickOsc.frequency.setValueAtTime(140, now);
    clickOsc.frequency.exponentialRampToValueAtTime(10, now + 0.08);
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.08);

    // 2. 50Hzの電源ハム音 (ブーン)
    const humOsc = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(55, now);
    humGain.gain.setValueAtTime(0, now);
    humGain.gain.linearRampToValueAtTime(0.04, now + 0.2);
    humGain.gain.linearRampToValueAtTime(0, now + 1.2);
    humOsc.connect(humGain);
    humGain.connect(this.ctx.destination);
    humOsc.start(now);
    humOsc.stop(now + 1.2);

    // 3. 11kHzのブラウン管特有の高周波ノイズ (キーン)
    const whineOsc = this.ctx.createOscillator();
    const whineGain = this.ctx.createGain();
    whineOsc.type = 'sine';
    whineOsc.frequency.setValueAtTime(11000, now);
    whineGain.gain.setValueAtTime(0, now);
    whineGain.gain.linearRampToValueAtTime(0.008, now + 0.1);
    whineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    whineOsc.connect(whineGain);
    whineGain.connect(this.ctx.destination);
    whineOsc.start(now);
    whineOsc.stop(now + 0.8);
  }

  // ダイヤルを回すときの「カチッ」
  playClick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(100, now + 0.02);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

const sfx = new RetroSoundSynth();

// ==========================================
// 【動画データ ＆ 感想文 設定】
// ここを編集・変更することで、授業(動画)の一覧、
// ニコニコ動画のID、感想文をカスタマイズできます！
// ==========================================
interface Lesson {
  period: number;
  title: string;
  nicovideoId: string; // ニコニコ動画のID (例: sm38500001)
  date: string;
  comment: string;
  stamp: 'excellent' | 'good' | 'great'; // スタンプの文字
  chalkColor: 'white' | 'red' | 'green';
}

const LESSON_DATA: Lesson[] = [
  {
    period: 1,
    title: "ハッピーシンセサイザ 踊ってみた",
    nicovideoId: "sm38500001", // <!-- ここに1本目の動画IDを入れる -->
    date: "2025年08月01日",
    comment: "記念すべきバースデー放送室の第1時限目！ドキドキの初投稿です。みちさんの緊張が指先から伝わってくるけれど、弾ける笑顔は最初から満点！何回も見返したくなる、ここから全てが始まった奇跡の原点です。",
    stamp: "excellent",
    chalkColor: "white"
  },
  {
    period: 2,
    title: "メランコリック 踊ってみた",
    nicovideoId: "sm38500002", // <!-- ここに2本目の動画IDを入れる -->
    date: "2025年08月15日",
    comment: "ツインテールを揺らしながら踊る姿が最高にキュート！恋する乙女のジレンマを、小さなステップとしぐさで見事に表現しています。間奏の首をかしげるポーズがあざとすぎて、ただのオタクはしっかりノックアウトされました。",
    stamp: "great",
    chalkColor: "green"
  },
  {
    period: 3,
    title: "ルカルカ★ナイトフィーバー 踊ってみた",
    nicovideoId: "sm38500003", // <!-- ここに3本目の動画IDを入れる -->
    date: "2025年09月01日",
    comment: "一転してユーロビートのキレキレダンスに挑戦！体全体をダイナミックに使った激しい振り付けなのに、息を切らさずにずっと満面の笑みをキープ。みちさんの高いポテンシャルと体力の凄さに驚かされた熱い授業です。",
    stamp: "excellent",
    chalkColor: "red"
  },
  {
    period: 4,
    title: "おちゃめ機能 踊ってみた",
    nicovideoId: "sm38500004", // <!-- ここに4本目の動画IDを入れる -->
    date: "2025年09月18日",
    comment: "「吹っ切れた」のポーズが抜群にシンクロ！くるくると目まぐるしく変わる豊かな表情と、おどけたカメラ目線が満載。手書きのテロップ演出もかわいらしく、手作り感あふれる良さがぎゅっと詰まっています。",
    stamp: "good",
    chalkColor: "white"
  },
  {
    period: 5,
    title: "スイートマジック 踊ってみた",
    nicovideoId: "sm38500005", // <!-- ここに5本目の動画IDを入れる -->
    date: "2025年10月05日",
    comment: "まるでお菓子作りの魔法にかかったような、カラフルでハッピーな時間。エプロン姿を思わせる衣装選びからセンス抜群です！くるっと回転したあとの、お茶目でスウィートな「おいしい魔法」にやられました。",
    stamp: "excellent",
    chalkColor: "green"
  },
  {
    period: 6,
    title: "金曜日のおはよう 踊ってみた",
    nicovideoId: "sm38500006", // <!-- ここに6本目の動画IDを入れる -->
    date: "2025年10月20日",
    comment: "金曜日の朝の、そわそわした甘酸っぱい通学路のストーリー。恋するもどかしさを表現した一生懸命なダンスは、見ているだけでこちらの背中も押されるよう。元気な「おはよう！」のポーズが爽やかで最高！",
    stamp: "great",
    chalkColor: "red"
  },
  {
    period: 7,
    title: "神のまにまに 踊ってみた",
    nicovideoId: "sm38500007", // <!-- ここに7本目の動画IDを入れる -->
    date: "2025年11月03日",
    comment: "和モダンな世界観の中で、お祭り騒ぎのように踊るハッピーなコマ。みんなで手拍子を合わせたくなるような一体感があります。「神様も人も、みんな一緒に楽しもう！」というみちさんの優しいオーラが溢れる授業です。",
    stamp: "excellent",
    chalkColor: "white"
  },
  {
    period: 8,
    title: "惑星ループ 踊ってみた",
    nicovideoId: "sm38500008", // <!-- ここに8本目の動画IDを入れる -->
    date: "2025年11月22日",
    comment: "「トゥットゥルー」の無限ループに吸い込まれる！宇宙を回る軌道のように、みちさんの周囲にはいつも笑顔の引力が働いています。ジャンプやスピンの軸がぶれず、ダンスの重心がどんどん安定してきたのがわかります。",
    stamp: "great",
    chalkColor: "green"
  },
  {
    period: 9,
    title: "可愛くてごめん 踊ってみた",
    nicovideoId: "sm38500009", // <!-- ここに9本目の動画IDを入れる -->
    date: "2025年12月10日",
    comment: "あざと可愛さの限界を突破！ちゅっちゅっと投げキッスをする仕草や、自分を全肯定する歌詞に合わせたポージングが完璧。みちさんに「可愛くてごめん」と歌われたら、全人類「いいえ、ありがとう！」と平伏すのみです。",
    stamp: "excellent",
    chalkColor: "red"
  },
  {
    period: 10,
    title: "ロミオとシンデレラ 踊ってみた",
    nicovideoId: "sm38500010", // <!-- ここに10本目の動画IDを入れる -->
    date: "2025年12月24日",
    comment: "クリスマスイブに投稿された、少し大人びたエモーショナルな名作。いつもの無邪気な笑顔を少し抑え、指先の妖艶な動きや伏せ目がちな目線でドラマチックなシンデレラを好演。表現力の幅にただただ感動しました。",
    stamp: "great",
    chalkColor: "white"
  },
  {
    period: 11,
    title: "ビバハピ 踊ってみた",
    nicovideoId: "sm38500011", // <!-- ここに11本目の動画IDを入れる -->
    date: "2026年01月08日",
    comment: "新年一発目はハイテンションなビバハピ！早口な歌詞に合わせた超高速ステップを見事にこなしています。見ているだけでお正月の眠気が一気に吹き飛ぶような、エネルギッシュでハッピーなダンス初めでした！",
    stamp: "excellent",
    chalkColor: "green"
  },
  {
    period: 12,
    title: "シル・ヴ・プレジデント 踊ってみた",
    nicovideoId: "sm38500012", // <!-- ここに12本目の動画IDを入れる -->
    date: "2026年01月25日",
    comment: "「宣誓！私が大統領になったら！」のポーズが凛々しくて超キュート。ちょっとツンとした表情と、コミカルなダンスのギャップがたまりません。みちさんが大統領選挙に出たら、ぶっちぎりで一発当選間違いなし！",
    stamp: "great",
    chalkColor: "red"
  },
  {
    period: 13,
    title: "おねがいダーリン 踊ってみた",
    nicovideoId: "sm38500013", // <!-- ここに13本目の動画IDを入れる -->
    date: "2026年02月14日",
    comment: "バレンタイン特別授業！甘えておねだりするようなポーズや、ちょっと寂しげな表情など、歌詞の「ダーリン」への想いが体いっぱいに詰まっています。この動画をリピートしながら食べたチョコは通常の3倍甘かったです。",
    stamp: "excellent",
    chalkColor: "white"
  },
  {
    period: 14,
    title: "エイリアンエイリアン 踊ってみた",
    nicovideoId: "sm38500014", // <!-- ここに14本目の動画IDを入れる -->
    date: "2026年02月28日",
    comment: "どこか無機質で宇宙的な、不思議なコンテンポラリー風ステップに挑戦。ロボットのようなカチッとした動きと、しなやかなターンの対比が素晴らしい！みちさんエイリアンに心を通わされ、未確認のトキメキを観測しました。",
    stamp: "good",
    chalkColor: "green"
  },
  {
    period: 15,
    title: "ニア 踊ってみた",
    nicovideoId: "sm38500015", // <!-- ここに15本目の動画IDを入れる -->
    date: "2026年03月15日",
    comment: "AIと人間の絆を描いた切なくも優しい名曲。一歩一歩踏みしめるような静かな動きから、サビに向けて感情が爆発するような大きな振りが胸を打ちます。みちさんのダンスから、確かなストーリーを感じられた深みのある授業です。",
    stamp: "excellent",
    chalkColor: "red"
  },
  {
    period: 16,
    title: "ファンサ 踊ってみた",
    nicovideoId: "sm38500016", // <!-- ここに16本目の動画IDを入れる -->
    date: "2026年04月01日",
    comment: "アイドル精神ここに極まれり！「もっともっと！」の声に応える特大のサービス満点ダンス。ファン一人ひとりに視線を送るような丁寧なカメラアピールに、全米が、いや、全みちさんファンが嬉し涙を流した伝説回。",
    stamp: "excellent",
    chalkColor: "white"
  },
  {
    period: 17,
    title: "極楽浄土 踊ってみた",
    nicovideoId: "sm38500017", // <!-- ここに17本目の動画IDを入れる -->
    date: "2026年04月20日",
    comment: "和傘を片手に、艶やかで美しい妖艶なダンスを披露。これまでの「可愛い」から「美しい・カッコいい」への完璧なる進化を見せつけました。ヒラリと翻る袖と、妖しく光る瞳に魂を持っていかれました。",
    stamp: "great",
    chalkColor: "green"
  },
  {
    period: 18,
    title: "テレキャスタービーボーイ 踊ってみた",
    nicovideoId: "sm38500018", // <!-- ここに18本目の動画IDを入れる -->
    date: "2026年05月10日",
    comment: "疾走感バツグンの高速ロックに乗せて、全力のジャンプとリズミカルなステップを披露！ダンス全体のシルエットがとても綺麗で、動きの止める・動かすのメリハリが完璧にコントロールされています。爽快感MAX！",
    stamp: "excellent",
    chalkColor: "red"
  },
  {
    period: 19,
    title: "ダーリンダンス 踊ってみた",
    nicovideoId: "sm38500019", // <!-- ここに19本目の動画IDを入れる -->
    date: "2026年05月25日",
    comment: "ちょっとダークなゆめかわいい世界。ゴシック風の仕草や、ニヒルで挑発的な表情が今までになく新鮮！みちさんの持つ多面的なミリョクをまざまざと見せつけられた、中毒性120%の病みつきコマです。",
    stamp: "great",
    chalkColor: "white"
  },
  {
    period: 20,
    title: "ハートアラモード 踊ってみた",
    nicovideoId: "sm38500020", // <!-- ここに20本目の動画IDを入れる -->
    date: "2026年06月15日",
    comment: "1周年の節目を飾る、あたたかくて優しい感謝の気持ちに満ちたダンス。これまで画面越しに授業を受けてきたオタクへの、みちさんからの最高の手紙のよう。愛を込めたハートのポーズに、感謝と祝福を込めて拍手を送りました。",
    stamp: "excellent",
    chalkColor: "green"
  }
];

// ==========================================
// 【特別授業（サプライズ枠）設定】
// ここに今日投稿した、最新のサプライズ動画IDを設定！
// ==========================================
const SPECIAL_LESSON = {
  title: "ハッピーバースデーみちさん！本日投稿の踊ってみた最新作",
  nicovideoId: "sm41000000", // <!-- ここに特別なサプライズ動画IDを入れる -->
  date: "2026年09月27日 (誕生日当日！)",
  comment: "みちさん、お誕生日本当におめでとう！この1年間、みちさんが届けてくれたたくさんの『踊ってみた』と最高の笑顔に、何度も元気をもらってきました。不器用だけど、心からの感謝を込めて作った特設サイトです。これからも、自分らしくきらきら踊り続けるみちさんを、ずっと応援しています。特別な今日に、ただのオタクより愛を込めて。"
};

export default function App() {
  // 状態管理
  const [isTvOn, setIsTvOn] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [activePeriod, setActivePeriod] = useState<number>(1);
  const [isTvGlitching, setIsTvGlitching] = useState<boolean>(false);
  const [isSpecialUnlocked, setIsSpecialUnlocked] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>("");
  const [filterMode, setFilterMode] = useState<'standard' | 'retro' | 'noise'>('retro');

  const tvScreenRef = useRef<HTMLDivElement | null>(null);

  // 1年間の動画の総数
  const totalLessons = LESSON_DATA.length;

  // チャンネルを切り替える
  const handleSelectPeriod = (periodNum: number) => {
    if (periodNum === activePeriod) return;
    sfx.playClick();
    setIsTvGlitching(true);
    setActivePeriod(periodNum);
    
    // チャンネル切替の砂嵐演出 (400ms)
    setTimeout(() => {
      setIsTvGlitching(false);
    }, 450);

    // モバイルスクロール対応：テレビをスムーズに画面中央へ
    if (window.innerWidth < 1024) {
      tvScreenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrevPeriod = () => {
    const nextVal = activePeriod === 1 ? totalLessons : activePeriod - 1;
    handleSelectPeriod(nextVal);
  };

  const handleNextPeriod = () => {
    const nextVal = activePeriod === totalLessons ? 1 : activePeriod + 1;
    handleSelectPeriod(nextVal);
  };

  // テレビをONにする
  const turnOnTv = () => {
    sfx.playTvOn();
    setIsTvOn(true);
    setHasStarted(true);
    
    // 最初は砂嵐から徐々に映像が出る演出
    setIsTvGlitching(true);
    setTimeout(() => {
      setIsTvGlitching(false);
      sfx.playSchoolChime(); // 起動時に優しくチャイムを鳴らす
      triggerNotification("チャイムが鳴りました！みちさんバースデー放送室の開始です");
    }, 1200);
  };

  // 特別授業のロックを解除
  const unlockSpecial = () => {
    if (isSpecialUnlocked) return;
    sfx.playSchoolChime();
    setIsSpecialUnlocked(true);
    triggerNotification("特別授業：サプライズ動画が公開されました！");
    
    // スムーズスクロールで特別授業の位置へ
    setTimeout(() => {
      const el = document.getElementById('special-lesson-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const triggerNotification = (msg: string) => {
    setNotificationMsg(msg);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const activeLesson = LESSON_DATA.find(l => l.period === activePeriod) || LESSON_DATA[0];

  return (
    <div className="relative min-h-screen bg-[#161411] text-[#ece6d8] overflow-x-hidden selection:bg-[#8f4a3a] selection:text-[#ece6d8]">
      {/* 画面全体のレトロエフェクト */}
      <div className="scanlines" />
      <div className="vignette" />

      {/* サウンドなどのシステム通知 */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] bg-[#2b3a33] border-2 border-[#6a8d7a] text-[#ece6d8] px-5 py-3 rounded-md shadow-2xl flex items-center gap-3 font-hand text-sm md:text-base max-w-[90%] w-fit text-center"
          >
            <div className="w-2 h-2 rounded-full bg-[#8f4a3a] animate-ping" />
            <span className="chalk-text jp-balance">{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          1. オープニング（テレビの電源を入れる前）
          ========================================== */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div 
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 bg-[#0d0c0a] z-[999] flex flex-col items-center justify-center p-6"
            style={{ pointerEvents: hasStarted ? 'none' : 'auto' }}
          >
            {/* 砂嵐風のバックグラウンド */}
            <div className="absolute inset-0 bg-[radial-gradient(#1f1c18_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />
            
            <div className="relative max-w-xl w-full text-center z-10 space-y-12 px-4">
              {/* テレビ本体のレトロなアウトライン */}
              <div className="border-4 border-[#332b24] bg-[#1a1712] rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-8 ring-[#161411] outline-none">
                
                {/* 画面の内側 */}
                <div className="bg-[#0f0e0d] border-2 border-[#2b2520] rounded-2xl py-12 px-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-inner">
                  {/* CRT画面特有の球体ゆがみとガラスの反射をシミュレート */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-2xl" />
                  
                  {/* アナログ砂嵐のうっすらした表示 */}
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)] pointer-events-none" />

                  {/* チョーク手書き風のタイトル */}
                  <div className="space-y-4 animate-pulse">
                    <p className="text-sm tracking-wider md:tracking-widest text-[#a45a49] font-hand font-bold jp-balance">
                      ー 昭和レトロ誕生日記念放送 ー
                    </p>
                    <h1 className="text-3xl md:text-4xl text-[#ece6d8] font-hand font-bold leading-relaxed tracking-normal md:tracking-wider jp-balance">
                      みちさんバースデー放送室
                    </h1>
                    <div className="w-24 h-0.5 bg-[#a45a49] mx-auto opacity-70 my-4" />
                    <p className="text-xs text-[#a39e93] font-mono tracking-widest uppercase">
                      Ch.927 Special Birthday Broadcast
                    </p>
                  </div>

                  {/* 静的な指示 */}
                  <div className="mt-8 text-xs text-[#8e897e] font-sans flex items-center justify-center gap-1">
                    <Info size={12} />
                    <span>音量をオンにしてお楽しみください</span>
                  </div>
                </div>

                {/* つまみ（ダミー）とスピーカー穴 */}
                <div className="mt-6 flex justify-between items-center px-4 border-t border-[#2d2621] pt-4">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full border-2 border-[#2d2621] bg-[#1a1712] relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#a45a49]" />
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-[#2d2621] bg-[#1a1712] relative">
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-0.5 bg-[#a39e93]" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#161411]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#161411]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#161411]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#161411]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#161411]" />
                  </div>
                </div>
              </div>

              {/* 起動ボタン */}
              <motion.button
                onClick={turnOnTv}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full max-w-xs mx-auto bg-[#8f4a3a] hover:bg-[#a45a49] text-[#ece6d8] font-hand py-4 px-8 rounded-full border-2 border-[#ece6d8]/20 shadow-lg text-lg tracking-wider cursor-pointer transition-colors duration-200 jp-keep"
              >
                テレビの電源を入れる 📺
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          2. メインコンテンツ（テレビ起動後）
          ========================================== */}
      {hasStarted && (
        <div className="pb-24">
          
          {/* ヘッダーエリア */}
          <header className="relative border-b-2 border-[#2d2621] py-8 bg-[#1a1712] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#25211c_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              
              {/* タイトル & 日直 */}
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#8f4a3a]/10 border border-[#8f4a3a]/30 px-3 py-1 rounded-full text-xs text-[#a45a49] font-mono tracking-widest uppercase">
                  <Tv size={12} className="animate-pulse" />
                  <span>Nostalgic Memorial TV System</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-hand text-[#ece6d8] tracking-normal md:tracking-wider flex flex-wrap items-center justify-center md:justify-start gap-2 jp-balance">
                  <span>みちさんバースデー放送室</span>
                  <span className="text-xs font-mono font-normal bg-[#33403a] text-[#ece6d8] px-2 py-0.5 rounded border border-[#6a8d7a]/30 ui-nowrap">
                    Ch.927 誕生日特別放送
                  </span>
                </h1>
                <p className="text-xs text-[#a39e93] font-klee jp-balance">
                  1年間の『踊ってみた』作品の軌跡を振り返る、誕生日記念の特別授業です。
                </p>
              </div>

              {/* 学校の黒板風 日直・出席板 */}
              <div className="bg-[#2b3a33] border-4 border-[#5c4033] p-3 rounded-lg shadow-md max-w-md w-full grid grid-cols-3 text-[11px] md:text-sm font-hand">
                <div className="space-y-1 border-r border-[#6a8d7a]/30 px-2 first:pl-0">
                  <div className="text-[#6a8d7a] text-center ui-nowrap">【本日の日直】</div>
                  <div className="text-center font-bold text-[#ece6d8] jp-keep">ただのオタク</div>
                </div>
                <div className="space-y-1 border-r border-[#6a8d7a]/30 px-2">
                  <div className="text-[#6a8d7a] text-center ui-nowrap">【本日の目標】</div>
                  <div className="text-center text-[#ece6d8] text-[11px] md:text-xs jp-keep">全力でお祝いする！</div>
                </div>
                <div className="space-y-1 px-2 last:pr-0">
                  <div className="text-[#a45a49] text-center ui-nowrap">【出席状況】</div>
                  <div className="text-center font-mono font-bold text-[#ece6d8] ui-nowrap">365 / 365 日</div>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 mt-10 space-y-16">
            
            {/* ==========================================
                セクション 1: ブラウン管テレビ ＆ 感想文ノート
                ========================================== */}
            <section ref={tvScreenRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* 左側：ブラウン管テレビコンソール（7カラム） */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* テレビ外郭枠 */}
                <div className="relative border-[12px] md:border-[16px] border-[#3a3128] bg-[#211a14] rounded-3xl p-3 md:p-6 shadow-2xl relative overflow-hidden ring-4 ring-[#161411]">
                  
                  {/* テレビ上部アンテナ（飾り） */}
                  <div className="hidden md:flex justify-center -mt-10 mb-4 opacity-70">
                    <div className="w-1 bg-[#4a3f33] h-10 origin-bottom -rotate-12 translate-x-2 rounded" />
                    <div className="w-1 bg-[#4a3f33] h-12 origin-bottom rotate-12 -translate-x-2 rounded" />
                  </div>

                  {/* ブラウン管画面部 */}
                  <div className="relative aspect-video bg-[#0d0c0a] rounded-xl overflow-hidden shadow-inner border border-black">
                    
                    {/* テレビ内部用 砂嵐 overlay (glitch時または電源OFF時) */}
                    {isTvGlitching && (
                      <div className="absolute inset-0 z-40 bg-black overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:3px_3px] opacity-70 animate-pulse" />
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_50px,rgba(255,255,255,0.04)_50px,rgba(255,255,255,0.04)_100px)] pointer-events-none" />
                        <div className="font-mono text-[#ece6d8] text-xs font-bold tracking-widest flex flex-col items-center gap-2">
                          <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#ece6d8] animate-spin" />
                          <span className="text-[#a45a49]">TUNING CH.927...</span>
                        </div>
                      </div>
                    )}

                    {/* ブラウン管特有のガラスの反射・質感オーバーレイ */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-30" />
                    
                    {/* CRT走査線 */}
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.12),rgba(0,0,0,0.12)_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)] pointer-events-none z-30" />

                    {/* アナログ特有の湾曲感を四隅に shadow で再現 */}
                    <div className="absolute inset-0 shadow-[inset_0_0_24px_rgba(0,0,0,0.9)] pointer-events-none z-30" />

                    {/* VHS状態表示テキスト (PLAY 0:00:00) */}
                    <div className="absolute top-3 left-4 font-mono text-[10px] md:text-xs text-[#00ff66] tracking-widest z-30 select-none flex items-center gap-2 opacity-80">
                      <div className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
                      <span>PLAY</span>
                      <span>0:00:{activePeriod < 10 ? `0${activePeriod}` : activePeriod}</span>
                    </div>

                    <div className="absolute top-3 right-4 font-mono text-[10px] md:text-xs text-[#00ff66] tracking-widest z-30 select-none opacity-80">
                      <span>CH.927 VHS-SP</span>
                    </div>

                    {/* 実際のニコニコ動画埋め込みプレイヤー */}
                    <div className="w-full h-full">
                      {/* ニコニコ動画のインラインフレーム：パフォーマンス向上のため、チャンネル切り替え時にのみ遅延読み込みされます */}
                      <iframe 
                        title={`nicovideo-player-${activePeriod}`}
                        src={`https://embed.nicovideo.jp/watch/${activeLesson.nicovideoId}?jsapi=1`} 
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media" 
                        allowFullScreen
                      />
                    </div>
                  </div>

                  {/* テレビのコントロールパネル */}
                  <div className="mt-4 border-t border-[#4a3d31]/40 pt-4 flex items-center justify-between gap-4">
                    
                    {/* ダイヤルとボタン */}
                    <div className="flex items-center gap-3">
                      
                      {/* 前の授業へ */}
                      <button 
                        onClick={handlePrevPeriod}
                        className="w-9 h-9 rounded-full bg-[#3a3128] border border-[#524436] hover:bg-[#4a3f33] active:bg-[#2b221a] flex items-center justify-center text-[#ece6d8] cursor-pointer shadow transition-colors"
                        title="前の時間割"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {/* チャンネルダイヤル */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-mono text-[#a39e93] uppercase mb-1">Channel</span>
                        <div className="w-12 h-12 rounded-full bg-[#2a2119] border-2 border-[#524436] relative flex items-center justify-center shadow-inner">
                          <div 
                            className="absolute w-1 h-5 bg-[#8f4a3a] rounded-full top-1 transition-transform duration-300"
                            style={{ transform: `rotate(${(activePeriod * 18) % 360}deg)`, transformOrigin: 'bottom center' }}
                          />
                          <span className="font-mono text-xs text-[#ece6d8] z-10 bg-[#2a2119] px-1 rounded-sm border border-[#524436]/50">
                            {activePeriod}
                          </span>
                        </div>
                      </div>

                      {/* 次の授業へ */}
                      <button 
                        onClick={handleNextPeriod}
                        className="w-9 h-9 rounded-full bg-[#3a3128] border border-[#524436] hover:bg-[#4a3f33] active:bg-[#2b221a] flex items-center justify-center text-[#ece6d8] cursor-pointer shadow transition-colors"
                        title="次の時間割"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* スピーカーネット（レトロな縦スリット） */}
                    <div className="flex-1 max-w-[120px] md:max-w-[200px] flex flex-col gap-1 px-4">
                      <div className="h-1 bg-[#1c1611] rounded-full opacity-60" />
                      <div className="h-1 bg-[#1c1611] rounded-full opacity-60" />
                      <div className="h-1 bg-[#1c1611] rounded-full opacity-60" />
                      <div className="h-1 bg-[#1c1611] rounded-full opacity-60" />
                      <div className="h-1 bg-[#1c1611] rounded-full opacity-60" />
                    </div>

                    {/* 画質モード切替 */}
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-[#a39e93] block mb-1 uppercase">Filter Mode</span>
                      <div className="inline-flex rounded-md border border-[#4a3d31]/60 p-0.5 bg-[#1a1410]">
                        {(['standard', 'retro'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              sfx.playClick();
                              setFilterMode(mode);
                              triggerNotification(`フィルターを ${mode === 'retro' ? '昭和レトロ風' : '標準'} に変更しました`);
                            }}
                            className={`px-2 py-1 text-[9px] font-hand rounded cursor-pointer transition-all ${
                              filterMode === mode 
                                ? 'bg-[#8f4a3a] text-[#ece6d8]' 
                                : 'text-[#a39e93] hover:text-[#ece6d8]'
                            }`}
                          >
                            {mode === 'retro' ? '番組風' : '標準'}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 補足操作案内 */}
                <div className="bg-[#1f1a14] border border-[#332a21]/50 p-3.5 rounded-xl space-y-1.5 text-xs text-[#a39e93]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <p className="font-klee jp-keep">📺 下の番組表から好きな授業（踊ってみた動画）を選択できます。</p>
                    <p className="font-mono text-[10px] text-[#8f4a3a]">VHS RERUN SYSTEM</p>
                  </div>
                  <p className="font-klee text-[11px] text-[#a45a49]/90 border-t border-[#332a21]/40 pt-1.5 jp-keep">
                    📱 モバイル画面等でスクロールしづらい場合は、テレビの外郭（黒枠）や周りの余白、または下部の黒板グリーン部をスワイプするとスムーズにスクロールできます。
                  </p>
                </div>
              </div>

              {/* 右側：学習ノート感想文カード（5カラム） */}
              <div className="lg:col-span-5 h-full">
                
                <div className="bg-[#fcfaf2] text-[#2b251e] rounded-2xl shadow-2xl border-l-[16px] border-[#933c2a] relative overflow-hidden h-full flex flex-col justify-between"
                     style={{ backgroundImage: 'radial-gradient(#e5dec9 1px, transparent 1.5px)', backgroundSize: '16px 16px' }}>
                  
                  {/* キャンパスノートのような装飾テープ */}
                  <div className="absolute top-0 right-0 left-0 h-4 bg-[#a45a49]/10 border-b border-[#a45a49]/20" />
                  
                  <div className="p-6 md:p-8 space-y-6 pt-10">
                    
                    {/* ノートヘッダー */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-[#a45a49]/30 pb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#a45a49] font-hand font-semibold jp-keep">
                          <BookOpen size={14} className="shrink-0" />
                          <span>学習ノート（授業の記録）</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-hand font-bold text-[#110e0c] mt-1 jp-keep">
                          第{activeLesson.period}時限の記録
                        </h2>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono text-[#8a8174]">DATE:</div>
                        <div className="text-xs font-mono font-bold text-[#a45a49] ui-nowrap">{activeLesson.date}</div>
                      </div>
                    </div>

                    {/* 授業タイトル */}
                    <div className="bg-[#a45a49]/5 border-l-4 border-[#a45a49] p-3 rounded-r-lg">
                      <div className="text-[10px] text-[#8a8174] uppercase tracking-wider font-mono">Subject (曲名)</div>
                      <div className="text-base md:text-lg font-hand font-bold text-[#1a1511] flex items-start gap-1.5 mt-0.5 jp-keep">
                        <Music size={16} className="text-[#a45a49] shrink-0 mt-1" />
                        <span>{activeLesson.title}</span>
                      </div>
                    </div>

                    {/* 感想文本文 (手書き風) */}
                    <div className="relative font-hand text-base md:text-lg leading-relaxed text-[#211a14] min-h-[160px] whitespace-pre-wrap py-2 border-b border-dashed border-[#a45a49]/20">
                      
                      {/* 横罫線風の背景 */}
                      <div className="absolute inset-0 pointer-events-none" 
                           style={{ 
                             backgroundImage: 'linear-gradient(#0000 95%, rgba(164, 90, 73, 0.1) 95%)', 
                             backgroundSize: '100% 1.8rem',
                             lineHeight: '1.8rem'
                           }} 
                      />
                      
                      <p className="relative z-10 pl-2 leading-[1.8rem]">
                        {activeLesson.comment}
                      </p>
                    </div>

                    {/* 教師からの評価スタンプ（レトロな赤インク風スタンプ） */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
                      <div className="text-[11px] font-klee text-[#8a8174] jp-keep">
                        ※この授業は記念再放送として出席登録済みです。
                      </div>
                      
                      {/* 赤インクスタンプ */}
                      <div className="relative w-20 h-20 flex items-center justify-center transform rotate-6 border-4 border-dashed border-[#a45a49] rounded-full p-1 shadow-sm select-none shrink-0 self-end sm:self-auto">
                        <div className="border-2 border-double border-[#a45a49] rounded-full w-full h-full flex flex-col items-center justify-center bg-white/40">
                          <span className="text-[10px] font-bold text-[#a45a49] font-hand leading-none">みちさん</span>
                          <span className="text-xs font-bold text-[#a45a49] font-hand leading-normal uppercase my-0.5">
                            {activeLesson.stamp === 'excellent' ? 'たいへんよく' : activeLesson.stamp === 'great' ? 'よく' : 'がんばり'}
                          </span>
                          <span className="text-[10px] font-bold text-[#a45a49] font-hand leading-none">できました</span>
                        </div>
                        {/* かすれ風の模様をCSSで再現 */}
                        <div className="absolute inset-0 bg-[#fcfaf2] mix-blend-color-dodge opacity-20" />
                      </div>
                    </div>

                  </div>

                  {/* ノートの下部余白 */}
                  <div className="h-5 bg-[#933c2a]/15 border-t border-[#933c2a]/20" />
                </div>

              </div>

            </section>

            {/* ==========================================
                セクション 2: メインの授業表 (1〜20時限)
                ========================================== */}
            <section className="space-y-6">
              
              <div className="text-center space-y-2">
                <div className="inline-block bg-[#2b3a33] text-[#ece6d8] px-4 py-1.5 rounded-full border border-[#6a8d7a]/40 text-xs font-hand jp-keep">
                  ー 年間時間割表（1年間で20本） ー
                </div>
                <h2 className="text-2xl md:text-3xl font-hand text-[#ece6d8] tracking-normal md:tracking-wider chalk-text jp-balance">
                  授業カリキュラム一覧
                </h2>
                <p className="text-xs text-[#a39e93] font-klee jp-balance max-w-2xl mx-auto">
                  タップすると、上のブラウン管テレビのチャンネルが切り替わり、動画と感想文がロードされます。
                </p>
              </div>

              {/* VHSカセットテープが並ぶ棚のようなグリッドレイアウト */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {LESSON_DATA.map((lesson) => {
                  const isActive = lesson.period === activePeriod;
                  
                  // カラーテーマ
                  const cardBgClass = isActive 
                    ? 'bg-[#33403a] border-[#6a8d7a] text-[#ece6d8] ring-4 ring-[#8f4a3a]/40 shadow-2xl' 
                    : 'bg-[#1a1712] border-[#2d2621] text-[#a39e93] hover:border-[#4a3f33] hover:text-[#ece6d8]';

                  return (
                    <motion.div
                      key={lesson.period}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPeriod(lesson.period)}
                      className={`border-2 p-3.5 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px] relative overflow-hidden group ${cardBgClass}`}
                    >
                      {/* VHSラベル風のデザインスリット */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8f4a3a] opacity-50 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="space-y-2 relative z-10">
                        {/* 時限バッジ */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-mono text-[10px] tracking-normal sm:tracking-wider uppercase text-[#a45a49] ui-nowrap">
                            PERIOD {lesson.period < 10 ? `0${lesson.period}` : lesson.period}
                          </span>
                          {isActive && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
                            </span>
                          )}
                        </div>

                        {/* 漢字の時限名 */}
                        <div className="font-hand text-base font-bold text-[#ece6d8] group-hover:text-white transition-colors line-clamp-1">
                          第{lesson.period}時限
                        </div>

                        {/* 曲名 */}
                        <p className="font-klee text-xs line-clamp-2 leading-relaxed h-8 text-[#a39e93] group-hover:text-[#ece6d8]">
                          {lesson.title.replace(" 踊ってみた", "")}
                        </p>
                      </div>

                      {/* フッター：日付と再生アイコン */}
                      <div className="flex justify-between items-center pt-3 border-t border-[#2d2621]/40 mt-2 relative z-10">
                        <span className="font-mono text-[9px] text-[#8e897e]">{lesson.date.replace("2025年", "").replace("2026年", "")}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-hand text-[#8f4a3a] opacity-0 group-hover:opacity-100 transition-opacity">再生</span>
                          <Play size={10} className={`${isActive ? 'text-[#00ff66]' : 'text-[#8f4a3a] group-hover:scale-125 transition-transform'}`} />
                        </div>
                      </div>

                      {/* アクティブ時のうっすらした輝き */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#6a8d7a]/5 to-transparent pointer-events-none" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

            </section>

            {/* ==========================================
                セクション 3: 総合所見（お祝いの手紙 ＆ 通知表）
                ========================================== */}
            <section className="bg-[#1f1a14] border-2 border-[#2d2621] rounded-2xl p-6 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#2c221a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
                
                {/* 左側：通知表の成績（5カラム） */}
                <div className="lg:col-span-5 bg-[#2b3a33] border-4 border-[#5c4033] rounded-xl p-5 md:p-6 flex flex-col justify-between text-[#ece6d8] shadow-lg relative">
                  
                  {/* 黒板消しの粉っぽいテクスチャ */}
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:8px_8px] opacity-50" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="border-b-2 border-[#6a8d7a]/40 pb-2 text-center">
                      <h3 className="font-hand text-xl text-[#ece6d8] chalk-text">みちさん通知表</h3>
                      <p className="text-[10px] font-mono text-[#6a8d7a] uppercase tracking-wider mt-0.5 jp-balance">Dance Performance Appraisal</p>
                    </div>

                    <table className="w-full text-[12px] sm:text-sm font-hand [word-break:keep-all]">
                      <thead>
                        <tr className="border-b border-[#6a8d7a]/30 text-[#6a8d7a]">
                          <th className="py-2 pr-2 text-left ui-nowrap">教科（項目）</th>
                          <th className="py-2 px-2 text-center ui-nowrap">評価</th>
                          <th className="py-2 text-right">所見</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#6a8d7a]/20">
                        <tr>
                          <td className="py-3 pr-2 text-[#ece6d8]"><span className="inline-flex items-center gap-1.5 ui-nowrap"><Heart size={14} className="text-[#a45a49] shrink-0" /> 笑顔のまぶしさ</span></td>
                          <td className="py-3 px-2 text-center text-[#a45a49] font-bold text-sm sm:text-base ui-nowrap">💮 特丸</td>
                          <td className="py-3 text-right text-xs text-[#a39e93] jp-keep">銀河系で一番きらきら</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-2 text-[#ece6d8]"><span className="inline-flex items-center gap-1.5 ui-nowrap"><Sparkles size={14} className="text-[#a45a49] shrink-0" /> ダンスのキレ</span></td>
                          <td className="py-3 px-2 text-center text-[#a45a49] font-bold text-sm sm:text-base ui-nowrap">💮 特丸</td>
                          <td className="py-3 text-right text-xs text-[#a39e93] jp-keep">しなやかで抜群の安定感</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-2 text-[#ece6d8]"><span className="inline-flex items-center gap-1.5 ui-nowrap"><Music size={14} className="text-[#a45a49] shrink-0" /> リズム感</span></td>
                          <td className="py-3 px-2 text-center text-[#a45a49] font-bold text-sm sm:text-base ui-nowrap">💮 特丸</td>
                          <td className="py-3 text-right text-xs text-[#a39e93] jp-keep">曲の主人公になりきる天才</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-2 text-[#ece6d8]"><span className="inline-flex items-center gap-1.5 ui-nowrap"><Calendar size={14} className="text-[#a45a49] shrink-0" /> 努力・継続性</span></td>
                          <td className="py-3 px-2 text-center text-[#a45a49] font-bold text-sm sm:text-base ui-nowrap">💮 特丸</td>
                          <td className="py-3 text-right text-xs text-[#a39e93] jp-keep">約20本！完璧な出席記録</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-2 text-[#ece6d8]"><span className="inline-flex items-center gap-1.5 ui-nowrap"><Award size={14} className="text-[#a45a49] shrink-0" /> ファンへの愛</span></td>
                          <td className="py-3 px-2 text-center text-[#a45a49] font-bold text-sm sm:text-base ui-nowrap">💮 特丸</td>
                          <td className="py-3 text-right text-xs text-[#a39e93] jp-keep">いつも特大の元気を届ける</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-[#6a8d7a]/30 pt-4 mt-6 text-center text-xs text-[#6a8d7a] font-hand relative z-10">
                    <p>担任教諭：ただのオタク より</p>
                    <p className="text-[10px] mt-1 text-[#a45a49]">「1年間、感動をありがとうございました！」</p>
                  </div>
                </div>

                {/* 右側：総合所見お手紙（7カラム） */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#a45a49] font-mono tracking-wider">
                      <span>REPORT CARD</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a45a49]" />
                      <span>総合所見欄</span>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-hand text-[#ece6d8] tracking-normal md:tracking-wider flex items-center gap-2 jp-balance">
                      総合所見（みちさんへの手紙）
                    </h3>

                    {/* 昭和の作文用紙・便箋風の枠 */}
                    <div className="bg-[#1a1712] border border-[#2d2621] p-5 md:p-6 rounded-xl font-hand text-sm md:text-base leading-relaxed text-[#ece6d8] space-y-4 relative">
                      {/* 横線が入った懐かしい便箋をシミュレート */}
                      <div className="absolute inset-0 pointer-events-none opacity-5" 
                           style={{ 
                             backgroundImage: 'linear-gradient(#ece6d8 1px, transparent 1px)', 
                             backgroundSize: '100% 1.6rem' 
                           }} 
                      />

                      <p className="text-[#a45a49] font-bold jp-keep">みちさんへ、お誕生日おめでとうございます！</p>
                      
                      <p className="indent-4 text-justify">
                        この1年間、みちさんが投稿してくれた約20本の踊ってみた作品は、どれも個性的で、熱い想いがぎゅっと詰まった素晴らしい「授業」ばかりでした。
                        最初は初々しくて緊張していた姿が、時を重ねるごとに表現の幅を広げ、ついには艶やかな和風ダンスやダークな曲調まで完璧に踊りこなす姿を見て、
                        ただのオタクはいつも大きな驚きと、それ以上の元気をたくさんもらっていました。
                      </p>
                      
                      <p className="indent-4 text-justify">
                        完璧に整った可愛さだけではなく、どこか手作りで、不器用なほどに一生懸命で、温かいみちさんの踊りとコメントが、日々の最高の癒やしです。
                        日々の中にみちさんの動画という「きらきらした時間」があったこと、本当に感謝しています。
                      </p>

                      <p className="text-right text-xs md:text-sm text-[#a39e93] pt-2">
                        ただのオタクより、愛とリスペクトを込めて。
                      </p>
                    </div>
                  </div>

                  {/* 次に進むための動線 */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2d2621]/40">
                    <p className="text-xs text-[#a39e93] font-klee text-center sm:text-left">
                      ※さて、ついに放課後の「特別授業」のチャイムが鳴り響きます…
                    </p>
                    
                    <button
                      onClick={unlockSpecial}
                      disabled={isSpecialUnlocked}
                      className={`font-hand px-6 py-3 rounded-full border-2 text-sm tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer jp-keep ${
                        isSpecialUnlocked 
                          ? 'bg-[#2b3a33] border-[#6a8d7a] text-[#6a8d7a] cursor-default' 
                          : 'bg-[#8f4a3a] border-[#ece6d8]/20 hover:bg-[#a45a49] hover:scale-105 active:scale-95 text-[#ece6d8] shadow-lg'
                      }`}
                    >
                      {isSpecialUnlocked ? (
                        <>
                          <Unlock size={14} />
                          <span>特別授業 開放中</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} className="animate-bounce" />
                          <span>特別授業を開放する 🔑</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

              </div>
            </section>

            {/* ==========================================
                セクション 4: 特別授業 (本日投稿のサプライズ動画)
                ========================================== */}
            <section id="special-lesson-section" className="relative scroll-mt-6">
              
              <AnimatePresence>
                {!isSpecialUnlocked ? (
                  /* ロック中の表示 */
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={unlockSpecial}
                    className="border-8 border-double border-[#332b24] bg-[#221e1a] rounded-2xl p-8 md:p-12 text-center cursor-pointer hover:bg-[#2b2520] transition-colors relative group"
                  >
                    {/* 木目のチョーク黒板のダミー */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1a1712_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                    
                    <div className="max-w-md mx-auto space-y-6 py-6 relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-[#8f4a3a]/10 border-2 border-dashed border-[#8f4a3a] flex items-center justify-center text-[#8f4a3a] group-hover:scale-110 transition-transform">
                        <Lock size={28} />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-hand text-xl md:text-2xl text-[#ece6d8] tracking-normal md:tracking-wider jp-balance">
                          本日の予定：特別授業（秘密の放課後）
                        </h3>
                        <p className="text-xs text-[#a39e93] font-klee jp-balance">
                          上の「特別授業を開放する」ボタンを押すか、ここをタップすると
                          ロックが解除され、秘密の誕生日動画枠が現れます。
                        </p>
                      </div>

                      <div className="w-16 h-0.5 bg-[#8f4a3a] opacity-50" />
                      
                      <p className="text-xs text-[#8f4a3a] font-hand tracking-wider animate-pulse jp-keep">
                        【タップして出席登録＆ロック解除】
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* ロック解除後の特別授業 */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="border-8 border-[#5c4033] bg-[#2b3a33] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
                  >
                    {/* 黒板の質感 */}
                    <div className="absolute inset-0 chalkboard-bg" />
                    
                    <div className="relative z-10 space-y-8">
                      
                      {/* 黒板の文字・ヘッダー */}
                      <div className="border-b-2 border-dashed border-[#6a8d7a]/50 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-1 text-[#a45a49] font-hand text-xs font-bold bg-[#a45a49]/10 px-2 py-0.5 rounded border border-[#a45a49]/20 jp-keep">
                            <Sparkles size={12} className="animate-spin shrink-0" />
                            <span>本日限りの特別授業</span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-hand font-bold text-[#ece6d8] chalk-text mt-1.5 jp-balance">
                            特別授業：『ハッピーバースデーみちさん！』
                          </h3>
                        </div>
                        <div className="text-left md:text-right font-hand text-xs text-[#6a8d7a] shrink-0">
                          <span>日付: {SPECIAL_LESSON.date}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        
                        {/* 左：サプライズ動画プレイヤー（7カラム） */}
                        <div className="lg:col-span-7">
                          <div className="relative border-4 border-[#1a1712] bg-[#1a1712] rounded-2xl p-1 shadow-2xl overflow-hidden aspect-video">
                            
                            {/* CRT走査線（特別授業用） */}
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1),rgba(0,0,0,0.1)_2px,transparent_2px,transparent_4px)] pointer-events-none z-20" />
                            <div className="absolute inset-0 shadow-[inset_0_0_16px_rgba(0,0,0,0.8)] pointer-events-none z-20" />
                            
                            {/* ニコニコ動画 iframe */}
                            <iframe 
                              title="nicovideo-special-player"
                              src={`https://embed.nicovideo.jp/watch/${SPECIAL_LESSON.nicovideoId}?jsapi=1`} 
                              className="w-full h-full border-0 rounded-xl"
                              allow="autoplay; encrypted-media" 
                              allowFullScreen
                            />
                          </div>
                        </div>

                        {/* 右：特別授業のコメント（5カラム） */}
                        <div className="lg:col-span-5 space-y-5">
                          
                          {/* チョーク赤枠の手書き看板 */}
                          <div className="border-2 border-dashed border-[#a45a49] bg-[#1a1712]/45 p-5 rounded-2xl text-[#ece6d8] space-y-4 font-hand shadow-inner">
                            <h4 className="text-lg text-[#a45a49] chalk-text-red font-bold flex items-center gap-1 jp-keep">
                              <Heart size={16} className="fill-[#a45a49] animate-pulse shrink-0" />
                              <span>お祝いメッセージ 💮</span>
                            </h4>
                            
                            <p className="text-sm md:text-base leading-relaxed text-[#ece6d8]/90 pl-1 jp-keep">
                              {SPECIAL_LESSON.comment}
                            </p>

                            <div className="border-t border-[#6a8d7a]/30 pt-3 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-[#6a8d7a]">
                              <span className="jp-keep">企画・制作: ただのオタクより</span>
                              <span className="font-mono text-[10px] text-[#a45a49]">SPECIAL PRESENT</span>
                            </div>
                          </div>

                          {/* リピートを促す可愛いチョーク風手書きメモ */}
                          <div className="border border-dashed border-[#6a8d7a] p-4 rounded-xl text-center font-hand text-xs text-[#6a8d7a] space-y-1">
                            <p className="chalk-text-green jp-balance">💡 「みちさん、生まれてきてくれてありがとう！」</p>
                            <p className="jp-balance">この動画の感想は、ぜひコメント欄でたくさん届けてくださいね！</p>
                          </div>

                        </div>

                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </section>

          </main>

          {/* フッター */}
          <footer className="mt-20 border-t border-[#2d2621] pt-8 text-center text-xs text-[#8e897e] font-klee space-y-3 px-4 relative z-10">
            <p className="jp-balance">📺 本サイトはみちさんのお誕生日を記念して作られたファンメイドサプライズサイトです。</p>
            <p className="font-mono text-[10px] tracking-wider text-[#8f4a3a]/60 break-words">
              © 2026 ただのオタクより / MICHI-SAN BIRTHDAY BROADCAST PROJECT.
            </p>
          </footer>

        </div>
      )}

    </div>
  );
}
