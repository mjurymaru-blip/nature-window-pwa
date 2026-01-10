/**
 * Nature Window PWA - メインエントリーポイント
 * デスクに「季節と外」を連れてくる窓のようなアプリ
 */

import './style.css';
import { getLocation, fetchWeather, getWeatherCondition, getTimeOfDayTheme } from './services/weatherApi';
import type { WeatherData } from './services/weatherApi';
import { getCurrentSekki, getCurrentKou } from './services/seasonCalendar';
import type { Sekki, Kou } from './services/seasonCalendar';
import { soundController, SoundController } from './services/soundController';
import type { SoundScene } from './services/soundController';
import { ClockDisplay } from './components/ClockDisplay';

// 状態管理
interface AppState {
  weather: WeatherData | null;
  sekki: Sekki;
  kou: Kou;
  theme: string;
  soundScene: SoundScene;
  isSoundPlaying: boolean;
  isFireplaceActive: boolean;  // 焚き火オーバーレイ
  isClockVisible: boolean;     // 時計表示 ON/OFF
  isLoading: boolean;
  error: string | null;
}

// localStorageから焚き火状態を復元
const FIREPLACE_STORAGE_KEY = 'nature-window-fireplace';
const CLOCK_VISIBLE_STORAGE_KEY = 'nature-window-clock-visible';

