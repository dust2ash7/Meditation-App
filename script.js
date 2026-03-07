let timerInterval;
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const minutesInput = document.getElementById('minutes');  // If you have this; if not, adjust logic
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
        } else if (!startBtn.disabled) {  // Only play if timer is running
            bgMusic.play().catch(e => console.log("Music play prevented:", e));
        }
    });
}

// Start button: Start timer + music
startBtn.addEventListener('click', () => {
    let time = parseInt(minutesInput ? minutesInput.value : 10) * 60;  // Fallback to 10 min if no input
    if (time < 60 || time > 3600) return alert('Enter 1-60 minutes.');
    
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Start background music if enabled
    if (musicEnabled) {
        bgMusic.play().catch(e => console.log("Autoplay blocked, user interaction needed:", e));
    }

    timerInterval = setInterval(() => {
        time--;
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (time <= 0) {
            clearInterval(timerInterval);
            bell.play();
            bgMusic.pause();  // Stop music at end
            resetButtons();
        }
    }, 1000);
});

// Stop button: Stop timer + music
stopBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    bgMusic.pause();
    resetButtons();
    timerDisplay.textContent = 'Stopped';
});

function resetButtons() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// Optional: Pause music if page hidden (helps battery)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        bgMusic.pause();
    } else if (musicEnabled && !startBtn.disabled) {
        bgMusic.play().catch(() => {});
    }
});let timerInterval;
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const minutesInput = document.getElementById('minutes');
const timerDisplay = document.getElementById('timer');
const bell = document.getElementById('bell');

startBtn.addEventListener('click', () => {
    let time = parseInt(minutesInput.value) * 60;
    if (time < 60 || time > 3600) return alert('Enter 1-60 minutes.');
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    timerInterval = setInterval(() => {
        time--;
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (time <= 0) {
            clearInterval(timerInterval);
            bell.play();
            resetButtons();
        }
    }, 1000);
});

stopBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    resetButtons();
    timerDisplay.textContent = 'Stopped';
});

function resetButtons() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}
