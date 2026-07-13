# Design

## 技術構成

- フレームワーク: React 19
- ビルドツール: Vite
- 言語: TypeScript
- スタイリング: Tailwind CSS v4 + `src/index.css`
- アニメーション: `motion/react`
- アイコン: `lucide-react`
- 動画埋め込み: ニコニコ動画 iframe
- 音声: Web Audio APIによる合成音

## アプリ構造

現状は単一コンポーネント `src/App.tsx` に、データ定義、音声合成クラス、状態管理、画面描画がまとまっている。

```text
src/
  App.tsx       # メイン画面、データ、音声合成、状態管理
  index.css     # フォント、Tailwind、CRT/黒板/チョーク系CSS
  main.tsx      # Reactエントリーポイント
```

## データモデル

### Lesson

```ts
interface Lesson {
  period: number;
  title: string;
  nicovideoId: string;
  date: string;
  comment: string;
  stamp: 'excellent' | 'good' | 'great';
  chalkColor: 'white' | 'red' | 'green';
}
```

### 通常授業データ

`LESSON_DATA` に20件を配列で定義する。`period` は1から20までの連番で、画面上のチャンネル番号としても使う。

### 特別授業データ

`SPECIAL_LESSON` に以下を定義する。

- `title`
- `nicovideoId`
- `date`
- `comment`

## 状態設計

`App` コンポーネントでは以下の状態を管理する。

| state | 型 | 役割 |
| --- | --- | --- |
| `isTvOn` | `boolean` | テレビ電源状態。現状はセットされるが描画条件にはほぼ使われない。 |
| `hasStarted` | `boolean` | オープニング終了済みか。メイン画面表示の判定に使う。 |
| `activePeriod` | `number` | 現在選択中の通常授業番号。 |
| `isTvGlitching` | `boolean` | 起動時・チャンネル切替時の砂嵐表示。 |
| `isSpecialUnlocked` | `boolean` | 特別授業のロック解除状態。 |
| `showNotification` | `boolean` | 通知表示状態。 |
| `notificationMsg` | `string` | 通知テキスト。 |
| `filterMode` | `'standard' \| 'retro' \| 'noise'` | フィルター選択状態。UIでは `standard` と `retro` のみ表示。 |

## 主要イベント

### `turnOnTv`

テレビ電源ボタン押下時に実行する。

1. テレビ起動音を鳴らす。
2. `isTvOn` と `hasStarted` を `true` にする。
3. `isTvGlitching` を `true` にする。
4. 約1.2秒後に砂嵐を解除する。
5. 学校チャイムを鳴らす。
6. 開始通知を表示する。

### `handleSelectPeriod`

授業カードまたは前後ボタンから授業を切り替える。

1. 同じ授業が選択された場合は何もしない。
2. クリック音を鳴らす。
3. `isTvGlitching` を `true` にする。
4. `activePeriod` を更新する。
5. 約450ms後に砂嵐を解除する。
6. モバイル幅ではテレビセクションへスクロールする。

### `handlePrevPeriod` / `handleNextPeriod`

`activePeriod` を前後に移動する。端では1から20、20から1へ循環する。

### `unlockSpecial`

特別授業を開放する。

1. 開放済みの場合は何もしない。
2. 学校チャイムを鳴らす。
3. `isSpecialUnlocked` を `true` にする。
4. 開放通知を表示する。
5. 約200ms後に特別授業セクションへスクロールする。

### `triggerNotification`

通知メッセージを設定して表示し、約4秒後に自動で非表示にする。

## 画面設計

### 1. オープニング

全画面固定のレイヤー。暗い背景、CRT風ノイズ、テレビ筐体風カード、タイトル、電源ボタンで構成する。`hasStarted` が `false` の間だけ表示する。

### 2. ヘッダー

メイン画面上部。番組名、チャンネル表記、本日の目標、出席状況を表示する。

### 3. ブラウン管テレビ

