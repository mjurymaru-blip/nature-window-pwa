# 開発ワークフロー

## 概要

複数のAI（Gemini/ChatGPT/Antigravity）を活用した効率的な開発フローです。

## 開発フロー図

```
┌─────────────────────────────────────────────────────────┐
│  1. アイディア出し: Gemini/ChatGPT                       │
│  2. プラン作成: Antigravity → /review-feedback          │
│  3. 実装: Antigravity                                   │
│  4. ローカル確認: npm run dev (+ mkcert HTTPS)          │
│  5. バックアップ: /backup (Gitea)                       │
│  6. AIレビュー: /export-context → Gemini/ChatGPT        │
│  7. 修正: /review-feedback → 3に戻る                    │
│  8. 公開準備完了: /publish → GitHub Public + Pages      │
└─────────────────────────────────────────────────────────┘
```

## 段階別リポジトリ運用

| 開発段階 | リポジトリ | 確認方法 | AIレビュー |
|----------|-----------|----------|-----------|
| **初期開発** | Gitea | ローカルHTTP/HTTPS | repomix → 貼り付け |
| **機能実装中** | Gitea | ローカルHTTPS | repomix → 貼り付け |
| **公開準備** | GitHub Public | Pages | URL直接共有可能 |
| **公開後** | GitHub Public | Pages | URL直接共有 |

## ワークフローコマンド一覧

| コマンド | 説明 | 使用タイミング |
|---------|------|---------------|
| `/backup` | Giteaにバックアップ | 作業の区切りごと |
| `/publish` | GitHubへスクッシュマージ | 公開準備完了時 |
| `/review-feedback` | 外部AIレビュー結果を取り込む | レビュー後 |
| `/export-context` | repomixでエクスポート | AIレビュー依頼前 |
| `/setup-dual-remote` | Dual Remote設定 | 初回セットアップ時 |

## リモートリポジトリ構成

| リモート名 | URL | 用途 |
|-----------|-----|------|
| `origin` | Gitea (プライベート) | 開発・バックアップ |
| `public` | GitHub (パブリック) | 公開・Pages |

## ローカルHTTPS環境（オプション）

PWAのService Worker等をローカルでテストする場合：

```bash
# mkcertのインストール（初回のみ）
sudo apt install mkcert
mkcert -install
mkcert localhost

# 開発サーバー起動時にHTTPS有効化
npm run dev -- --https
```

## AIレビュー依頼テンプレート

```markdown
以下はプロジェクトのソースコード全体です。
以下の観点でレビューをお願いします：

1. 設計・アーキテクチャの整合性
2. セキュリティ上の懸念
3. UI/UXの改善案
4. パフォーマンス最適化の余地

---
[context.txtの内容をここに貼り付け]
```

## レビュー結果フィードバック形式

外部AIからの指摘をAntigravityに渡す際の推奨フォーマット：

```markdown
## 外部AIレビュー結果

### 採用する指摘
- [ ] ○○の修正
- [ ] △△の追加

### 検討が必要な指摘
- □□について（理由: ...）

### 却下する指摘
- ××（却下理由: ...）
```
