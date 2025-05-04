//sessao_de_foco JS
document.addEventListener('DOMContentLoaded', function() {
  // Elementos da UI
  const startBtn = document.getElementById('start-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const timeDisplay = document.getElementById('clock-circle');
  const taskTimeDisplay = document.querySelector('.time-invested span');
  const timeSelect = document.getElementById('tempo-select');
  const taskButtons = document.querySelectorAll('.btn-task');
  
  // Variáveis de estado
  let timer;
  let isRunning = false;
  let timeInvested = 0;
  let selectedTime = parseInt(timeSelect.value);
  let currentTask = 'Matemática';
  let remainingTime = selectedTime * 60; // Em segundos

  // Atualiza o display do tempo
  function updateTimeDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Atualiza o tempo investido na tarefa
  function updateTaskTime() {
    taskTimeDisplay.textContent = timeInvested;
    // Salva no localStorage
    localStorage.setItem(`timeInvested_${currentTask}`, timeInvested);
  }

  // Carrega o tempo investido salvo
  function loadTaskTime() {
    const savedTime = localStorage.getItem(`timeInvested_${currentTask}`);
    if (savedTime) {
      timeInvested = parseInt(savedTime);
      updateTaskTime();
    }
  }

  // Inicia o timer
  function startTimer() {
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
      if (remainingTime > 0) {
        remainingTime--;
        updateTimeDisplay();
      } else {
        completeSession();
      }
    }, 1000);
    
    isRunning = true;
    startBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
    startBtn.classList.add('pulse');
    setTimeout(() => startBtn.classList.remove('pulse'), 1000);
  }

  // Pausa o timer
  function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
  }

  // Reseta o timer
  function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    selectedTime = parseInt(timeSelect.value);
    remainingTime = selectedTime * 60;
    updateTimeDisplay();
    startBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
  }

  // Completa a sessão
  function completeSession() {
    clearInterval(timer);
    timeInvested += selectedTime;
    updateTaskTime();
    
    // Notificação visual
    timeDisplay.classList.add('pulse');
    setTimeout(() => timeDisplay.classList.remove('pulse'), 2000);
    
    // Reset automático após conclusão
    setTimeout(resetTimer, 2000);
  }

  // Event Listeners
  startBtn.addEventListener('click', function() {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  cancelBtn.addEventListener('click', resetTimer);

  timeSelect.addEventListener('change', function() {
    if (!isRunning) {
      selectedTime = parseInt(this.value);
      remainingTime = selectedTime * 60;
      updateTimeDisplay();
    }
  });

  taskButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      taskButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentTask = this.getAttribute('data-task');
      loadTaskTime();
    });
  });

  // Atualiza o ano no footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  // Inicialização
  updateTimeDisplay();
  loadTaskTime();
});
