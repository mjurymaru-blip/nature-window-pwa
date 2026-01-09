# Nature Window

> デスクに「季節と外」を連れてくる、窓のようなPWA

[![Demo](https://img.shields.io/badge/Demo-GitHub%20Pages-blue)](https://mjurymaru-blip.github.io/nature-window-pwa/)

## ✨ Features

- **時計表示** - 左サイドに時計パネル（砂時計 / ミニマルの2モード）
- **天気連動ビジュアル** - 現在地の天気に合わせた背景グラデーション
- **二十四節気・七十二候** - 日本の季節感を可視化
- **環境音** - 雨音、虫の声、波音など12種類のシーン
- **焚き火モード** - いつでも焚き火の音と暖かい光をオーバーレイ（時計にも照り返し）
- **天候連動** - 雨の日は青み、雪の日は白ぼけ、時計の色も天気に染まる
- **PWA対応** - ホーム画面に追加してフルスクリーンで使用可能

## 🎯 コンセプト

| 原則 | 内容 |
|------|------|
| 作業を促さない | タスク管理・タイマーなし |
| 疲れない | 低FPS、スローなアニメーション |
| 置きっぱなし | 常時表示に最適化 |

### 思想

このアプリは「時間を使う」ではなく「時間を置く」ためのものです。  
画面の中に季節があり、天気があり、静かに時が流れている。  
それを眺めるでもなく、ただそこにある。  
焚き火の音、虫の声、雨音——作業の傍らに、窓が一枚あるだけ。

## 🔧 技術スタック

- **Framework**: Vite + TypeScript
- **PWA**: vite-plugin-pwa (Workbox)
- **Weather API**: Open-Meteo（無料・キー不要）
- **Audio**: Web Audio API（揺らぎ設計）
- **Deploy**: GitHub Pages + GitHub Actions

## 🚀 使い方

1. [デモサイト](https://mjurymaru-blip.github.io/nature-window-pwa/) にアクセス
2. 位置情報を許可（天気取得に使用）
3. 音声トグル（🔇）をタップして環境音を再生
4. 焚き火ボタン（🔥）で焚き火モードをオン
5. スマホならホーム画面に追加してPWAとして使用

## 📱 対応環境

- PC: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Android Chrome/Firefox

## 🛠️ ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 📄 License

MIT
