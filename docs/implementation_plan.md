# Nature Window PWA 実装プラン

デスクに「季節と外」を連れてくる、窓のようなアプリケーション。

## コンセプト

- **目的**: デスク周りにゆったりとした流れを演出する
- **ターゲットデバイス**: スマホ（デスク時計の隣に配置）、または小型ディスプレイ
- **既存アプリとの関係**: desk-clock-pwa、edge-sandglassと並べて使用

### 設計思想（外部AIレビューより）

> **「窓」としての静寂**: UI要素は極限まで削ぎ落とし、天気と季節が主役になるように。

| 原則 | 内容 |
|------|------|
| 作業を促さない | タスク管理・タイマーは入れない |
| 疲れない | 低FPS、スローなアニメーション |
| 置きっぱなし | 常時表示に最適化 |

### 主要機能

1. **天気連動ビジュアル**: 現在の天気に合わせた背景グラフィック
2. **環境音**: 雨音、焚き火、風の音など（揺らぎ設計）
3. **季節の可視化**: 二十四節気・七十二候の表示
4. **キャンプ地連携**: 次のキャンプ予定地の天気表示（将来）

---

## 技術構成

| カテゴリ | 選択 | 理由 |
|---------|------|------|
| フレームワーク | Vite + Vanilla TS | 軽量、PWA相性◎ |
| スタイリング | CSS変数 + アニメーション | 時間帯でテーマ変化 |
| 天気API | Open-Meteo | 無料、APIキー不要 |
| PWA | Vite PWA Plugin | Service Worker自動生成 |
| デプロイ | GitHub Pages | HTTPS対応 |

---

## フェーズ1: 基盤構築

### [NEW] プロジェクト構造

```
nature-window-pwa/
├── src/
│   ├── main.ts           # エントリーポイント
│   ├── style.css         # グローバルスタイル
│   ├── components/
│   │   ├── WeatherDisplay.ts
│   │   ├── SeasonDisplay.ts
│   │   └── SoundController.ts
│   ├── services/
│   │   ├── weatherApi.ts
│   │   └── seasonCalendar.ts
│   └── assets/
│       └── sounds/       # 環境音ファイル
├── public/
│   ├── manifest.json
│   └── icons/
├── index.html
├── vite.config.ts
└── package.json
```

### 初期化コマンド

```bash
npm create vite@latest ./ -- --template vanilla-ts
npm install vite-plugin-pwa -D
```

---

## フェーズ2: コア機能

### 天気API連携

[Open-Meteo API](https://open-meteo.com/) を使用：

```typescript
// 位置情報から天気を取得
const response = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
);
```

#### 位置情報の永続化

| 状態 | 動作 |
|------|------|
| 初回アクセス | Geolocation APIで取得 → localStorageに保存 |
| 2回目以降 | localStorageから読み込み（許可ダイアログなし） |
| 取得失敗時 | デフォルト座標（ふもとっぱら）を使用 |

> [!NOTE]
> **「キャンプ地の予感」**: `services/weatherApi.ts` に「現在地」と「カスタム座標」の切り替えインターフェースを用意（フェーズ3対応）

### 二十四節気・七十二候

日付から該当する節気を計算するロジックを実装：

| 節気 | 期間（目安） | 候 |
|------|-------------|-----|
| 小寒 | 1/5頃 | 芹乃栄、水泉動、雉始雊 |
| 大寒 | 1/20頃 | 款冬華、水沢腹堅、鶏始乳 |
| ... | ... | ... |

### 背景ビジュアル

天気コードに応じたCSSグラデーション + アニメーション：

| 天気 | ビジュアル |
|------|-----------|
| 晴れ | 青空グラデーション + 日差しエフェクト |
| 曇り | グレー系 + ゆっくり流れる雲 |
| 雨 | 暗めグラデーション + 雨粒アニメーション |
| 雪 | 白系 + 雪片アニメーション |

> [!IMPORTANT]
> **焼き付き防止**: 背景グラデーションは「1時間かけてゆっくり一周」するスローな変化を導入

### 環境音（揺らぎ設計）

| 天気/シーン | 音源 |
|------------|------|
| 雨 | 雨音ループ + 遠くの雷（ランダム） |
| 焚き火 | 焚き火の音 + 薪が爆ぜる音（ランダム） |
| 風 | 風の音 + 葉擦れ音（レイヤー） |
| 夜 | 虫の声 + 遠くのフクロウ（ランダム） |

> [!IMPORTANT]
> **音は生き物のように**: 単純な `<audio loop>` ではなく、Web Audio APIで複数トラックをレイヤーし、ランダムなタイミングでサブ音を再生する設計

音源はフリー素材を探して実装

---

## フェーズ3: 拡張機能

### 焚き火モード（独立モード）

天気連動とは別に、いつでも切り替え可能な専用モード：

| 要素 | 内容 |
|------|------|
| ビジュアル | 焚き火のアニメーション（CSS/Canvas） |
| サウンド | 焚き火の音ループ |
| 切り替え | 画面タップまたは設定から |

> [!NOTE]
> YouTubeで焚き火を流していた代わりに使用可能

### キャンプ予定地の天気

- ローカルストレージに座標を保存
- 定期的に天気を取得して表示
- 「次のキャンプ地: ○○ 現在◯℃」

### 七十二候の詳細表示（探索型UI）

> [!NOTE]
> 通常時は候の名前のみをミニマルに表示。タップ時に詳細が浮かび上がる。

| 表示レベル | 内容 |
|-----------|------|
| 通常 | 「芹乃栄」のみ |
| タップ時 | 読み + 説明（田んぼの畦道に芹が芽を出す頃） |

---

## フェーズ4: 仕上げ

### PWA設定

```json
// manifest.json
{
  "name": "Nature Window",
  "short_name": "NatureWindow",
  "display": "fullscreen",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e"
}
```

### GitHub Actions

```yaml
# Pages自動デプロイ
on:
  push:
    branches: [main]
```

---

## 確定事項

| 項目 | 決定内容 |
|------|---------|
| 天気API | Open-Meteo（無料・キー不要） |
| 環境音 | フリー素材を探して実装 |
| MVP範囲 | フェーズ2まで（天気 + 節気 + 基本ビジュアル） |
| 焚き火モード | 独立モードとして実装（フェーズ3） |

---

## 検証計画

### ローカル確認

```bash
npm run dev
# http://localhost:5173 で確認
```

### PWA動作確認

1. `npm run build && npm run preview`
2. Chrome DevTools → Application → Service Workers
3. 「インストール」プロンプト表示の確認

### HTTPS確認（GitHub Pages公開後）

- Service Workerの動作
- 位置情報取得の許可ダイアログ