function loadFireplaceState(): boolean {
  try {
    return localStorage.getItem(FIREPLACE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function loadClockVisibleState(): boolean {
  try {
    const saved = localStorage.getItem(CLOCK_VISIBLE_STORAGE_KEY);
    // デフォルトはtrue（時計表示）
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

const state: AppState = {
  weather: null,
  sekki: getCurrentSekki(),
  kou: getCurrentKou(),
  theme: getTimeOfDayTheme(),
  soundScene: 'silent',
  isSoundPlaying: false,
  isFireplaceActive: loadFireplaceState(),
  isClockVisible: loadClockVisibleState(),
  isLoading: true,
  error: null
};

// Clockコンポーネントのインスタンス
let clockDisplay: ClockDisplay | null = null;

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
  const soundIcon = state.isSoundPlaying ? '🔊' : '🔇';
  const clockIcon = state.isClockVisible ? '🕐' : '🕐';
  const layoutClass = state.isClockVisible ? 'split-layout' : 'split-layout clock-hidden';

  app.innerHTML = `
    <div class="background"></div>
    
    <!-- 2カラムレイアウト: 左Clock / 右Nature -->
    <div class="${layoutClass}">
      <!-- 左: 時計パネル -->
      <div class="clock-container" id="clockContainer"></div>
      
      <!-- 右: Nature パネル -->
      <div class="nature-container">
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
        
        <!-- 音声コントロール -->
        <div class="sound-control">
          <button 
            class="clock-toggle ${state.isClockVisible ? 'active' : ''}" 
            aria-label="時計表示切替" 
            data-action="toggle-clock"
          >
            ${clockIcon}
          </button>
          <button 
            class="fireplace-toggle ${state.isFireplaceActive ? 'active' : ''}" 
            aria-label="焚き火モード" 
            data-action="toggle-fireplace"
          >
            🔥
          </button>
          <button class="sound-toggle" aria-label="音声切り替え" data-action="toggle-sound">
            ${soundIcon}
          </button>
          <label for="sound-scene-select" class="visually-hidden">音声シーン選択</label>
          <select id="sound-scene-select" class="sound-scene-select" data-action="change-scene">
            ${SoundController.getAvailableScenes().map(scene => `
              <option value="${scene}" ${scene === state.soundScene ? 'selected' : ''}>
                ${getSoundSceneLabel(scene)}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>
  `;

  // テーマクラスを適用（焚き火モード・天候モード対応）
  let bodyClass = `theme-${state.theme}`;
  if (state.isFireplaceActive) {
    bodyClass += ' fireplace-active';
  }
  // 天候テーマを追加（Clock側の色に反映）
  if (state.weather) {
    const condition = getWeatherCondition(state.weather.weatherCode);
    bodyClass += ` weather-${condition.theme}`;
  }
  document.body.className = bodyClass;

  // Clockコンポーネントを初期化
  const clockContainer = document.getElementById('clockContainer');
  if (clockContainer) {
    if (clockDisplay) {
      clockDisplay.stop();
    }
    clockDisplay = new ClockDisplay({
      container: clockContainer,
      isFireplaceActive: state.isFireplaceActive
    });
    clockDisplay.start();
  }

  // イベントリスナーを設定
  setupEventListeners();
}

/**
 * サウンドシーンのラベルを取得
 */
function getSoundSceneLabel(scene: SoundScene): string {
  const labels: Record<SoundScene, string> = {
    rain: '🌧 雨音',
    fire: '🔥 焚き火',
    wind: '💨 風',
    night: '🦗 夏の夜',
    'night-autumn': '🍂 秋の夜',
    'evening-summer': '🌅 夏の夕(ひぐらし)',
    morning: '🐦 朝(鳥)',
    cicada: '☀️ 夏の昼(セミ)',
    snow: '❄️ 雪',
    wave: '🌊 波',
    stream: '🏞 小川',
    silent: '🔇 消音'
  };
  return labels[scene];
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners(): void {
  // 音声トグルボタン
  const soundToggle = document.querySelector('[data-action="toggle-sound"]');
  if (soundToggle) {
    soundToggle.addEventListener('click', handleSoundToggle);
  }

  // シーン切り替えセレクト
  const sceneSelect = document.querySelector('[data-action="change-scene"]') as HTMLSelectElement;
  if (sceneSelect) {
    sceneSelect.addEventListener('change', handleSceneChange);
  }

  // 焚き火トグルボタン
  const fireplaceToggle = document.querySelector('[data-action="toggle-fireplace"]');
  if (fireplaceToggle) {
    fireplaceToggle.addEventListener('click', handleFireplaceToggle);
  }

  // 時計表示トグルボタン
  const clockToggle = document.querySelector('[data-action="toggle-clock"]');
  if (clockToggle) {
    clockToggle.addEventListener('click', handleClockToggle);
  }
}

/**
 * 音声トグルハンドラ
 */
async function handleSoundToggle(): Promise<void> {
  try {
    state.isSoundPlaying = await soundController.toggle();

    // 音声ONで焚き火もONなら、焚き火も一緒にフェードイン
    if (state.isSoundPlaying && state.isFireplaceActive) {
      await soundController.enableFireplaceOverlay();
    }

    render();
  } catch (e) {
    console.error('音声の切り替えに失敗:', e);
  }
}

/**
 * シーン切り替えハンドラ
 */
async function handleSceneChange(event: Event): Promise<void> {
  const select = event.target as HTMLSelectElement;
  const newScene = select.value as SoundScene;

  try {
    state.soundScene = newScene;
    await soundController.setScene(newScene);

    // 再生中の場合は新しいシーンで再生開始
    if (state.isSoundPlaying) {
      await soundController.play();
    }

    console.log(`シーンを ${getSoundSceneLabel(newScene)} に変更`);
  } catch (e) {
    console.error('シーンの切り替えに失敗:', e);
  }
}

/**
 * 焚き火トグルハンドラ
 */
async function handleFireplaceToggle(): Promise<void> {
  try {
    state.isFireplaceActive = !state.isFireplaceActive;

    // localStorageに保存
    localStorage.setItem(FIREPLACE_STORAGE_KEY, state.isFireplaceActive.toString());

    // 音声再生中なら焚き火音も制御
    if (state.isSoundPlaying) {
      if (state.isFireplaceActive) {
        await soundController.enableFireplaceOverlay();
      } else {
        soundController.disableFireplaceOverlay();
      }
    }

    render();
    console.log(`焚き火モード: ${state.isFireplaceActive ? 'ON 🔥' : 'OFF'}`);
  } catch (e) {
    console.error('焚き火の切り替えに失敗:', e);
  }
}

/**
 * 時計表示トグルハンドラ
 * フェードアウトを効かせるため、render()ではなくクラスを直接切り替え
 */
function handleClockToggle(): void {
  state.isClockVisible = !state.isClockVisible;

  // localStorageに保存
  localStorage.setItem(CLOCK_VISIBLE_STORAGE_KEY, state.isClockVisible.toString());

  // クラスを直接切り替え（render()だとDOMが再生成されてトランジションが効かない）
  const splitLayout = document.querySelector('.split-layout');
  const clockToggleBtn = document.querySelector('.clock-toggle');

  if (splitLayout) {
    if (state.isClockVisible) {
      splitLayout.classList.remove('clock-hidden');
    } else {
      splitLayout.classList.add('clock-hidden');
    }
  }

  // ボタンのactiveクラスも更新
  if (clockToggleBtn) {
    if (state.isClockVisible) {
      clockToggleBtn.classList.add('active');
    } else {
      clockToggleBtn.classList.remove('active');
    }
  }

  console.log(`時計表示: ${state.isClockVisible ? 'ON 🕐' : 'OFF'}`);
}

/**
 * 天気情報を取得して更新
 */
async function updateWeather(): Promise<void> {
  try {
    const location = await getLocation();
    state.weather = await fetchWeather(location);
    state.error = null;

    // 天気に基づいてサウンドシーンを更新
    if (state.weather) {
      state.soundScene = SoundController.getSceneFromWeather(
        state.weather.weatherCode,
        state.weather.isDay
      );
      await soundController.setScene(state.soundScene);
    }
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
}

// ===== タイマー管理（Page Visibility API対応） =====

let weatherIntervalId: number | null = null;
let themeIntervalId: number | null = null;

/**
 * 定期更新タイマーを開始
 */
function startIntervals(): void {
  // 天気: 30分ごと
  if (weatherIntervalId === null) {
    weatherIntervalId = window.setInterval(async () => {
      await updateWeather();
      render();
    }, 30 * 60 * 1000);
  }

  // 季節・テーマ: 1時間ごと
  if (themeIntervalId === null) {
    themeIntervalId = window.setInterval(() => {
      updateSeason();
      updateTheme();
      render();
    }, 60 * 60 * 1000);
  }

  console.log('タイマーを開始しました');
}

/**
 * 定期更新タイマーを停止
 */
function stopIntervals(): void {
  if (weatherIntervalId !== null) {
    clearInterval(weatherIntervalId);
    weatherIntervalId = null;
  }
  if (themeIntervalId !== null) {
    clearInterval(themeIntervalId);
    themeIntervalId = null;
  }

  console.log('タイマーを停止しました（バックグラウンド）');
}

/**
 * Page Visibility API: タブの表示状態変化を検知
 */
function handleVisibilityChange(): void {
  if (document.hidden) {
    // バックグラウンド: タイマー停止
    stopIntervals();
  } else {
    // フォアグラウンド復帰: 即時更新 + タイマー再開
    console.log('フォアグラウンド復帰: 即時更新を実行');
    updateWeather().then(() => render());
    updateSeason();
    updateTheme();
    render();
    startIntervals();

    // Wake Lock再取得（スリープ防止）
    if (wakeLock === null) {
      requestWakeLock();
    }
  }
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

  // 定期更新タイマーを開始
  startIntervals();

  // Page Visibility API: バックグラウンド/フォアグラウンド切り替え検知
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Screen Wake Lock: スリープ防止
  requestWakeLock();

  console.log('Nature Window PWA 起動完了');
  console.log(`サウンドシーン: ${state.soundScene} (音声ボタンをクリックで再生開始)`);
}

// === Screen Wake Lock API: デバイスのスリープを防止 ===
let wakeLock: WakeLockSentinel | null = null;

async function requestWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator)) {
    console.log('Wake Lock API は非対応です');
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake Lock: スリープ防止を有効化しました');

    // Wake Lockが解放された時（ページ非表示など）の処理
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock: 解放されました');
      wakeLock = null; // 解放されたら変数をクリアして再取得可能にする
    });
  } catch (err) {
    console.warn('Wake Lock: 取得に失敗しました', err);
  }
}

// アプリ起動
init();

