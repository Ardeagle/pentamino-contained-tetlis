/**
 * ========================================================================
 * 0. 定数・グローバル設定
 * ========================================================================
 */

// オプション画面の設定値を管理するグローバルオブジェクト
// 詳細オプション画面の独立設定を管理するグローバルオブジェクト
// オプション状態を管理するグローバル変数
let gameOptions = {
    allowBasic: true, allowAlternative: true, allowComplex: true, 
    allowDistorted: true, allowExotic: true, pentaMixCount: 2,
    spawnMode: 'random'};

// 【重要追加】UIの現在の状態を gameOptions に強制同期させる関数
function syncGameOptions() {
    const bCheck = document.getElementById('chkBasic');
    const aCheck = document.getElementById('chkAlternative');
    const cCheck = document.getElementById('chkComplex');
    const dCheck = document.getElementById('chkDistorted');
    const eCheck = document.getElementById('chkExotic');
    const mixSelect = document.getElementById('pentaMixSelect');;
    const spawnMode = document.getElementById('spawnModeSelect');

    // UI要素が画面に存在する場合のみ同期処理を行う
    if (bCheck && aCheck && cCheck && dCheck && eCheck) {
        // 全てオフになっている場合は強制的にBasicをオンにする安全装置
        if (!bCheck.checked && !aCheck.checked && !cCheck.checked && !dCheck.checked && !eCheck.checked) {
            bCheck.checked = true;
        }
        
        gameOptions.allowBasic = bCheck.checked;
        gameOptions.allowAlternative = aCheck.checked;
        gameOptions.allowComplex = cCheck.checked;
        gameOptions.allowDistorted = dCheck.checked;
        gameOptions.allowExotic = eCheck.checked;
        gameOptions.pentaMixCount = parseInt(mixSelect.value, 10)

        if (spawnMode) {
            gameOptions.spawnMode = spawnMode.value; // ← 【追加】
        }

    }
}

function handleDetailedOptionChange() {
    const bCheck = document.getElementById('chkBasic');
    const aCheck = document.getElementById('chkAlternative');
    const cCheck = document.getElementById('chkComplex');
    const dCheck = document.getElementById('chkDistorted');
    const eCheck = document.getElementById('chkExotic');
    
    const mixSettingArea = document.getElementById('pentaMixSetting');

    // すべてオフにされるとミノが枯渇するため、最低1つは強制ONにする安全ガード
    if (!bCheck.checked && !aCheck.checked && !cCheck.checked && !dCheck.checked && !eCheck.checked) {
        bCheck.checked = true;
    }

    gameOptions.allowBasic = bCheck.checked;
    gameOptions.allowAlternative = aCheck.checked;
    gameOptions.allowComplex = cCheck.checked;
    gameOptions.allowDistorted = dCheck.checked;
    gameOptions.allowExotic = eCheck.checked;

    // ペントミノクラスが1つでもONになっているか判定
    const hasAnyPenta = (gameOptions.allowAlternative || gameOptions.allowComplex || gameOptions.allowDistorted || gameOptions.allowExotic);

    // Basic（テトロミノ）がオフ、またはペントミノがすべてオフの場合は、ブレンド比率設定を無効化
if (mixSelect && mixSettingArea) { // ← エラー防止のための安全確認を追加しておくのがオススメです
        if (!gameOptions.allowBasic || !hasAnyPenta) {
            mixSelect.disabled = true;
            mixSettingArea.style.opacity = "0.3";
        } else {
            mixSelect.disabled = false;
            mixSettingArea.style.opacity = "1.0";
        }
    }
}

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const MINI_BLOCK_SIZE = 14;

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

let currentScene = 'start'; 
let isFallingEnabled = true; 

