document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("start-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const timeDisplay = document.getElementById("clock-circle");
    const taskTimeDisplay = document.querySelector(".time-invested span");
    const timeSelect = document.getElementById("tempo-select");
    const taskListDiv = document.querySelector(".task-list");

    let timer;
    let isRunning = false;
    let selectedTime = 25;
    let currentTaskName = null;
    let currentTaskId = null;
    let remainingTime = selectedTime * 60;
    
    // Variáveis para modo automático
    let timerMode = 'manual';
    let isFocusTime = true;
    let autoSettings = {
        focusDuration: 25,
        breakDuration: 5,
        usePomodoroRatio: false
    };
    let sessionCount = 0;
    const pomodoroRatio = 1/5;

    // Gera as opções de tempo (15-240 minutos)
    function generateTimeOptions() {
        timeSelect.innerHTML = '';
        for (let i = 15; i <= 240; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} minutos${i === 25 ? ' (Pomodoro)' : ''}`;
            timeSelect.appendChild(option);
        }
        timeSelect.value = 25; // Valor padrão
    }

    // Valida as configurações de tempo no modo automático
    function validateTimeSettings() {
        const focusTime = parseInt(document.getElementById('focus-time').value);
        const breakTime = parseInt(document.getElementById('break-time').value);
        const validationMessage = document.getElementById('time-validation-message');
        
        // Verifica se o tempo de foco é pelo menos 3x o tempo de pausa
        if (focusTime / breakTime < 3) {
            validationMessage.style.display = 'block';
            return false;
        } else {
            validationMessage.style.display = 'none';
            return true;
        }
    }

    // Inicializa os controles de modo
    function initModeControls() {
        const modeRadios = document.querySelectorAll('input[name="timerMode"]');
        const autoSettingsDiv = document.getElementById('auto-settings');
        const manualTimeOptions = document.getElementById('manual-time-options');
        const focusTimeInput = document.getElementById('focus-time');
        const breakTimeInput = document.getElementById('break-time');
        const pomodoroRatioCheckbox = document.getElementById('use-pomodoro-ratio');

        // Mostra/oculta seções conforme o modo selecionado
        modeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                timerMode = radio.value;
                autoSettingsDiv.style.display = timerMode === 'auto' ? 'block' : 'none';
                manualTimeOptions.style.display = timerMode === 'manual' ? 'block' : 'none';
                resetTimer();
            });
        });

        // Validação em tempo real dos tempos de foco
        focusTimeInput.addEventListener('input', () => {
            let value = parseInt(focusTimeInput.value);
            if (isNaN(value) || value < 15) value = 15;
            if (value > 240) value = 240;
            focusTimeInput.value = value;
            autoSettings.focusDuration = value;
            
            if (autoSettings.usePomodoroRatio) {
                const newBreak = Math.max(5, Math.min(30, Math.round(value * pomodoroRatio)));
                breakTimeInput.value = newBreak;
                autoSettings.breakDuration = newBreak;
            }
            
            validateTimeSettings();
        });

        // Validação em tempo real dos tempos de pausa
        breakTimeInput.addEventListener('input', () => {
            let value = parseInt(breakTimeInput.value);
            if (isNaN(value) || value < 5) value = 5;
            if (value > 30) value = 30;
            breakTimeInput.value = value;
            autoSettings.breakDuration = value;
            
            validateTimeSettings();
        });

        // Atualiza o tempo de pausa quando a proporção Pomodoro é ativada
        pomodoroRatioCheckbox.addEventListener('change', () => {
            autoSettings.usePomodoroRatio = pomodoroRatioCheckbox.checked;
            if (autoSettings.usePomodoroRatio) {
                const newBreak = Math.max(5, Math.min(30, Math.round(autoSettings.focusDuration * pomodoroRatio)));
                breakTimeInput.value = newBreak;
                autoSettings.breakDuration = newBreak;
                validateTimeSettings();
            }
        });

        // Configuração inicial
        autoSettingsDiv.style.display = 'none';
        manualTimeOptions.style.display = 'block';
    }

    // Carrega e exibe as tarefas disponíveis
    function loadAndDisplayTasks() {
        if (!taskListDiv) return;
        taskListDiv.innerHTML = "";
        try {
            const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
            const allTasks = Object.values(studyTasks).flat().filter(task => !task.done);

            if (allTasks.length === 0) {
                taskListDiv.innerHTML = "<p>Nenhuma tarefa pendente encontrada. Adicione tarefas na página de Tarefas.</p>";
                if(startBtn) startBtn.disabled = true;
                return;
            }
            if(startBtn) startBtn.disabled = false;

            allTasks.forEach((task, index) => {
                const button = document.createElement("button");
                button.className = "btn-task";
                button.setAttribute("data-task-name", task.title);
                button.setAttribute("data-task-id", task.id);
                button.innerHTML = `<i class=\"fas fa-book-reader\"></i> ${task.title}`;
                
                button.addEventListener("click", function () {
                    document.querySelectorAll(".btn-task").forEach(btn => {
                        btn.classList.remove("active");
                        btn.setAttribute("aria-pressed", "false");
                    });
                    this.classList.add("active");
                    this.setAttribute("aria-pressed", "true");
                    currentTaskName = this.getAttribute("data-task-name");
                    currentTaskId = this.getAttribute("data-task-id");
                    loadTimeInvestedForTask(currentTaskName);
                });
                taskListDiv.appendChild(button);
                if (index === 0) {
                    button.click();
                }
            });
        } catch (e) {
            console.error("Erro ao carregar tarefas para sessão de foco:", e);
            taskListDiv.innerHTML = "<p>Erro ao carregar tarefas.</p>";
        }
    }

    // Carrega o tempo investido em uma tarefa específica
    function loadTimeInvestedForTask(taskName) {
        if (!taskTimeDisplay) return;
        let totalMinutesForTask = 0;
        try {
            const focusSessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
            focusSessions.forEach(session => {
                if (session.task === taskName && session.durationMinutes) {
                    totalMinutesForTask += session.durationMinutes;
                }
            });
            taskTimeDisplay.textContent = totalMinutesForTask;
        } catch (e) {
            console.error("Erro ao carregar tempo investido para tarefa:", e);
            taskTimeDisplay.textContent = "0";
        }
    }

    // Inicia o timer no modo manual
    function startManualMode() {
        startBtn.innerHTML = "<i class=\"fas fa-pause\"></i> Pausar";
        
        timer = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateTimerDisplay();
            } else {
                completeSession();
            }
        }, 1000);
    }

    // Inicia o timer no modo automático
    function startAutoMode() {
        if (!validateTimeSettings()) {
            alert("Configurações de tempo inválidas. O tempo de foco deve ser pelo menos 3x o tempo de pausa.");
            return;
        }
        
        updateTimerStateDisplay();
        remainingTime = isFocusTime ? autoSettings.focusDuration * 60 : autoSettings.breakDuration * 60;
        updateTimerDisplay();
        
        startBtn.innerHTML = isFocusTime ? 
            "<i class=\"fas fa-pause\"></i> Pausar Timer" : 
            "<i class=\"fas fa-coffee\"></i> Pausa Ativa";

        timer = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateTimerDisplay();
            } else {
                if (isFocusTime) {
                    completeFocusSession();
                } else {
                    completeBreakSession();
                }
            }
        }, 1000);
    }

    // Completa uma sessão de foco no modo automático
    function completeFocusSession() {
        clearInterval(timer);
        sessionCount++;
        
        showNotification(`Tempo de foco concluído!`, `Hora de uma pausa de ${autoSettings.breakDuration} minutos.`);
        
        saveSessionToStorage(autoSettings.focusDuration);
        loadTimeInvestedForTask(currentTaskName);
        
        isFocusTime = false;
        startAutoMode();
    }

    // Completa uma sessão de pausa no modo automático
    function completeBreakSession() {
        clearInterval(timer);
        
        showNotification(`Pausa concluída!`, `Hora de voltar ao foco por ${autoSettings.focusDuration} minutos.`);
        
        isFocusTime = true;
        startAutoMode();
    }

    // Completa uma sessão no modo manual
    function completeSession() {
        clearInterval(timer);
        isRunning = false;
        
        const sessionData = {
            date: new Date().toISOString().split("T")[0],
            durationMinutes: selectedTime,
            task: currentTaskName,
            taskId: currentTaskId
        };

        try {
            let focusSessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
            focusSessions.push(sessionData);
            localStorage.setItem("focusSessions", JSON.stringify(focusSessions));
        } catch (e) {
            console.error("Erro ao salvar sessão de foco:", e);
        }

        loadTimeInvestedForTask(currentTaskName);
        
        showNotification("Sessão de Foco Concluída!", 
            `Você completou uma sessão de ${selectedTime} minutos para a tarefa: ${currentTaskName}`);
        
        resetTimer(); 
    }

    // Salva a sessão no localStorage
    function saveSessionToStorage(duration) {
        const sessionData = {
            date: new Date().toISOString().split("T")[0],
            durationMinutes: duration,
            task: currentTaskName,
            taskId: currentTaskId,
            isFocus: isFocusTime
        };

        try {
            let focusSessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
            focusSessions.push(sessionData);
            localStorage.setItem("focusSessions", JSON.stringify(focusSessions));
        } catch (e) {
            console.error("Erro ao salvar sessão de foco:", e);
        }
    }

    // Atualiza o display do estado do timer (foco/pausa)
    function updateTimerStateDisplay() {
        const stateDisplay = document.createElement('div');
        stateDisplay.className = `timer-state ${isFocusTime ? 'focus' : 'break'}`;
        stateDisplay.innerHTML = isFocusTime ? 
            `<i class="fas fa-brain"></i> Modo Foco (Sessão ${sessionCount + 1})` : 
            `<i class="fas fa-coffee"></i> Modo Pausa`;
        
        const existingState = document.querySelector('.timer-state');
        if (existingState) {
            existingState.replaceWith(stateDisplay);
        } else {
            document.querySelector('.pomodoro-clock').prepend(stateDisplay);
        }
    }

    // Reinicia o timer
    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        
        if (timerMode === 'manual') {
            selectedTime = parseInt(timeSelect.value);
            remainingTime = selectedTime * 60;
            updateTimerDisplay();
            startBtn.innerHTML = "<i class=\"fas fa-play\"></i> Iniciar";
        } else {
            isFocusTime = true;
            sessionCount = 0;
            remainingTime = autoSettings.focusDuration * 60;
            updateTimerDisplay();
            updateTimerStateDisplay();
            startBtn.innerHTML = "<i class=\"fas fa-play\"></i> Iniciar";
        }
    }

    // Atualiza o display do timer
    function updateTimerDisplay() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    // Mostra notificação
    function showNotification(title, message) {
        if (Notification.permission === "granted") {
            new Notification(title, { body: message });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, { body: message });
                } else {
                    alert(`${title}\n${message}`);
                }
            });
        } else {
            alert(`${title}\n${message}`);
        }
        
        timeDisplay.classList.add('pulse');
        setTimeout(() => timeDisplay.classList.remove('pulse'), 1000);
    }

    // Pausa o timer
    function pauseTimer() {
        clearInterval(timer);
        isRunning = false;
        if (timerMode === 'auto') {
            startBtn.innerHTML = isFocusTime ? 
                "<i class=\"fas fa-play\"></i> Continuar Foco" : 
                "<i class=\"fas fa-play\"></i> Continuar Pausa";
        } else {
            startBtn.innerHTML = "<i class=\"fas fa-play\"></i> Continuar";
        }
    }

    // Inicia o timer conforme o modo selecionado
    function startTimer() {
        if (!currentTaskName) {
            alert("Por favor, selecione uma tarefa para iniciar a sessão de foco.");
            return;
        }

        if (timer) clearInterval(timer);
        isRunning = true;
        
        if (timerMode === 'auto') {
            startAutoMode();
        } else {
            startManualMode();
        }
    }

    // Event Listeners
    if (startBtn) {
        startBtn.addEventListener("click", function () {
            if (isRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", resetTimer);
    }

    if (timeSelect) {
        timeSelect.addEventListener("change", function () {
            if (!isRunning) {
                selectedTime = parseInt(this.value);
                remainingTime = selectedTime * 60;
                updateTimerDisplay();
            }
        });
    }

    // Inicialização
    generateTimeOptions();
    initModeControls();
    loadAndDisplayTasks();
    updateTimerDisplay();
});
