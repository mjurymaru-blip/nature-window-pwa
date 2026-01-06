# フェーズ2.5 実装指示書

## 概要
フェーズ2（コア機能）完了後の品質強化フェーズ。
外部AIレビュー（ChatGPT/Gemini）の指摘を反映し、「窓としての堅牢性」を完成させる。

---

## 実装項目

### 1. オフライン時のキャッシュ天気表示

**目的**: API失敗時でも「窓が閉じない」ようにする

**実装場所**: `src/services/weatherApi.ts`

**仕様**:
```typescript
// 天気データをlocalStorageにキャッシュ
const WEATHER_CACHE_KEY = 'nature-window-weather-cache';

// fetchWeather成功時: キャッシュに保存
localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData));

// fetchWeather失敗時: キャッシュから読み込み
const cached = localStorage.getItem(WEATHER_CACHE_KEY);
if (cached) {
  return { ...JSON.parse(cached), isCached: true };
}

// キャッシュもない場合: 季節に合わせたデフォルト天気
return getSeasonalDefaultWeather();
```

**優先度**: 高

---

### 2. Page Visibility APIでタイマー制御

**目的**: バックグラウンド時の省電力化、復帰時の即時更新

**実装場所**: `src/main.ts`

**仕様**:
```typescript
// タイマーハンドラを保持
let weatherIntervalId: number | null = null;
let themeIntervalId: number | null = null;

// Page Visibility API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // バックグラウンド: タイマー停止
    clearAllIntervals();
  } else {
    // フォアグラウンド復帰: 即時更新 + タイマー再開
    updateWeather();
    updateTheme();
    startIntervals();
  }
});
```

**優先度**: 高

---

### 3. SoundPresence型の定義（焚き火モード準備）

**目的**: シーンごとの「存在感」を設計レベルで定義

**実装場所**: `src/services/soundController.ts`

**仕様**:
```typescript
/**
 * 音の「存在感」を定義する型
 * UIに出さない。設計レベルでのドキュメンテーション。
 */
export interface SoundPresence {
  baseVolume: number;    // 平均音量 (0.0 - 1.0)
  fluctuation: number;   // 揺らぎ幅 (±)
  density: number;       // 発音頻度係数 (0.0 - 1.0, 高いほど頻繁)
}

// シーンごとの存在感定義
const SCENE_PRESENCE: Partial<Record<SoundScene, SoundPresence>> = {
  fire: {
    baseVolume: 0.35,
    fluctuation: 0.08,
    density: 0.6,
  },
  rain: {
    baseVolume: 0.4,
    fluctuation: 0.05,
    density: 0.3,  // 雷は稀
  },
  // 他シーンは将来的に追加
};
```

**優先度**: 中（焚き火モード実装時に使用）

---

## 検証項目

- [ ] オフライン時に最後の天気が表示されること
- [ ] タブを隠すとタイマーが停止すること（コンソールログで確認）
- [ ] タブ復帰時に天気が即時更新されること
- [ ] SoundPresence型がTypeScriptビルドを通ること

---

## 完了基準

1. 全検証項目がパス
2. コンソールエラーなし
3. Giteaにプッシュ完了

---

## 次のフェーズ（フェーズ3: 焚き火モード）

- 焚き火シーンをOverlayとしてレイヤリング
- 「夜 × 焚き火」で最深の状態を実現
- SoundPresenceを実際の音制御に適用
