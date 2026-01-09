/**
 * ClockDisplay - 時計表示コンポーネント
 * desk-clock-pwa-2625 から移植・TypeScript化
 * 
 * 特徴:
 * - ミニマル（秒なし）と砂時計（Hourglass）の2モード
 * - 状態を持たない（親から isFireplaceActive を受け取るのみ）
 * - 5秒周期のブレスアニメーション（生命感）
 */

import './clock.css';

export type ClockMode = 'minimal' | 'hourglass';

export interface ClockDisplayOptions {
    container: HTMLElement;
    isFireplaceActive: boolean;
}

/**
 * 時計表示コンポーネント
 */
export class ClockDisplay {
    private container: HTMLElement;
    private mode: ClockMode = 'hourglass';
    private intervalId: number | null = null;
    private isFireplaceActive: boolean = false;

    // localStorageキー
    private static readonly MODE_STORAGE_KEY = 'clock-display-mode';

    constructor(options: ClockDisplayOptions) {
        this.container = options.container;
        this.isFireplaceActive = options.isFireplaceActive;

        // 保存されたモードを復元
        this.mode = this.loadMode();
    }

    /**
     * 時計を開始
     */
    start(): void {
        this.render();
        this.update();

        // 1秒ごとに更新
        this.intervalId = window.setInterval(() => {
            this.update();
        }, 1000);
    }

    /**
     * 時計を停止
     */
    stop(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * 焚き火状態を更新
     */
    setFireplaceActive(active: boolean): void {
        this.isFireplaceActive = active;
        this.updateFireplaceClass();
    }

    /**
     * モードを切り替え
     */
    toggleMode(): void {
        this.mode = this.mode === 'minimal' ? 'hourglass' : 'minimal';
        this.saveMode();
        this.render();
        this.update();
    }

    /**
     * 現在のモードを取得
     */
    getMode(): ClockMode {
        return this.mode;
    }

    /**
     * DOMを描画
     */
    private render(): void {
        const fireplaceClass = this.isFireplaceActive ? 'fireplace-glow' : '';

        this.container.innerHTML = `
      <div class="clock-panel ${fireplaceClass}" data-mode="${this.mode}">
        ${this.mode === 'hourglass' ? `
          <div class="clock-hourglass">
            <div class="clock-fill" id="clockFill"></div>
            <div class="clock-time" id="clockTime"></div>
          </div>
        ` : `
          <div class="clock-minimal">
            <div class="clock-time" id="clockTime"></div>
          </div>
        `}
        <button class="clock-mode-toggle" aria-label="モード切替" data-action="toggle-clock-mode">
          ${this.mode === 'hourglass' ? '⏳' : '🕐'}
        </button>
      </div>
    `;

        // モード切替ボタンのイベント
        const toggleBtn = this.container.querySelector('[data-action="toggle-clock-mode"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMode();
            });
        }
    }

    /**
     * 時刻を更新
     */
    private update(): void {
        const now = new Date();

        // 時刻表示（秒なし）
        const timeStr = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const timeEl = this.container.querySelector('#clockTime');
        if (timeEl) {
            timeEl.textContent = timeStr;
        }

        // 砂時計モードの場合、充填率を更新
        if (this.mode === 'hourglass') {
            this.updateHourglass(now);
        }
    }

    /**
     * 砂時計の充填率を更新
     * 1時間で満ちる光
     */
    private updateHourglass(now: Date): void {
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const totalSecondsInHour = 3600;
        const currentSeconds = (minutes * 60) + seconds;
        const progress = currentSeconds / totalSecondsInHour;

        const fillEl = this.container.querySelector('#clockFill') as HTMLElement;
        if (fillEl) {
            fillEl.style.height = `${progress * 100}%`;

            // 80%以上で色相を変える
            if (progress >= 0.8) {
                fillEl.classList.add('approaching');
            } else {
                fillEl.classList.remove('approaching');
            }

            // 最後の1分（59分）で「気配」演出
            if (minutes === 59) {
                fillEl.classList.add('final-flare');
            } else {
                fillEl.classList.remove('final-flare');
            }
        }
    }

    /**
     * 焚き火クラスを更新
     */
    private updateFireplaceClass(): void {
        const panel = this.container.querySelector('.clock-panel');
        if (panel) {
            if (this.isFireplaceActive) {
                panel.classList.add('fireplace-glow');
            } else {
                panel.classList.remove('fireplace-glow');
            }
        }
    }

    /**
     * モードをlocalStorageに保存
     */
    private saveMode(): void {
        try {
            localStorage.setItem(ClockDisplay.MODE_STORAGE_KEY, this.mode);
        } catch {
            // localStorage unavailable
        }
    }

    /**
     * モードをlocalStorageから読み込み
     */
    private loadMode(): ClockMode {
        try {
            const saved = localStorage.getItem(ClockDisplay.MODE_STORAGE_KEY);
            if (saved === 'minimal' || saved === 'hourglass') {
                return saved;
            }
        } catch {
            // localStorage unavailable
        }
        return 'hourglass'; // デフォルトは砂時計
    }
}
