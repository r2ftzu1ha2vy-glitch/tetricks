// --- CANVASES ---
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
canvas.width = 12 * 20;
canvas.height = 20 * 20;
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
nextCtx.scale(20, 20);

// --- ARENA ---
const arena = createMatrix(12, 20);

// --- PLAYER ---
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    material: 'metal',
    score: 0,
};

let nextPiece = null;
let nextMaterial = null;

const materials = ['metal', 'sand', 'water', 'wood', 'lava'];

// --- COLORS ---
const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];

const colorNames = [
    '',
    'Pink',
    'Cyan',
    'Green',
    'Purple',
    'Orange',
    'Yellow',
    'Blue',
];

const materialColors = {
    metal: '#757575',
    sand: '#ffe0a1',
    water: '#9dbbfa',
    wood: '#967654',
    lava: '#ff9e7a',
    obsidian: '#2e2633',
    stone: '#bab8b8'
};

let lavaTick = 0;
const lavaSpeed = 6; // higher = slower lava

// --- LINE CLEAR ---
let clearingLines = [];
const clearDuration = 200;

// --- MUSIC ---
const music = new Audio('https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/tetricks/main/tetris.mid.mp3');
music.loop = true;
music.volume = 1;

const lineClearSound = new Audio(
  'https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/tetricks/main/universfield-level-up-06-370051.mp3'
);
lineClearSound.volume = 0.6; // adjust as desired

// --- HELPERS ---
function createMatrix(w, h) {
    return Array.from({ length: h }, () => new Array(w).fill(0));
}

function createPiece(type) {
    if (type === 'T') return [[0,0,0],[1,1,1],[0,1,0]];
    if (type === 'O') return [[2,2],[2,2]];
    if (type === 'L') return [[0,3,0],[0,3,0],[0,3,3]];
    if (type === 'J') return [[0,4,0],[0,4,0],[4,4,0]];
    if (type === 'I') return [[0,0,0,0],[5,5,5,5],[0,0,0,0],[0,0,0,0]];
    if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
    if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

function randomPiece() {
    const pieces = 'ILJOTSZ';
    return createPiece(pieces[(Math.random() * pieces.length) | 0]);
}

function randomMaterial() {
    return materials[(Math.random() * materials.length) | 0];
}

function updateMaterialDisplay() {
    const el = document.getElementById('materialName');
    el.innerText = player.material;
    el.style.color = materialColors[player.material] || '#fff';
}

// --- COLLISION ---
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;

    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0) {
                const newY = y + o.y;
                const newX = x + o.x;

                if (
                    newX < 0 || 
                    newX >= arena[0].length || 
                    newY >= arena.length || 
                    (newY >= 0 && arena[newY][newX] !== 0)
                ) return true;
            }
        }
    }
    return false;
}

// --- MERGE ---
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = {
                    value: value,
                    material: player.material
                };
            }
        });
    });
}

function arenaSweep() {
    clearingLines = [];
    let obsidianRows = [];

    for (let y = arena.length - 1; y >= 0; y--) {
        if (arena[y].every(cell => cell?.value)) {
            const allStone = arena[y].every(cell => cell?.material === 'stone');
const allObsidian = arena[y].every(cell => cell?.material === 'obsidian');

if (allObsidian) obsidianRows.push(y);
else if (allStone || arena[y].every(cell => cell?.value)) {
    clearingLines.push({ y, start: performance.now() });
}
        }
    }

    // obsidian needs 2 rows
    if (obsidianRows.length >= 2) {
        obsidianRows.slice(0, 2).forEach(y => {
            arena.splice(y, 1);
            arena.unshift(new Array(arena[0].length).fill(0));
        });
        player.score += 100;
    }

    if (clearingLines.length) {
        lineClearSound.currentTime = 0;
        lineClearSound.play();

        setTimeout(() => {
            clearingLines.forEach(line => {
                arena.splice(line.y, 1);
                arena.unshift(new Array(arena[0].length).fill(0));
            });
            player.score += clearingLines.length * 25;
            updateScore();
            clearingLines = [];
        }, clearDuration);
    }
}

function playerReset() {
    if (!nextPiece) nextPiece = randomPiece();
    player.matrix = nextPiece;
    player.material = nextMaterial || randomMaterial();

    updateMaterialDisplay(); // 👈 ADD THIS

    nextPiece = randomPiece();
    nextMaterial = randomMaterial();
    drawNext();

    player.pos.y = 0;
    player.pos.x =
        ((arena[0].length / 2) | 0) -
        ((player.matrix[0].length / 2) | 0);

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}
// --- BLOCK PLACE SOUND ---
const placeSound = new Audio('https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/tetricks/main/freesound_community-wood-block-105066.mp3');
placeSound.volume = 0.5; // adjust volume if needed

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);

        // play block place sound
        placeSound.currentTime = 0; // restart in case it was still playing
        placeSound.play();

        // 5 points for every block placed
        const blocksPlaced = player.matrix.flat().filter(v => v !== 0).length;
        player.score += blocksPlaced * 5;

        arenaSweep();
        playerReset();
        updateScore();
    }
    dropCounter = 0;
}

