// ゲーム定数
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 1;
const FALL_SPEED = 1000; // ミリ秒

// テトロミノの形状定義
const TETROMINOS = {
    I: {
        shapes: [
            [[1, 1, 1, 1]],
            [[1], [1], [1], [1]]
        ],
        color: 'type-I'
    },
    O: {
        shapes: [
            [[1, 1], [1, 1]]
        ],
        color: 'type-O'
    },
    T: {
        shapes: [
            [[0, 1, 0], [1, 1, 1]],
            [[1, 0], [1, 1], [1, 0]],
            [[1, 1, 1], [0, 1, 0]],
            [[0, 1], [1, 1], [0, 1]]
        ],
        color: 'type-T'
    },
    S: {
        shapes: [
            [[0, 1, 1], [1, 1, 0]],
            [[1, 0], [1, 1], [0, 1]]
        ],
        color: 'type-S'
    },
    Z: {
        shapes: [
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1], [1, 1], [1, 0]]
        ],
        color: 'type-Z'
    },
    J: {
        shapes: [
            [[1, 0, 0], [1, 1, 1]],
            [[1, 1], [1, 0], [1, 0]],
            [[1, 1, 1], [0, 0, 1]],
            [[0, 1], [0, 1], [1, 1]]
        ],
        color: 'type-J'
    },
    L: {
        shapes: [
            [[0, 0, 1], [1, 1, 1]],
            [[1, 0], [1, 0], [1, 1]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 1], [0, 1], [0, 1]]
        ],
        color: 'type-L'
    }
};

class TetrisGame {
    constructor() {
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.fallSpeed = FALL_SPEED;
        this.fallTimer = null;

        this.setupDOM();
        this.setupEventListeners();
        this.nextPiece = this.createNewPiece();
        this.drawBoard();
        this.drawNextPreview();
    }

    createBoard() {
        return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    }

    setupDOM() {
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreDisplay = document.getElementById('score');
        this.levelDisplay = document.getElementById('level');
        this.linesDisplay = document.getElementById('lines');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.nextCanvas = document.getElementById('nextPreview');
        this.gameOverModal = document.getElementById('gameOver');
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.finalLinesDisplay = document.getElementById('finalLines');
        this.restartBtn = document.getElementById('restartBtn');

        // ゲームボードのブロックを作成
        for (let i = 0; i < BOARD_HEIGHT * BOARD_WIDTH; i++) {
            const block = document.createElement('div');
            block.className = 'block empty';
            block.id = `block-${i}`;
            this.gameBoard.appendChild(block);
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'z':
            case 'Z':
                e.preventDefault();
                this.rotatePiece(-1);
                break;
            case 'x':
            case 'X':
                e.preventDefault();
                this.rotatePiece(1);
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
        }
    }

    createNewPiece() {
        const types = Object.keys(TETROMINOS);
        const type = types[Math.floor(Math.random() * types.length)];
        const tetromino = TETROMINOS[type];
        return {
            type,
            shape: tetromino.shapes[0],
            shapeIndex: 0,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            color: tetromino.color
        };
    }

    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createNewPiece();
        this.drawNextPreview();

        // ゲーム開始時にピースが既に配置されている場合はゲームオーバー
        if (!this.canPlacePiece(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.endGame();
            return;
        }

        this.scheduleFall();
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;
        this.pauseBtn.textContent = this.gamePaused ? '再開' : '一時停止';
        if (!this.gamePaused) {
            this.scheduleFall();
        } else {
            clearTimeout(this.fallTimer);
        }
    }

    scheduleFall() {
        clearTimeout(this.fallTimer);
        this.fallTimer = setTimeout(() => {
            if (this.gameRunning && !this.gamePaused) {
                this.fall();
            }
        }, this.fallSpeed);
    }