const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[2,2],[2,2]],
    T: [[0,3,0],[3,3,3],[0,0,0]],
    S: [[0,4,4],[4,4,0],[0,0,0]],
    Z: [[5,5,0],[0,5,5],[0,0,0]],
    J: [[6,0,0],[6,6,6],[0,0,0]],
    L: [[0,0,7],[7,7,7],[0,0,0]],
    
    I_penta:       [[0,0,0,0,0],[0,0,0,0,0],[8, 8, 8, 8, 8],[0,0,0,0,0],[0,0,0,0,0]],
    T_penta:       [[0, 9, 0], 
                    [0, 9, 0], 
                    [9, 9, 9]],
    
    Z_penta:       [[ 0,  0, 10], 
                    [10, 10, 10], 
                    [10,  0, 0]],

    Z_prime_penta: [[11,  0,  0], 
                    [11, 11, 11], 
                    [ 0,  0, 11]],


    L_penta:       [[0, 0, 0, 12], [12, 12, 12, 12], [0, 0, 0, 0], [0, 0, 0, 0]],
    L_prime_penta: [[13, 0, 0, 0], [13, 13, 13, 13], [0, 0, 0, 0], [0, 0, 0, 0]],
    
    P_penta:       [[14, 14, 0], [14, 14, 14], [0, 0, 0]],
    P_prime_penta: [[0, 15, 15], [15, 15, 15], [0, 0, 0]],
    N_penta:       [[0, 0,16,16], [16, 16, 16, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    N_prime_penta: [[17, 17, 0, 0], [0, 17, 17, 17], [0, 0, 0, 0], [0, 0, 0, 0]],
    
    Y_penta:       [[0, 18, 0, 0], [18, 18, 18, 18], [0, 0, 0, 0], [0, 0, 0, 0]],
    Y_prime_penta: [[0, 0, 19, 0], [19, 19, 19, 19], [0, 0, 0, 0], [0, 0, 0, 0]],
    F_penta:       [[20, 0, 0], 
                    [20, 20, 20], 
                    [0, 20, 0]],
    F_prime_penta: [[0 , 0 , 21], 
                    [21, 21, 21], 
                    [0 , 21,  0]],
    
    X_penta:       [[0, 22, 0], [22, 22, 22], [0, 22, 0]],
    V_penta:       [[23, 0, 0], [23, 0, 0],[23, 23, 23]],
    W_penta:       [[24,0,0], [24, 24, 0], [0, 24, 24]],
    U_penta:       [[0, 0, 0],[25, 0, 25], [25, 25, 25]]
};

const COLORS = [
    null, 
    'oklch(0.8 0.16 210)', 'oklch(0.9 0.16 100)', 'oklch(0.7 0.18 310)',
    'oklch(0.75 0.18 150)', 'oklch(0.65 0.2 25)', 'oklch(0.7 0.2 250)',
    'oklch(0.8 0.16 75)', 'oklch(0.5 0.2 30)', 'oklch(0.65 0.2 100)',
    'oklch(0.55 0.2 210)', 'oklch(0.6 0.2 350)', 'oklch(0.55 0.2 165)',
    'oklch(0.55 0.2 300)', 'oklch(0.80 0.07 100)', 'oklch(0.75 0.08 250)',
    'oklch(0.8 0.12 150)', 'oklch(0.80 0.10 30)', 'oklch(0.5 0.025 250)',
    'oklch(0.5 0.05 75)', 'oklch(0.5 0.05 150)', 'oklch(0.5 0.05 0)',
    'oklch(0.8 0.2 350)', 'oklch(0.7 0.2 40)', 'oklch(0.75 0.16 170)',
    'oklch(0.8 0.2 125)',  '#004060' 
];

const PENTAMINOS = [
    'I_penta', 'T_penta', 'Z_penta', 'Z_prime_penta', 'L_penta', 'L_prime_penta',
    'P_penta', 'P_prime_penta', 'N_penta', 'N_prime_penta', 'Y_penta', 'Y_prime_penta',
    'F_penta', 'F_prime_penta', 'X_penta', 'V_penta', 'W_penta', 'U_penta'
];

// 内部名をプレイヤーに見せる名前にする
const MINO_DISPLAY_NAMES = {
    'I_penta':"I5",
    'T_penta':"T5",
    'Z_penta':"Z5",
    'Z_prime_penta':"S5",
    'L_penta':"L5",
    'L_prime_penta':"J5",
    'P_penta':"P",
    'P_prime_penta':"G",
    'N_penta':"N",
    'N_prime_penta':"R",
    'Y_penta':"Y",
    'Y_prime_penta':"B",
    'F_penta':"F",
    'F_prime_penta':"E",
    'X_penta':"X",
    'V_penta':"V",
    'W_penta':"W",
    'U_penta':"U"
};

// --- 各種特化クラスの所属定義 ---
const MINO_CLASSES = {
    Alternative: ['I_penta', 'T_penta', 'Z_penta', 'Z_prime_penta', 'L_penta', 'L_prime_penta'],
    Complex: ['P_penta', 'P_prime_penta', 'N_penta', 'N_prime_penta'],
    Distorted: ['Y_penta', 'Y_prime_penta', 'F_penta', 'F_prime_penta'],
    Exotic: ['X_penta', 'V_penta', 'W_penta', 'U_penta']
};

// --- SRS オフセットデータ ---
const WALL_KICK_JLTSZ = {
    "0->1": [[0, 0], [-1, 0], [-1, -1], [0,  2], [-1,  2]],
    "1->0": [[0, 0], [ 1, 0], [ 1,  1], [0, -2], [ 1, -2]],
    "1->2": [[0, 0], [ 1, 0], [ 1,  1], [0, -2], [ 1, -2]],
    "2->1": [[0, 0], [-1, 0], [-1, -1], [0,  2], [-1,  2]],
    "2->3": [[0, 0], [ 1, 0], [ 1, -1], [0,  2], [ 1,  2]],
    "3->2": [[0, 0], [-1, 0], [-1,  1], [0, -2], [-1, -2]],
    "3->0": [[0, 0], [-1, 0], [-1,  1], [0, -2], [-1, -2]],
    "0->3": [[0, 0], [ 1, 0], [ 1, -1], [0,  2], [ 1,  2]]
};

const WALL_KICK_I = {
    "0->1": [[0,0], [-2,0], [1,0], [-2,1],[-2,2], [1,-2],[-2,-2]], 
    "1->2": [[0,0], [-1,0], [2,0],[0,1], [-1,-2],[2,-1],[2,-2], [-1,1], [1,2]], 
    "2->3": [[0,0], [2,0], [-1,0], [-1,2], [-1,3], [2,-1],[-1,-1],[2,1],[2,2]], 
    "3->0": [[0,0], [1,0], [-2,0], [-2,-1], [1,2],[-2,2], [-2,-2]],

    "0->3": [[0,0], [-1,0], [2,0], [2,1], [2,2], [-1,-2],[2,-2]],
    "3->2": [[0,0], [-2,0], [1,0],[1,1], [1,-2], [1,-3], [-2,1],[-2,-1],[-2,-2]],
    "2->1": [[0,0], [1,0], [-2,0], [-2,-1],[0,-1],[-2,1],[-2,2], [-1,1], [1,2]], 
    "1->0": [[0,0], [2,0], [-1,0], [2,-1], [-1,2],[2,2],[2,-2]]
};

// 
const WALL_KICK_5X5 = {
    "0->1": [[0, 0], [0,-2], [1,-2], [-1,-2],[-2,2],[2,2],[-2,-2],[2,-2]],
    "1->0": [[0, 0], [0, 2], [-1,2], [1,2],[2,-2],[-2,-2],[2,2],[-2,2]],
    "1->2": [[0, 0], [0, -2], [-1,-2], [1,-2],[2,2],[-2,2],[2,-2],[-2,-2]],
    "2->1": [[0, 0], [0,2], [1,2], [-1,2],[-2,-2],[2,-2],[-2,2],[2,2]],
    "2->3": [[0, 0], [0,-2], [-1,-2], [-1,-2],[-2,2],[2,2],[-2,-2],[2,-2]],
    "3->2": [[0, 0], [0, 2], [-1,2], [1,2],[2,-2],[-2,-2],[2,2],[-2,2]],
    "3->0": [[0, 0], [0, -2], [-1,-2], [1,-2],[2,2],[-2,2],[2,-2],[-2,-2]],
    "0->3": [[0, 0], [0,2], [1,2], [-1,2],[-2,-2],[2,-2],[-2,2],[2,2]]
};


const WALL_KICK_W = {
    "0->1": [[0, 0], [-1, 0], [ 0, -1], [-1, -1], [-2, 0], [-2, -1]],
    "1->0": [[0, 0], [-1, 0], [ 0, -1],[0,1], [-1, -1], [-2, 0], [-2, -1]],
    "1->2": [[0, 0], [0, -1], [-1,-1], [0, -2], [1,-1]],
    "2->1": [[0, 0], [0, -1], [1,-1], [0, -2], [-1,-1]],
    "2->3": [[0, 0], [1, 0], [ 0, -1],[0,1], [1, -1], [2, 0], [2, -1]],
    "3->2": [[0, 0], [1, 0], [ 0, -1], [1, -1], [2, 0], [2, -1]],
    "3->0": [[0, 0], [0, 1], [0, 2],[0,3], [0, -1], [0, -2],[0,-3]],
    "0->3": [[0, 0], [0, 1], [0, 2],[0,3], [0, -1], [0, -2],[0,-3]]
};
const WALL_KICK_V = JSON.parse(JSON.stringify(WALL_KICK_W));
const WALL_KICK_U = {
    "0->1": [[0, 0], [-1, 0],[0,1],[1,1], [-1, -1], [0,  2], [-1,  2]],
    "1->0": [[0, 0], [ 1, 0],[0,-1],[-1,-1], [ 1,  1], [0, -2], [ 1, -2]],
    "1->2": [[0, 0], [ 1, 0],[0,-1],[-1,-1], [ 1,  1], [0, -2], [ 1, -2], [-1,  -2]],
    "2->1": [[0, 0], [-1, 0],[0,1],[1,1], [-1, -1], [0,  2], [-1,  2], [1,  2]],
    "2->3": [[0, 0], [ 1, 0],[0,1],[-1,1], [ 1, -1], [0,  2], [ 1,  2], [-1,  2]],
    "3->2": [[0, 0], [-1, 0],[0,-1],[1,-1], [-1,  1], [0, -2], [-1, -2], [1,  -2]],
    "3->0": [[0, 0], [-1, 0],[0,-1],[1,-1], [-1,  1], [0, -2], [-1, -2]],
    "0->3": [[0, 0], [ 1, 0],[0,1],[-1,1], [ 1, -1], [0,  2], [ 1,  2]]
};

const WALL_KICK_TFSZ = {
    "0->1": [[0, 0],[0,1],[0,2], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]],
    "1->0": [[0, 0],[0,1],[0,2], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]],
    "1->2": [[0, 0],[0,1], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]],
    "2->1": [[0, 0],[0,1], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]],
    "2->3": [[0, 0],[0,1],[0,2], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]],
    "3->2": [[0, 0],[0,1],[0,2], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]],
    "3->0": [[0, 0],[0,1], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]],
    "0->3": [[0, 0],[0,1], [-1,  1], [1,  1], [0, -1], [-1,  -1], [1,  -1],[0 , -2]]
};

/**
 * ========================================================================
 * 1. ライフサイクル & イベントハンドラ管理
 * ========================================================================
 */
function startGameMode(mode) {
    currentScene = mode;
    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    document.getElementById('controlButtons').style.display = 'flex';
    
    const pTools = document.getElementById('practiceTools');
    if (mode === 'practice') {
        pTools.style.display = 'flex';
        isFallingEnabled = true; 
        document.getElementById('fallToggleBtn').innerText = "落下: ON";
    } else {
        pTools.style.display = 'none';
        isFallingEnabled = true; 
    }
    // 1. まずUI設定からオプションを完全に読み込み直す（同期）
    syncGameOptions();
    
    // 2. 古いキューを完全に捨て、新しいオプションに基づいてキューを作り直す
    pieceQueue = [];
    resetGame();
}

function backToMenu() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    currentScene = 'start';
    document.getElementById('startMenu').style.display = 'flex';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('controlButtons').style.display = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';
}

// ========================================================================
// 【追加】スポーン安全装置（Block Out回避）用ヘルパー関数
// ========================================================================

// ミノの「一番下のブロック」が存在する行インデックスを取得
function getBottomFilledRow(matrix) {
    for (let y = matrix.length - 1; y >= 0; y--) {
        if (matrix[y].some(val => val !== 0)) return y;
    }
    return 0;
}

// 初期スポーン位置のめり込みを検知し、上空の安全圏へ押し上げる
function applySpawnPushUp() {
    // 押し上げの限界高度：ミノの一番下のブロックが y=0（画面の最上段）に来るまで
    const maxPushUp = -getBottomFilledRow(player.matrix);
    
    // 現在位置で衝突しており、かつ限界高度に達していないなら1マス上に逃がす
    while (collide(arena, player) && player.pos.y > maxPushUp) {
        player.pos.y--;
    }
}

function resetGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    arena = createMatrix(COLS, ROWS);
    score = 0; linesCleared = 0; level = 1; gameOver = false; holdPiece = null; 
    
    // 1. まずUI設定からオプションを完全に読み込み直す（同期）
    syncGameOptions();
    
    // 2. 【重要修正】ディスペンサー内部の「古いペントミノの残弾」を完全に破棄する
    dispenser.resetPool();
    
    // 3. 古いキューを完全に捨て、新しいオプションに基づいてキューを作り直す
    pieceQueue = [];
    while (pieceQueue.length < 18) {
        pieceQueue.push(...dispenser.generateNextBag());
    }

    isSoftDropping = false; comboCount = -1; isBackToBack = false; lineClearTimer = 0;
    linesToClear = []; pendingTSpinType = 'none'; floatingTexts = [];
    document.getElementById('score').innerText = '0';
    document.getElementById('lines').innerText = '0';
    
    // ゲームオーバー/ゲームクリア状態のテキストスタイル初期復旧
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        const headline = overlay.querySelector('h2');
        if (headline) {
            headline.innerText = 'GAME OVER';
            headline.style.color = '#ff3333';
            headline.style.textShadow = '0 0 10px rgba(255,51,51,0.5)';
        }
    }
    
    updateLevelAndSpeed();
    resetPlayer();
    lastTime = performance.now();
    update();
}

function update(time = 0) {
    if (currentScene === 'start' || gameOver) return;
    const deltaTime = time - lastTime;
    lastTime = time;

    if (lineClearTimer > 0) {
        lineClearTimer -= deltaTime;
        floatingTexts.forEach(t => t.update());
        floatingTexts = floatingTexts.filter(t => t.life > 0);
        if (lineClearTimer <= 0) { lineClearTimer = 0; executeLineClear(); }
        draw();
        animationFrameId = requestAnimationFrame(update);
        return;
    }

    if (isFallingEnabled) {
        if (collide(arena, player, {x: 0, y: 1})) {
            lockDelayCounter += deltaTime;
            if (lockDelayCounter >= lockDelayTimeout) lockPiece();
        } else {
            lockDelayCounter = 0;
        }

        if (player.matrix) {
            dropCounter += deltaTime;
            const currentInterval = isSoftDropping ? 30 : dropInterval; 
            while (dropCounter >= currentInterval) {
                if (collide(arena, player, {x: 0, y: 1})) { dropCounter = 0; break; }
                playerDrop(true); // 自動落下時はフラグを立てて直前アクションを汚さない
                dropCounter -= currentInterval;
                if (gameOver) break;
            }
        }
    }

    floatingTexts.forEach(t => t.update());
    floatingTexts = floatingTexts.filter(t => t.life > 0);
    draw();
    animationFrameId = requestAnimationFrame(update);
}

// キーボード制御
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const modal = document.getElementById('minoSelectorModal');
        if (modal.style.display === 'flex') { closeMinoSelector(); return; }
        if (currentScene !== 'start') { backToMenu(); return; }
    }

    if (currentScene === 'start' || gameOver || lineClearTimer > 0) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    
    if (event.key === 'ArrowLeft') playerMove(-1);
    else if (event.key === 'ArrowRight') playerMove(1);
    else if (event.key === 'ArrowUp') { if (!event.repeat) playerHardDrop(); }
    else if (event.key === 'z' || event.key === 'Z') { if (!event.repeat) playerRotate(-1); }
    else if (event.key === 'x' || event.key === 'X') { if (!event.repeat) playerRotate(1); }
    else if (event.key === ' ') { if (!event.repeat) playerHold(); }
    else if (event.key === 'B') { if (!event.repeat) useBomb(); }
    else if (event.key === 'ArrowDown') { if (!isSoftDropping) { isSoftDropping = true; playerDrop(false); } }
});

document.addEventListener('keyup', event => {
    if (event.key === 'ArrowDown') isSoftDropping = false;
});

// 初期パレットロード実行
buildVisualMinoSelector();

/**
 * ========================================================================
 * 2. ゲーム状態用変数 & ストリーム生成器
 * ========================================================================
 */
let arena = createMatrix(COLS, ROWS);
let score = 0;
let linesCleared = 0;
let level = 1; // レベルシステム変数
let gameOver = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isSoftDropping = false;
let animationFrameId = null;

let lockDelayTimeout = 600;
let lockDelayCounter = 0;
let lockResetCount = 0;
const MAX_LOCK_RESETS = 15;

let player = { pos: {x: 0, y: 0}, matrix: null, type: null, rotationState: 0, lastAction: 'none', lastKickIndex: 0 };
let holdPiece = null;
let hasHeld = false;
let pieceQueue = [];

class PentaminoStream {
    constructor(masterList) { this.masterList = [...masterList]; this.queue = []; this._refill(); }
    _refill() {
        const newBatch = [...this.masterList];
        for (let i = newBatch.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newBatch[i], newBatch[j]] = [newBatch[j], newBatch[i]];
        }
        this.queue.push(...newBatch);
    }
    popPentaminos(count) {
        if (this.queue.length < count + 5) this._refill();
        const result = [];
        for (let i = 0; i < count; i++) result.push(this.queue.shift());
        return result;
    }
}

class DynamicMinoDispenser {
    constructor() {
        this.tetroBase = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
        this.classMap = {
            Alternative: ['I_penta', 'T_penta', 'Z_penta', 'Z_prime_penta', 'L_penta', 'L_prime_penta'],
            Complex: ['P_penta', 'P_prime_penta', 'N_penta', 'N_prime_penta'],
            Distorted: ['Y_penta', 'Y_prime_penta', 'F_penta', 'F_prime_penta'],
            Exotic: ['X_penta', 'V_penta', 'W_penta', 'U_penta'] // VとWがそれぞれU,Xとペアになる
        };
        
        // ユーザー指定の完全対応ペアリスト
        this.pentaPairs = [
            ['I_penta', 'T_penta'], ['Z_penta', 'Z_prime_penta'], ['L_penta', 'L_prime_penta'], // Alt
            ['P_penta', 'P_prime_penta'], ['N_penta', 'N_prime_penta'], // Cmp
            ['Y_penta', 'Y_prime_penta'], ['F_penta', 'F_prime_penta'], // Dist
            ['X_penta', 'U_penta'], ['W_penta', 'V_penta'] // Exo
        ];
        
        this._pentaPool = []; // ランダムモード用プール
        this._pairPool = [];  // ペアモード用（7-BAG式）プール
        this.pendingPair = null; 
    }

    resetPool() {
        this._pentaPool = [];
        this._pairPool = []; // リセット時にペアバッグも空にする
        this.pendingPair = null;
    }

    _getActivePentaPool() {
        let pool = [];
        if (gameOptions.allowAlternative) pool.push(...this.classMap.Alternative);
        if (gameOptions.allowComplex) pool.push(...this.classMap.Complex);
        if (gameOptions.allowDistorted) pool.push(...this.classMap.Distorted);
        if (gameOptions.allowExotic) pool.push(...this.classMap.Exotic);
        return pool;
    }

