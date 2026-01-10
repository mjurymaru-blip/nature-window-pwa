/**
 * 環境音コントローラ（揺らぎ設計）
 * Web Audio APIを使用して、自然な揺らぎを持つ環境音を再生
 */

export type SoundScene =
    | 'rain'           // 雨
    | 'fire'           // 焚き火
    | 'wind'           // 風
    | 'night'          // 夏の夜（虫の声）
    | 'night-autumn'   // 秋の夜（鈴虫系）
    | 'evening-summer' // 夏の夕方（ひぐらし）
    | 'morning'        // 朝（鳥のさえずり）
    | 'cicada'         // 夏の昼（セミ）
    | 'snow'           // 雪
    | 'wave'           // 波
    | 'stream'         // 小川
    | 'silent';        // 無音

interface SoundLayer {
    url: string;
    volume: number;
    loop: boolean;
    isSubSound?: boolean;  // サブ音（ランダムタイミングで再生）
    minInterval?: number;  // 最小再生間隔（ms）
    maxInterval?: number;  // 最大再生間隔（ms）
}

interface SceneConfig {
    main: SoundLayer;
    sub?: SoundLayer[];
}

/**
 * 音の「存在感」を定義する型
 * 
 * UIに出さない。設計レベルでのドキュメンテーション。
 * 「これは音量調整ではなく、存在感の設計である」という認識をコードに残す。
 * 
 * @see ChatGPT/Geminiレビュー: フェーズ2.5で概念を定義、数値は後で調整
 */
export interface SoundPresence {
    /** 平均音量 (0.0 - 1.0) */
    baseVolume: number;
    /** 揺らぎ幅 (±) */
    fluctuation: number;
    /** 発音頻度係数 (0.0 - 1.0, 高いほど頻繁) */
    density: number;
}

/**
 * シーンごとの存在感定義（フェーズ3: 焚き火モードで使用予定）
 * 
 * 将来の拡張余地:
 * - frequencyBias（高音/低音）
 * - spatiality（PannerNode）
 * - decay（余韻）
 */
export const SCENE_PRESENCE: Partial<Record<SoundScene, SoundPresence>> = {
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
    // 他シーンはフェーズ3以降で追加
};

// ViteのベースURLを使用して音源パスを生成（GitHub Pages対応）
const soundUrl = (filename: string): string => {
    const base = import.meta.env.BASE_URL || '/';
    return `${base}sounds/${filename}`;
};

// シーン設定
const SCENE_CONFIGS: Record<SoundScene, SceneConfig | null> = {
    rain: {
        main: {
            url: soundUrl('rain-loop.mp3'),
            volume: 0.4,
            loop: true
        },
        sub: [
            {
                url: soundUrl('thunder-distant.mp3'),
                volume: 0.2,
                loop: false,
                isSubSound: true,
                minInterval: 30000,
                maxInterval: 120000
            }
        ]
    },
    fire: {
        main: {
            url: soundUrl('fire-crackles.mp3'),
            volume: 0.5,
            loop: true
        }
        // fire-pop.mp3は不要（メインに含まれる）
    },
    wind: {
        main: {
            url: soundUrl('wind-loop.mp3'),
            volume: 0.3,
            loop: true
        },
        sub: [
            {
                url: soundUrl('leaves-rustle.mp3'),
                volume: 0.2,
                loop: false,
                isSubSound: true,
                minInterval: 10000,
                maxInterval: 40000
            }
        ]
    },
    night: {
        main: {
            url: soundUrl('insects-loop.mp3'),
            volume: 0.3,
            loop: true
        },
        sub: [
            {
                url: soundUrl('owl-distant.mp3'),
                volume: 0.15,
                loop: false,
                isSubSound: true,
                minInterval: 60000,
                maxInterval: 180000
            }
        ]
    },
    'night-autumn': {
        main: {
            url: soundUrl('autumn-insects.mp3'),
            volume: 0.25,
            loop: true
        }
    },
    'evening-summer': {
        main: {
            url: soundUrl('higurashi-loop.mp3'),
            volume: 0.35,
            loop: true
        },
        sub: [
            {
                url: soundUrl('crows-evening.mp3'),
                volume: 0.15,
                loop: false,
                isSubSound: true,
                minInterval: 45000,
                maxInterval: 120000
            }
        ]
    },
    morning: {
        main: {
            url: soundUrl('birds-morning.mp3'),
            volume: 0.35,
            loop: true
        }
    },
    cicada: {
        main: {
            url: soundUrl('cicada-loop.mp3'),
            volume: 0.4,
            loop: true
        }
    },
    snow: {
        main: {
            url: soundUrl('snow-wind.mp3'),
            volume: 0.2,
            loop: true
        }
    },
    wave: {
        main: {
            url: soundUrl('wave-loop.mp3'),
            volume: 0.4,
            loop: true
        }
    },
    stream: {
        main: {
            url: soundUrl('stream-loop.mp3'),
            volume: 0.35,
            loop: true
        }
    },
    silent: null
};

