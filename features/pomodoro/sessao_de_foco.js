document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("start-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const timeDisplay = document.getElementById("clock-circle");
    const taskTimeDisplay = document.querySelector(".time-invested span");
    const customTimeInput = document.getElementById("custom-time-input");
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

    // Controle de tarefas selecionadas
    let selectedTasks = [];
    const MAX_TASKS = 8;
    const MIN_MINUTES_PER_TASK = 15;

    // Função para atualizar a contagem de tarefas selecionadas
    function updateSelectedTasksCount() {
        const countElement = document.getElementById('selectedTasksCount');
        countElement.textContent = `${selectedTasks.length}/${MAX_TASKS} selecionadas`;
        
        // Validação do tempo mínimo
        const validationElement = document.getElementById('tasksValidation');
        const totalMinutesNeeded = selectedTasks.length * MIN_MINUTES_PER_TASK;
        const availableMinutes = timerMode === 'manual' ? selectedTime : autoSettings.focusDuration;
        
        if (selectedTasks.length > 0 && totalMinutesNeeded > availableMinutes) {
            validationElement.style.display = 'block';
            startBtn.disabled = true;
        } else {
            validationElement.style.display = 'none';
            startBtn.disabled = false;
        }
    }

    // Função para renderizar as tarefas selecionadas
    function renderSelectedTasks() {
        const container = document.getElementById('selectedTasksList');
        container.innerHTML = '';
        
        selectedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'selected-task';
            taskElement.innerHTML = `
                ${task.title}
                <i class="fas fa-times" data-task-id="${task.id}"></i>
            `;
            container.appendChild(taskElement);
        });
        
        // Adiciona evento de remoção
        container.querySelectorAll('.fa-times').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                selectedTasks = selectedTasks.filter(task => task.id !== taskId);
                renderSelectedTasks();
                updateSelectedTasksCount();
                
                // Atualiza os botões de tarefa
                document.querySelectorAll('.btn-task').forEach(btn => {
                    if (btn.getAttribute('data-task-id') === taskId) {
                        btn.classList.remove('active');
                    }
                });
                
                e.stopPropagation();
            });
        });
    }

    // Função para validar o tempo digitado
    function validateCustomTime(input) {
        const value = parseInt(input.value);
        const validationElement = document.getElementById('timeValidation');
        
        if (isNaN(value) || value < 15 || value > 240) {
            validationElement.style.display = 'block';
            return false;
        } else {
            validationElement.style.display = 'none';
            return true;
        }
    }

    // Função para validar as configurações de tempo automático
    function validateAutoTimeSettings() {
        const focusTime = parseInt(document.getElementById('focus-time').value);
        const breakTime = parseInt(document.getElementById('break-time').value);
        const validationElement = document.getElementById('time-validation-message');
        
        if (focusTime / breakTime < 3) {
            validationElement.style.display = 'block';
            return false;
        } else {
            validationElement.style.display = 'none';
            return true;
        }
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
                startBtn.disabled = true;
                return;
            }

            allTasks.forEach(task => {
                const button = document.createElement("button");
                button.className = "btn-task";
                button.setAttribute("data-task-id", task.id);
                button.innerHTML = `<i class="fas fa-book-reader"></i> ${task.title}`;
                
                button.addEventListener("click", function () {
                    const taskId = this.getAttribute("data-task-id");
                    const taskIndex = selectedTasks.findIndex(t => t.id === taskId);
                    
                    if (taskIndex !== -1) {
                        // Remove a tarefa se já estiver selecionada
                        selectedTasks.splice(taskIndex, 1);
                        this.classList.remove("active");
                    } else {
                        // Adiciona a tarefa se ainda não tiver atingido o máximo
                        if (selectedTasks.length >= MAX_TASKS) return;
                        selectedTasks.push({
                            id: taskId,
                            title: task.title
                        });
                        this.classList.add("active");
                    }
                    
                    renderSelectedTasks();
                    updateSelectedTasksCount();
                    
                    // Atualiza a tarefa principal (para o timer)
                    if (selectedTasks.length > 0) {
                        currentTaskName = selectedTasks[0].title;
                        currentTaskId = selectedTasks[0].id;
                        loadTimeInvestedForTask(currentTaskName);
                    }
                });
                
                taskListDiv.appendChild(button);
            });
            
            updateSelectedTasksCount();
        } catch (e) {
            console.error("Erro ao carregar tarefas:", e);
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

    // Atualiza as informações da próxima sessão
    function updateNextSessionInfo() {
        const nextSessionElement = document.getElementById('nextSessionInfo');
        const timerModeElement = document.getElementById('timerModeIndicator');
        
        if (timerMode === 'auto') {
            if (isFocusTime) {
                timerModeElement.className = 'timer-mode-indicator focus';
                timerModeElement.innerHTML = '<i class="fas fa-brain"></i> Modo Foco';
                nextSessionElement.textContent = `Próxima pausa em: ${formatTime(autoSettings.focusDuration * 60)}`;
            } else {
                timerModeElement.className = 'timer-mode-indicator break';
                timerModeElement.innerHTML = '<i class="fas fa-coffee"></i> Modo Pausa';
                nextSessionElement.textContent = `Próximo foco em: ${formatTime(autoSettings.breakDuration * 60)}`;
            }
        } else {
            timerModeElement.className = 'timer-mode-indicator focus';
            timerModeElement.innerHTML = '<i class="fas fa-brain"></i> Modo Foco';
            nextSessionElement.textContent = `Tempo total: ${formatTime(selectedTime * 60)}`;
        }
    }

    // Formata o tempo (segundos para MM:SS)
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    // Atualiza o display do timer
    function updateTimerDisplay() {
        timeDisplay.textContent = formatTime(remainingTime);
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
                updateNextSessionInfo();
                updateSelectedTasksCount();
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
            
            validateAutoTimeSettings();
            updateNextSessionInfo();
            updateSelectedTasksCount();
        });

        // Validação em tempo real dos tempos de pausa
        breakTimeInput.addEventListener('input', () => {
            let value = parseInt(breakTimeInput.value);
            if (isNaN(value) || value < 5) value = 5;
            if (value > 30) value = 30;
            breakTimeInput.value = value;
            autoSettings.breakDuration = value;
            
            validateAutoTimeSettings();
            updateNextSessionInfo();
        });

        // Atualiza o tempo de pausa quando a proporção Pomodoro é ativada
        pomodoroRatioCheckbox.addEventListener('change', () => {
            autoSettings.usePomodoroRatio = pomodoroRatioCheckbox.checked;
            if (autoSettings.usePomodoroRatio) {
                const newBreak = Math.max(5, Math.min(30, Math.round(autoSettings.focusDuration * pomodoroRatio)));
                breakTimeInput.value = newBreak;
                autoSettings.breakDuration = newBreak;
                validateAutoTimeSettings();
                updateNextSessionInfo();
            }
        });

        // Configuração do input de tempo manual
        customTimeInput.addEventListener('input', () => {
            if (validateCustomTime(customTimeInput)) {
                selectedTime = parseInt(customTimeInput.value);
                remainingTime = selectedTime * 60;
                updateTimerDisplay();
                updateSelectedTasksCount();
                updateNextSessionInfo();
            }
        });

        // Configuração inicial
        autoSettingsDiv.style.display = 'none';
        manualTimeOptions.style.display = 'block';
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
        if (!validateAutoTimeSettings()) {
            alert("Configurações de tempo inválidas. O tempo de foco deve ser pelo menos 3x o tempo de pausa.");
            return;
        }
        
        updateNextSessionInfo();
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
        
        // Rotaciona as tarefas se houver mais de uma
        if (selectedTasks.length > 1) {
            selectedTasks.push(selectedTasks.shift());
            currentTaskName = selectedTasks[0].title;
            currentTaskId = selectedTasks[0].id;
            renderSelectedTasks();
            loadTimeInvestedForTask(currentTaskName);
        }
        
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
        
        // Rotaciona as tarefas se houver mais de uma
        if (selectedTasks.length > 1) {
            selectedTasks.push(selectedTasks.shift());
            currentTaskName = selectedTasks[0].title;
            currentTaskId = selectedTasks[0].id;
            renderSelectedTasks();
            loadTimeInvestedForTask(currentTaskName);
        }
        
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

    // Reinicia o timer
    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        
        if (timerMode === 'manual') {
            remainingTime = selectedTime * 60;
            startBtn.innerHTML = "<i class=\"fas fa-play\"></i> Iniciar";
        } else {
            isFocusTime = true;
            sessionCount = 0;
            remainingTime = autoSettings.focusDuration * 60;
            startBtn.innerHTML = "<i class=\"fas fa-play\"></i> Iniciar";
        }
        
        updateTimerDisplay();
        updateNextSessionInfo();
    }

    // Inicia o timer conforme o modo selecionado
    function startTimer() {
        if (selectedTasks.length === 0) {
            alert("Por favor, selecione pelo menos uma tarefa.");
            return;
        }
        
        const totalMinutesNeeded = selectedTasks.length * MIN_MINUTES_PER_TASK;
        const availableMinutes = timerMode === 'manual' ? selectedTime : autoSettings.focusDuration;
        
        if (totalMinutesNeeded > availableMinutes) {
            alert(`Você precisa de pelo menos ${totalMinutesNeeded} minutos para as tarefas selecionadas.`);
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

    // Inicialização
    initModeControls();
    loadAndDisplayTasks();
    updateTimerDisplay();
    updateNextSessionInfo();
});