    generateNextBag() {
        syncGameOptions();
        let bag = [];
        
        const activePentas = this._getActivePentaPool();
        const activeCount = activePentas.length;

        if (gameOptions.allowBasic) {
            bag.push(...this.tetroBase);

            if (gameOptions.spawnMode === 'pair') {
                // ========================================================
                // Pair System (ペア・BAG巡回アルゴリズム)
                // ========================================================
                // チェックされているクラスに属するペアのみを抽出
                const validPairs = this.pentaPairs.filter(pair => activePentas.includes(pair[0]) && activePentas.includes(pair[1]));

                if (validPairs.length > 0) {
                    if (gameOptions.pentaMixCount === 1) {
                        // 【1個モード】1巡目に片方、2巡目に確実に相方を投入
                        if (this.pendingPair && activePentas.includes(this.pendingPair)) {
                            bag.push(this.pendingPair);
                            this.pendingPair = null;
                        } else {
                            if (this._pairPool.length === 0) {
                                this._pairPool = [...validPairs];
                                for (let j = this._pairPool.length - 1; j > 0; j--) {
                                    const k = Math.floor(Math.random() * (j + 1));
                                    [this._pairPool[j], this._pairPool[k]] = [this._pairPool[k], this._pairPool[j]];
                                }
                            }
                            const randomPair = this._pairPool.pop();
                            if (Math.random() > 0.5) {
                                bag.push(randomPair[0]);
                                this.pendingPair = randomPair[1]; 
                            } else {
                                bag.push(randomPair[1]);
                                this.pendingPair = randomPair[0]; 
                            }
                        }
                    } else {
                        // 【偶数モード】指定されたペア数を、同じBAG内に確実にセットで投入
                        const pairsToAdd = Math.floor(gameOptions.pentaMixCount / 2);
                        for (let i = 0; i < pairsToAdd; i++) {
                            // プールが空なら補充してシャッフル
                            if (this._pairPool.length === 0) {
                                this._pairPool = [...validPairs];
                                for (let j = this._pairPool.length - 1; j > 0; j--) {
                                    const k = Math.floor(Math.random() * (j + 1));
                                    [this._pairPool[j], this._pairPool[k]] = [this._pairPool[k], this._pairPool[j]];
                                }
                            }
                            // プールからペアを1組取り出して両方BAGに入れる
                            const nextPair = this._pairPool.pop();
                            bag.push(nextPair[0], nextPair[1]);
                        }
                    }
                }
            } else {
                // ========================================================
                // Random Mix (完全ランダムモード)
                // ========================================================
                for (let i = 0; i < Math.min(gameOptions.pentaMixCount, activeCount); i++) {
                    if (this._pentaPool.length === 0) {
                        this._pentaPool = [...activePentas];
                        if (this._pentaPool.length === 0) break;
                        for (let j = this._pentaPool.length - 1; j > 0; j--) {
                            const k = Math.floor(Math.random() * (j + 1));
                            [this._pentaPool[j], this._pentaPool[k]] = [this._pentaPool[k], this._pentaPool[j]];
                        }
                    }
                    bag.push(this._pentaPool.pop());
                }
            }
        } else {
            // 【BasicがOFFの場合】（ランダム抽出を継続）
            if (activeCount > 0) {
                while (bag.length < activeCount) {
                    if (this._pentaPool.length === 0) {
                        this._pentaPool = [...activePentas];
                        for (let j = this._pentaPool.length - 1; j > 0; j--) {
                            const k = Math.floor(Math.random() * (j + 1));
                            [this._pentaPool[j], this._pentaPool[k]] = [this._pentaPool[k], this._pentaPool[j]];
                        }
                    }
                    bag.push(this._pentaPool.pop());
                }
            } else {
                bag.push(...this.tetroBase);
            }
        }

        // BAGの中身を一括でシャッフル（Pairモードでも落ちてくる順番はランダム）
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        return bag;
    }
}
const dispenser = new DynamicMinoDispenser();

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

// 【重要修正】キューからミノを取り出す関数
function getNextPiece() {
    while (pieceQueue.length < 18) {
        pieceQueue.push(...dispenser.generateNextBag());
    }
    return pieceQueue.shift();
}

// ========================================================================
// ■ 統計情報（リザルト用）変数
// ========================================================================
let gameStats = {
    single: 0, double: 0, triple: 0, tetris: 0, pentris: 0,
    tSpinZero: 0, tSpinMiniZero: 0, tSpinSingle: 0, tSpinDouble: 0, tSpinTriple: 0,
    tSpinMiniSingle: 0, tSpinMiniDouble: 0,
    maxCombo: 0, b2bCount: 0
};

// 【resetGame 関数の修正】
function resetGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    arena = createMatrix(COLS, ROWS);
    score = 0; linesCleared = 0; level = 1; gameOver = false; holdPiece = null; 
    
    // 統計の初期化
gameStats = {
        single: 0, double: 0, triple: 0, tetris: 0, pentris: 0,
        tSpinZero: 0, tSpinMiniZero: 0, tSpinSingle: 0, tSpinDouble: 0, tSpinTriple: 0,
        tSpinMiniSingle: 0, tSpinMiniDouble: 0,
        maxCombo: 0, b2bCount: 0,
        bombBonus: 0, perfectBonus: 0
    };

    syncGameOptions();
    dispenser.resetPool();
    
    pieceQueue = [];
    while (pieceQueue.length < 18) {
        pieceQueue.push(...dispenser.generateNextBag());
    }

    isSoftDropping = false; comboCount = -1; isBackToBack = false; lineClearTimer = 0;
    linesToClear = []; pendingTSpinType = 'none'; floatingTexts = [];
    document.getElementById('score').innerText = '0';
    document.getElementById('lines').innerText = '0';
    
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    // 前回のリザルトパネルが残っていれば非表示にする
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) resultContainer.style.display = 'none';
    
updateLevelAndSpeed();
    
    bombsRemaining = MAX_BOMBS;
    updateBombDisplay();
    
    resetPlayer();
    lastTime = performance.now();
    update();
}

/**
 * ========================================================================
 * 3. プレイヤー操作 & 移動判定コアロジック
 * ========================================================================
 */
function resetPlayer() {
    player.type = getNextPiece();
    player.matrix = SHAPES[player.type].map(row => [...row]);
    player.rotationState = 0;
    
    // 一度 y=0 でスポーンを試みる
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    
    // 【重要修正】18段目などで早すぎるゲームオーバーを防ぐため、衝突時は上空に逃がす
    applySpawnPushUp();

    player.lastAction = 'none';
    player.lastKickIndex = 0;
    lockDelayCounter = 0;
    lockResetCount = 0;

    // 押し上げ限界まで行っても衝突する場合は、完全に窒息しているためゲームオーバー
    if (collide(arena, player)) {
        gameOver = true;
        showResultScreen(false); // GAME OVER としてリザルト表示
    }
    hasHeld = false;
}

function collide(arena, player, offset = {x: 0, y: 0}) {
    if (!player || !player.matrix) return true;
    const m = player.matrix;
    const p = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0) {
                const targetX = x + p.x + offset.x;
                const targetY = y + p.y + offset.y;
                if (targetX < 0 || targetX >= COLS || targetY >= ROWS || (targetY >= 0 && arena[targetY][targetX] !== 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function playerMove(dir) {
    if (!player || !player.matrix) return;
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
    else { player.lastAction = 'move'; checkLockReset(); }
}

function playerDrop(isAuto = false) {
    if (!player || !player.matrix) return;
    if (collide(arena, player, {x: 0, y: 1})) { dropCounter = 0; return; }
    player.pos.y++;
    
    // 【重要修正】自動落下（重力）の際も、最後のアクションを上書きして
    // 上空で回転させた履歴が設置時まで残り続けないように変更します。
    player.lastAction = isAuto ? 'autoDrop' : 'drop';
    
    dropCounter = 0;
}

function playerHardDrop() {
    if (gameOver) return;
    player.pos.y = getGhostPosition();
    lockPiece();
}

function playerHold() {
    if (gameOver || hasHeld || !player || !player.matrix) return;
    const currentType = player.type;
    if (holdPiece === null) {
        holdPiece = currentType;
        resetPlayer();
    } else {
        const tmp = holdPiece;
        holdPiece = currentType;
        player.type = tmp;
        player.matrix = SHAPES[tmp].map(row => [...row]);
        
        player.pos.y = 0;
        player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
        
        // 【重要修正】ホールドからの出現時も安全装置を適用
        applySpawnPushUp();
        
        player.lastAction = 'none';
        player.lastKickIndex = 0;
        lockDelayCounter = 0; 
        lockResetCount = 0;
    }
    hasHeld = true;
}

// ========================================================================
// ■ ボム
// ========================================================================
const MAX_BOMBS = 3;
let bombsRemaining = MAX_BOMBS;

function useBomb() {
    if (currentScene !== 'game' || gameOver || bombsRemaining <= 0) return;

    for (let y = 0; y < 12; y++) {
        arena[y].fill(0);         
        }
    }

    bombsRemaining--;
    updateBombDisplay();

 // --- 爆発エフェクトの発生 ---
    const areaWidth = COLS * BLOCK_SIZE;
    const areaHeight = 20 * BLOCK_SIZE;

    // 対象領域全体を覆う強烈なフラッシュを発生
    areaFlashes.push(new AreaFlash(areaWidth, areaHeight));

    // 飛び散る火花（パーティクル）を「領域内のランダムな位置」に200個発生させて面爆発を演出
    const colors = ['#f0eee0', '#feee00', '#ff8800', '#ff3300', '#888888']; // 煙のようなグレーも追加
    for (let i = 0; i < 200; i++) {
        // 発生位置を上部10段の中に分散させる
        const pX = Math.random() * areaWidth;
        const pY = Math.random() * areaHeight;
        const color = colors[Math.floor(Math.random() * colors.length)];
        bombParticles.push(new BombParticle(pX, pY, color));
    }

    // エフェクトテキストの表示
    floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 3 + 40, "BOMB!!", '#cc3300', 64));
    draw();
}