    fall() {
        if (this.canPlacePiece(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
        } else {
            this.lockPiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.createNewPiece();
            this.drawNextPreview();

            if (!this.canPlacePiece(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
                this.endGame();
                return;
            }
        }

        this.drawBoard();
        this.scheduleFall();
    }

    movePiece(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;

        if (this.canPlacePiece(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.drawBoard();
        }
    }

    rotatePiece(direction) {
        const tetromino = TETROMINOS[this.currentPiece.type];
        const currentIndex = this.currentPiece.shapeIndex;
        const newIndex = (currentIndex + (direction > 0 ? 1 : -1) + tetromino.shapes.length) % tetromino.shapes.length;
        const newShape = tetromino.shapes[newIndex];

        if (this.canPlacePiece(this.currentPiece.x, this.currentPiece.y, newShape)) {
            this.currentPiece.shape = newShape;
            this.currentPiece.shapeIndex = newIndex;
            this.drawBoard();
        }
    }

    hardDrop() {
        while (this.canPlacePiece(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
        }
        this.drawBoard();
    }

    canPlacePiece(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 0) continue;

                const boardX = x + col;
                const boardY = y + row;

                // 境界チェック
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY < 0 || boardY >= BOARD_HEIGHT) {
                    if (boardY < 0) continue; // 上部のみ許可
                    if (boardY >= BOARD_HEIGHT) return false;
                    return false;
                }

                // 衝突チェック
                if (this.board[boardY][boardX] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    lockPiece() {
        const shape = this.currentPiece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 0) continue;

                const boardY = this.currentPiece.y + row;
                const boardX = this.currentPiece.x + col;

                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    this.board[boardY][boardX] = this.currentPiece.color;
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            this.addScore(linesCleared);
        }
    }

    addScore(linesCleared) {
        const scoreTable = {
            1: 100,
            2: 300,
            3: 500,
            4: 800
        };

        this.score += scoreTable[linesCleared] || 0;
        this.lines += linesCleared;

        // レベルアップ判定
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.fallSpeed = Math.max(100, FALL_SPEED - (this.level - 1) * 50);
        }

        this.updateDisplay();
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.linesDisplay.textContent = this.lines;
    }

    drawBoard() {
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                const block = document.getElementById(`block-${row * BOARD_WIDTH + col}`);
                const blockValue = this.board[row][col];

                if (blockValue === 0) {
                    block.className = 'block empty';
                } else {
                    block.className = `block placed ${blockValue}`;
                }
            }
        }

        // 現在のピースを描画
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
    }

    drawPiece(piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col] === 0) continue;

                const boardY = piece.y + row;
                const boardX = piece.x + col;

                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    const block = document.getElementById(`block-${boardY * BOARD_WIDTH + boardX}`);
                    block.className = `block placed ${piece.color}`;
                }
            }
        }
    }

    drawNextPreview() {
        const ctx = this.nextCanvas.getContext('2d');
        const blockSize = 30;
        const padding = 10;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const shape = this.nextPiece.shape;
        const colors = {
            'type-I': '#00f0f0',
            'type-O': '#f0f000',
            'type-T': '#a000f0',
            'type-S': '#00f000',
            'type-Z': '#f00000',
            'type-J': '#0000f0',
            'type-L': '#f0a000'
        };

        ctx.fillStyle = colors[this.nextPiece.color] || '#fff';

        let offsetX = padding;
        let offsetY = padding;

        // テトロミノをセンタリング
        const width = shape[0].length;
        const height = shape.length;
        offsetX = (this.nextCanvas.width - width * blockSize) / 2;
        offsetY = (this.nextCanvas.height - height * blockSize) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 0) continue;

                const x = offsetX + col * blockSize;
                const y = offsetY + row * blockSize;

                ctx.fillRect(x, y, blockSize - 2, blockSize - 2);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, blockSize - 2, blockSize - 2);
            }
        }
    }

    endGame() {
        this.gameRunning = false;
        clearTimeout(this.fallTimer);
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '一時停止';

        this.finalScoreDisplay.textContent = this.score;
        this.finalLinesDisplay.textContent = this.lines;
        this.gameOverModal.style.display = 'flex';
    }

    restartGame() {
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.fallSpeed = FALL_SPEED;

        this.gameOverModal.style.display = 'none';
        this.nextPiece = this.createNewPiece();
        this.updateDisplay();
        this.drawBoard();
        this.drawNextPreview();
        this.startGame();
    }
}

// ゲーム初期化
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new TetrisGame();
});
