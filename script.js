document.addEventListener('DOMContentLoaded', () => {
  // Page Elements
  const page1 = document.getElementById('page-1');
  const page2 = document.getElementById('page-2');
  const page3 = document.getElementById('page-3');

  // Navigation Buttons
  const btnToPage2 = document.getElementById('btn-to-page-2');
  const btnToPage3 = document.getElementById('btn-to-page-3');
  const btnRestart = document.getElementById('btn-restart');

  // Audio Elements
  const audio1 = document.getElementById('audio-page1');
  const audio2 = document.getElementById('audio-page2');
  const audio3 = document.getElementById('audio-page3');
  const musicToggle = document.getElementById('music-toggle');

  let currentAudio = null;
  let isMuted = false;

  // Cake & Voice Elements
  const blowBtn = document.getElementById('blow-btn');
  const flame = document.getElementById('flame');
  const smoke = document.getElementById('smoke');
  const wishMessage = document.getElementById('wish-message');
  const voiceHint = document.getElementById('voice-hint');

  // ==========================================
  // SMART AUDIO SWITCHER & VOLUME CONTROLS
  // ==========================================
  function switchMusic(targetAudio, targetVolume = 1.0) {
    if (currentAudio && currentAudio !== targetAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = targetAudio;
    currentAudio.volume = targetVolume;

    if (!isMuted && currentAudio) {
      currentAudio.play().catch(err => {
        console.log("Autoplay waiting for user gesture:", err);
      });
    }
  }

  // 1. Full-volume playback on Page 1 on first touch/click
  function startPage1Music() {
    if (!currentAudio) {
      switchMusic(audio1, 1.0); // Page 1 plays at 100% full volume
    }
    window.removeEventListener('click', startPage1Music);
    window.removeEventListener('touchstart', startPage1Music);
  }
  window.addEventListener('click', startPage1Music);
  window.addEventListener('touchstart', startPage1Music);

  // Mute / Unmute Button
  musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;

    if (isMuted) {
      if (currentAudio) currentAudio.pause();
      musicToggle.innerHTML = '🔇 <span>Muted</span>';
    } else {
      if (currentAudio) currentAudio.play();
      musicToggle.innerHTML = '🎵 <span>Sound On</span>';
    }
  });

  // ==========================================
  // PAGE TRANSITIONS WITH AUDIO DUCKING
  // ==========================================
  function showPage(activePage) {
    page1.classList.remove('active');
    page2.classList.remove('active');
    page3.classList.remove('active');

    activePage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Page 1 -> Page 2: Keep Song 2 low (15%) until candle is blown out
  btnToPage2.addEventListener('click', (e) => {
    e.stopPropagation();
    showPage(page2);

    // DUCK VOLUME TO 0.15: Background music won't drown out the microphone
    switchMusic(audio2, 0.15);

    initScratchCards();
    setTimeout(initVoiceRecognition, 500);
  });

  // Page 2 -> Page 3: Transition to Gallery with Song 3 at full volume
  btnToPage3.addEventListener('click', () => {
    stopVoiceRecognition();
    showPage(page3);
    switchMusic(audio3, 1.0);
  });

  // Page 3 -> Restart to Page 1
  btnRestart.addEventListener('click', () => {
    candleBlown = false;
    flame.style.opacity = '1';
    smoke.style.display = 'none';
    blowBtn.style.display = 'inline-block';
    wishMessage.classList.add('hidden');

    if (voiceHint) {
      voiceHint.style.display = 'inline-block';
      voiceHint.innerHTML = '🎤 Say: <span class="highlight-word">"I love you"</span> 🎂';
    }

    showPage(page1);
    switchMusic(audio1, 1.0);
  });

  // ==========================================
  // CANDLE BLOWING & VOLUME CELEBRATION SWELL
  // ==========================================
  let candleBlown = false;

  blowBtn.addEventListener('click', blowCandle);
  flame.addEventListener('click', blowCandle);

  function blowCandle() {
    if (candleBlown) return;
    candleBlown = true;

    // Extinguish Flame & show smoke
    flame.style.opacity = '0';
    smoke.style.display = 'block';
    blowBtn.style.display = 'none';
    wishMessage.classList.remove('hidden');

    // CELEBRATION SWELL: Smoothly raise Song 2 volume from 0.15 up to 1.0 (full blast)
    let currentVol = audio2.volume;
    const fadeTimer = setInterval(() => {
      if (currentVol < 0.95) {
        currentVol += 0.05;
        audio2.volume = Math.min(currentVol, 1.0);
      } else {
        audio2.volume = 1.0;
        clearInterval(fadeTimer);
      }
    }, 60);

    launchConfetti();
  }

  // ==========================================
  // "I LOVE YOU" VOICE RECOGNITION (CLEAN & ACCURATE)
  // ==========================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  const LOVE_TRIGGERS = [
    "i love you",
    "i love u",
    "love you",
    "love u",
    "i luv you",
    "i luv u",
    "luv you",
    "luv u",
    "love",
    "i love",
    "আই লাভ ইউ"
  ];

  function initVoiceRecognition() {
    if (!SpeechRecognition) {
      if (voiceHint) {
        voiceHint.innerHTML = "💡 Tap the flame or button to blow!";
      }
      return;
    }

    try {
      if (recognition) {
        try { recognition.abort(); } catch (e) {}
      }

      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        if (candleBlown) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          // Strip punctuation and normalize string
          const rawSpoken = event.results[i][0].transcript;
          const cleanSpoken = rawSpoken.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, "").trim();

          // Live feedback preview
          if (voiceHint && !candleBlown) {
            voiceHint.innerHTML = `🎤 Heard: "<i>${cleanSpoken}</i>"...`;
          }

          // Check for trigger matches
          const directMatch = LOVE_TRIGGERS.some(trigger => cleanSpoken.includes(trigger));
          const flexibleMatch = cleanSpoken.includes("love") && (cleanSpoken.includes("you") || cleanSpoken.includes("u"));

          if (directMatch || flexibleMatch) {
            if (voiceHint) {
              voiceHint.innerHTML = '❤️ Love received! Blowing candles... ✨';
            }
            blowCandle();
            stopVoiceRecognition();
            break;
          }
        }
      };

      recognition.onerror = (err) => {
        console.log("Mic noise / status:", err.error);
      };

      recognition.onend = () => {
        // Safe restart delay prevents browser audio channel collisions
        if (!candleBlown && page2.classList.contains("active")) {
          setTimeout(() => {
            if (!candleBlown && page2.classList.contains("active")) {
              try { recognition.start(); } catch (e) {}
            }
          }, 300);
        }
      };

      recognition.start();
    } catch (e) {
      console.log("Speech recognition startup error:", e);
    }
  }

  function stopVoiceRecognition() {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    if (voiceHint) {
      setTimeout(() => {
        voiceHint.style.display = 'none';
      }, 1500);
    }
  }

  // ==========================================
  // MAGIC SPARKLE & HEART TRAIL CANVAS
  // ==========================================
  const trailCanvas = document.getElementById("trail-canvas");
  const tCtx = trailCanvas.getContext("2d");

  function resizeTrailCanvas() {
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
  }
  resizeTrailCanvas();
  window.addEventListener("resize", resizeTrailCanvas);

  const trailParticles = [];
  const particleSymbols = ["♥", "✦", "★", "💖", "✨"];
  const particleColors = ["#ff4081", "#ffd54f", "#e040fb", "#64ffda", "#ff80ab"];

  function addParticle(x, y) {
    trailParticles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      symbol: particleSymbols[Math.floor(Math.random() * particleSymbols.length)],
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      size: Math.random() * 12 + 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * -1.8 - 0.6,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }

  window.addEventListener("mousemove", (e) => {
    addParticle(e.clientX, e.clientY);
  });

  window.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches[0]) {
      addParticle(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  function animateTrail() {
    tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        trailParticles.splice(i, 1);
        continue;
      }

      tCtx.save();
      tCtx.globalAlpha = p.alpha;
      tCtx.font = `${p.size}px serif`;
      tCtx.fillStyle = p.color;
      tCtx.shadowColor = p.color;
      tCtx.shadowBlur = 8;
      tCtx.fillText(p.symbol, p.x, p.y);
      tCtx.restore();
    }

    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  // ==========================================
  // 3 SCRATCH VOUCHER CARDS (DESKTOP & TOUCH)
  // ==========================================
  let scratchInitialized = false;

  function initScratchCards() {
    if (scratchInitialized) return;
    scratchInitialized = true;

    const cards = [
      { id: 'voucher-1', label: 'Scratch for Voucher 1 ✨' },
      { id: 'voucher-2', label: 'Scratch for Voucher 2 🎁' },
      { id: 'voucher-3', label: 'Scratch for Voucher 3 🌟' },
    ];

    cards.forEach(card => setupScratchCanvas(card.id, card.label));
  }

  function setupScratchCanvas(canvasId, text) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    // Metallic silver coating
    ctx.fillStyle = '#b0b5bc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    grad.addColorStop(1, 'rgba(255,255,255,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Label on foil
    ctx.font = '600 15px Poppins, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 5);

    function scratch(e) {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouse handlers
    canvas.addEventListener('mousedown', () => isDrawing = true);
    window.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);

    // Mobile touch handlers
    canvas.addEventListener('touchstart', (e) => {
      isDrawing = true;
      scratch(e);
    }, { passive: true });
    window.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('touchmove', scratch, { passive: true });
  }

  // ==========================================
  // CONFETTI CANNON SYSTEM
  // ==========================================
  function launchConfetti() {
    const cCanvas = document.getElementById('confetti-canvas');
    const cCtx = cCanvas.getContext('2d');
    cCanvas.width = window.innerWidth;
    cCanvas.height = window.innerHeight;

    const confettiParticles = [];
    const colors = ['#ff416c', '#ff4b2b', '#ffeb3b', '#48dbfb', '#1dd1a1', '#f368e0'];

    for (let i = 0; i < 140; i++) {
      confettiParticles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 8
      });
    }

    let frames = 0;
    function renderConfetti() {
      cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.rotation += p.rSpeed;

        cCtx.save();
        cCtx.translate(p.x, p.y);
        cCtx.rotate((p.rotation * Math.PI) / 180);
        cCtx.fillStyle = p.color;
        cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        cCtx.restore();
      });

      frames++;
      if (frames < 200) {
        requestAnimationFrame(renderConfetti);
      } else {
        cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      }
    }
    renderConfetti();
  }
});