左カラムに配置する動画プレイヤー領域。アスペクト比は16:9。以下のオーバーレイを重ねる。

- 起動・切替時の砂嵐
- ガラス反射
- CRT走査線
- 四隅のシャドウ
- `PLAY 0:00:NN`
- `CH.927 VHS-SP`

動画は選択中授業の `nicovideoId` からiframe URLを生成する。

### 4. テレビ操作部

テレビ下部に以下を配置する。

- 前へボタン
- チャンネルダイヤル
- 次へボタン
- スピーカー風スリット
- フィルターモード切替

チャンネルダイヤルの針は `activePeriod * 18` 度をベースに回転する。

### 5. 学習ノート

右カラムに配置する紙ノート風カード。選択中授業の記録を表示する。紙のドット背景、赤い背表紙、横罫線、赤インク風スタンプで構成する。

### 6. 授業カリキュラム一覧

通常授業20件をカードグリッドで表示する。カードはVHSカセット風の見た目で、選択中カードは色とリングで強調する。

レスポンシブ列数:

- 2列: 基本
- 3列: `sm`
- 4列: `md`
- 5列: `lg`

### 7. 通知表・総合所見

2カラム構成。左に黒板風通知表、右に便箋風の総合所見メッセージを配置する。下部に特別授業開放ボタンを置く。

### 8. 特別授業

`isSpecialUnlocked` によって表示を切り替える。

- ロック中: ダブルボーダーのカード、ロックアイコン、タップ誘導
- 開放後: 黒板風セクション、特別動画iframe、お祝いメッセージ

### 9. フッター

ファンメイドサイトであること、著作表記を表示する。

## ビジュアルデザイン

### コンセプト

昭和レトロな誕生日記念放送、ブラウン管テレビ、VHS再放送、学校の放送室、黒板、学習ノート、通知表を組み合わせた記念サイト。

### カラーパレット

- 背景: `#161411`, `#1a1712`, `#0d0c0a`
- 木枠・テレビ: `#3a3128`, `#211a14`, `#5c4033`
- 黒板: `#2b3a33`, `#33403a`
- チョーク白: `#ece6d8`
- 赤アクセント: `#8f4a3a`, `#a45a49`
- 緑アクセント: `#6a8d7a`
- 補助テキスト: `#a39e93`, `#8e897e`

### フォント

Google Fontsから以下を読み込む。

- `Yusei Magic`: 見出し、チョーク文字、手書き風UI
- `Klee One`: 本文、手紙、説明文
- `Inter`: 汎用サンセリフ
- `JetBrains Mono`: チャンネル、日付、VHS表示

### グローバル装飾

`src/index.css` で以下を定義する。

- `.scanlines`: 画面全体のCRT走査線
- `.vignette`: 画面周辺の暗いビネット
- `.chalk-text`: 白チョーク風テキスト
- `.chalk-text-red`: 赤チョーク風テキスト
- `.chalk-text-green`: 緑チョーク風テキスト
- `.chalkboard-bg`: 黒板の粉っぽい背景
- `.animate-vhs-glitch`: VHS風の微細な揺れ
- `.crt-flickering`: CRTちらつき

## 外部依存・制約

- ニコニコ動画の埋め込みが外部通信に依存する。
- ブラウザの自動再生制限により、音声はユーザー操作後にのみ確実に再生される。
- Google Fontsの読み込みに外部通信が必要。
- `@google/genai` は依存関係に含まれるが、現状のフロントエンド画面では直接使用されていない。

## 既知の設計上の注意点

- `isTvOn` は現状の描画条件では実質的に不要。
- `filterMode` の型には `noise` が含まれるが、UIには表示されない。
- `filterMode` の切替はiframeやテレビ画面のCSSに反映されていない。
- `Lesson.chalkColor` はデータに存在するが、現状の画面では表示分岐に使われていない。
- 通常の授業データと特別授業データがコンポーネント内に直書きされているため、今後の編集性を高めるなら別ファイル化が望ましい。
