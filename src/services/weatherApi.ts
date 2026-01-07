/**
 * 天気API連携サービス
 * Open-Meteo APIを使用して現在の天気情報を取得
 */

// デフォルト座標（ふもとっぱら）
const DEFAULT_LOCATION = {
    latitude: 35.4167,
    longitude: 138.5833,
    name: 'ふもとっぱら'
};

const STORAGE_KEY = 'nature-window-location';

export interface Location {
    latitude: number;
    longitude: number;
    name?: string;
}

export interface WeatherData {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    isDay: boolean;
    time: string;
}

export interface WeatherCondition {
    code: number;
    description: string;
    theme: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs
const WEATHER_CONDITIONS: Record<number, WeatherCondition> = {
    0: { code: 0, description: '快晴', theme: 'sunny' },
    1: { code: 1, description: '晴れ', theme: 'sunny' },
    2: { code: 2, description: '薄曇り', theme: 'cloudy' },
    3: { code: 3, description: '曇り', theme: 'cloudy' },
    45: { code: 45, description: '霧', theme: 'cloudy' },
    48: { code: 48, description: '霧氷', theme: 'cloudy' },
    51: { code: 51, description: '弱い霧雨', theme: 'rainy' },
    53: { code: 53, description: '霧雨', theme: 'rainy' },
    55: { code: 55, description: '強い霧雨', theme: 'rainy' },
    61: { code: 61, description: '弱い雨', theme: 'rainy' },
    63: { code: 63, description: '雨', theme: 'rainy' },
    65: { code: 65, description: '強い雨', theme: 'rainy' },
    71: { code: 71, description: '弱い雪', theme: 'snowy' },
    73: { code: 73, description: '雪', theme: 'snowy' },
    75: { code: 75, description: '強い雪', theme: 'snowy' },
    80: { code: 80, description: 'にわか雨', theme: 'rainy' },
    81: { code: 81, description: '強いにわか雨', theme: 'rainy' },
    82: { code: 82, description: '激しいにわか雨', theme: 'stormy' },
    95: { code: 95, description: '雷雨', theme: 'stormy' },
    96: { code: 96, description: '雷雨（雹）', theme: 'stormy' },
    99: { code: 99, description: '激しい雷雨', theme: 'stormy' },
};

/**
 * 保存された位置情報を取得
 */
export function getSavedLocation(): Location | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('位置情報の読み込みに失敗:', e);
    }
    return null;
}

/**
 * 位置情報を保存
 */
export function saveLocation(location: Location): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } catch (e) {
        console.warn('位置情報の保存に失敗:', e);
    }
}

/**
 * 現在地を取得（Geolocation API）
 */
export function getCurrentPosition(): Promise<Location> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location: Location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    name: '現在地'
                };
                saveLocation(location);
                resolve(location);
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 3600000 // 1時間キャッシュ
            }
        );
    });
}

/**
 * 位置情報を取得（優先順位: 保存済み → 現在地 → デフォルト）
 */
export async function getLocation(): Promise<Location> {
    // 1. 保存済みの位置情報を確認
    const saved = getSavedLocation();
    if (saved) {
        return saved;
    }

    // 2. 現在地を取得
    try {
        return await getCurrentPosition();
    } catch (e) {
        console.warn('現在地の取得に失敗、デフォルト座標を使用:', e);
    }

    // 3. デフォルト座標を使用
    return DEFAULT_LOCATION;
}

/**
 * カスタム座標を設定（フェーズ3: キャンプ地対応用インターフェース）
 */
export function setCustomLocation(location: Location): void {
    saveLocation(location);
}

// ===== オフラインキャッシュ機能 =====

const WEATHER_CACHE_KEY = 'nature-window-weather-cache';
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12時間

interface CachedWeather {
    data: WeatherData;
    fetchedAt: number;
}

/**
 * 天気データをキャッシュに保存
 */
function saveWeatherCache(weatherData: WeatherData): void {
    try {
        const cache: CachedWeather = {
            data: weatherData,
            fetchedAt: Date.now()
        };
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn('天気キャッシュの保存に失敗:', e);
    }
}

/**
 * キャッシュから天気データを取得（有効期限チェック付き）
 */
function getWeatherCache(): WeatherData | null {
    try {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (!cached) return null;
        
        const { data, fetchedAt }: CachedWeather = JSON.parse(cached);
        const age = Date.now() - fetchedAt;
        
        // 12時間以内のキャッシュなら有効
        if (age < CACHE_MAX_AGE_MS) {
            console.log(`天気キャッシュを使用 (${Math.round(age / 60000)}分前のデータ)`);
            return data;
        }
        
        console.log('天気キャッシュが古すぎます（12時間超過）');
        return null;
    } catch (e) {
        console.warn('天気キャッシュの読み込みに失敗:', e);
        return null;
    }
}

/**
 * 季節に合わせたデフォルト天気を返す
 */
function getSeasonalDefaultWeather(): WeatherData {
    const month = new Date().getMonth() + 1;
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    
    // 季節に応じた天気コード
    let weatherCode: number;
    let temperature: number;
    
    if (month >= 3 && month <= 5) {
        // 春: 晴れ、15度
        weatherCode = 1;
        temperature = 15;
    } else if (month >= 6 && month <= 8) {
        // 夏: 晴れ、28度
        weatherCode = 0;
        temperature = 28;
    } else if (month >= 9 && month <= 11) {
        // 秋: 薄曇り、18度
        weatherCode = 2;
        temperature = 18;
    } else {
        // 冬: 晴れ、5度
        weatherCode = 1;
        temperature = 5;
    }
    
    console.log('季節のデフォルト天気を使用');
    
    return {
        temperature,
        weatherCode,
        windSpeed: 5,
        isDay,
        time: new Date().toISOString()
    };
}

/**
 * 天気情報を取得（キャッシュ対応）
 */
export async function fetchWeather(location: Location): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&timezone=Asia%2FTokyo`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        const current = data.current_weather;

        const weatherData: WeatherData = {
            temperature: current.temperature,
            weatherCode: current.weathercode,
            windSpeed: current.windspeed,
            isDay: current.is_day === 1,
            time: current.time
        };
        
        // 成功時: キャッシュに保存
        saveWeatherCache(weatherData);
        
        return weatherData;
    } catch (e) {
        console.warn('天気APIリクエスト失敗:', e);
        
        // フォールバック1: キャッシュから取得
        const cached = getWeatherCache();
        if (cached) {
            return cached;
        }
        
        // フォールバック2: 季節のデフォルト天気
        return getSeasonalDefaultWeather();
    }
}

/**
 * 天気コードから天気状態を取得
 */
export function getWeatherCondition(code: number): WeatherCondition {
    return WEATHER_CONDITIONS[code] || { code, description: '不明', theme: 'cloudy' };
}

/**
 * 時間帯からテーマを決定
 */
export function getTimeOfDayTheme(): 'morning' | 'day' | 'evening' | 'night' {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
}
