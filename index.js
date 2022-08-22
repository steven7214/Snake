var canvas, ctx, drawInterval, x, myMusic, overSound, chompSound, nopress;
const overlay = document.getElementById("overlay");
const openModalButtons = document.querySelectorAll("[data-modal-target]");
const closeModalButtons = document.querySelectorAll("[data-close-button]");
const appleImg = new Image();
appleImg.src = "./public/apple.png";
const rightSnakeImg = new Image();
rightSnakeImg.src = "./public/rightSnake.png";
const leftSnakeImg = new Image();
leftSnakeImg.src = "./public/leftSnake.png";
const upSnakeImg = new Image();
upSnakeImg.src = "./public/upSnake.png";
const downSnakeImg = new Image();
downSnakeImg.src = "./public/downSnake.png";

// game
const gridSize = 22; // gridSize^2 canvas size
var nextX = 0;
var nextY = 0;
const speed = 10;

// snake variables
var defaultTailSize = 3;
var tailSize = defaultTailSize;
var snakeX = (snakeY = gridSize / 2);
const initialSnakeTrail = [
  { x: snakeX - 2, y: snakeY },
  { x: snakeX - 1, y: snakeY },
  { x: snakeX, y: snakeY },
];
var snakeTrail = [...initialSnakeTrail];
let value = document.getElementById("maxScore").textContent.split(" ");
var points = Number.parseInt(value[value.length - 1]);

// apple
var appleX = snakeX + 5;
var appleY = snakeY;

var playing = true;
var before = [0, 0];
var paused = false;
var over = false;
var start = false;

window.onload = function () {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  document.addEventListener("keydown", keyDownEvent);
  document.getElementById("reset").addEventListener("click", wipe);
  // render x times per second
  drawInterval = setInterval(draw, 1000 / speed);
  openModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      let modal = document.querySelector(button.dataset.modalTarget);
      openModal(modal);
      nopress = true;
    });
  });
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      let modal = button.closest(".modal");
      closeModal(modal);
      nopress = false;
    });
  });
  overlay.addEventListener("click", () => {
    if (!over) {
      closeAllModals();
      nopress = false;
    }
  });
  myMusic = new sound("sounds/game_theme.mp3");
  overSound = new sound("sounds/gameover.mov");
  chompSound = new sound("sounds/chomp.mp3");
};

function closeAllModals() {
  let modals = document.querySelectorAll(".modal.active");
  modals.forEach((modalt) => closeModal(modalt));
  resume();
}
function openModal(modal) {
  if (modal == null) {
    console.log("modal not found");
    return;
  }
  // close all open modals before opening modal
  closeAllModals();
  let main = modal.querySelector(".main");
  if (main != null) main.focus();
  modal.classList.add("active");
  overlay.classList.add("active");
}

function closeModal(modal) {
  if (modal == null) {
    console.log("modal not found");
    return;
  }
  if (modal.classList.contains("active")) {
    modal.classList.remove("active");
    overlay.classList.remove("active");
  }
}

function wipe() {
  if (confirm("Are you sure you want to reset your score?")) {
    reset();
    points = 0;
    let maxScore = document.getElementById("maxScore");
    let score = document.getElementById("score");
    score.textContent = `Score: 0`;
    maxScore.textContent = `Max Score: 0`;
    updateDB(0);
  }
}

function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function () {
    this.sound.play();
  };
  this.stop = function () {
    this.sound.pause();
  };
  this.restart = function () {
    this.sound.currentTime = 0;
  };
}

function keyDownEvent(e) {
  if (nopress) {
    return;
  }
  switch (e.keyCode) {
    case 13:
      let modal = document.getElementById("gameover-modal");
      closeModal(modal);
      over = false;
      playing = true;
      break;
    case 32:
      if (over) {
        break;
      }
      if (!paused) {
        pause();
      } else {
        resume();
      }
      break;
    case 37: // left
      start = true;
      if (playing && !(nextX == 1 && nextY == 0)) {
        nextX = -1;
        nextY = 0;
      }
      break;
    case 38: // down
      start = true;
      if (playing && !(nextX == 0 && nextY == 1)) {
        nextX = 0;
        nextY = -1;
      }
      break;
    case 39: // right
      start = true;
      if (playing && !(nextX == -1 && nextY == 0)) {
        nextX = 1;
        nextY = 0;
      }
      break;
    case 40: // up
      start = true;
      if (playing && !(nextX == 0 && nextY == -1)) {
        nextX = 0;
        nextY = 1;
      }
      break;
  }
}