function rotate(matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());
}

function rotateCounterClockwise(matrix) {
    rotate(matrix);
    rotate(matrix);
    rotate(matrix);
}

function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);

    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (Math.abs(offset) > player.matrix[0].length) {
            rotateCounterClockwise(player.matrix);
            player.pos.x = pos;
            return;
        }
    }
}

// --- DRAW ---
function drawMatrix(matrix, offset, ctx = context, white = false) {
    matrix.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell !== 0) {
                let color;
                if (white) color = '#fff';
                else if (typeof cell === 'object') color = materialColors[cell.material] || colors[cell.value];
                else color = colors[cell];

                ctx.fillStyle = color;
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // arena border
    context.strokeStyle = '#fff';
    context.lineWidth = 0.1;
    context.strokeRect(0, 0, arena[0].length, arena.length);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);

    // line clear animation
    clearingLines.forEach(line => {
        const progress = (performance.now() - line.start) / clearDuration;
        context.fillStyle = '#fff';
        context.globalAlpha = 1 - progress;
        context.fillRect(0, line.y, arena[0].length, 1);
        context.globalAlpha = 1;
    });
}

// --- NEXT PIECE ---
function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const offset = {
        x: (4 - nextPiece[0].length) / 2,
        y: (4 - nextPiece.length) / 2
    };
    drawMatrix(nextPiece, offset, nextCtx);
    document.getElementById('nextColor').innerText = nextMaterial || '';
}

// --- SCORE ---
function updateScore() {
    document.getElementById('score').innerText = player.score;
}

function applyPhysics() {
    lavaTick++;

    for (let y = arena.length - 2; y >= 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            const cell = arena[y][x];
            if (!cell) continue;
          if (cell.material === 'obsidian' || cell.material === 'stone') continue;

            // ----- SAND / WOOD -----
            if (cell.material === 'sand' || cell.material === 'wood') {
                if (!arena[y+1][x]) {
                    arena[y+1][x] = cell;
                    arena[y][x] = 0;
                }
            }

            // ----- WATER -----
            else if (cell.material === 'water') {
                if (!arena[y+1][x]) {
                    arena[y+1][x] = cell;
                    arena[y][x] = 0;
                } else {
                    if (x > 0 && !arena[y][x-1]) {
                        arena[y][x-1] = cell; arena[y][x] = 0;
                    } else if (x < arena[y].length-1 && !arena[y][x+1]) {
                        arena[y][x+1] = cell; arena[y][x] = 0;
                    }
                }
              
              // WATER touching LAVA -> STONE
if (arena[y+1]?.[x]?.material === 'lava') {
    arena[y+1][x] = {
        value: cell.value,
        material: 'stone'
    };
    arena[y][x] = 0;
    continue;
}

            }

            // ----- LAVA -----
            else if (cell.material === 'lava') {
                if (lavaTick % lavaSpeed !== 0) continue;

                // burn wood
                if (arena[y+1]?.[x]?.material === 'wood') {
                    arena[y+1][x] = 0;
                }

// lava + water = obsidian
if (arena[y+1]?.[x]?.material === 'water') {
    arena[y+1][x] = {
        value: cell.value,
        material: 'obsidian'
    };
    arena[y][x] = 0;
    continue;
}

                // fall
                if (!arena[y+1][x]) {
                    arena[y+1][x] = cell;
                    arena[y][x] = 0;
                } 
                // slow spread
                else {
                    if (x > 0 && !arena[y][x-1]) {
                        arena[y][x-1] = cell; arena[y][x] = 0;
                    } 
                    else if (x < arena[y].length-1 && !arena[y][x+1]) {
                        arena[y][x+1] = cell; arena[y][x] = 0;
                    }
                }
            }
        }
    }
}

// --- TIMING ---
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// --- MENU ---
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
let gameStarted = false;

startBtn.onclick = () => {
    menu.style.display = 'none';
    gameStarted = true;
    playerReset();
    lastTime = performance.now();

    // play music (required user interaction 👍)
    music.currentTime = 0;
    music.play();

    update();
};

// --- GAME LOOP ---
function update(time = 0) {
    if (!gameStarted) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) playerDrop();

    applyPhysics();
    draw();
    requestAnimationFrame(update);
}

// --- INPUT ---
document.addEventListener('keydown', e => {
    if (!gameStarted) return;
    if (e.keyCode === 37) playerMove(-1);
    if (e.keyCode === 39) playerMove(1);
    if (e.keyCode === 40) playerDrop();
    if (e.keyCode === 38) playerRotate();
});

// Buttons support
document.getElementById('left').onclick = () => { if(gameStarted) playerMove(-1); };
document.getElementById('right').onclick = () => { if(gameStarted) playerMove(1); };
document.getElementById('down').onclick = () => { if(gameStarted) playerDrop(); };
document.getElementById('rotate').onclick = () => { if(gameStarted) playerRotate(); };