function updateBombDisplay() {
    let bombEl = document.getElementById('bombCount');
    if (!bombEl) {
        // LEVELパネルの下に動的にボムパネルを生成して挿入
        const levelBox = document.getElementById('level')?.parentElement;
        if (levelBox && levelBox.parentElement) {
            const bombBox = document.createElement('div');
            bombBox.className = 'panel-box';
            bombBox.style.marginTop = '15px';
            bombBox.innerHTML = `
                <div class="panel-title" style="color: #ff5555;">BOMB [Shift+B]</div>
                <div id="bombCount" class="score-display" style="color: #ff5555; font-size: 18px;"></div>
            `;
            levelBox.parentElement.appendChild(bombBox);
            bombEl = document.getElementById('bombCount');
        }
    }
    
    if (bombEl) {
        let stars = '';
        for (let i = 0; i < bombsRemaining; i++) stars += '★';
        bombEl.innerText = stars === '' ? '0' : stars;
        bombEl.style.color = bombsRemaining > 0 ? '#ff5555' : '#555';
    }
}

/**
 * ========================================================================
 * 4. 完全版 SRS 回転処理機構
 * ========================================================================
 */
function playerRotate(dir) {
    if (gameOver || !player || !player.matrix || player.type === 'O') return;
    
    const startState = player.rotationState;
    const endState = (startState + dir + 4) % 4;
    
    // 1. まず配列（形状）を回転させる
    rotateMatrix(player.matrix, dir);
    
    // 2. ミノの種類名を最優先でチェックして正確にテーブルを特定
    let kickTable = WALL_KICK_JLTSZ; // デフォルト（3x3の通常テトロミノ等）

    if (player.type === 'W_penta') {
        kickTable = WALL_KICK_W;
    } else if (player.type === 'V_penta') {
        kickTable = WALL_KICK_V;
    } else if (player.type === 'U_penta') {
        kickTable = WALL_KICK_U;
    } else if ((player.type === 'T_penta' || player.type === 'F_penta' || player.type === 'Z_penta' || player.type === 'Z_prime_penta' || player.type === 'F_prime_penta')) {
        kickTable = WALL_KICK_TFSZ; // 
    } else if (player.matrix.length === 4) {
        kickTable = WALL_KICK_I;   // 4x4サイズ（本家Iミノ）
    } else if (player.matrix.length === 5) {
        kickTable = WALL_KICK_5X5; // その他の5x5サイズペントミノ
    }
    
    const transitionKey = `${startState}->${endState}`;
    let kicks = kickTable[transitionKey];
    
    let success = false;
    if (kicks) {
        for (let i = 0; i < kicks.length; i++) {
            const kickX = kicks[i][0];
            const kickY = kicks[i][1];
            
            if (!collide(arena, player, {x: kickX, y: kickY})) {
                player.pos.x += kickX; 
                player.pos.y += kickY;
                player.rotationState = endState; 
                player.lastAction = 'rotate'; 
                player.lastKickIndex = i; 
                success = true; 
                break;
            }
        }
    }
    
    if (!success) {
        rotateMatrix(player.matrix, -dir);
    } else {
        checkLockReset();
    }
}