function draw() {
  if (!nextX == 0 || nextY != 0) {
    myMusic.play();
  }
  snakeX += nextX;
  snakeY += nextY;
  // out of bounds
  if (snakeX < 0 || snakeX >= gridSize || snakeY < 0 || snakeY >= gridSize) {
    GameOver();
  }

  // paint background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //orient snake head
  var head;
  if (nextY == 1) {
    head = downSnakeImg;
  } else if (nextY == -1) {
    head = upSnakeImg;
  } else if (nextX == -1) {
    head = leftSnakeImg;
  } else {
    head = rightSnakeImg;
  }

  // paint snake
  ctx.fillStyle = "green";
  // paint snake green except for head
  for (let i = 0; i < snakeTrail.length; i++) {
    if (i == snakeTrail.length - 1) {
      ctx.drawImage(
        head,
        snakeTrail[i].x * gridSize,
        snakeTrail[i].y * gridSize,
        gridSize,
        gridSize
      );
    } else {
      ctx.fillRect(
        snakeTrail[i].x * gridSize,
        snakeTrail[i].y * gridSize,
        gridSize,
        gridSize
      );
    }
    // bites tail
    if (
      snakeTrail[i].x == snakeX &&
      snakeTrail[i].y == snakeY &&
      tailSize != defaultTailSize
    ) {
      GameOver();
    }
  }
  if (start) {
    //set snake trail
    snakeTrail.push({ x: snakeX, y: snakeY });
    while (snakeTrail.length > tailSize) {
      snakeTrail.shift();
    }
  }

  // bit apple
  if (snakeX == appleX && snakeY == appleY) {
    chompSound.play();
    tailSize++;
    appleX = Math.floor(Math.random() * gridSize);
    appleY = Math.floor(Math.random() * gridSize);
    while (true) {
      for (let i = 0; i < snakeTrail.length; i++) {
        if (appleX == snakeTrail[i].x && appleY == snakeTrail[i].y) {
          appleX = Math.floor(Math.random() * gridSize);
          appleY = Math.floor(Math.random() * gridSize);
          break;
        }
      }
      break;
    }
  }

  // paint apple
  ctx.fillStyle = "red";
  // ctx.fillRect(appleX * gridSize, appleY * gridSize, gridSize, gridSize);
  ctx.drawImage(
    appleImg,
    appleX * gridSize,
    appleY * gridSize,
    gridSize,
    gridSize
  );

  let score = document.getElementById("score");
  score.textContent = `Score: ${tailSize - 3}`;
}

function updateDB(s) {
  let profile = document.getElementById("profile");
  if (profile) {
    let username = profile.textContent.split(" ");
    username = username[username.length - 1];
    $.post("/update", { username: username, score: s });
  }
}

function GameOver() {
  myMusic.stop();
  myMusic.restart();
  overSound.play();
  let modal = document.getElementById("gameover-modal");
  openModal(modal);
  let body = document.getElementById("gameover-modal-body");
  body.style.whiteSpace = "pre";
  if (tailSize - 3 > points) {
    body.textContent =
      `HIGH SCORE: ${tailSize - 3}!` +
      "\r\n" +
      "\r\n" +
      "press Enter to play again";
    updateDB(tailSize - 3);
  } else {
    body.textContent = `GAME OVER! SCORE: ${
      tailSize - 3
    } \r\n \r\n press Enter to play again`;
  }
  reset();
  playing = false;
  over = true;
}

function reset() {
  if (tailSize - 3 > points) {
    points = tailSize - 3;
    let maxScore = document.getElementById("maxScore");
    maxScore.textContent = `High Score: ${points}`;
  }
  tailSize = defaultTailSize;
  nextX = nextY = 0;
  snakeX = snakeY = gridSize / 2;
  appleX = snakeX + 5;
  appleY = snakeY;
  snakeTrail = [...initialSnakeTrail];
  paused = false;
  start = false;
}

function pause() {
  if (start) {
    clearInterval(drawInterval);
    let modal = document.getElementById("pause-modal");
    openModal(modal);
    paused = true;
    myMusic.stop();
    playing = false;
    overlay.classList.add("active");
  }
}

function resume() {
  if (paused) {
    let modal = document.getElementById("pause-modal");
    closeModal(modal);
    drawInterval = setInterval(draw, 1000 / speed);
    playing = true;
    paused = false;
    if (start) {
      myMusic.play();
    }
  }
}
