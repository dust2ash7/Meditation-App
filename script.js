let timerInterval;
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const minutesInput = document.getElementById('minutes');
const timerDisplay = document.getElementById('timer');
const bell = document.getElementById('bell');
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

let musicEnabled = true;  // Default on

// Toggle music on/off
if (musicToggle) {
    musicToggle.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        musicToggle.textContent = `Music: ${musicEnabled ? 'On' : 'Off'}`;
        if (!musicEnabled) {
            bgMusic.pause();
        } else if (!startBtn.disabled) {  // Only attempt play if timer is active
            bgMusic.play().catch(e => console.log("Music play prevented:", e));
        }
    });
}

// Start button: Start timer + music
startBtn.addEventListener('click', () => {
    let time = parseInt(minutesInput ? minutesInput.value : 10) * 60;  // Fallback to 10 min
    if (isNaN(time) || time < 60 || time > 3600) {
        alert('Enter 1-60 minutes.');
        return;
    }
    
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Start background music if enabled (user interaction allows it)
    if (musicEnabled && bgMusic) {
        bgMusic.play().catch(e => console.log("Autoplay blocked:", e));
    }

    timerInterval = setInterval(() => {
        time--;
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (time <= 0) {
            clearInterval(timerInterval);
            if (bell) bell.play();
            if (bgMusic) bgMusic.pause();
            resetButtons();
        }
    }, 1000);
});

// Stop button: Stop timer + music
stopBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    if (bgMusic) bgMusic.pause();
    resetButtons();
    timerDisplay.textContent = 'Stopped';
});

function resetButtons() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// Pause/resume music on tab visibility change (battery + UX)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (bgMusic) bgMusic.pause();
    } else if (musicEnabled && bgMusic && !startBtn.disabled) {
        bgMusic.play().catch(() => {});
    }
});

// Register service worker for PWA (only once)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.log('Service Worker registration failed', err));
}
