const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const backgroundMusic = new Audio('audio/retromusic.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Set the volume between 0 and 1, adjust as needed
backgroundMusic.play();


// Preload obstacle images
const greenVanImg = new Image();
greenVanImg.src = 'images/greenvan.png';
const blueCarImg = new Image();
blueCarImg.src = 'images/bluecar.png';

const car = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 20,
    height: 29,
    speed: 2,
    color: 'blue',
    rotation: 0,
};

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
};

const timer = {
    time: 0,
    display: function () {
        ctx.fillStyle = 'white';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText('Time: ' + this.time.toFixed(2), 10, 25);
    },
    update: function (dt) {
        this.time += dt;
    },
};

let roadSpeed = 2;
let obstacles = [];
let lastObstacleSpawn = 0;
let gameOver = false;


car.move = function (direction) {
    const driftRotation = Math.PI / 4;
    switch (direction) {
        case 'up':
            this.y -= this.speed;
            break;
        case 'down':
            this.y += this.speed;
            break;
        case 'left':
            if (keys.Space && this.rotation > -driftRotation) {
                this.rotation -= Math.PI / 180;
            }
            this.x -= this.speed;
            break;
        case 'right':
            if (keys.Space && this.rotation < driftRotation) {
                this.rotation += Math.PI / 180;
            }
            this.x += this.speed;
            break;
    }
};

function updateCarRotation() {
    if (!keys.Space) {
        if (car.rotation > 0) {
            car.rotation -= Math.PI / 180;
        } else if (car.rotation < 0) {
            car.rotation += Math.PI / 180;
        }
    }
}

function createObstacle() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const obstacle = {
        side: side,
        x: side === 'left'
            ? Math.random() * (canvas.width / 2 - 100) + 40
            : Math.random() * (canvas.width / 2 - 60) + canvas.width / 2,
        y: side === 'left' ? -20 : canvas.height,
        width: car.width, // Use the same width as the player car
        height: car.height, // Use the same height as the player car
        speed: roadSpeed,
        img: side === 'left' ? greenVanImg : blueCarImg,
    };
    obstacles.push(obstacle);
}

function updateObstacles(dt) {
    const drifting = keys.Space && (keys.ArrowLeft || keys.ArrowRight);
    
    for (let i = 0; i < obstacles.length; i++) {
        const obstacleSpeed = drifting ? obstacles[i].speed / 3 : obstacles[i].speed;
        
        if (obstacles[i].side === 'left') {
            obstacles[i].y += obstacleSpeed * dt;
        } else {
            obstacles[i].y -= obstacleSpeed * dt;
        }

        if (obstacles[i].y > canvas.height || obstacles[i].y < -obstacles[i].height) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

function drawRoadLines() {
    const lineSpacing = 30;
    const lineY = -lineSpacing + (roadSpeed * timer.time) % lineSpacing;

    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;

    for (let y = lineY; y < canvas.height; y += lineSpacing) {
        ctx.moveTo(canvas.width / 2, y);
        ctx.lineTo(canvas.width / 2, y + 20);
    }

    ctx.stroke();
}

function handleInput() {
    if (keys.ArrowUp && car.y > 0) car.move('up');
    if (keys.ArrowDown && car.y < canvas.height - car.height) car.move('down');
    if (keys.ArrowLeft && car.x > 40) car.move('left');
    if (keys.ArrowRight && car.x < canvas.width - car.width - 40) car.move('right');
}

function render() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBorders();
    drawRoadLines();
    drawCar();
    drawObstacles();
    timer.display();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawBorders() {
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, 40, canvas.height);
    ctx.fillRect(canvas.width - 40, 0, 40, canvas.height);
}

function drawCar() {
    const img = new Image();
    img.src = 'images/redsupercar.png';
    ctx.save();
    ctx.translate(car.x + car.width / 2, car.y + car.height / 2);
    ctx.rotate(car.rotation);
    ctx.drawImage(img, -car.width / 2, -car.height / 2, car.width, car.height);
    ctx.restore();
}

function detectCollision(obstacle) {
    return car.x < obstacle.x + obstacle.width &&
        car.x + car.width > obstacle.x &&
        car.y < obstacle.y + obstacle.height &&
        car.y + car.height > obstacle.y;
}

function handleCollisions() {
    obstacles.forEach(obstacle => {
        if (detectCollision(obstacle)) {
            gameOver = true;
        }
    });
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '30px "Press Start 2P"';
    ctx.textAlign = 'center';

    const startY = canvas.height / 2 - 60;
    const lineHeight = 30;
    const gameOverText = [
        'Game Over',
        '',
        'Time: ' + timer.time.toFixed(2),
        '',
        'Click to Restart',
    ];

    gameOverText.forEach((text, index) => {
        ctx.fillText(text, canvas.width / 2, startY + lineHeight * index);
    });
}

function update(dt) {
    timer.update(dt);
    handleCollisions();
    handleInput();
    updateCarRotation();
    updateObstacles(dt);
    roadSpeed += 1 * dt;
}

function renderPausedScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Paused', canvas.width / 2 - 40, canvas.height / 2 - 15);
}

