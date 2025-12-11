const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

const gravity = 0.5;

// Player
const player = {
    x: 50,
    y: 250,
    width: 48,
    height: 48,
    color: 'red',
    dx: 0,
    dy: 0,
    jumping: false,
    texture: new Image(),
    frameIndex: 0,
    animationSpeed: 12,
    frameCount: 4,
    frameTimer: 0,
    direction: 0
};

player.texture.src = 'player_spritesheet.png';

// Platform and obstacle
let platforms = [
    { x: 0, y: 350, width: 800, height: 50, color: 'green' }, // Ground
    { x: 200, y: 250, width: 150, height: 20, color: 'brown' }, //Platform
    { x: 500, y: 200, width: 100, height: 20, color: 'brown' }, //Platform
];

let obstacles = []; // all obstacles

let offsetX = 0; // how far player went
let platformSpawnX = 800; // where next platform
let groundExtendX = 800; // width of ground

let score = 0;
let gameOverFlag = false;
let gameLoopId;

// help function
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowRight' && !gameOverFlag) {
        player.dx = 5;
        player.direction = 1;
    } else if (e.code === 'ArrowLeft' && !gameOverFlag) {
        player.dx = -5;
        player.direction = -1;
    } else if (e.code === 'Space' && !player.jumping && !gameOverFlag) {
        player.dy = -12;
        player.jumping = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        player.dx = 0;
        player.direction = 0;
    }
});

function drawPlayer() {
    const spriteWidth = player.texture.width / 4;
    const spriteHeight = player.texture.height / 4;

    let row = 0;
    let frameOffset = 0;

    if (player.jumping || player.dy > 0) {
        row = 1;
        frameOffset = 2;
    } else if (player.dx !== 0) {
        row = player.direction === 1 ? 3 : 2;
        frameOffset = 2;
    } else {
        row = 0;
        frameOffset = 0;
    }

    player.frameTimer++;
    if (player.frameTimer >= player.animationSpeed) {
        player.frameIndex = (player.frameIndex + 1) % 2;
        player.frameTimer = 0;
    }

    const frame = player.frameIndex + frameOffset;

    ctx.save();
    ctx.drawImage(
        player.texture,
        frame * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight,
        player.x, player.y, player.width, player.height
    );
    ctx.restore();
}

// Dynamic platform generation
function generateNewPlatform() {
    let y;
    const groundHeight = platforms[0].height;
    const groundTopY = platforms[0].y;

    do {
        y = Math.random() * 200 + 150; // Random y
    } while (y + 20 > groundTopY && y < groundTopY + groundHeight); //doesn't overlap the green ground

    const width = Math.random() * 100 + 50; // Random width
    const x = platformSpawnX; // Spawn offscreen to the right
    const color = 'brown';
    platforms.push({ x, y, width, height: 20, color });

    platformSpawnX += Math.random() * 150 + 100; // Random horizontal spacing
}

// Dynamic obstacle generation
function generateNewObstacle() {
    let y;
    const groundHeight = platforms[0].height;
    const groundTopY = platforms[0].y;

    do {
        y = Math.random() * 200 + 150; // Random y
    } while (y + 20 > groundTopY && y < groundTopY + groundHeight); //doesn't overlap the green ground

    const width = Math.random() * 50 + 30;
    const x = platformSpawnX; // Spawn offscreen to the right
    const color = 'black';

    // Check for overlap with existing platforms
    let overlap = false;
    for (let platform of platforms) {
        if (
            x < platform.x + platform.width &&
            x + width > platform.x &&
            y < platform.y + platform.height &&
            y + 20 > platform.y
        ) {
            overlap = true;
            break;
        }
    }

    if (!overlap) {
        obstacles.push({ x, y, width, height: 20, color });
        platformSpawnX += Math.random() * 100 + 50; // adjusts the spacing
    }
}

// Check for collisions with obstacles
function checkForObstaclesCollision() {
    obstacles.forEach(obstacle => {
        const playerRight = player.x + player.width - 5;
        const playerLeft = player.x + 5;
        const playerBottom = player.y + player.height - 16;
        const playerTop = player.y;

        // Obstacle boundaries
        const obstacleTop = obstacle.y;
        const obstacleBottom = obstacle.y + obstacle.height;
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacle.width;

        if (
            playerRight > obstacleLeft &&
            playerLeft < obstacleRight &&
            playerBottom > obstacleTop &&
            playerTop < obstacleBottom
        ) {
            gameOver();
        }
    });
}