export class SoundController {
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private mainSource: AudioBufferSourceNode | null = null;
    private mainBuffer: AudioBuffer | null = null;
    private subTimers: number[] = [];
    private currentScene: SoundScene = 'silent';
    private isPlaying: boolean = false;
    private masterVolume: number = 0.5;
    private audioCache: Map<string, AudioBuffer> = new Map();

    // === 焚き火オーバーレイ用 ===
    private fireplaceGain: GainNode | null = null;
    private fireplaceSource: AudioBufferSourceNode | null = null;
    private fireplaceBuffer: AudioBuffer | null = null;
    private isFireplaceActive: boolean = false;
    /**
     * AudioContextを初期化（ユーザー操作後に呼び出す必要あり）
     * iOS Safari対応: webkitAudioContextフォールバック
     * Android Chrome対応: 無音再生によるオーディオアンロック
     */
    async init(): Promise<void> {
        if (this.audioContext) {
            // 既存のコンテキストがsuspendedならresumeを試行
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            return;
        }

        // iOS Safari対応: webkitAudioContextを使用
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioContextClass();

        // モバイルブラウザ対応: 即座にresumeを試行
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Android Chrome対応: 無音バッファを再生してオーディオをアンロック
        try {
            const silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = silentBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);
            console.log('SoundController: Silent buffer played for audio unlock');
        } catch (e) {
            console.warn('SoundController: Failed to play silent buffer', e);
        }

        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = this.masterVolume;

