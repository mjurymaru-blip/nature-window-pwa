# 環境音ファイル

## シーン選択ロジック（季節 × 時間帯）

| 季節 | 朝(5-9) | 昼(10-16) | 夕(17-19) | 夜(20-4) |
|------|---------|-----------|-----------|----------|
| 春 | 🐦 朝(鳥) | 💨 風 | 💨 風 | 💨 風 |
| 夏 | 🐦 朝(鳥) | ☀️ セミ | 🌅 ひぐらし | 🦗 夏の夜 |
| 初秋(9月) | 🐦 朝(鳥) | 💨 風 | 🌅 ひぐらし | 🍂 秋の夜 |
| 秋(10-11) | 💨 風 | 💨 風 | 💨 風 | 💨 風 |
| 冬 | 💨 風 | 💨 風 | 💨 風 | ❄️ 雪 |

**天気優先**: 雨/雷雨 → 🌧雨音 / 雪 → ❄️雪

---

## 現在の音源ファイル

| シーン | ファイル | 状態 |
|--------|---------|------|
| 🌧 雨音 | `rain-loop.mp3`, `thunder-distant.mp3` | ✅ |
| 🔥 焚き火 | `fire-crackles.mp3` | ✅ |
| 💨 風 | `wind-loop.mp3`, `leaves-rustle.mp3` | ✅ |
| 🦗 夏の夜 | `insects-loop.mp3`, `owl-distant.mp3` | ✅ |
| 🍂 秋の夜 | `insects-loop.mp3` | ✅ |
| 🌅 ひぐらし | `cicada-loop.mp3`, `crows-evening.mp3` | ✅ |
| 🐦 朝(鳥) | `birds-morning.mp3` | ✅ |
| ☀️ セミ | `cicada-loop.mp3` | ✅ |
| ❄️ 雪 | `wind-loop.mp3` (静か) | ✅ |
| 🌊 波 | `stream-loop.mp3` ※波専用推奨 | ⚠️ |
| 🏞 小川 | `stream-loop.mp3` | ✅ |

---

## 追加したい音源

| 音 | ファイル名 | 効果音ラボで探す |
|----|-----------|-----------------|
| ひぐらし専用 | `higurashi-loop.mp3` | 「夏の山2」 |
| 秋の虫専用 | `autumn-insects.mp3` | 鈴虫・コオロギ音源 |
| 波専用 | `wave-loop.mp3` | 「海岸1」「海岸4」 |
| 雪専用 | `snow-wind.mp3` | 「吹雪」(音量下げ) |

---

## フリー素材サイト

- [効果音ラボ](https://soundeffect-lab.info/sound/environment/) - 商用可・クレジット不要
- [Freesound](https://freesound.org/) - CC0素材あり
