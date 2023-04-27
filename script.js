// Grab the game canvas and set up the 2D context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set up the background music and play it on a loop
const backgroundMusic = new Audio('audio/retromusic.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Set the volume between 0 and 1, adjust as needed
backgroundMusic.play();


// Preload obstacle images
const greenVanImg = new Image();
greenVanImg.src = 'images/greenvan.png';
const blueCarImg = new Image();
blueCarImg.src = 'images/bluecar.png';

// Define the player car object
const car = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 20,
    height: 29,
    speed: 2,
    color: 'blue',
    rotation: 0,
};

// Set up an object to track the state of the keys being pressed
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
};

// Create a timer object to keep track of the elapsed time and display it on the canvas
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

// Set up some variables to control the game state, obstacles, and road speed
let roadSpeed = 100;
let obstacles = [];
let lastObstacleSpawn = 0;
let gameOver = false;

// Define the car's movement method based on the direction passed as an argument
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

// Update car's rotation based on the keys pressed
function updateCarRotation() {
    if (!keys.Space) {
        if (car.rotation > 0) {
            car.rotation -= Math.PI / 180;
        } else if (car.rotation < 0) {
            car.rotation += Math.PI / 180;
        }
    }
}

// Create a new obstacle object with random 
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

// Update the position of obstacles based on their speed and the time drift effect
function updateObstacles(dt) {
    const drifting = keys.Space && (keys.ArrowLeft || keys.ArrowRight);
    
    for (let i = 0; i < obstacles.length; i++) {
        const obstacleSpeed = drifting ? obstacles[i].speed / 3 : obstacles[i].speed;
        
        if (obstacles[i].side === 'left') {
            obstacles[i].y += obstacleSpeed * dt;
        } else {
            obstacles[i].y -= obstacleSpeed * dt;
        }
        // Remove the obstacle from the array if it moves off the canvas
        if (obstacles[i].y > canvas.height || obstacles[i].y < -obstacles[i].height) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// Draw the yellow road lines on the canvas
function drawRoadLines() {
    const lineSpacing = 30;
    const lineY = -lineSpacing + (roadSpeed * timer.time) % lineSpacing;

    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    // Loop through the canvas height and draw the road lines at specified intervals
    for (let y = lineY; y < canvas.height; y += lineSpacing) {
        ctx.moveTo(canvas.width / 2, y);
        ctx.lineTo(canvas.width / 2, y + 20);
    }

    ctx.stroke();
}

// Handle player input based on the keys being pressed and move the car accordingly
function handleInput() {
    if (keys.ArrowUp && car.y > 0) car.move('up');
    if (keys.ArrowDown && car.y < canvas.height - car.height) car.move('down');
    if (keys.ArrowLeft && car.x > 40) car.move('left');
    if (keys.ArrowRight && car.x < canvas.width - car.width - 40) car.move('right');
}

// Render the game elements on the canvas
function render() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBorders();
    drawRoadLines();
    drawCar();
    drawObstacles();
    timer.display();
}

// Draw the obstacles on the canvas
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// Draw the gray borders on the canvas
function drawBorders() {
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, 40, canvas.height);
    ctx.fillRect(canvas.width - 40, 0, 40, canvas.height);
}

// Draw the player car on the canvas with its current rotation
function drawCar() {
    const img = new Image();
    img.src = 'images/redsupercar.png';
    ctx.save();
    ctx.translate(car.x + car.width / 2, car.y + car.height / 2);
    ctx.rotate(car.rotation);
    ctx.drawImage(img, -car.width / 2, -car.height / 2, car.width, car.height);
    ctx.restore();
}

// Check for collisions between the player car and obstacles
function detectCollision(obstacle) {
    return car.x < obstacle.x + obstacle.width &&
        car.x + car.width > obstacle.x &&
        car.y < obstacle.y + obstacle.height &&
        car.y + car.height > obstacle.y;
}

// Handle collisions by setting the game over state to true
function handleCollisions() {
    obstacles.forEach(obstacle => {
        if (detectCollision(obstacle)) {
            gameOver = true;
        }
    });
}

// Draw Game Over Screen with score and option to restart
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

// Updates various components
function update(dt) {
    timer.update(dt);
    handleCollisions();
    handleInput();
    updateCarRotation();
    updateObstacles(dt);
    roadSpeed += 1 * dt;
}

