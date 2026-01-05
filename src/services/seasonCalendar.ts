/**
 * 二十四節気・七十二候カレンダー
 * 日付から該当する節気・候を計算
 */

export interface Sekki {
    name: string;      // 節気名
    reading: string;   // 読み
    startMonth: number;
    startDay: number;
}

export interface Kou {
    name: string;      // 候名
    reading: string;   // 読み
    description: string; // 説明
    sekkiIndex: number;  // 所属する節気のインデックス
    kouIndex: number;    // その節気内での候の順番（0-2）
}

// 二十四節気（2024-2026年頃の日付）
const SEKKI: Sekki[] = [
    { name: '小寒', reading: 'しょうかん', startMonth: 1, startDay: 5 },
    { name: '大寒', reading: 'だいかん', startMonth: 1, startDay: 20 },
    { name: '立春', reading: 'りっしゅん', startMonth: 2, startDay: 4 },
    { name: '雨水', reading: 'うすい', startMonth: 2, startDay: 19 },
    { name: '啓蟄', reading: 'けいちつ', startMonth: 3, startDay: 5 },
    { name: '春分', reading: 'しゅんぶん', startMonth: 3, startDay: 20 },
    { name: '清明', reading: 'せいめい', startMonth: 4, startDay: 4 },
    { name: '穀雨', reading: 'こくう', startMonth: 4, startDay: 20 },
    { name: '立夏', reading: 'りっか', startMonth: 5, startDay: 5 },
    { name: '小満', reading: 'しょうまん', startMonth: 5, startDay: 21 },
    { name: '芒種', reading: 'ぼうしゅ', startMonth: 6, startDay: 5 },
    { name: '夏至', reading: 'げし', startMonth: 6, startDay: 21 },
    { name: '小暑', reading: 'しょうしょ', startMonth: 7, startDay: 7 },
    { name: '大暑', reading: 'たいしょ', startMonth: 7, startDay: 22 },
    { name: '立秋', reading: 'りっしゅう', startMonth: 8, startDay: 7 },
    { name: '処暑', reading: 'しょしょ', startMonth: 8, startDay: 23 },
    { name: '白露', reading: 'はくろ', startMonth: 9, startDay: 7 },
    { name: '秋分', reading: 'しゅうぶん', startMonth: 9, startDay: 23 },
    { name: '寒露', reading: 'かんろ', startMonth: 10, startDay: 8 },
    { name: '霜降', reading: 'そうこう', startMonth: 10, startDay: 23 },
    { name: '立冬', reading: 'りっとう', startMonth: 11, startDay: 7 },
    { name: '小雪', reading: 'しょうせつ', startMonth: 11, startDay: 22 },
    { name: '大雪', reading: 'たいせつ', startMonth: 12, startDay: 7 },
    { name: '冬至', reading: 'とうじ', startMonth: 12, startDay: 22 },
];

