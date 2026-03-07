let timerInterval;
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