function rotateMatrix(matrix, dir) {
    if (!matrix) return;
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function checkLockReset() {
    if (collide(arena, player, {x: 0, y: 1})) {
        if (lockResetCount < MAX_LOCK_RESETS) { lockDelayCounter = 0; lockResetCount++; }
    }
}

/**
 * ========================================================================
 * 5. T-Spin判定・ライン消去・特化型スコア処理（差し戻し適用版）
 * ========================================================================
 */
let comboCount = -1;
let isBackToBack = false;
let lineClearTimer = 0;
let linesToClear = [];
let pendingTSpinType = 'none';
let floatingTexts = [];

class FloatingText {
    constructor(x, y, text, color, fontSize = 16) {
        this.x = x; this.y = y; this.text = text; this.color = color; this.fontSize = fontSize;
        this.alpha = 1.0; this.life = 1.0; this.decay = 0.015; this.vy = -1.2;
    }
    update() { this.y += this.vy; this.alpha -= this.decay; this.life -= this.decay; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.fontSize}px 'Helvetica Neue', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

function getMinoClass(type) {
    if (MINO_CLASSES.Alternative.includes(type)) return 'Alternative';
    if (MINO_CLASSES.Complex.includes(type)) return 'Complex';
    if (MINO_CLASSES.Distorted.includes(type)) return 'Distorted';
    if (MINO_CLASSES.Exotic.includes(type)) return 'Exotic';
    return 'Basic'; 
}

// 【差し戻し】本家準拠 T系統限定・精密4隅T-Spin判定アルゴリズム
function checkTSpin() {
    if (!player || !player.matrix || player.lastAction !== 'rotate') return 'none';
    
    // Tミノ、T_penta以外は判定を行わない
    if (player.type !== 'T' && player.type !== 'T_penta') return 'none';
    
    const px = player.pos.x; const py = player.pos.y;
    const corners = [ {x: px, y: py}, {x: px + 2, y: py}, {x: px, y: py + 2}, {x: px + 2, y: py + 2} ];
    let occupied = 0;
    
    corners.forEach(c => {
        if (c.x < 0 || c.x >= COLS || c.y >= ROWS || c.y < 0 || arena[c.y][c.x] !== 0) occupied++;
    });
    if (occupied < 3) return 'none';
    
    let frontCorners = [], backCorners = [];
    if (player.rotationState === 0) { frontCorners = [corners[0], corners[1]]; backCorners = [corners[2], corners[3]]; }
    else if (player.rotationState === 1) { frontCorners = [corners[1], corners[3]]; backCorners = [corners[0], corners[2]]; }
    else if (player.rotationState === 2) { frontCorners = [corners[2], corners[3]]; backCorners = [corners[0], corners[1]]; }
    else if (player.rotationState === 3) { frontCorners = [corners[0], corners[2]]; backCorners = [corners[1], corners[3]]; }
    
    let frontOccupied = 0, backOccupied = 0;
    frontCorners.forEach(c => { if (c.x < 0 || c.x >= COLS || c.y >= ROWS || c.y < 0 || arena[c.y][c.x] !== 0) frontOccupied++; });
    backCorners.forEach(c => { if (c.x < 0 || c.x >= COLS || c.y >= ROWS || c.y < 0 || arena[c.y][c.x] !== 0) backOccupied++; });
    
    if (frontOccupied === 1 && backOccupied === 2 && player.lastKickIndex < 4) return 'mini';
    return 'regular';
}

function lockPiece() {
    const tspinType = checkTSpin();
    mergeMatrix(arena, player);
    
    const activeMinoType = player.type;
    player.matrix = null;
    
    const completedRows = [];
    for (let y = 0; y < ROWS; y++) {
        if (arena[y].every(val => val !== 0)) completedRows.push(y);
    }
    
    if (completedRows.length > 0) {
        lineClearTimer = 100;
        linesToClear = completedRows;
        pendingTSpinType = tspinType;
        player.lastLockedMinoType = activeMinoType;
    } else {
        linesToClear = [];
        pendingTSpinType = tspinType;
        player.lastLockedMinoType = activeMinoType;
        executeLineClear();
    }
}

function mergeMatrix(arena, player) {
    if (!player || !player.matrix) return;
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0 && y + player.pos.y >= 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 【差し戻し】スコア計算ロジック（Exotic/Distorted特化スピンの撤廃、通常＋T-Spinへ回帰）
function executeLineClear() {
    let baseScore = 0; 
    let actionText = ""; 
    let isDifficult = false;
    const linesCount = linesToClear.length;
    const minoClass = getMinoClass(player.lastLockedMinoType || 'Basic');
    
if (linesCount > 0) {
        comboCount++;
        // MAX REN (コンボ) の更新
        if (comboCount > gameStats.maxCombo) gameStats.maxCombo = comboCount;

        linesToClear.sort((a, b) => a - b).forEach(y => {
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
        });
        
        if (currentScene === 'game') {
            linesCleared += linesCount;
            updateLevelAndSpeed();
        }
        
        // --- 1. 標準基準点数の算出（T-Spin判定のみ） ---
        if (pendingTSpinType === 'regular') {
            isDifficult = true;
            if (linesCount === 1) { baseScore = 800; actionText = "T-SPIN SINGLE"; gameStats.tSpinSingle++; }
            else if (linesCount === 2) { baseScore = 1200; actionText = "T-SPIN DOUBLE"; gameStats.tSpinDouble++; }
            else if (linesCount === 3) { baseScore = 1600; actionText = "T-SPIN TRIPLE"; gameStats.tSpinTriple++; }
        } else if (pendingTSpinType === 'mini') {
            isDifficult = true;
            if (linesCount === 1) { baseScore = 200; actionText = "T-SPIN MINI SINGLE"; gameStats.tSpinMiniSingle++; }
            else if (linesCount === 2) { baseScore = 400; actionText = "T-SPIN MINI DOUBLE"; gameStats.tSpinMiniDouble++; }
        } else {
            if (linesCount === 1) { baseScore = 100; isDifficult = false; actionText = "SINGLE"; gameStats.single++; }
            else if (linesCount === 2) { baseScore = 300; isDifficult = false; actionText = "DOUBLE"; gameStats.double++; }
            else if (linesCount === 3) { baseScore = 500; isDifficult = false; actionText = "TRIPLE"; gameStats.triple++; }
            else if (linesCount === 4) { baseScore = 800; isDifficult = true; actionText = "TETRIS"; gameStats.tetris++; }
            else if (linesCount === 5) { baseScore = 1300; isDifficult = true; actionText = "PENTRIS"; gameStats.pentris++; }
        }
        
        // --- 2. Alternativeクラスの「BtoB倍率超強化」ボーナス ---
        if (isDifficult) {
            if (isBackToBack) { 
                const btbMultiplier = (minoClass === 'Alternative') ? 2.5 : 1.5;
                baseScore = Math.floor(baseScore * btbMultiplier); 
                actionText = (minoClass === 'Alternative') ? "bonus! " + actionText : "B2B " + actionText; 
                gameStats.b2bCount++; // BtoB発動回数をカウント
            }
            isBackToBack = true;
        } else {
            isBackToBack = false;
        }
        
        // --- 3. Complexクラスの「Combo加算超強化」ボーナス（維持） ---
        if (comboCount > 0) {
            const comboWeight = (minoClass === 'Complex') ? 200 : 50;
            baseScore += comboCount * comboWeight;
            if (minoClass === 'Complex') actionText += ` (bonus!)`;
        }
        
        // レベルに応じたスコア倍率の適用（維持）
        baseScore = baseScore * level;
        score += baseScore;
        
        let yPos = Math.min(...linesToClear) * BLOCK_SIZE;
        yPos = Math.max(40, Math.min(yPos, canvas.height - 80));
        
        if (actionText !== "") floatingTexts.push(new FloatingText(canvas.width / 2, yPos, actionText, '#ff007f'));
        floatingTexts.push(new FloatingText(canvas.width / 2, yPos + 22, `+${baseScore}`, '#b7e0ff'));
        if (comboCount > 0) floatingTexts.push(new FloatingText(canvas.width / 2, yPos + 44, `${comboCount} REN`, '#f0eee0f00'));
        
} else {
        // ラインが消えなかった時のスピン判定（T-Spin ZEROのみ計算）
        comboCount = -1;
        if (pendingTSpinType === 'regular' || pendingTSpinType === 'mini') {
            baseScore = (pendingTSpinType === 'regular') ? 400 : 100;
            actionText = (pendingTSpinType === 'regular') ? "T-SPIN ZERO" : "T-SPIN MINI ZERO";
            
            // スピンゼロの回数をカウント
            if (pendingTSpinType === 'regular') gameStats.tSpinZero++;
            else gameStats.tSpinMiniZero++;

            baseScore = baseScore * level;
            score += baseScore;
            
            floatingTexts.push(new FloatingText(canvas.width / 2, player.pos.y * BLOCK_SIZE, actionText, '#ff007f'));
            floatingTexts.push(new FloatingText(canvas.width / 2, player.pos.y * BLOCK_SIZE + 20, `+${baseScore}`, '#b7e0ff'));
        }
    }
    
    document.getElementById('score').innerText = score;
    document.getElementById('lines').innerText = linesCleared;
    linesToClear = [];
    pendingTSpinType = 'none';
    player.lastLockedMinoType = null;
    if (!gameOver) resetPlayer();
}
// ========================================================================
// ■ リザルト画面表示機能
// ========================================================================
function showResultScreen(isClear = false) {
    const overlay = document.getElementById('gameOverOverlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    
    const headline = overlay.querySelector('h2');
    if (headline) {
        if (isClear) {
            headline.innerText = 'GAME CLEAR';
            headline.style.color = '#b7e0ff';
            headline.style.textShadow = '0 0 15px rgba(0,240,255,0.6)';
        } else {
            headline.innerText = 'GAME OVER';
            headline.style.color = '#ff3333';
            headline.style.textShadow = '0 0 10px rgba(255,51,51,0.5)';
        }
    }
    
    let resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.id = 'resultContainer';
        resultContainer.style.marginTop = '15px';
        resultContainer.style.width = '280px';
        resultContainer.style.textAlign = 'center';
        
        if (headline) {
            headline.parentNode.insertBefore(resultContainer, headline.nextSibling);
        } else {
            overlay.insertBefore(resultContainer, overlay.firstChild);
        }
    }
    
    resultContainer.style.display = 'block';
    
    const tSpinTotal = gameStats.tSpinZero + gameStats.tSpinSingle + gameStats.tSpinDouble + gameStats.tSpinTriple + gameStats.tSpinMiniZero + gameStats.tSpinMiniSingle + gameStats.tSpinMiniDouble;

    // リザルトの中身をHTMLで構築
resultContainer.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 15px; color: #f0eee0;">SCORE: <span style="color: #b7e0ff; font-weight: bold; font-size: 28px; text-shadow: 0 0 8px #b7e0ff;">${score}</span></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; text-align: left; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 8px; border: 1px solid #444; color: #ccc;">
            <div>LINES: <span style="color: #f0eee0; font-weight: bold;">${linesCleared}</span></div>
            <div>LEVEL: <span style="color: #f0eee0; font-weight: bold;">${level}</span></div>
            <div>SINGLE: <span style="color: #f0eee0;">${gameStats.single}</span></div>
            <div>DOUBLE: <span style="color: #f0eee0;">${gameStats.double}</span></div>
            <div>TRIPLE: <span style="color: #f0eee0;">${gameStats.triple}</span></div>
            <div>TETRIS: <span style="color: #b7e0ff; font-weight: bold;">${gameStats.tetris}</span></div>
            <div>PENTRIS: <span style="color: #ff88bb; font-weight: bold;">${gameStats.pentris}</span></div>
            <div>MAX REN: <span style="color: #ddee66; font-weight: bold;">${gameStats.maxCombo}</span></div>
            <div>BtoB: <span style="color: #ff88bb; font-weight: bold;">${gameStats.b2bCount}</span></div>
            <div>T-SPIN: <span style="color: #9999ff; font-weight: bold;">${tSpinTotal}</span></div>
            
            <div style="grid-column: span 2; border-top: 1px dashed #666; padding-top: 8px; margin-top: 4px;"></div>
            <div style="grid-column: span 2;">BOMB BONUS: <span style="color: #ff5555; font-weight: bold;">+${gameStats.bombBonus}</span></div>
            <div style="grid-column: span 2;">PERFECT (NO BOMB): <span style="color: #ff5555; font-weight: bold;">+${gameStats.perfectBonus}</span></div>
        </div>
    `;
}

// 【updateLevelAndSpeed 関数の修正】
function updateLevelAndSpeed() {
    level = Math.floor(linesCleared / 12) + 1;
    if (level > 12) level = 12;
    
    const speedTable = [1000, 850, 700, 550, 450, 380, 300, 230, 160, 100, 70, 50];
    dropInterval = speedTable[level - 1];
    
    const levelEl = document.getElementById('level');
    if (levelEl) levelEl.innerText = level;
    
    if (linesCleared >= 144) {
        gameOver = true;

        gameStats.bombBonus = bombsRemaining * 15000;
        gameStats.perfectBonus = (bombsRemaining === MAX_BOMBS) ? 50000 : 0;
        score += gameStats.bombBonus + gameStats.perfectBonus;
        
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = score;

        showResultScreen(true); // GAME CLEAR としてリザルト表示
    }
}


function getGhostPosition() {
    if (!player || !player.matrix) return player ? player.pos.y : 0;
    let ghostY = player.pos.y;
    while (!collide(arena, player, {x: 0, y: ghostY - player.pos.y + 1})) {
        ghostY++;
    }
    return ghostY;
}

/**
 * ========================================================================
 * 6. レンダリング・画面描画制御群
 * ========================================================================
 */
function drawBlock(targetCtx, x, y, size, colorIndex, isGhost = false, isPlayer = false) {
    if (colorIndex === 0) return;
    
    const absX = x * size;
    const absY = y * size;
    const color = COLORS[colorIndex];

    // ゴースト（落下予測位置）の描画処理
    if (isGhost) {
        targetCtx.strokeStyle = color;
        targetCtx.lineWidth = 2;
        targetCtx.strokeRect(absX + 2, absY + 2, size - 4, size - 4);
        return;
    }

    // 1. ベースカラーの描画
    targetCtx.fillStyle = color;
    targetCtx.fillRect(absX, absY, size, size);

    // 2. 3Dベベル（立体的なフチ）の描画
    const b = size * 0.15; // フチの太さをブロックサイズに比例させる

    // 上部のハイライト（強い光の反射）
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    targetCtx.beginPath();
    targetCtx.moveTo(absX, absY); targetCtx.lineTo(absX + size, absY);
    targetCtx.lineTo(absX + size - b, absY + b); targetCtx.lineTo(absX + b, absY + b);
    targetCtx.fill();

    // 左部のソフトハイライト
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    targetCtx.beginPath();
    targetCtx.moveTo(absX, absY + size); targetCtx.lineTo(absX, absY);
    targetCtx.lineTo(absX + b, absY + b); targetCtx.lineTo(absX + b, absY + size - b);
    targetCtx.fill();

    // 下部のシャドウ（影）
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    targetCtx.beginPath();
    targetCtx.moveTo(absX + size, absY + size); targetCtx.lineTo(absX, absY + size);
    targetCtx.lineTo(absX + b, absY + size - b); targetCtx.lineTo(absX + size - b, absY + size - b);
    targetCtx.fill();

    // 右部のソフトシャドウ
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    targetCtx.beginPath();
    targetCtx.moveTo(absX + size, absY); targetCtx.lineTo(absX + size, absY + size);
    targetCtx.lineTo(absX + size - b, absY + size - b); targetCtx.lineTo(absX + size - b, absY + b);
    targetCtx.fill();

    // 3. アクア調の光沢（グラス・ハイライト）
    // 表面が透明な樹脂やガラスで覆われているような質感をカーブ描画で合成
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    targetCtx.beginPath();
    targetCtx.moveTo(absX + b, absY + b);
    targetCtx.lineTo(absX + size - b, absY + b);
    targetCtx.lineTo(absX + size - b, absY + size * 0.45);
    // 中央に向かって滑らかな二次ベジェ曲線を引く
    targetCtx.quadraticCurveTo(absX + size / 2, absY + size * 0.65, absX + b, absY + size * 0.45);
    targetCtx.fill();

    // 4. 全体の輪郭線
    targetCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    targetCtx.lineWidth = 1;
    targetCtx.strokeRect(absX, absY, size, size);

    // 5. プレイヤー操作中のアクティブ発光（視認性の向上）
    if (isPlayer) {
        targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        targetCtx.lineWidth = 1.5;
        targetCtx.strokeRect(absX + 1, absY + 1, size - 2, size - 2);
    }
}

function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * BLOCK_SIZE, 0); ctx.lineTo(i * BLOCK_SIZE, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < ROWS; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * BLOCK_SIZE); ctx.lineTo(canvas.width, j * BLOCK_SIZE); ctx.stroke();
    }

    arena.forEach((row, y) => {
        row.forEach((value, x) => { drawBlock(ctx, x, y, BLOCK_SIZE, value); });
    });

    if (lineClearTimer > 0 && linesToClear.length > 0) {
        ctx.fillStyle = '#f0eee0';
        linesToClear.forEach(y => { ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, BLOCK_SIZE); });
    }

    if (!gameOver && player.matrix) {
        const ghostY = getGhostPosition();
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) drawBlock(ctx, x + player.pos.x, y + ghostY, BLOCK_SIZE, value, true);
            });
        });
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) drawBlock(ctx, x + player.pos.x, y + player.pos.y, BLOCK_SIZE, value, false, true);
            });
        });
    }

    areaFlashes.forEach(f => f.update());
    areaFlashes = areaFlashes.filter(f => f.life > 0);
    areaFlashes.forEach(f => f.draw(ctx));

    bombParticles.forEach(p => p.update());
    bombParticles = bombParticles.filter(p => p.life > 0);
    bombParticles.forEach(p => p.draw(ctx));

    floatingTexts.forEach(t => t.draw(ctx));
    drawHold();
    drawNext();
}

function drawHold() {
    holdCtx.fillStyle = '#111';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (holdPiece) {
        const matrix = SHAPES[holdPiece];
        const xOffset = (holdCanvas.width - matrix[0].length * MINI_BLOCK_SIZE) / 2;
        const yOffset = (holdCanvas.height - matrix.length * MINI_BLOCK_SIZE) / 2;
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) drawBlock(holdCtx, x + xOffset / MINI_BLOCK_SIZE, y + yOffset / MINI_BLOCK_SIZE, MINI_BLOCK_SIZE, value);
            });
        });
    }
}

function drawNext() {
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const slotHeight = 80;
    for (let i = 0; i < 6; i++) {
        const type = pieceQueue[i];
        if (!type) continue;
        const matrix = SHAPES[type];
        const xOffset = (nextCanvas.width - matrix[0].length * MINI_BLOCK_SIZE) / 2;
        const yOffset = i * slotHeight + (slotHeight - matrix.length * MINI_BLOCK_SIZE) / 2;
        
        nextCtx.strokeStyle = '#222';
        nextCtx.strokeRect(5, i * slotHeight + 3, nextCanvas.width - 10, slotHeight - 6);

        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) drawBlock(nextCtx, x + xOffset / MINI_BLOCK_SIZE, y + yOffset / MINI_BLOCK_SIZE, MINI_BLOCK_SIZE, value);
            });
        });
    }
}

// ========================================================================
// ■ 爆発エフェクト（パーティクル＆衝撃波）管理
// ========================================================================
// ========================================================================
// ■ 爆発エフェクト（全体閃光＆パーティクル）管理
// ========================================================================
let bombParticles = [];
let areaFlashes = []; // shockwaves から変更

class BombParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 20 + 5; // 爆発の勢いを少し強化
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
        this.color = color;
        this.size = Math.random() * 6 + 2; // 破片を少し大きく
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.90; // 空気抵抗
        this.vy *= 0.90;
        this.vy += 0.4;  // 重力を強めて破片っぽく落とす
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); // 丸から四角い破片に変更してブロック感を出す
        ctx.restore();
    }
}

// 【新規追加】消えた領域全体が激しく発光するクラス
class AreaFlash {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.life = 1.0;
        this.decay = 0.04; // 閃光が消えるスピード
    }
    update() {
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        // 激しいフラッシュを表現するため、不透明度を加算ブレンドっぽくする
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = '#f0eee0'; // 真っ白な閃光
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 追加で青色のオーバーレイ
        ctx.globalAlpha = Math.max(0, this.life * 0.5);
        ctx.fillStyle = '#6677ff';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }
}

/**
 * ========================================================================
 * 7. プラクティス支援機能 & パレットUI制御 & レベル項目動的自動生成
 * ========================================================================
 */
function openMinoSelector() { document.getElementById('minoSelectorModal').style.display = 'flex'; }
function closeMinoSelector() { document.getElementById('minoSelectorModal').style.display = 'none'; }

function toggleFalling() {
    isFallingEnabled = !isFallingEnabled;
    document.getElementById('fallToggleBtn').innerText = isFallingEnabled ? "落下: ON" : "落下: OFF";
    if (!isFallingEnabled) { dropCounter = 0; lockDelayCounter = 0; }
}

function clearField() { arena = createMatrix(COLS, ROWS); floatingTexts = []; draw(); }

function summonMino(key) {
    if (!SHAPES[key]) return;
    player.type = key;
    player.matrix = SHAPES[key].map(row => [...row]);
    player.rotationState = 0;
    
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    
    // 【重要修正】プラクティスの特殊召喚時も安全装置を適用
    applySpawnPushUp();

    player.lastAction = 'none'; 
    player.lastKickIndex = 0;
    lockDelayCounter = 0; 
    lockResetCount = 0;
    closeMinoSelector();
    draw();
}

function buildVisualMinoSelector() {
    // 【動的DOM対応】HTMLファイルをいじらずに自動で「LEVEL」項目をLINESの真下へ差し込む便利システム
    const linesBox = document.getElementById('lines')?.parentElement;
    if (linesBox && !document.getElementById('level')) {
        const levelBox = document.createElement('div');
        levelBox.className = 'panel-box';
        levelBox.style.marginTop = '15px';
        levelBox.innerHTML = `
            <div class="panel-title" style="color: #b7e0ff;">LEVEL</div>
            <div id="level" class="score-display" style="color: #b7e0ff;">1</div>
        `;
        linesBox.parentNode.insertBefore(levelBox, linesBox.nextSibling);
    }

    const tetroKeys = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const tetroGrid = document.getElementById('tetroGrid');
    const pentaGrid = document.getElementById('pentaGrid');

    const generateCards = (keys, container) => {
        if (!container) return;
        container.innerHTML = '';
        keys.forEach(key => {
            const matrix = SHAPES[key];
            const card = document.createElement('div');
            card.className = 'mino-card';
            card.onclick = () => summonMino(key);

            const preview = document.createElement('div');
            preview.className = 'mino-preview';

            matrix.forEach(row => {
                const rowEl = document.createElement('div');
                rowEl.className = 'preview-row';
                row.forEach(val => {
                    const cell = document.createElement('div');
                    cell.className = 'preview-cell';
                    if (val !== 0) {
                        cell.style.backgroundColor = COLORS[val];
                        cell.style.boxShadow = 'inset 1px 1px 2px rgba(255,255,255,0.2)';
                    } else {
                        cell.style.backgroundColor = 'transparent';
                    }
                    rowEl.appendChild(cell);
                });
                preview.appendChild(rowEl);
            });

            const label = document.createElement('div');
            label.className = 'mino-name';
            
            // 辞書に登録されていればその名前を、なければ従来通り '_penta' を削った名前を使う
            let displayName = MINO_DISPLAY_NAMES[key] || key.replace('_penta', '');
            
            label.innerText = `${displayName}`;

            card.appendChild(preview);
            card.appendChild(label);
            container.appendChild(card);
        });
    };
    generateCards(tetroKeys, tetroGrid);
    generateCards(PENTAMINOS, pentaGrid);
}

canvas.addEventListener('mousedown', event => {
    if (currentScene !== 'practice') return;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX - rect.left - parseFloat(getComputedStyle(canvas).borderLeftWidth);
    const clientY = event.clientY - rect.top - parseFloat(getComputedStyle(canvas).borderTopWidth);
    
    const col = Math.floor(clientX / BLOCK_SIZE);
    const row = Math.floor(clientY / BLOCK_SIZE);
    
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        arena[row][col] = (arena[row][col] === 0) ? 26 : 0;
        draw();
    }
});

//ミノ形状図鑑

// ========================================================================
// ■ ペア＆形状図鑑の動的生成（Canvasレンダリング）
// ========================================================================
// ========================================================================
// ■ ペア＆形状図鑑の動的生成（Canvasレンダリング・説明文付き）
// ========================================================================
function buildPairLibrary() {
    const container = document.getElementById('pairLibraryContent');
    if (!container) return;
    container.innerHTML = ''; 

    // クラス名、カラー、説明文、属するミノのペア（配列）をまとめた統合データ
    const LIBRARY_DEF = [
                {
            name: 'Alternative',
            color: '#ff88bb',
            desc: '４ライン消しもできるけど、邪魔になることも多いミノ',
            items: [['I_penta', 'T_penta'], ['Z_penta', 'Z_prime_penta'], ['L_penta', 'L_prime_penta']]
        },
        {
            name: 'Basic',
            color: '#eef0ff',
            desc: 'いつもの使い慣れたテトリスのミノ',
            // Basicは厳密なペアではないため、視覚的に似たものを隣り合わせ、Tは単独にする
            items: [['S'], ['Z'], ['L'], ['J'], ['I'], ['O'], ['T']]
        },
        {
            name: 'Complex',
            color: '#99bbee',
            desc: 'くぼみを埋めやすいミノ',
            items: [['P_penta', 'P_prime_penta'], ['N_penta', 'N_prime_penta']]
        },
        {
            name: 'Distorted',
            color: '#ddee66',
            desc: 'なんかゆがんだ形状のミノ',
            items: [['Y_penta', 'Y_prime_penta'], ['F_penta', 'F_prime_penta']]
        },
        {
            name: 'Exotic',
            color: '#80ccac',
            desc: '特異な形状のミノ',
            items: [['X_penta', 'U_penta'], ['W_penta', 'V_penta']]
        }
    ];

    LIBRARY_DEF.forEach(category => {
        const section = document.createElement('div');
        
        // クラス見出し
        const title = document.createElement('div');
        title.style.color = category.color;
        title.style.fontWeight = 'bold';
        title.style.borderBottom = `1px solid ${category.color}`;
        title.style.marginBottom = '5px';
        title.style.paddingBottom = '3px';
        title.style.fontSize = '14px';
        title.innerText = `■ ${category.name}`;
        section.appendChild(title);

        // クラスの解説文（index.htmlから引っ越してきた部分）
        const desc = document.createElement('div');
        desc.style.color = '#ccc';
        desc.style.fontSize = '11px';
        desc.style.marginBottom = '12px';
        desc.style.lineHeight = '1.5';
        desc.innerText = category.desc;
        section.appendChild(desc);

// 【追加】このカテゴリがすべて単独ブロック（長さ1）か判定する
        const isSingleOnly = category.items.every(pair => pair.length === 1);

        // ペアを並べるグリッド
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        
        // 【修正】単独の場合は4列（ペアの半分の幅）、ペアの場合は2列にする
        grid.style.gridTemplateColumns = isSingleOnly ? 'repeat(4, 1fr)' : '1fr 1fr';
        grid.style.gap = '8px';
        grid.style.marginBottom = '20px'; // セクション間の余白

        category.items.forEach(pair => {
            const pairRow = document.createElement('div');
            pairRow.style.display = 'flex';
            pairRow.style.alignItems = 'center';
            
            // 【修正】space-aroundからcenterに変更し、gapで間隔をあけることで、単独時もペア時も綺麗に中央配置する
            pairRow.style.justifyContent = 'center';
            pairRow.style.gap = '15px'; 
            
            pairRow.style.background = 'rgba(255,255,255,0.05)';
            pairRow.style.padding = '8px 5px';
            pairRow.style.borderRadius = '6px';
            pairRow.style.border = '1px solid #333';

            // キャンバス生成用ローカル関数
            const createCard = (key) => {
                const card = document.createElement('div');
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'center';
                card.style.gap = '5px';

                const shape = SHAPES[key];
                const canvas = document.createElement('canvas');
                const cellSize = 11; // 種類が増えたので少しだけ縮小
                canvas.width = shape[0].length * cellSize;
                canvas.height = shape.length * cellSize;
                const ctx = canvas.getContext('2d');
                
                shape.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val !== 0) drawBlock(ctx, x, y, cellSize, val);
                    });
                });

                const label = document.createElement('div');
                label.style.fontSize = '14px';
                label.style.color = '#ccc';
                label.style.fontWeight = 'bold';
                let displayName = (typeof MINO_DISPLAY_NAMES !== 'undefined' && MINO_DISPLAY_NAMES[key]) 
                                    ? MINO_DISPLAY_NAMES[key] : key.replace('_penta', '');
                label.innerText = displayName;

                card.appendChild(canvas);
                card.appendChild(label);
                return card;
            };

            // ペアの左側（または単独）を追加
            pairRow.appendChild(createCard(pair[0]));
            
            // ペアの右側が存在する場合のみ「↔」と右側を追加
            if (pair.length > 1) {
                const link = document.createElement('div');
                link.innerText = '⇔';
                link.style.color = '#DDFF66';
                link.style.fontSize = '16px';
                pairRow.appendChild(link);
                pairRow.appendChild(createCard(pair[1]));
            }

            grid.appendChild(pairRow);
        });
        
        section.appendChild(grid);
        container.appendChild(section);
    });
}

// 画面の読み込みが終わった瞬間に図鑑の中身を作り上げる
window.addEventListener('DOMContentLoaded', () => {
    buildPairLibrary();
});
