# フェーズ3 実装指示書：焚き火モード

## 概要

「夜 × 焚き火」を最も深い状態として実現する。
焚き火はBase Scene（時間帯）の上に**レイヤリング**される Overlay Scene として実装。

---

## 設計思想（ChatGPT/Geminiレビューで合意）

> **実装は別、体験は連動**
> 
> | モード | 本質 |
> |--------|------|
> | 夜専用モード | 時間に支配される状態（自動） |
> | 焚き火モード | 人が選ぶ状態（手動） |

```
Base Scene（時間帯）
 ├─ Day
 ├─ Evening
 ├─ Night ← 夜は自動で虫の声等

Overlay Scene（手動）
 └─ Fireplace 🔥 ← 上に重なる
```

---

## 実装項目

### 1. 焚き火トグルUI

**場所**: `src/main.ts`（render関数内）

**仕様**:
- 🔥ボタンを音声コントロールの左側に追加
- アクティブ時はボタンに強調スタイル（オレンジ系グロー）
- タップでON/OFF

```html
<button class="fireplace-toggle" aria-label="焚き火モード" data-action="toggle-fireplace">
  🔥
</button>
```

---

### 2. 焚き火音のオーバーレイ再生

**場所**: `src/services/soundController.ts`

**仕様**:
- 現在のシーン再生に加えて、焚き火音を**別レイヤー**で同時再生
- `SoundPresence.fire`の設定を使用
- 新メソッド: `enableFireplaceOverlay()` / `disableFireplaceOverlay()`

```typescript
// 焚き火オーバーレイ用の専用ゲインノード
private fireplaceGain: GainNode | null = null;

enableFireplaceOverlay(): void {
  // 焚き火音を別レイヤーで再生開始
}

disableFireplaceOverlay(): void {
  // フェードアウトしながら停止
}
```

---

### 3. ビジュアル演出

**場所**: `src/style.css`

**仕様**:
- 焚き火ON時に `body.fireplace-active` クラスを付与
- 背景のグラデーションを暖色系（オレンジ〜赤系）にシフト
- 控えめな演出（「窓」の静寂を壊さない）

```css
body.fireplace-active {
  --bg-gradient-start: #2d1f1f;
  --bg-gradient-mid: #3d2a1a;
  --bg-gradient-end: #1a1a2e;
}
```

---

### 4. 状態の永続化

**場所**: `src/main.ts`

**仕様**:
- localStorageに `nature-window-fireplace` キーで保存
- ページ読み込み時に復元
- 音声がONの場合のみ焚き火音を自動再生

---

## 検証項目

- [ ] 焚き火ボタンタップでON/OFF切り替え
- [ ] 焚き火ONで現在のシーン音と焚き火音が同時再生
- [ ] 焚き火ONで背景が暖色にシフト
- [ ] リロード後も焚き火状態が維持
- [ ] 焚き火OFFでスムーズにフェードアウト

---

## 完了基準

1. 全検証項目がパス
2. 「夜 × 焚き火」で虫の声と焚き火音が重なって聞こえる
3. コンソールエラーなし
4. Giteaにプッシュ完了

---

## 次のステップ（フェーズ3以降）

- キャンプ地プリセット機能
- 月齢ビジュアライザー
- バイノーラル音響（PannerNode）
