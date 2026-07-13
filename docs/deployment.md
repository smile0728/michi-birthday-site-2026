# Deployment

## 方針

このサイトはVite/React製の静的サイトとしてCloudflare Pagesにデプロイする。

現状、フロントエンドからサーバーAPI、Gemini API、Pages Functionsは使用していない。そのため、`npm run build` で生成される `dist/` をそのまま配信すればよい。

## 推奨: GitHub連携デプロイ

Cloudflare PagesのGitHub連携を使い、`main` ブランチへpushされたら自動でビルド・デプロイする。

### Cloudflare Pages設定

```text
Project name: michi-birthday-site-2026
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
Environment variables: なし
```

想定URL:

```text
https://michi-birthday-site-2026.pages.dev
```

現在の公開URL:

```text
https://michi-birthday-site-2026.1108smileman.workers.dev/
```

### 手順

1. Cloudflare Dashboardにログインする。
2. `Workers & Pages` を開く。
3. `Create` を選ぶ。
4. `Pages` を選ぶ。
5. `Import from Git` を選ぶ。
6. GitHubアカウントを連携する。
7. `smile0728/michi-birthday-site-2026` を選ぶ。
8. 上記のCloudflare Pages設定を入力する。
9. `Save and Deploy` を押す。
10. デプロイ完了後、発行された `pages.dev` URLで表示確認する。

## 代替: Wrangler直接アップロード

GitHub連携の前にローカルから直接確認したい場合は、Wranglerで `dist/` をアップロードできる。

```bash
npm run build
npx wrangler pages deploy ./dist --project-name=michi-birthday-site-2026
```

この方法は手動デプロイになるため、本運用はGitHub連携を推奨する。

## 公開前チェック

- [ ] `npm run lint` が成功する。
- [ ] `npm run build` が成功する。
- [ ] `dist/` が生成される。
- [ ] Cloudflare Pagesのビルド設定が `npm run build` / `dist` になっている。
- [ ] 本番URLでトップページが表示される。
- [ ] 「テレビの電源を入れる」ボタンが動作する。
- [ ] 前後ボタンと授業カードでチャンネル切替できる。
- [ ] 特別授業を開放できる。
- [ ] ニコニコ動画iframeが表示される。
- [ ] Google Fontsが読み込まれる。
- [ ] スマートフォン幅で表示崩れがない。

## 注意点

- `.env.example` にはAI Studio由来の `GEMINI_API_KEY` 記載があるが、現在の画面実装では使用していない。
- Cloudflare Pagesの環境変数は現時点では不要。
- Viteの `base` 設定は不要。Cloudflare Pagesはドメイン直下で配信するため、`/assets/...` のままで動作する。
- GitHub Pagesとは異なり、リポジトリ名を含むサブパス配信ではない。
- Cloudflare PagesのGitHub連携後は、`main` にpushするたびに自動で本番デプロイされる。
- Cloudflare側で `workers.dev` ドメインを有効にしている場合、公開URLは `*.workers.dev` になることがある。

## トラブルシュート

### ビルドに失敗する

Cloudflare PagesのDeploymentsログを確認する。まず以下を疑う。

- Build commandが `npm run build` になっていない。
- Build output directoryが `dist` になっていない。
- Node.jsのバージョン差で依存関係のインストールやビルドが失敗している。

ローカルでは以下で再現確認する。

```bash
npm install
npm run lint
npm run build
```

### 画面は出るが動画が表示されない

以下を確認する。

- `nicovideoId` が実際に存在するIDか。
- ニコニコ動画側で外部埋め込みが許可されているか。
- ブラウザの拡張機能やネットワーク制限でiframeがブロックされていないか。

### 音が鳴らない

ブラウザの自動再生制限により、初回ユーザー操作前は音声を再生できない。電源ボタン押下後に音が鳴るのが正常。

### 404になる

このアプリは現時点でクライアントサイドルーティングを使っていないため、通常は追加設定不要。将来 `/lesson/1` のようなURLを追加する場合は、Cloudflare Pagesのリダイレクト設定でSPA fallbackを検討する。
