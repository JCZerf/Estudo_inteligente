document.addEventListener("DOMContentLoaded", function () {
    // Elementos do DOM
    const startBtn = document.getElementById("start-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const timeDisplay = document.getElementById("time-display");
    const progressCircle = document.getElementById("clock-progress");
    const customTimeInput = document.getElementById("custom-time-input");
    const taskListDiv = document.querySelector(".task-list");
    const selectedTasksListDiv = document.getElementById("selectedTasksList");
    const selectedTasksCountElement = document.getElementById("selectedTasksCount");
    const tasksValidationElement = document.getElementById("tasksValidation");
    const nextSessionElement = document.getElementById("nextSessionInfo");
    const timerModeElement = document.getElementById("timerModeIndicator");
    const timerModeText = document.getElementById("timerModeText");
    const progressPercentageElement = document.getElementById("progress-percentage");

    // Elementos de áudio
    const focusStartSound = document.getElementById("focusStartSound");
    const focusEndSound = document.getElementById("focusEndSound");
    const breakStartSound = document.getElementById("breakStartSound");
    const breakEndSound = document.getElementById("breakEndSound");

    // Variáveis de controle do timer
    let timer;
    let isRunning = false;
    let selectedTime = 25;
    let remainingTime = selectedTime * 60;
    let totalFocusDurationForCurrentTask = selectedTime * 60;
    let focusTimeElapsed = 0;

    // Variáveis para o modo automático
    let timerMode = "manual";
    let isFocusTime = true;
    let autoSettings = {
        focusDuration: 25,
        breakDuration: 5,
        usePomodoroRatio: false,
    };
    let sessionCount = 0;
    const pomodoroRatio = 1 / 5;

    // Controle de tarefas
    let selectedTasks = [];
    let activeTaskIndex = -1;
    const MAX_TASKS = 8;
    const MIN_MINUTES_PER_TASK = 15;

    // Inicializa os marcadores de tempo
    function createTimeMarkers() {
        const markersContainer = document.getElementById("time-markers");
        markersContainer.innerHTML = '';
        
        for (let i = 0; i < 60; i++) {
            const marker = document.createElement("div");
            marker.className = "time-marker";
            marker.style.transform = `rotate(${i * 6}deg)`;
            if (i % 5 === 0) {
                marker.style.height = "15px";
                marker.style.background = "var(--text-color)";
            }
            markersContainer.appendChild(marker);
        }
    }

    // Função para tocar sons
    function playSound(sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.error("Erro ao reproduzir som:", e));
    }

    // Atualiza a contagem de tarefas selecionadas
    function updateSelectedTasksCountAndValidation() {
        selectedTasksCountElement.textContent = `${selectedTasks.length}/${MAX_TASKS}`;

        const totalMinutesNeeded = selectedTasks.length * MIN_MINUTES_PER_TASK;
        const availableMinutes = timerMode === "manual" ? selectedTime : autoSettings.focusDuration;

        if (selectedTasks.length > 0 && totalMinutesNeeded > availableMinutes) {
            tasksValidationElement.textContent = `Tempo insuficiente. Você precisa de pelo menos ${totalMinutesNeeded} min para ${selectedTasks.length} tarefas.`;
            tasksValidationElement.style.display = "flex";
            startBtn.disabled = true;
        } else {
            tasksValidationElement.style.display = "none";
            startBtn.disabled = selectedTasks.length === 0 || isRunning;
        }
    }

    // Define a tarefa ativa
    function setActiveTask(index) {
        if (index >= 0 && index < selectedTasks.length) {
            activeTaskIndex = index;
            document.querySelectorAll('.selected-task').forEach(task => {
                task.classList.remove('task-active');
            });
            const activeTaskElement = selectedTasksListDiv.querySelector(`.selected-task[data-task-id="${selectedTasks[index].id}"]`);
            if (activeTaskElement) {
                activeTaskElement.classList.add('task-active');
            }
            resetTimerForActiveTask();
        } else {
            activeTaskIndex = -1;
        }
    }

    // Renderiza as tarefas selecionadas
    function renderSelectedTasks() {
        selectedTasksListDiv.innerHTML = "";
        selectedTasks.forEach((task, index) => {
            const taskElement = document.createElement("div");
            taskElement.className = `selected-task ${index === activeTaskIndex ? 'task-active' : ''}`;
            taskElement.setAttribute("data-task-id", task.id);
            taskElement.innerHTML = `
                <span class="task-title">${task.title}</span>
                <div class="task-progress-bar">
                    <div class="progress" style="width: ${task.progress || 0}%;">
                        <span class="progress-text">${Math.round(task.progress || 0)}%</span>
                    </div>
                </div>
                <i class="fas fa-times remove-task-icon" data-task-id="${task.id}" aria-label="Remover tarefa ${task.title}"></i>
            `;
            selectedTasksListDiv.appendChild(taskElement);
        });

        // Adiciona eventos de remoção
        selectedTasksListDiv.querySelectorAll(".remove-task-icon").forEach((icon) => {
            icon.addEventListener("click", (e) => {
                if (isRunning) {
                    alert("Cancele a sessão atual antes de remover tarefas.");
                    return;
                }
                const taskIdToRemove = e.target.getAttribute("data-task-id");
                const removedTaskIndex = selectedTasks.findIndex(t => t.id === taskIdToRemove);
                
                selectedTasks = selectedTasks.filter(task => task.id !== taskIdToRemove);
                
                const taskButton = taskListDiv.querySelector(`.btn-task[data-task-id="${taskIdToRemove}"]`);
                if (taskButton) {
                    taskButton.classList.remove("active");
                    taskButton.disabled = false;
                }

                if (selectedTasks.length === 0) {
                    activeTaskIndex = -1;
                } else if (removedTaskIndex === activeTaskIndex) {
                    setActiveTask(0);
                } else if (removedTaskIndex < activeTaskIndex) {
                    activeTaskIndex--;
                }
                
                renderSelectedTasks();
                updateSelectedTasksCountAndValidation();
                resetTimer();
                e.stopPropagation();
            });
        });
        
        updateSelectedTasksCountAndValidation();
    }

    // Atualiza o progresso da tarefa ativa
    function updateActiveTaskProgress(percentage) {
        if (activeTaskIndex === -1) return;

        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const activeTaskElement = selectedTasksListDiv.querySelector(
            `.selected-task[data-task-id="${selectedTasks[activeTaskIndex].id}"]`
        );
        
        if (activeTaskElement) {
            const progressBar = activeTaskElement.querySelector(".progress");
            const progressText = activeTaskElement.querySelector(".progress-text");
            
            progressBar.style.width = `${clampedPercentage}%`;
            progressText.textContent = `${Math.round(clampedPercentage)}%`;
            
            if (clampedPercentage > 50) {
                progressText.style.left = "auto";
                progressText.style.right = "4px";
                progressText.style.color = "white";
                progressText.style.mixBlendMode = "overlay";
            } else {
                progressText.style.left = "4px";
                progressText.style.right = "auto";
                progressText.style.color = "var(--text-color)";
                progressText.style.mixBlendMode = "normal";
            }
            
            if (clampedPercentage === 100) {
                progressBar.style.background = "var(--success-color)";
            } else {
                progressBar.style.background = "linear-gradient(90deg, var(--primary-color), var(--secondary-color))";
            }
            
            selectedTasks[activeTaskIndex].progress = clampedPercentage;
        }
    }

    // Formata o tempo para MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    // Atualiza o display do timer
    function updateTimerDisplay() {
        timeDisplay.textContent = formatTime(remainingTime);
        
        const totalTime = timerMode === "manual" ? selectedTime * 60 : 
                       isFocusTime ? autoSettings.focusDuration * 60 : autoSettings.breakDuration * 60;
        const progressPercentage = ((totalTime - remainingTime) / totalTime) * 100;
        
        progressCircle.style.background = `conic-gradient(var(--primary-color) ${progressPercentage}%, transparent ${progressPercentage}%)`;
        progressPercentageElement.textContent = `${Math.round(progressPercentage)}%`;
        
        if (remainingTime <= 10) {
            document.getElementById("clock-circle").classList.add("timer-active");
        } else {
            document.getElementById("clock-circle").classList.remove("timer-active");
        }
    }

    // Atualiza as informações da próxima sessão
    function updateNextSessionInfo() {
        if (activeTaskIndex === -1) {
            nextSessionElement.textContent = "Selecione uma tarefa para começar";
            timerModeText.textContent = "Nenhuma tarefa ativa";
            return;
        }
        
        const currentActiveTaskTitle = selectedTasks[activeTaskIndex].title;

        if (timerMode === "auto") {
            if (isFocusTime) {
                timerModeElement.className = "timer-mode-indicator focus";
                timerModeText.textContent = `Foco: ${currentActiveTaskTitle}`;
                nextSessionElement.innerHTML = `<i class="fas fa-coffee"></i> Próxima pausa em: ${formatTime(autoSettings.breakDuration * 60)}`;
            } else {
                timerModeElement.className = "timer-mode-indicator break";
                timerModeText.textContent = "Pausa Curta";
                nextSessionElement.innerHTML = `<i class="fas fa-brain"></i> Próximo foco em: ${formatTime(autoSettings.focusDuration * 60)}`;
            }
        } else {
            timerModeElement.className = "timer-mode-indicator focus";
            timerModeText.textContent = `Foco: ${currentActiveTaskTitle}`;
            nextSessionElement.innerHTML = `<i class="fas fa-clock"></i> Duração: ${formatTime(selectedTime * 60)}`;
        }
    }

    // Inicializa os controles de modo
    function initModeControls() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                timerMode = tabId === 'manual-tab' ? 'manual' : 'auto';
                resetTimer();
                updateNextSessionInfo();
                updateSelectedTasksCountAndValidation();
            });
        });

        // Função para atualizar o timer com base no input manual
        function handleManualTimeUpdate() {
            if (validateCustomTime(customTimeInput)) {
                selectedTime = parseInt(customTimeInput.value);
                remainingTime = selectedTime * 60;
                totalFocusDurationForCurrentTask = remainingTime;
                updateTimerDisplay();
                updateNextSessionInfo();
                resetTimerForActiveTask();
            }
        }

        customTimeInput.addEventListener('blur', handleManualTimeUpdate);
        customTimeInput.addEventListener('input', function() {
            if (validateCustomTime(customTimeInput)) {
                selectedTime = parseInt(this.value);
                remainingTime = selectedTime * 60;
                totalFocusDurationForCurrentTask = remainingTime;
                updateTimerDisplay();
                updateNextSessionInfo();
            }
        });
        customTimeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleManualTimeUpdate();
                customTimeInput.blur();
            }
        });

        const focusTimeInput = document.getElementById('focus-time');
        const breakTimeInput = document.getElementById('break-time');
        const pomodoroRatioCheckbox = document.getElementById('use-pomodoro-ratio');

        // Função para atualizar o timer com base no input de tempo de foco
        function handleFocusTimeUpdate() {
            let value = parseInt(focusTimeInput.value);
            if (isNaN(value)) value = 25;
            value = Math.max(15, Math.min(240, value));
            focusTimeInput.value = value;
            autoSettings.focusDuration = value;
            
            if (autoSettings.usePomodoroRatio) {
                const newBreak = Math.max(5, Math.min(30, Math.round(value * pomodoroRatio)));
                breakTimeInput.value = newBreak;
                autoSettings.breakDuration = newBreak;
            }
            
            validateAutoTimeSettings();
            
            if (isFocusTime && !isRunning) {
                remainingTime = autoSettings.focusDuration * 60;
                totalFocusDurationForCurrentTask = remainingTime;
                updateTimerDisplay();
            }
            updateNextSessionInfo();
        }

        focusTimeInput.addEventListener('blur', handleFocusTimeUpdate);
        focusTimeInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (!isNaN(value)) {
                value = Math.max(15, Math.min(240, value));
                this.value = value;
                autoSettings.focusDuration = value;
                
                if (autoSettings.usePomodoroRatio) {
                    const newBreak = Math.max(5, Math.min(30, Math.round(value * pomodoroRatio)));
                    breakTimeInput.value = newBreak;
                    autoSettings.breakDuration = newBreak;
                }
                
                if (isFocusTime && !isRunning) {
                    remainingTime = autoSettings.focusDuration * 60;
                    totalFocusDurationForCurrentTask = remainingTime;
                    updateTimerDisplay();
                }
                updateNextSessionInfo();
            }
        });
        focusTimeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleFocusTimeUpdate();
                focusTimeInput.blur();
            }
        });

        // Função para atualizar o timer com base no input de tempo de pausa
        function handleBreakTimeUpdate() {
            let value = parseInt(breakTimeInput.value);
            if (isNaN(value)) value = 5;
            value = Math.max(5, Math.min(30, value));
            breakTimeInput.value = value;
            autoSettings.breakDuration = value;
            validateAutoTimeSettings();
            
            if (!isFocusTime && !isRunning) {
                remainingTime = autoSettings.breakDuration * 60;
                updateTimerDisplay();
            }
            updateNextSessionInfo();
        }

        breakTimeInput.addEventListener('blur', handleBreakTimeUpdate);
        breakTimeInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (!isNaN(value)) {
                value = Math.max(5, Math.min(30, value));
                this.value = value;
                autoSettings.breakDuration = value;
                
                if (!isFocusTime && !isRunning) {
                    remainingTime = autoSettings.breakDuration * 60;
                    updateTimerDisplay();
                }
                updateNextSessionInfo();
            }
        });
        breakTimeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleBreakTimeUpdate();
                breakTimeInput.blur();
            }
        });

        pomodoroRatioCheckbox.addEventListener('change', () => {
            autoSettings.usePomodoroRatio = pomodoroRatioCheckbox.checked;
            if (autoSettings.usePomodoroRatio) {
                const newBreak = Math.max(5, Math.min(30, Math.round(autoSettings.focusDuration * pomodoroRatio)));
                breakTimeInput.value = newBreak;
                autoSettings.breakDuration = newBreak;
                validateAutoTimeSettings();
                resetTimer();
            }
        });
    }

    // Valida o tempo personalizado
    function validateCustomTime(input) {
        const value = parseInt(input.value);
        const validationMsg = document.getElementById("timeValidation");
        if (isNaN(value) || value < 15 || value > 240) {
            validationMsg.style.display = "flex";
            return false;
        } else {
            validationMsg.style.display = "none";
            return true;
        }
    }

    // Valida as configurações de tempo automático
    function validateAutoTimeSettings() {
        const focusTime = parseInt(document.getElementById("focus-time").value);
        const breakTime = parseInt(document.getElementById("break-time").value);
        const validationMsg = document.getElementById("time-validation-message");
        if (focusTime / breakTime < 3) {
            validationMsg.style.display = "flex";
            return false;
        } else {
            validationMsg.style.display = "none";
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
                taskListDiv.innerHTML = "<p>Nenhuma tarefa pendente encontrada.</p>";
                startBtn.disabled = true;
                return;
            }

            allTasks.forEach((task) => {
                const button = document.createElement("button");
                button.className = "btn-task";
                button.setAttribute("data-task-id", task.id);
                button.innerHTML = `<i class="fas fa-book-reader"></i> ${task.title}`;

                button.addEventListener("click", function () {
                    if (isRunning) {
                        alert("Cancele a sessão atual antes de modificar as tarefas.");
                        return;
                    }
                    const taskId = this.getAttribute("data-task-id");
                    const taskIndex = selectedTasks.findIndex((t) => t.id === taskId);

                    if (taskIndex !== -1) return;

                    if (selectedTasks.length >= MAX_TASKS) {
                        alert(`Você pode selecionar no máximo ${MAX_TASKS} tarefas.`);
                        return;
                    }
                    
                    selectedTasks.push({
                        id: taskId,
                        title: task.title,
                        eligibleForPoints: false,
                        progress: 0,
                    });
                    
                    this.classList.add("active");
                    this.disabled = true;
                    
                    if (selectedTasks.length === 1) {
                        setActiveTask(0);
                    }
                    
                    renderSelectedTasks();
                    updateSelectedTasksCountAndValidation();
                    resetTimer();
                });
                taskListDiv.appendChild(button);
            });
            updateSelectedTasksCountAndValidation();
        } catch (e) {
            console.error("Erro ao carregar tarefas:", e);
            taskListDiv.innerHTML = "<p>Erro ao carregar tarefas.</p>";
        }
    }

    // Inicia/pausa o timer
    function toggleTimer() {
        if (isRunning) {
            clearInterval(timer);
            isRunning = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Retomar';
        } else {
            if (activeTaskIndex === -1) {
                alert("Selecione uma tarefa para iniciar.");
                return;
            }
            isRunning = true;
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            startBtn.disabled = true;
            cancelBtn.disabled = false;

            totalFocusDurationForCurrentTask = (timerMode === "manual" ? selectedTime : autoSettings.focusDuration) * 60;
            focusTimeElapsed = (totalFocusDurationForCurrentTask - remainingTime);

            // Toca o som apropriado
            if (timerMode === "manual" || isFocusTime) {
                playSound(focusStartSound);
            } else {
                playSound(breakStartSound);
            }

            timer = setInterval(() => {
                if (remainingTime > 0) {
                    remainingTime--;
                    if (timerMode === "manual" || (timerMode === "auto" && isFocusTime)) {
                        focusTimeElapsed++;
                        const progressPercentage = (focusTimeElapsed / totalFocusDurationForCurrentTask) * 100;
                        updateActiveTaskProgress(progressPercentage);
                    }
                    updateTimerDisplay();
                } else {
                    completeSession();
                }
            }, 1000);
            setTimeout(() => { startBtn.disabled = false; }, 500);
        }
    }

    // Completa uma sessão
    function completeSession() {
        clearInterval(timer);
        isRunning = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
        startBtn.disabled = activeTaskIndex === -1;
        cancelBtn.disabled = true;

        if (timerMode === "auto") {
            if (isFocusTime) {
                playSound(focusEndSound);
                if (activeTaskIndex !== -1) {
                    selectedTasks[activeTaskIndex].eligibleForPoints = true;
                    updateActiveTaskProgress(100);
                    saveFocusSession(totalFocusDurationForCurrentTask / 60, selectedTasks[activeTaskIndex]);
                }
                setTimeout(() => playSound(breakStartSound), 500);
                isFocusTime = false;
                remainingTime = autoSettings.breakDuration * 60;
            } else {
                playSound(breakEndSound);
                isFocusTime = true;
                sessionCount++;
                setTimeout(() => playSound(focusStartSound), 500);
                if (activeTaskIndex + 1 < selectedTasks.length) {
                    setActiveTask(activeTaskIndex + 1);
                } else {
                    alert("Todas as tarefas selecionadas foram focadas nesta sessão!");
                    resetTimer();
                    return;
                }
            }
        } else {
            playSound(focusEndSound);
            if (activeTaskIndex !== -1) {
                selectedTasks[activeTaskIndex].eligibleForPoints = true;
                updateActiveTaskProgress(100);
                saveFocusSession(totalFocusDurationForCurrentTask / 60, selectedTasks[activeTaskIndex]);
            }
            if (activeTaskIndex + 1 < selectedTasks.length) {
                setActiveTask(activeTaskIndex + 1);
            } else {
                alert("Todas as tarefas selecionadas foram focadas!");
                resetTimer();
                return;
            }
        }

        updateTimerDisplay();
        updateNextSessionInfo();
    }

    // Reseta o timer para a tarefa ativa
    function resetTimerForActiveTask() {
        clearInterval(timer);
        isRunning = false;
        focusTimeElapsed = 0;
        
        if (activeTaskIndex === -1) {
             selectedTime = parseInt(customTimeInput.value) || 25;
             remainingTime = selectedTime * 60;
        } else {
            if (timerMode === "manual") {
                selectedTime = parseInt(customTimeInput.value) || 25;
                remainingTime = selectedTime * 60;
            } else {
                 isFocusTime = true;
                 remainingTime = autoSettings.focusDuration * 60;
            }
            totalFocusDurationForCurrentTask = remainingTime;
            updateActiveTaskProgress(0);
        }
        
        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
        startBtn.disabled = activeTaskIndex === -1;
        cancelBtn.disabled = true;
    }

    // Reseta completamente o timer
    function resetTimer() {
        focusStartSound.pause();
        focusEndSound.pause();
        breakStartSound.pause();
        breakEndSound.pause();
        
        clearInterval(timer);
        isRunning = false;
        isFocusTime = true;
        sessionCount = 0;
        focusTimeElapsed = 0;
        activeTaskIndex = selectedTasks.length > 0 ? 0 : -1;
        
        selectedTasks.forEach((task, index) => {
            task.eligibleForPoints = false;
            updateActiveTaskProgress(0);
        });

        if (timerMode === "manual") {
            selectedTime = parseInt(customTimeInput.value) || 25;
            remainingTime = selectedTime * 60;
        } else {
            autoSettings.focusDuration = parseInt(document.getElementById("focus-time").value) || 25;
            autoSettings.breakDuration = parseInt(document.getElementById("break-time").value) || 5;
            remainingTime = autoSettings.focusDuration * 60;
        }
        totalFocusDurationForCurrentTask = remainingTime;

        renderSelectedTasks();
        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
        startBtn.disabled = activeTaskIndex === -1;
        cancelBtn.disabled = true;
    }

    // Salva a sessão de foco
    function saveFocusSession(durationMinutes, focusedTask) {
        if (!focusedTask) return;
        try {
            const sessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
            const sessionData = {
                date: new Date().toISOString().split("T")[0],
                time: new Date().toTimeString().split(" ")[0],
                durationMinutes: durationMinutes,
                task: { id: focusedTask.id, title: focusedTask.title },
                completedWithPoints: false,
            };
            sessions.push(sessionData);
            localStorage.setItem("focusSessions", JSON.stringify(sessions));
        } catch (e) {
            console.error("Erro ao salvar sessão de foco:", e);
        }
    }

    // Inicialização
    createTimeMarkers();
    loadAndDisplayTasks();
    initModeControls();
    resetTimer();

    // Event listeners
    startBtn.addEventListener("click", toggleTimer);
    cancelBtn.addEventListener("click", resetTimer);
});
