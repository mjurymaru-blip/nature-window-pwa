/**
 * 環境音コントローラ（揺らぎ設計）
 * Web Audio APIを使用して、自然な揺らぎを持つ環境音を再生
 */

export type SoundScene = 'rain' | 'fire' | 'wind' | 'night' | 'silent';

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

// 音源設定（URLはプレースホルダー、後で実際のファイルに置換）
const SCENE_CONFIGS: Record<SoundScene, SceneConfig | null> = {
    rain: {
        main: {
            url: '/sounds/rain-loop.mp3',
            volume: 0.4,
            loop: true
        },
        sub: [
            {
                url: '/sounds/thunder-distant.mp3',
                volume: 0.2,
                loop: false,
                isSubSound: true,
                minInterval: 30000,  // 30秒〜2分間隔で雷
                maxInterval: 120000
            }
        ]
    },
    fire: {
        main: {
            url: '/sounds/fire-crackle.mp3',
            volume: 0.5,
            loop: true
        },
        sub: [
            {
                url: '/sounds/fire-pop.mp3',
                volume: 0.3,
                loop: false,
                isSubSound: true,
                minInterval: 5000,   // 5秒〜20秒間隔で薪が爆ぜる
                maxInterval: 20000
            }
        ]
    },
    wind: {
        main: {
            url: '/sounds/wind-loop.mp3',
            volume: 0.3,
            loop: true
        },
        sub: [
            {
                url: '/sounds/leaves-rustle.mp3',
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
            url: '/sounds/insects-loop.mp3',
            volume: 0.3,
            loop: true
        },
        sub: [
            {
                url: '/sounds/owl-distant.mp3',
                volume: 0.15,
                loop: false,
                isSubSound: true,
                minInterval: 60000,  // 1分〜3分間隔でフクロウ
                maxInterval: 180000
            }
        ]
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

    /**
     * AudioContextを初期化（ユーザー操作後に呼び出す必要あり）
     */
    async init(): Promise<void> {
        if (this.audioContext) return;

        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = this.masterVolume;

        console.log('SoundController: AudioContext initialized');
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
    }

    /**
     * 現在の状態を取得
     */
    getState(): { scene: SoundScene; isPlaying: boolean; volume: number } {
        return {
            scene: this.currentScene,
            isPlaying: this.isPlaying,
            volume: this.masterVolume
        };
    }

    /**
     * 天気コードからシーンを決定
     */
    static getSceneFromWeather(weatherCode: number, isDay: boolean): SoundScene {
        // 雨系
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
            return 'rain';
        }
        // 雷雨
        if ([95, 96, 99].includes(weatherCode)) {
            return 'rain';
        }
        // 夜
        if (!isDay) {
            return 'night';
        }
        // 風が強い（曇り〜晴れ）
        if ([2, 3, 45, 48].includes(weatherCode)) {
            return 'wind';
        }
        // デフォルト（静か or 風）
        return 'wind';
    }
}

// シングルトンインスタンス
export const soundController = new SoundController();
