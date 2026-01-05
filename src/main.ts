/**
 * Nature Window PWA - メインエントリーポイント
 * デスクに「季節と外」を連れてくる窓のようなアプリ
 */

import './style.css';
import { getLocation, fetchWeather, getWeatherCondition, getTimeOfDayTheme } from './services/weatherApi';
import type { WeatherData } from './services/weatherApi';
import { getCurrentSekki, getCurrentKou } from './services/seasonCalendar';
import type { Sekki, Kou } from './services/seasonCalendar';

// 状態管理
interface AppState {
  weather: WeatherData | null;
  sekki: Sekki;
  kou: Kou;
  theme: string;
  isLoading: boolean;
  error: string | null;
}

const state: AppState = {
  weather: null,
  sekki: getCurrentSekki(),
  kou: getCurrentKou(),
  theme: getTimeOfDayTheme(),
  isLoading: true,
  error: null
};

/**
 * UIを描画
 */
function render(): void {
  const app = document.getElementById('app');
  if (!app) return;

  if (state.isLoading) {
    app.innerHTML = `
      <div class="background"></div>
      <div class="loading">
        <div class="loading-text">季節を読み込んでいます...</div>
      </div>
    `;
    return;
  }

  if (state.error) {
    app.innerHTML = `
      <div class="background"></div>
      <div class="loading">
        <div class="loading-text">${state.error}</div>
      </div>
    `;
    return;
  }

  const condition = state.weather ? getWeatherCondition(state.weather.weatherCode) : null;

  app.innerHTML = `
    <div class="background"></div>
    
    <!-- 天気表示 -->
    ${state.weather ? `
      <div class="weather-display">
        <div class="weather-temp">${Math.round(state.weather.temperature)}°</div>
        <div class="weather-condition">${condition?.description || ''}</div>
      </div>
    ` : ''}
    
    <!-- 季節表示（タップで詳細） -->
    <div class="season-display">
      <div class="season-name">${state.kou.name}</div>
      <div class="season-detail">
        <div class="kou-reading">${state.kou.reading}</div>
        <div class="kou-description">${state.kou.description}</div>
        <div class="sekki-name">${state.sekki.name}（${state.sekki.reading}）</div>
      </div>
    </div>
    
    <!-- 音声コントロール（フェーズ2で実装） -->
    <div class="sound-control">
      <button class="sound-toggle" aria-label="音声切り替え">🔇</button>
    </div>
  `;

  // テーマクラスを適用
  document.body.className = `theme-${state.theme}`;
}

/**
 * 天気情報を取得して更新
 */
async function updateWeather(): Promise<void> {
  try {
    const location = await getLocation();
    state.weather = await fetchWeather(location);
    state.error = null;
  } catch (e) {
    console.error('天気の取得に失敗:', e);
    state.error = '天気情報を取得できませんでした';
  }
}

/**
 * 季節情報を更新
 */
function updateSeason(): void {
  state.sekki = getCurrentSekki();
  state.kou = getCurrentKou();
}

/**
 * テーマを時間帯に合わせて更新
 */
function updateTheme(): void {
  state.theme = getTimeOfDayTheme();

  // 天気によるテーマ上書きはフェーズ2で実装
}

/**
 * アプリを初期化
 */
async function init(): Promise<void> {
  console.log('Nature Window PWA を起動中...');

  // 初期描画（ローディング状態）
  render();

  // データ取得
  await updateWeather();
  updateSeason();
  updateTheme();

  // ローディング完了
  state.isLoading = false;
  render();

  // 定期更新
  // 天気: 30分ごと
  setInterval(async () => {
    await updateWeather();
    render();
  }, 30 * 60 * 1000);

  // 季節・テーマ: 1時間ごと
  setInterval(() => {
    updateSeason();
    updateTheme();
    render();
  }, 60 * 60 * 1000);

  console.log('Nature Window PWA 起動完了');
}

// アプリ起動
init();