        console.log('SoundController: AudioContext initialized, state:', this.audioContext.state);
    }

    /**
     * 音声ファイルを読み込み
     */
    private async loadAudio(url: string): Promise<AudioBuffer | null> {
        // キャッシュ確認
        if (this.audioCache.has(url)) {
            return this.audioCache.get(url)!;
        }

        if (!this.audioContext) {
            console.warn('SoundController: AudioContext not initialized');
            return null;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`SoundController: Failed to load ${url}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioCache.set(url, audioBuffer);
            return audioBuffer;
        } catch (e) {
            console.warn(`SoundController: Error loading ${url}:`, e);
            return null;
        }
    }

    /**
     * シーンを変更
     */
    async setScene(scene: SoundScene): Promise<void> {
        if (scene === this.currentScene) return;

        // 現在の再生を停止
        this.stop();

        this.currentScene = scene;

        if (scene === 'silent' || !this.isPlaying) return;

        await this.play();
    }

    /**
     * 再生開始
     */
    async play(): Promise<void> {
        if (!this.audioContext) {
            await this.init();
        }

        // AudioContextがsuspended状態の場合はresumeする
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;

        const config = SCENE_CONFIGS[this.currentScene];
        if (!config) return;

        // メイン音源を再生
        this.mainBuffer = await this.loadAudio(config.main.url);
        if (this.mainBuffer && this.audioContext && this.gainNode) {
            this.mainSource = this.audioContext.createBufferSource();
            this.mainSource.buffer = this.mainBuffer;
            this.mainSource.loop = config.main.loop;

            // 個別のゲインノードで音量調整
            const mainGain = this.audioContext.createGain();
            mainGain.gain.value = config.main.volume;
            this.mainSource.connect(mainGain);
            mainGain.connect(this.gainNode);

            this.mainSource.start();
            console.log(`SoundController: Playing ${this.currentScene} main sound`);
        }

        // サブ音源のスケジュール
        if (config.sub) {
            for (const subLayer of config.sub) {
                this.scheduleSubSound(subLayer);
            }
        }
    }

    /**
     * サブ音源をランダムタイミングで再生スケジュール
     */
    private scheduleSubSound(layer: SoundLayer): void {
        if (!this.isPlaying) return;

        const minInterval = layer.minInterval || 10000;
        const maxInterval = layer.maxInterval || 60000;
        const delay = minInterval + Math.random() * (maxInterval - minInterval);

        const timer = window.setTimeout(async () => {
            if (!this.isPlaying || !this.audioContext || !this.gainNode) return;

            const buffer = await this.loadAudio(layer.url);
            if (buffer) {
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;

                const subGain = this.audioContext.createGain();
                // ランダムな音量変動（±20%）
                const volumeVariation = 0.8 + Math.random() * 0.4;
                subGain.gain.value = layer.volume * volumeVariation;

                source.connect(subGain);
                subGain.connect(this.gainNode);
                source.start();

                console.log(`SoundController: Playing sub sound from ${layer.url}`);
            }

            // 次のサブ音源をスケジュール
            this.scheduleSubSound(layer);
        }, delay);

        this.subTimers.push(timer);
    }

    /**
     * 再生停止
     */
    stop(): void {
        this.isPlaying = false;

        // メイン音源停止
        if (this.mainSource) {
            try {
                this.mainSource.stop();
            } catch (e) {
                // すでに停止している場合のエラーを無視
            }
            this.mainSource = null;
        }

        // サブ音源タイマーをクリア
        for (const timer of this.subTimers) {
            clearTimeout(timer);
        }
        this.subTimers = [];

        // 焚き火オーバーレイも停止（音量OFFで焚き火音も止める）
        this.disableFireplaceOverlay();

        console.log('SoundController: Stopped');
    }

    /**
     * トグル（再生/停止）
     */
    async toggle(): Promise<boolean> {
        if (this.isPlaying) {
            this.stop();
        } else {
            await this.play();
        }
        return this.isPlaying;
    }

    /**
     * マスター音量を設定
     */
    setVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.masterVolume;
        }
        // 焚き火も同じ音量に連動
        if (this.fireplaceGain) {
            const presence = SCENE_PRESENCE.fire;
            this.fireplaceGain.gain.value = this.masterVolume * (presence?.baseVolume ?? 0.35);
        }
    }

    /**
     * 現在の状態を取得
     */
    getState(): { scene: SoundScene; isPlaying: boolean; volume: number; isFireplaceActive: boolean } {
        return {
            scene: this.currentScene,
            isPlaying: this.isPlaying,
            volume: this.masterVolume,
            isFireplaceActive: this.isFireplaceActive
        };
    }

    // ===== 焚き火オーバーレイ機能 =====

    /**
     * 焚き火オーバーレイを有効化
     * 既存のシーンと同時に焚き火音を再生
     */
    async enableFireplaceOverlay(): Promise<void> {
        if (!this.audioContext) {
            await this.init();
        }
        if (!this.audioContext) return;

        // 既にアクティブなら何もしない
        if (this.isFireplaceActive && this.fireplaceSource) return;

        const fireConfig = SCENE_CONFIGS.fire;
        if (!fireConfig) return;

        try {
            // 焚き火用ゲインノードを作成
            if (!this.fireplaceGain) {
                this.fireplaceGain = this.audioContext.createGain();
                this.fireplaceGain.connect(this.audioContext.destination);
            }

            // SoundPresenceから音量を設定
            const presence = SCENE_PRESENCE.fire;
            const targetVolume = this.masterVolume * (presence?.baseVolume ?? 0.35);

            // 焚き火音をロード
            if (!this.fireplaceBuffer) {
                this.fireplaceBuffer = await this.loadAudio(fireConfig.main.url);
            }

            // フェードインで開始
            this.fireplaceGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.fireplaceGain.gain.linearRampToValueAtTime(
                targetVolume,
                this.audioContext.currentTime + 2 // 2秒でフェードイン
            );

            // ソースを作成して再生
            this.fireplaceSource = this.audioContext.createBufferSource();
            this.fireplaceSource.buffer = this.fireplaceBuffer;
            this.fireplaceSource.loop = true;
            this.fireplaceSource.connect(this.fireplaceGain);
            this.fireplaceSource.start();

            this.isFireplaceActive = true;
            console.log('焚き火オーバーレイを有効化しました 🔥');

        } catch (e) {
            console.error('焚き火オーバーレイの有効化に失敗:', e);
        }
    }

    /**
     * 焚き火オーバーレイを無効化
     * フェードアウトしながら停止
     */
    disableFireplaceOverlay(): void {
        if (!this.isFireplaceActive || !this.fireplaceSource || !this.fireplaceGain || !this.audioContext) {
            this.isFireplaceActive = false;
            return;
        }

        const currentTime = this.audioContext.currentTime;

        // 2秒でフェードアウト
        this.fireplaceGain.gain.setValueAtTime(
            this.fireplaceGain.gain.value,
            currentTime
        );
        this.fireplaceGain.gain.linearRampToValueAtTime(0, currentTime + 2);

        // フェードアウト完了後に停止
        const sourceToStop = this.fireplaceSource;
        setTimeout(() => {
            try {
                sourceToStop.stop();
            } catch {
                // 既に停止済みの場合は無視
            }
        }, 2100);

        this.fireplaceSource = null;
        this.isFireplaceActive = false;
        console.log('焚き火オーバーレイを無効化しました');
    }

    /**
     * 焚き火オーバーレイの状態を取得
     */
    getFireplaceStatus(): boolean {
        return this.isFireplaceActive;
    }

    /**
     * 天気・時間帯・季節からシーンを決定
     * 
     * マトリクス:
     * | 季節     | 朝(5-9)      | 昼(10-16)    | 夕(17-19)        | 夜(20-4)      |
     * |----------|--------------|--------------|------------------|---------------|
     * | 春(3-5)  | 朝(鳥)       | 風           | 風               | 風            |
     * | 夏(6-8)  | 朝(鳥)       | セミ         | ひぐらし         | 夏の夜(虫)    |
     * | 秋(9-11) | 朝(鳥)/風    | 風           | 風/夕(カラス)    | 秋の夜/風     |
     * | 冬(12-2) | 風           | 風           | 風               | 風/雪         |
     */
    static getSceneFromWeather(
        weatherCode: number,
        _isDay: boolean,  // 時間帯判定で代替
        month?: number,
        hour?: number
    ): SoundScene {
        const currentMonth = month ?? new Date().getMonth() + 1;
        const currentHour = hour ?? new Date().getHours();

        // 季節判定
        const isSummer = currentMonth >= 6 && currentMonth <= 8;
        const isEarlyAutumn = currentMonth === 9;
        const isAutumn = currentMonth >= 9 && currentMonth <= 11;
        const isWinter = currentMonth === 12 || currentMonth <= 2;
        const isSpring = currentMonth >= 3 && currentMonth <= 5;

        // 時間帯判定
        const isMorning = currentHour >= 5 && currentHour < 10;
        const isMidday = currentHour >= 10 && currentHour < 17;
        const isEvening = currentHour >= 17 && currentHour < 20;
        const isNight = currentHour >= 20 || currentHour < 5;

        // === 天気優先判定 ===

        // 雨系
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
            return 'rain';
        }
        // 雪
        if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
            return 'snow';
        }

        // === 季節 × 時間帯 判定 ===

        // 夏
        if (isSummer) {
            if (isMorning) return 'morning';
            if (isMidday) return 'cicada';
            if (isEvening) return 'evening-summer';
            if (isNight) return 'night';
        }

        // 初秋（9月）
        if (isEarlyAutumn) {
            if (isMorning) return 'morning';
            if (isEvening) return 'evening-summer';  // まだひぐらし
            if (isNight) return 'night-autumn';
            return 'wind';
        }

        // 秋（10-11月）
        if (isAutumn && !isEarlyAutumn) {
            if (isNight) return 'wind';  // 寒くなると虫も減る
            return 'wind';
        }

        // 冬
        if (isWinter) {
            return isNight ? 'snow' : 'wind';
        }

        // 春
        if (isSpring) {
            if (isMorning) return 'morning';
            return 'wind';
        }

        // デフォルト
        return 'wind';
    }

    /**
     * シーン決定の詳細情報を取得（デバッグ用）
     */
    static getSceneInfo(weatherCode: number, isDay: boolean, month?: number, hour?: number): {
        scene: SoundScene;
        reason: string;
        season: string;
        timeOfDay: string;
    } {
        const currentMonth = month ?? new Date().getMonth() + 1;
        const currentHour = hour ?? new Date().getHours();

        // 季節判定
        let season: string;
        if (currentMonth >= 3 && currentMonth <= 5) season = '春';
        else if (currentMonth >= 6 && currentMonth <= 8) season = '夏';
        else if (currentMonth >= 9 && currentMonth <= 11) season = '秋';
        else season = '冬';

        // 時間帯判定
        let timeOfDay: string;
        if (currentHour >= 5 && currentHour < 10) timeOfDay = '朝';
        else if (currentHour >= 10 && currentHour < 17) timeOfDay = '昼';
        else if (currentHour >= 17 && currentHour < 20) timeOfDay = '夕方';
        else timeOfDay = '夜';

        const scene = this.getSceneFromWeather(weatherCode, isDay, currentMonth, currentHour);

        const reason = `${season}の${timeOfDay}`;

        return { scene, reason, season, timeOfDay };
    }

    /**
     * 利用可能なシーン一覧を取得
     */
    static getAvailableScenes(): SoundScene[] {
        return [
            'rain', 'fire', 'wind', 'night', 'night-autumn',
            'evening-summer', 'morning', 'cicada', 'snow',
            'wave', 'stream', 'silent'
        ];
    }
}

// シングルトンインスタンス
export const soundController = new SoundController();