function getSpawnInterval(time) {
    const baseSpawnInterval = 20000;
    const timeConstant = 5;
    const spawnInterval = baseSpawnInterval / (time + timeConstant);

    return spawnInterval;
}

let gameStarted = false;


const backgroundImage = new Image();
backgroundImage.src = 'images/timedrift.png';

function drawStartingScreen() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '35px "Press Start 2P"';
    ctx.textAlign = 'center';

    // Set the title
    const titleY = canvas.height / 2 - 60;
    ctx.fillText('Time Drift', canvas.width / 2, titleY);

    // Set the instructions text to 20px
    ctx.font = '20px "Press Start 2P"';

    const startY = titleY + 40;
    const lineHeight = 20;
    const instructions = [
        'Instructions:',
        'Arrow keys to move',
        'Spacebar to drift (Time Slows)',
        'Escape to pause',
        '',
        'Click to Start',
    ];

    instructions.forEach((text, index) => {
        ctx.fillText(text, canvas.width / 2, startY + lineHeight * index);
    });
}



let lastTime = null;
let paused = false;
let pausedTime = 0;
let lastUnpausedTime = performance.now();


function gameLoop(timestamp) {
    if (gameStarted) {
        if (lastTime === null) {
            lastTime = timestamp;
        }

        if (!paused && !gameOver) {
            const dt = (timestamp - lastTime) / 1000;

            if (timestamp - lastObstacleSpawn > getSpawnInterval(timer.time)) {
                createObstacle();
                lastObstacleSpawn = timestamp;
            }

            update(dt);
            lastTime = timestamp;
        }

        render();

        if (paused) {
            renderPausedScreen();
        } else if (gameOver) {
            drawGameOverScreen();
        }
    } else {
        drawStartingScreen();
    }

    requestAnimationFrame(gameLoop);
}


document.addEventListener('keydown', (event) => {
    if (event.code in keys) {
        keys[event.code] = true;
    }

    if (event.code === 'Escape' && !gameOver) {
        paused = !paused;
        if (paused) {
            pausedTime = performance.now();
        } else {
            lastTime += performance.now() - pausedTime;
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code in keys) {
        keys[event.code] = false;
    }
});


canvas.addEventListener('click', (event) => {
    if (gameOver) {
        gameOver = false;
        timer.time = 0;
        obstacles = [];
        roadSpeed = 2;
        car.x = canvas.width / 2;
        car.y = canvas.height - 50;
        lastTime = null; // Reset the lastTime variable
    } else if (!gameStarted) {
        gameStarted = true;
        backgroundMusic.play(); // Start playing the background music
    } else if (paused) {
        paused = false;
        backgroundMusic.play(); // Resume the background music
    } else {
        paused = true;
        backgroundMusic.pause(); // Pause the background music
    }
});


requestAnimationFrame(gameLoop);
