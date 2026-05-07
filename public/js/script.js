console.log("Mock Test App Running");

// Timer Function
let time = 1800;

function startTimer() {

    const timer = document.getElementById('timer');

    if (!timer) return;

    setInterval(() => {

        let minutes = Math.floor(time / 60);
        let seconds = time % 60;

        seconds = seconds < 10 ? '0' + seconds : seconds;

        timer.innerHTML = `${minutes}:${seconds}`;

        if (time > 0) {
            time--;
        }

    }, 1000);
}

startTimer();