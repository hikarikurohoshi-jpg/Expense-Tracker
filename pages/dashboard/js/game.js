/*
      Expense Tetris — Fully self-contained game
      - Canvas rendering
      - Arrow key controls (left/right/down)
      - Falling category blocks, must land in matching column
      - Difficulty scaling, sounds, local highscore
      - Basic overflow animation and penalties
      - Mobile touch buttons
    */

(() => {
  // --- Configuration ---
  const CONFIG = {
    canvasWidth: 800,
    canvasHeight: 500,
    columns: [
      { key: "Food", emoji: "🍽️", color: "#FF6A00" },
      { key: "Transport", emoji: "🚌", color: "#008A1A" },
      { key: "Bills", emoji: "🧾", color: "#D10000" },
      { key: "Entertainment", emoji: "🎮", color: "#4A24FF" },
      { key: "Savings", emoji: "💰", color: "#003EBB" },
    ],
    spawnIntervalBase: 1600,
    spawnIntervalMin: 600,
    fallSpeedBase: 70,
    fallSpeedIncPerLevel: 12,
    levelUpScore: 120,
    maxActiveBlocks: 5,
    lives: 3,
  };

  // State
  const state = {
    running: false,
    paused: false,
    lastTime: 0,
    activeBlocks: [],
    spawnTimer: 0,
    spawnInterval: CONFIG.spawnIntervalBase,
    fallSpeed: CONFIG.fallSpeedBase,
    score: 0,
    level: 1,
    lives: CONFIG.lives,
    highScore: 0,
  };

  // DOM
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const livesDisplay = document.getElementById("livesDisplay");
  const levelDisplay = document.getElementById("levelDisplay");
  const highScoreDisplay = document.getElementById("highScoreDisplay");
  const difficultyLabel = document.getElementById("difficultyLabel");
  const overflowEl = document.getElementById("overflow");
  const legend = document.getElementById("legend");
  const columnsList = document.getElementById("columnsList");

  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const downBtn = document.getElementById("downBtn");

  function resizeCanvasToDisplay() {
    canvas.width = CONFIG.canvasWidth;
    canvas.height = CONFIG.canvasHeight;
  }
  resizeCanvasToDisplay();

  function renderLegend() {
    legend.innerHTML = "";
    if (columnsList) columnsList.remove();
    const colTitle = document.querySelector(".panel h3:last-child");
    if (colTitle && colTitle.textContent.includes("Budget Columns"))
      colTitle.remove();

    CONFIG.columns.forEach((c) => {
      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML = `
        <div class="dot" style="background:${c.color}"></div>
        <div>${c.emoji} ${c.key}</div>
      `;
      legend.appendChild(item);
    });
  }
  renderLegend();

  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function sfxBeep(freq = 880, length = 0.06, vol = 0.04) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + length);
  }
  function sfxThud() {
    sfxBeep(200, 0.08, 0.06);
  }
  function sfxWin() {
    sfxBeep(1200, 0.08, 0.06);
  }

  function loadHighScore() {
    const raw = localStorage.getItem("fynix_expense_tetris_hs");
    if (raw) {
      try {
        state.highScore = Number(raw) || 0;
      } catch (e) {
        state.highScore = 0;
      }
    }
    highScoreDisplay.textContent = state.highScore || "—";
  }
  function saveHighScore() {
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem("fynix_expense_tetris_hs", String(state.highScore));
      highScoreDisplay.textContent = state.highScore;
    }
  }
  loadHighScore();

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pickCategory() {
    const idx = randInt(0, CONFIG.columns.length - 1);
    return { ...CONFIG.columns[idx], colIndex: idx };
  }

  function createBlock() {
    const cat = pickCategory();
    const colIndex = randInt(0, CONFIG.columns.length - 1);
    const colWidth = canvas.width / CONFIG.columns.length;
    const x = colIndex * colWidth + colWidth / 2;

    return {
      id: Math.random().toString(36).slice(2, 9),
      x,
      y: -40,
      vx: 0,
      vy: 0,
      width: Math.min(120, colWidth * 0.86),
      height: 44,
      targetColumn: cat.colIndex,
      category: cat,
      currentColumn: colIndex,
      landed: false,
      dropSpeedMultiplier: 1,
    };
  }

  function spawnBlock() {
    if (state.activeBlocks.length >= CONFIG.maxActiveBlocks) return;
    state.activeBlocks.push(createBlock());
  }

  function getPlayerBlock() {
    return state.activeBlocks
      .filter((b) => !b.landed)
      .sort((a, b) => b.y - a.y)[0];
  }

  function movePlayerBlock(dir) {
    const b = getPlayerBlock();
    if (!b) return;

    const colCount = CONFIG.columns.length;
    if (dir === "left") b.currentColumn = Math.max(0, b.currentColumn - 1);
    if (dir === "right")
      b.currentColumn = Math.min(colCount - 1, b.currentColumn + 1);
    if (dir === "down") b.dropSpeedMultiplier = 4;

    const colWidth = canvas.width / colCount;
    b.x = b.currentColumn * colWidth + colWidth / 2;
  }

  function checkLanding(b) {
    const groundY = canvas.height - 80;
    if (b.y + b.height / 2 >= groundY) {
      b.landed = true;

      if (b.currentColumn === b.targetColumn) {
        state.score += 10 + Math.floor(5 * state.level);
        sfxWin();
      } else {
        state.lives -= 1;
        state.score = Math.max(0, state.score - 8);
        sfxThud();
        showOverflow();
      }

      setTimeout(() => {
        const i = state.activeBlocks.findIndex((x) => x.id === b.id);
        if (i !== -1) state.activeBlocks.splice(i, 1);
      }, 420);
    }
  }

  let overflowTimeout = null;
  function showOverflow() {
    overflowEl.classList.add("show");
    clearTimeout(overflowTimeout);
    overflowTimeout = setTimeout(() => {
      overflowEl.classList.remove("show");
    }, 900);
  }

  function updateDifficulty() {
    state.level = Math.floor(1 + state.score / CONFIG.levelUpScore);
    state.spawnInterval = Math.max(
      CONFIG.spawnIntervalMin,
      CONFIG.spawnIntervalBase - (state.level - 1) * 130
    );
    state.fallSpeed =
      CONFIG.fallSpeedBase + (state.level - 1) * CONFIG.fallSpeedIncPerLevel;

    if (state.level < 2) difficultyLabel.textContent = "Normal";
    else if (state.level < 4) difficultyLabel.textContent = "Hard";
    else difficultyLabel.textContent = "Insane";
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colCount = CONFIG.columns.length;
    const colW = canvas.width / colCount;

    // Columns
    for (let i = 0; i < colCount; i++) {
      const c = CONFIG.columns[i];

      ctx.fillStyle = hexToRgba(c.color, 0.1);
      ctx.fillRect(i * colW, 0, colW, canvas.height);

      // Column title
      ctx.fillStyle = "#000"; // ✅ black text
      ctx.font = "14px Inter";
      ctx.textAlign = "center";
      ctx.fillText(`${c.emoji} ${c.key}`, i * colW + colW / 2, 28);

      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo((i + 1) * colW, 0);
      ctx.lineTo((i + 1) * colW, canvas.height);
      ctx.stroke();
    }

    // Ground
    const groundY = canvas.height - 80;
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, groundY, canvas.width, 80);

    for (let i = 0; i < colCount; i++) {
      const x = i * colW + 10;
      const w = colW - 20;

      ctx.fillStyle = hexToRgba(CONFIG.columns[i].color, 0.18);
      roundedRect(ctx, x, groundY + 8, w, 56, 10);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.stroke();

      ctx.fillStyle = "#000"; // ✅ black text
      ctx.font = "13px Inter";
      ctx.textAlign = "left";
      ctx.fillText(` ${CONFIG.columns[i].key}`, x + 10, groundY + 40);
    }

    // Blocks
    for (const b of state.activeBlocks) drawBlock(b);
  }

  function drawBlock(b) {
    ctx.save();
    const w = b.width;
    const h = b.height;
    const left = b.x - w / 2;
    const top = b.y - h / 2;

    // block color
    ctx.fillStyle = hexToRgba(b.category.color, 0.3);
    roundRect(ctx, left, top, w, h, 8);
    ctx.fill();

    ctx.strokeStyle = hexToRgba("#000000", 0.2);
    ctx.lineWidth = 1;
    ctx.stroke();

    // ✅ black text
    ctx.fillStyle = "#000";
    ctx.font = "18px Inter";
    ctx.textAlign = "left";
    ctx.fillText(
      `${b.category.emoji} ${b.category.key}`,
      left + 10,
      top + h / 2 + 6
    );

    ctx.restore();
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function roundRect(ctx, x, y, w, h, r) {
    roundedRect(ctx, x, y, w, h, r);
  }

  function hexToRgba(hex, alpha = 1) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function update(dt) {
    if (!state.running || state.paused) return;

    state.spawnTimer += dt * 1000;
    if (state.spawnTimer >= state.spawnInterval) {
      spawnBlock();
      state.spawnTimer = 0;
    }

    for (const b of state.activeBlocks) {
      b.vy = state.fallSpeed * b.dropSpeedMultiplier;
      b.y += b.vy * dt;

      const targetX =
        b.currentColumn * (canvas.width / CONFIG.columns.length) +
        canvas.width / CONFIG.columns.length / 2;

      b.x += (targetX - b.x) * Math.min(1, 8 * dt);

      if (!b.landed) checkLanding(b);
    }

    scoreDisplay.textContent = state.score;
    livesDisplay.textContent = state.lives;
    levelDisplay.textContent = state.level;

    state.activeBlocks = state.activeBlocks.filter(
      (b) => b.y < canvas.height + 200
    );

    updateDifficulty();

    if (state.lives <= 0) gameOver();
  }

  function gameOver() {
    state.running = false;
    saveHighScore();
    setTimeout(() => alert(`Game Over — Score: ${state.score}`), 60);
  }

  function loop(time) {
    if (!state.lastTime) state.lastTime = time;
    const dt = Math.min(0.05, (time - state.lastTime) / 1000);
    state.lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    if (!state.running) return;
    if (e.key === "ArrowLeft") movePlayerBlock("left");
    if (e.key === "ArrowRight") movePlayerBlock("right");
    if (e.key === "ArrowDown" || e.key === " ") movePlayerBlock("down");
  });

  if (leftBtn) leftBtn.addEventListener("click", () => movePlayerBlock("left"));
  if (rightBtn)
    rightBtn.addEventListener("click", () => movePlayerBlock("right"));
  if (downBtn) downBtn.addEventListener("click", () => movePlayerBlock("down"));

  startBtn.addEventListener("click", () => {
    ensureAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

    if (!state.running) startGame();
    else if (confirm("Restart current game?")) restartGame();
  });

  pauseBtn.addEventListener("click", () => {
    if (!state.running) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  });

  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset highscore and current game?")) return;
    localStorage.removeItem("fynix_expense_tetris_hs");
    state.highScore = 0;
    restartGame(true);
  });

  function startGame() {
    state.running = true;
    state.paused = false;
    state.lastTime = 0;
    state.activeBlocks = [];
    state.spawnTimer = 0;
    state.spawnInterval = CONFIG.spawnIntervalBase;
    state.fallSpeed = CONFIG.fallSpeedBase;
    state.score = 0;
    state.level = 1;
    state.lives = CONFIG.lives;
    loadHighScore();
    spawnBlock();
    requestAnimationFrame(loop);
  }

  function restartGame(fullResetHighscore = false) {
    state.running = false;
    if (fullResetHighscore) {
      localStorage.removeItem("fynix_expense_tetris_hs");
      state.highScore = 0;
    }
    setTimeout(() => startGame(), 120);
  }

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowDown" || e.key === " ") {
      const b = getPlayerBlock();
      if (b) b.dropSpeedMultiplier = 1;
    }
  });

  document.addEventListener(
    "click",
    function once() {
      ensureAudio();
      if (audioCtx && audioCtx.state === "suspended") {
        try {
          audioCtx.resume();
        } catch {}
      }
      document.removeEventListener("click", once);
    },
    { once: true }
  );

  window.addEventListener("resize", () => {});

  loadHighScore();
})();
