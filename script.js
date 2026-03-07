let timerInterval;
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const minutesInput = document.getElementById('minutes');
const timerDisplay = document.getElementById('timer');
const bell = document.getElementById('bell');
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

let musicEnabled = true; // Default on

// Toggle music on/off
if (musicToggle) {
    musicToggle.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        musicToggle.textContent = `Music: ${musicEnabled ? 'On' : 'Off'}`;
        if (!musicEnabled && bgMusic) {
            bgMusic.pause();
        } else if (musicEnabled && bgMusic && !startBtn.disabled) {
            bgMusic.play().catch(e => console.log("Music play prevented (likely autoplay policy):", e));
        }
    });
}

// Start button: timer + music
startBtn.addEventListener('click', () => {
    let time = parseInt(minutesInput.value) * 60;
    if (isNaN(time) || time < 60 || time > 3600) {
        alert('Enter 1-60 minutes.');
        return;
    }
    
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Try to play music (user clicked Start, so allowed)
    if (musicEnabled && bgMusic) {
        bgMusic.play().catch(e => {
            console.log("Autoplay blocked - may need another interaction:", e);
            // Optional: alert user if blocked
            // alert("Click again or enable music manually - browser policy.");
        });
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

// Stop button
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

// Pause music when tab is hidden (saves battery)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && bgMusic) {
        bgMusic.pause();
    } else if (!document.hidden && musicEnabled && bgMusic && !startBtn.disabled) {
        bgMusic.play().catch(() => {});
    }
});

// PWA service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker failed:', err));
}