// Death
function gameOver() {
    gameOverFlag = true;
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over. Continue?', canvas.width / 2 - 240, canvas.height / 2 - 40);
    
    // continue yes no
    ctx.fillStyle = 'green';
    ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2, 100, 40);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Yes', canvas.width / 2 - 120, canvas.height / 2 + 30);
    
    ctx.fillStyle = 'red';
    ctx.fillRect(canvas.width / 2 + 50, canvas.height / 2, 100, 40);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('No', canvas.width / 2 + 80, canvas.height / 2 + 30);

    canvas.addEventListener('click', restartOrExit);
}

function restartOrExit(event) {
    const x = event.offsetX;
    const y = event.offsetY;

    // yes
    if (x >= canvas.width / 2 - 150 && x <= canvas.width / 2 - 50 &&
        y >= canvas.height / 2 && y <= canvas.height / 2 + 40) {
        startGame(); // Restart the game
    }
    
    // no
    if (x >= canvas.width / 2 + 50 && x <= canvas.width / 2 + 150 &&
        y >= canvas.height / 2 && y <= canvas.height / 2 + 40) {
        window.close(); // Exit the game (closes the page)
    }
}

function startGame() {
    gameOverFlag = false;
    player.x = 50;
    player.y = 250;
    player.dx = 0;
    player.dy = 0;
    player.jumping = false;
    platforms = [
        { x: 0, y: 350, width: 800, height: 50, color: 'green' },
        { x: 200, y: 250, width: 150, height: 20, color: 'brown' },
        { x: 500, y: 200, width: 100, height: 20, color: 'brown' },
    ];
    obstacles = [];
    offsetX = 0;
    platformSpawnX = 800;
    groundExtendX = 800;
    score = 0; // Reset score to 0
    
    // Restart the game loop
    gameLoop();
}

function displayScore() {
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + Math.floor(score), canvas.width - 150, 30);
}

function gameLoop() {
    if (gameOverFlag) return; // If the game is over, stop the game loop

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only scroll to the right
    if (player.x > canvas.width / 2) {
        const scrollSpeed = player.dx;
        if (scrollSpeed > 0) {
            offsetX += scrollSpeed;
            player.x -= scrollSpeed;

            platforms.forEach(platform => platform.x -= scrollSpeed);
            obstacles.forEach(obstacle => obstacle.x -= scrollSpeed);

            // Generate new platforms and obstacles
            while (platformSpawnX < offsetX + canvas.width) {
                generateNewPlatform();
                if (Math.random() < 2) generateNewObstacle();
            }

            // Extend the green ground dynamically
            if (groundExtendX < offsetX + canvas.width) {
                groundExtendX += 800;
                platforms[0].width = groundExtendX;
            }
        }
    }

    // Prevent player from moving left beyond the boundary
    if (player.x < 0) {
        player.x = 0;
    }

    // movement
    player.dy += gravity;
    player.x += player.dx;
    player.y += player.dy;

    // Prevent the player from falling off the screen
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.jumping = false;
    }

    // Collision detection
    const collisionBox = {
        top: player.y + 5,
        bottom: player.y + player.height - 5,
        left: player.x + 10,
        right: player.x + player.width - 10,
    };

    platforms.forEach(platform => {
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.height;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;

        const collisionHeightOffset = 16;
        const playerBottom = player.y + player.height - collisionHeightOffset;
        const playerTop = player.y;
        const playerLeft = player.x + 5;
        const playerRight = player.x + player.width - 5;

        if (
            playerRight > platformLeft &&
            playerLeft < platformRight &&
            playerBottom > platformTop &&
            playerTop < platformBottom
        ) {
            if (player.dy > 0 && playerBottom - player.dy <= platformTop) {
                player.y = platformTop - player.height + collisionHeightOffset;
                player.dy = 0;
                player.jumping = false;
            }
        }
    });

    platforms = platforms.filter(platform => platform.x + platform.width > 0);
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

    platforms.forEach(platform => {
        if (platform.x + platform.width > 0 && platform.x < canvas.width) {
            drawRect(platform.x, platform.y, platform.width, platform.height, platform.color);
        }
    });

    obstacles.forEach(obstacle => {
        if (obstacle.x + obstacle.width > 0 && obstacle.x < canvas.width) {
            drawRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
        }
    });

    drawPlayer();
    checkForObstaclesCollision();

    score = offsetX / 10; // Increase score based on distance (every 10 pixels)

    displayScore();

    gameLoopId = requestAnimationFrame(gameLoop);
}

gameLoop();