// Renders Pause Screen by overlaying pause
function renderPausedScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Paused', canvas.width / 2 - 40, canvas.height / 2 - 15);
}

// Determines Spawn Interval for obstacles
function getSpawnInterval(time) {
    const baseSpawnInterval = 20000;
    const timeConstant = 5;
    const spawnInterval = baseSpawnInterval / (time + timeConstant);

    return spawnInterval;
}

// Set initial game state
let gameStarted = false;

// Add game state for instructions page
let instructionsPage = false;


// Load the background image for the starting screen
const backgroundImage = new Image();
backgroundImage.src = 'images/timedrift.png';

// Draw the instructions screen
function drawInstructionsScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';

    const startY = canvas.height / 4;
    const lineHeight = 25;
    const instructions = [
        'Instructions:',
        'Arrow keys to move',
        'Spacebar to time drift',
        'Escape to pause',
        '',
        'Drifting:',
        'Slows obstacle speed by 3x',
        'Must be moving left or right to drift',
    ];

    instructions.forEach((text, index) => {
        ctx.strokeText(text, canvas.width / 2, startY + lineHeight * index);
        ctx.fillText(text, canvas.width / 2, startY + lineHeight * index);
    });

    // Draw the Back button
    drawButton('Back', canvas.width / 2, canvas.height - 50);
}

// Draw the starting screen with Play and Instructions buttons
function drawStartingScreen() {
    // Draw the background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Set text properties for the title
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.font = '35px "Press Start 2P"';
    ctx.textAlign = 'center';

    // Draw the title
    const titleY = canvas.height / 2 - 60;
    ctx.strokeText('Time Drift', canvas.width / 2, titleY);
    ctx.fillText('Time Drift', canvas.width / 2, titleY);

    // Draw the Play and Instructions buttons
    drawButton('Play', canvas.width / 2, titleY + 50);
    drawButton('Instructions', canvas.width / 2, titleY + 100);
}

// Draw a button with specified text and position
function drawButton(text, x, y) {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
}

// Check if the click event is within the boundaries of a button
function isClickInsideButton(event, x, y, width, height) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    return (
        clickX >= x - width / 2 &&
        clickX <= x + width / 2 &&
        clickY >= y - height / 2 &&
        clickY <= y + height / 2
    );
}

// Game loop variables
let lastTime = null;
let paused = false;
let pausedTime = 0;
let lastUnpausedTime = performance.now();

// Main game loop function
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
    } else if (instructionsPage) {
        drawInstructionsScreen();
    } else {
        drawStartingScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Event listeners for keydown and keyup events
document.addEventListener('keydown', (event) => {
    if (event.code in keys) {
        keys[event.code] = true;
    }

    // Toggle pause state if the Escape key is pressed and the game is not over
    if (event.code === 'Escape' && !gameOver) {
        paused = !paused;
        if (paused) {
            pausedTime = performance.now();
        } else {
            lastTime += performance.now() - pausedTime;
        }
    }
    // Prevent arrow keys from scrolling the page
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
    }
});


// Event listener for keyup events to update the 'keys' object
document.addEventListener('keyup', (event) => {
    // If the released key is in the 'keys' object, set its value to false
    if (event.code in keys) {
        keys[event.code] = false;
    }
});

// Event listener for click events on the canvas
canvas.addEventListener('click', (event) => {
    if (gameOver) {
        // Reset game state and variables if the game is over
        gameOver = false;
        timer.time = 0;
        obstacles = [];
        roadSpeed = 100;
        car.x = canvas.width / 2;
        car.y = canvas.height - 50;
        lastTime = null;
    } else if (!gameStarted && !instructionsPage) {
        // Check if the Play button is clicked
        if (
            isClickInsideButton(
                event,
                canvas.width / 2,
                canvas.height / 2 - 10,
                100,
                30
            )
        ) {
            gameStarted = true;
            backgroundMusic.play();
        }
        // Check if the Instructions button is clicked
        else if (
            isClickInsideButton(
                event,
                canvas.width / 2,
                canvas.height / 2 + 40,
                200,
                30
            )
        ) {
            instructionsPage = true;
        }
    } else if (instructionsPage) {
        // Check if the Back button is clicked
        if (
            isClickInsideButton(
                event,
                canvas.width / 2,
                canvas.height - 50,
                100,
                30
            )
        ) {
            instructionsPage = false;
        }
    }
});

// Start the game loop by requesting the first animation frame
requestAnimationFrame(gameLoop);
