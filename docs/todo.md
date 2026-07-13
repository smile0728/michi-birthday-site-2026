# TODO

## 公開前に必須

- [ ] 通常授業20本の `nicovideoId` を実際の動画IDへ差し替える。
- [ ] 特別授業の `nicovideoId` を実際の誕生日動画IDへ差し替える。
- [x] 特別授業の日付表示を `2026年09月27日 (誕生日当日！)` に統一する。
- [ ] すべてのニコニコ動画iframeが埋め込み再生できるか確認する。
- [ ] スマートフォン実機で、動画領域・授業カード・特別授業開放のスクロール挙動を確認する。

## 仕様とのズレ修正

- [ ] `filterMode` を実際の画面効果に反映する。
  - `standard`: 走査線や色補正を弱める。
  - `retro`: 現在のCRT/VHS風表示。
  - 必要なら `noise`: 砂嵐やノイズを常時薄く重ねる。
- [ ] `filterMode` の型にある `noise` を使わないなら削除する。
- [ ] 未使用に近い `isTvOn` を削除するか、電源OFF/ON機能として活用する。
- [ ] `Lesson.chalkColor` を授業カード、ノート、チョーク文字などに反映するか、不要なら削除する。

## 保守性改善

- [ ] `LESSON_DATA` と `SPECIAL_LESSON` を `src/data/lessons.ts` などへ分離する。
- [ ] `RetroSoundSynth` を `src/lib/sound.ts` へ分離する。
- [ ] 大きなJSXを以下のようなコンポーネントへ分割する。
  - `IntroScreen`
  - `Header`
  - `RetroTvPlayer`
  - `LessonNote`
  - `LessonGrid`
  - `ReportCard`
  - `SpecialLesson`
  - `NotificationToast`
- [ ] 評価スタンプ文言の変換を関数化する。
- [ ] ニコニコ動画URL生成を関数化する。

## アクセシビリティ

- [ ] 絵文字付きボタンの読み上げを確認し、必要に応じて `aria-label` を追加する。
- [ ] アイコンのみの前後ボタンに明示的な `aria-label` を追加する。
- [ ] 特別授業のロック中カードをクリック可能な `div` ではなく `button` 相当のアクセシブルな要素にする。
- [ ] キーボード操作で授業選択、前後移動、特別授業開放ができることを確認する。
- [ ] 通知表示に `aria-live` を追加する。
- [ ] 動きやちらつきが苦手なユーザー向けに `prefers-reduced-motion` 対応を検討する。

## 表示品質

- [ ] モバイル幅で学習ノートの長文が読みやすいか確認する。
- [ ] 授業カード内の長い曲名が崩れないか確認する。
- [ ] ニコニコ動画iframeの上に重なるVHS表示が操作を邪魔しないか確認する。
- [ ] iOS Safari、Android Chrome、Windows Chrome/Edgeで表示確認する。
- [ ] Google Fontsが読み込めない場合のフォールバック表示を確認する。

## テスト・検証

- [ ] `npm run lint` を通す。
- [ ] `npm run build` を通す。
- [ ] ローカル起動して主要操作を手動確認する。
  - 電源ON
  - 前後ボタン
  - 授業カード選択
  - フィルター切替
  - 特別授業開放
- [ ] 公開URL上でiframe、フォント、音声、スクロールを確認する。

## 将来拡張

- [ ] 授業データをJSON化し、非エンジニアでも編集しやすくする。
- [ ] 画像やサムネイルを追加し、授業カードの識別性を上げる。
- [ ] URLクエリで初期表示する授業番号を指定できるようにする。
- [ ] 特別授業の開放状態を `localStorage` に保存する。
- [x] Cloudflare Pagesへの公開手順を追加する。
- [x] Cloudflare Pagesで公開URLを有効化する。
- [x] 公開URLで本番表示を確認する: `https://michi-birthday-site-2026.smile0513.workers.dev/`