// 七十二候（各節気に3つずつ）
const KOU: Kou[] = [
    // 小寒
    { name: '芹乃栄', reading: 'せりすなわちさかう', description: '芹が盛んに生える', sekkiIndex: 0, kouIndex: 0 },
    { name: '水泉動', reading: 'しみずあたたかをふくむ', description: '地中で凍った泉が動き始める', sekkiIndex: 0, kouIndex: 1 },
    { name: '雉始雊', reading: 'きじはじめてなく', description: '雄の雉が鳴き始める', sekkiIndex: 0, kouIndex: 2 },
    // 大寒
    { name: '款冬華', reading: 'ふきのはなさく', description: '蕗の薹が出始める', sekkiIndex: 1, kouIndex: 0 },
    { name: '水沢腹堅', reading: 'さわみずこおりつめる', description: '沢の水が厚く凍る', sekkiIndex: 1, kouIndex: 1 },
    { name: '鶏始乳', reading: 'にわとりはじめてとやにつく', description: '鶏が卵を産み始める', sekkiIndex: 1, kouIndex: 2 },
    // 立春
    { name: '東風解凍', reading: 'はるかぜこおりをとく', description: '東風が吹いて氷を解かす', sekkiIndex: 2, kouIndex: 0 },
    { name: '黄鶯睍睆', reading: 'うぐいすなく', description: '鶯が鳴き始める', sekkiIndex: 2, kouIndex: 1 },
    { name: '魚上氷', reading: 'うおこおりをいずる', description: '魚が氷を割って跳ね上がる', sekkiIndex: 2, kouIndex: 2 },
    // 雨水
    { name: '土脉潤起', reading: 'つちのしょううるおいおこる', description: '雨が降って土が潤う', sekkiIndex: 3, kouIndex: 0 },
    { name: '霞始靆', reading: 'かすみはじめてたなびく', description: '霞がたなびき始める', sekkiIndex: 3, kouIndex: 1 },
    { name: '草木萌動', reading: 'そうもくめばえいずる', description: '草木が芽吹き始める', sekkiIndex: 3, kouIndex: 2 },
    // 啓蟄
    { name: '蟄虫啓戸', reading: 'すごもりむしとをひらく', description: '冬ごもりの虫が出てくる', sekkiIndex: 4, kouIndex: 0 },
    { name: '桃始笑', reading: 'ももはじめてさく', description: '桃の花が咲き始める', sekkiIndex: 4, kouIndex: 1 },
    { name: '菜虫化蝶', reading: 'なむしちょうとなる', description: '青虫が蝶になる', sekkiIndex: 4, kouIndex: 2 },
    // 春分
    { name: '雀始巣', reading: 'すずめはじめてすくう', description: '雀が巣を作り始める', sekkiIndex: 5, kouIndex: 0 },
    { name: '桜始開', reading: 'さくらはじめてひらく', description: '桜が咲き始める', sekkiIndex: 5, kouIndex: 1 },
    { name: '雷乃発声', reading: 'かみなりすなわちこえをはっす', description: '春雷が鳴り始める', sekkiIndex: 5, kouIndex: 2 },
    // 清明
    { name: '玄鳥至', reading: 'つばめきたる', description: '燕が南からやってくる', sekkiIndex: 6, kouIndex: 0 },
    { name: '鴻雁北', reading: 'こうがんかえる', description: '雁が北へ渡っていく', sekkiIndex: 6, kouIndex: 1 },
    { name: '虹始見', reading: 'にじはじめてあらわる', description: '雨上がりに虹が出始める', sekkiIndex: 6, kouIndex: 2 },
    // 穀雨
    { name: '葭始生', reading: 'あしはじめてしょうず', description: '葦が芽を出し始める', sekkiIndex: 7, kouIndex: 0 },
    { name: '霜止出苗', reading: 'しもやんでなえいずる', description: '霜が降りなくなり稲の苗が育つ', sekkiIndex: 7, kouIndex: 1 },
    { name: '牡丹華', reading: 'ぼたんはなさく', description: '牡丹の花が咲く', sekkiIndex: 7, kouIndex: 2 },
    // 立夏
    { name: '蛙始鳴', reading: 'かわずはじめてなく', description: '蛙が鳴き始める', sekkiIndex: 8, kouIndex: 0 },
    { name: '蚯蚓出', reading: 'みみずいずる', description: 'みみずが地上に出てくる', sekkiIndex: 8, kouIndex: 1 },
    { name: '竹笋生', reading: 'たけのこしょうず', description: 'たけのこが出てくる', sekkiIndex: 8, kouIndex: 2 },
    // 小満
    { name: '蚕起食桑', reading: 'かいこおきてくわをはむ', description: '蚕が桑を盛んに食べ始める', sekkiIndex: 9, kouIndex: 0 },
    { name: '紅花栄', reading: 'べにばなさかう', description: '紅花が盛んに咲く', sekkiIndex: 9, kouIndex: 1 },
    { name: '麦秋至', reading: 'むぎのときいたる', description: '麦が熟し収穫を迎える', sekkiIndex: 9, kouIndex: 2 },
    // 芒種
    { name: '蟷螂生', reading: 'かまきりしょうず', description: 'かまきりが生まれる', sekkiIndex: 10, kouIndex: 0 },
    { name: '腐草為螢', reading: 'くされたるくさほたるとなる', description: '蛍が光を放ち始める', sekkiIndex: 10, kouIndex: 1 },
    { name: '梅子黄', reading: 'うめのみきばむ', description: '梅の実が黄ばんで熟す', sekkiIndex: 10, kouIndex: 2 },
    // 夏至
    { name: '乃東枯', reading: 'なつかれくさかるる', description: '夏枯草が枯れる', sekkiIndex: 11, kouIndex: 0 },
    { name: '菖蒲華', reading: 'あやめはなさく', description: 'あやめの花が咲く', sekkiIndex: 11, kouIndex: 1 },
    { name: '半夏生', reading: 'はんげしょうず', description: '烏柄杓が生える', sekkiIndex: 11, kouIndex: 2 },
    // 小暑
    { name: '温風至', reading: 'あつかぜいたる', description: '暖かい風が吹いてくる', sekkiIndex: 12, kouIndex: 0 },
    { name: '蓮始開', reading: 'はすはじめてひらく', description: '蓮の花が開き始める', sekkiIndex: 12, kouIndex: 1 },
    { name: '鷹乃学習', reading: 'たかすなわちわざをならう', description: '鷹の幼鳥が飛ぶことを覚える', sekkiIndex: 12, kouIndex: 2 },
    // 大暑
    { name: '桐始結花', reading: 'きりはじめてはなをむすぶ', description: '桐の花が咲き始める', sekkiIndex: 13, kouIndex: 0 },
    { name: '土潤溽暑', reading: 'つちうるおうてむしあつし', description: '土が湿って蒸し暑くなる', sekkiIndex: 13, kouIndex: 1 },
    { name: '大雨時行', reading: 'たいうときどきふる', description: '時として大雨が降る', sekkiIndex: 13, kouIndex: 2 },
    // 立秋
    { name: '涼風至', reading: 'すずかぜいたる', description: '涼しい風が立ち始める', sekkiIndex: 14, kouIndex: 0 },
    { name: '寒蝉鳴', reading: 'ひぐらしなく', description: 'ひぐらしが鳴き始める', sekkiIndex: 14, kouIndex: 1 },
    { name: '蒙霧升降', reading: 'ふかききりまとう', description: '深い霧が立ち込める', sekkiIndex: 14, kouIndex: 2 },
    // 処暑
    { name: '綿柎開', reading: 'わたのはなしべひらく', description: '綿を包む萼が開く', sekkiIndex: 15, kouIndex: 0 },
    { name: '天地始粛', reading: 'てんちはじめてさむし', description: 'ようやく暑さが鎮まる', sekkiIndex: 15, kouIndex: 1 },
    { name: '禾乃登', reading: 'こくものすなわちみのる', description: '稲が実る', sekkiIndex: 15, kouIndex: 2 },
    // 白露
    { name: '草露白', reading: 'くさのつゆしろし', description: '草に降りた露が白く光る', sekkiIndex: 16, kouIndex: 0 },
    { name: '鶺鴒鳴', reading: 'せきれいなく', description: 'せきれいが鳴き始める', sekkiIndex: 16, kouIndex: 1 },
    { name: '玄鳥去', reading: 'つばめさる', description: '燕が南へ帰っていく', sekkiIndex: 16, kouIndex: 2 },
    // 秋分
    { name: '雷乃収声', reading: 'かみなりすなわちこえをおさむ', description: '雷が鳴らなくなる', sekkiIndex: 17, kouIndex: 0 },
    { name: '蟄虫坏戸', reading: 'むしかくれてとをふさぐ', description: '虫が土中に潜って入口をふさぐ', sekkiIndex: 17, kouIndex: 1 },
    { name: '水始涸', reading: 'みずはじめてかるる', description: '田畑の水を干し始める', sekkiIndex: 17, kouIndex: 2 },
    // 寒露
    { name: '鴻雁来', reading: 'こうがんきたる', description: '雁が飛来し始める', sekkiIndex: 18, kouIndex: 0 },
    { name: '菊花開', reading: 'きくのはなひらく', description: '菊の花が咲く', sekkiIndex: 18, kouIndex: 1 },
    { name: '蟋蟀在戸', reading: 'きりぎりすとにあり', description: '蟋蟀が戸の辺りで鳴く', sekkiIndex: 18, kouIndex: 2 },
    // 霜降
    { name: '霜始降', reading: 'しもはじめてふる', description: '霜が降り始める', sekkiIndex: 19, kouIndex: 0 },
    { name: '霎時施', reading: 'こさめときどきふる', description: '小雨がしとしと降る', sekkiIndex: 19, kouIndex: 1 },
    { name: '楓蔦黄', reading: 'もみじつたきばむ', description: 'もみじや蔦が黄葉する', sekkiIndex: 19, kouIndex: 2 },
    // 立冬
    { name: '山茶始開', reading: 'つばきはじめてひらく', description: '山茶花が咲き始める', sekkiIndex: 20, kouIndex: 0 },
    { name: '地始凍', reading: 'ちはじめてこおる', description: '大地が凍り始める', sekkiIndex: 20, kouIndex: 1 },
    { name: '金盞香', reading: 'きんせんかさく', description: '水仙の花が咲く', sekkiIndex: 20, kouIndex: 2 },
    // 小雪
    { name: '虹蔵不見', reading: 'にじかくれてみえず', description: '虹を見かけなくなる', sekkiIndex: 21, kouIndex: 0 },
    { name: '朔風払葉', reading: 'きたかぜこのはをはらう', description: '北風が木の葉を払う', sekkiIndex: 21, kouIndex: 1 },
    { name: '橘始黄', reading: 'たちばなはじめてきばむ', description: '橘の実が黄色くなり始める', sekkiIndex: 21, kouIndex: 2 },
    // 大雪
    { name: '閉塞成冬', reading: 'そらさむくふゆとなる', description: '天地の気が塞がって冬となる', sekkiIndex: 22, kouIndex: 0 },
    { name: '熊蟄穴', reading: 'くまあなにこもる', description: '熊が冬ごもりのため穴に隠れる', sekkiIndex: 22, kouIndex: 1 },
    { name: '鮭魚群', reading: 'さけのうおむらがる', description: '鮭が群がり川を上る', sekkiIndex: 22, kouIndex: 2 },
    // 冬至
    { name: '乃東生', reading: 'なつかれくさしょうず', description: '夏枯草が芽を出す', sekkiIndex: 23, kouIndex: 0 },
    { name: '麋角解', reading: 'おおしかのつのおつる', description: '大鹿の角が落ちる', sekkiIndex: 23, kouIndex: 1 },
    { name: '雪下出麦', reading: 'ゆきわたりてむぎいずる', description: '雪の下で麦が芽を出す', sekkiIndex: 23, kouIndex: 2 },
];

/**
 * 日付（月日）を年初からの日数に変換
 */
function getDayOfYear(month: number, day: number): number {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let dayOfYear = day;
    for (let i = 0; i < month - 1; i++) {
        dayOfYear += daysInMonth[i];
    }
    return dayOfYear;
}

/**
 * 二十四節気のインデックスを取得
 */
function getSekkiIndex(month: number, day: number): number {
    const targetDoy = getDayOfYear(month, day);

    // 各節気の開始日を年初からの日数に変換
    const sekkiDoys = SEKKI.map(s => getDayOfYear(s.startMonth, s.startDay));

    // 現在の日付がどの節気に属するか判定
    for (let i = sekkiDoys.length - 1; i >= 0; i--) {
        if (targetDoy >= sekkiDoys[i]) {
            return i;
        }
    }

    // 年初（1/1-1/4頃）は前年の冬至
    return 23;
}

/**
 * 現在の二十四節気を取得
 */
export function getCurrentSekki(date: Date = new Date()): Sekki {
    const index = getSekkiIndex(date.getMonth() + 1, date.getDate());
    return SEKKI[index];
}

/**
 * 現在の七十二候を取得
 */
export function getCurrentKou(date: Date = new Date()): Kou {
    const sekkiIndex = getSekkiIndex(date.getMonth() + 1, date.getDate());
    const sekki = SEKKI[sekkiIndex];

    // 次の節気の日付を取得
    const nextSekkiIndex = (sekkiIndex + 1) % 24;
    const nextSekki = SEKKI[nextSekkiIndex];

    // 節気内の経過日数を計算
    const sekkiStartDoy = getDayOfYear(sekki.startMonth, sekki.startDay);
    let nextSekkiStartDoy = getDayOfYear(nextSekki.startMonth, nextSekki.startDay);
    if (nextSekkiIndex === 0) nextSekkiStartDoy += 365; // 年をまたぐ場合

    const sekkiLength = nextSekkiStartDoy - sekkiStartDoy;
    const kouLength = sekkiLength / 3;

    let currentDoy = getDayOfYear(date.getMonth() + 1, date.getDate());
    if (currentDoy < sekkiStartDoy) currentDoy += 365; // 年をまたぐ場合

    const daysIntoSekki = currentDoy - sekkiStartDoy;
    const kouIndex = Math.min(Math.floor(daysIntoSekki / kouLength), 2);

    // 該当する候を検索
    const kou = KOU.find(k => k.sekkiIndex === sekkiIndex && k.kouIndex === kouIndex);

    return kou || KOU[sekkiIndex * 3];
}

/**
 * 季節を取得
 */
export function getCurrentSeason(date: Date = new Date()): '春' | '夏' | '秋' | '冬' {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
}
