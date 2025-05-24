/**
 * Script JavaScript para a página de Sessão de Foco (Pomodoro)
 * Gerencia o timer, seleção de tarefas (múltiplas permitidas, uma ativa por vez) e controle de sessões de estudo.
 */

document.addEventListener("DOMContentLoaded", function () {
    // Elementos do DOM
    const startBtn = document.getElementById("start-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const timeDisplay = document.getElementById("clock-circle");
    const customTimeInput = document.getElementById("custom-time-input");
    const taskListDiv = document.querySelector(".task-list");
    const selectedTasksListDiv = document.getElementById("selectedTasksList");
    const selectedTasksCountElement = document.getElementById("selectedTasksCount");
    const tasksValidationElement = document.getElementById("tasksValidation");
    const nextSessionElement = document.getElementById("nextSessionInfo");
    const timerModeElement = document.getElementById("timerModeIndicator");

    // Variáveis de controle do timer
    let timer;
    let isRunning = false;
    let selectedTime = 25; // Tempo manual padrão
    let remainingTime = selectedTime * 60;
    let totalFocusDurationForCurrentTask = selectedTime * 60; // Duração total do foco para a tarefa ATIVA
    let focusTimeElapsed = 0; // Tempo de foco decorrido na tarefa ATIVA

    // Variáveis para o modo automático (Pomodoro)
    let timerMode = "manual";
    let isFocusTime = true; // Indica se é tempo de foco ou pausa no modo auto
    let autoSettings = {
        focusDuration: 25,
        breakDuration: 5,
        usePomodoroRatio: false,
    };
    let sessionCount = 0; // Contador de ciclos foco/pausa no modo auto
    const pomodoroRatio = 1 / 5;

    // Controle de tarefas selecionadas e ativa
    let selectedTasks = []; // Array de objetos { id, title, eligibleForPoints, progress }
    let activeTaskIndex = -1; // Índice da tarefa ativa em selectedTasks (-1 se nenhuma)
    const MAX_TASKS = 8;
    const MIN_MINUTES_PER_TASK = 15;

    /**
     * Atualiza a contagem de tarefas selecionadas e valida o tempo.
     */
    function updateSelectedTasksCountAndValidation() {
        selectedTasksCountElement.textContent = `${selectedTasks.length}/${MAX_TASKS}`;

        const totalMinutesNeeded = selectedTasks.length * MIN_MINUTES_PER_TASK;
        const availableMinutes = timerMode === "manual" ? selectedTime : autoSettings.focusDuration;

        if (selectedTasks.length > 0 && totalMinutesNeeded > availableMinutes) {
            tasksValidationElement.textContent = `Tempo insuficiente. Você precisa de pelo menos ${totalMinutesNeeded} min para ${selectedTasks.length} tarefas.`;
            tasksValidationElement.style.display = "block";
            startBtn.disabled = true;
        } else {
            tasksValidationElement.style.display = "none";
            startBtn.disabled = selectedTasks.length === 0 || isRunning; // Desabilita se 0 tarefas ou se já rodando
        }
    }

    /**
     * Define qual tarefa está ativa.
     * @param {number} index - Índice da tarefa a ser ativada em selectedTasks.
     */
    function setActiveTask(index) {
        activeTaskIndex = index;
        renderSelectedTasks(); // Re-renderiza para atualizar o destaque visual
        resetTimerForActiveTask(); // Prepara o timer para a nova tarefa ativa
    }

    /**
     * Renderiza as tarefas selecionadas na interface, destacando a ativa.
     */
    function renderSelectedTasks() {
        selectedTasksListDiv.innerHTML = "";
        selectedTasks.forEach((task, index) => {
            const taskElement = document.createElement("div");
            taskElement.className = "selected-task";
            taskElement.setAttribute("data-task-id", task.id);
            if (index === activeTaskIndex) {
                taskElement.classList.add("task-active"); // Adiciona classe para destacar a ativa
            }
            taskElement.innerHTML = `
                <span class="task-title">${task.title}</span>
                <div class="task-progress-bar">
                    <div class="progress" style="width: ${task.progress || 0}%;"></div>
                </div>
                <i class="fas fa-times remove-task-icon" data-task-id="${task.id}" aria-label="Remover tarefa ${task.title}"></i>
            `;
            selectedTasksListDiv.appendChild(taskElement);
        });

        // Adiciona evento de remoção
        selectedTasksListDiv.querySelectorAll(".remove-task-icon").forEach((icon) => {
            icon.addEventListener("click", (e) => {
                if (isRunning) {
                    alert("Cancele a sessão atual antes de remover tarefas.");
                    return;
                }
                const taskIdToRemove = e.target.getAttribute("data-task-id");
                const removedTaskIndex = selectedTasks.findIndex(t => t.id === taskIdToRemove);
                
                selectedTasks = selectedTasks.filter(task => task.id !== taskIdToRemove);
                
                // Reativa o botão na lista de disponíveis
                const taskButton = taskListDiv.querySelector(`.btn-task[data-task-id="${taskIdToRemove}"]`);
                if (taskButton) {
                    taskButton.classList.remove("active");
                    taskButton.disabled = false;
                }

                // Ajusta o índice ativo se necessário
                if (selectedTasks.length === 0) {
                    activeTaskIndex = -1;
                } else if (removedTaskIndex === activeTaskIndex) {
                    // Se removeu a ativa, ativa a primeira (ou nenhuma se for a única)
                    setActiveTask(0);
                } else if (removedTaskIndex < activeTaskIndex) {
                    // Se removeu uma antes da ativa, ajusta o índice
                    activeTaskIndex--;
                }
                
                renderSelectedTasks();
                updateSelectedTasksCountAndValidation();
                resetTimer(); // Reseta o timer geral
                e.stopPropagation();
            });
        });
        updateSelectedTasksCountAndValidation();
    }

    /**
     * Atualiza a barra de progresso da tarefa ATIVA.
     * @param {number} percentage - Percentual de progresso (0 a 100).
     */
    function updateActiveTaskProgress(percentage) {
        if (activeTaskIndex === -1) return; // Nenhuma tarefa ativa

        const activeTaskElement = selectedTasksListDiv.querySelector(`.selected-task[data-task-id="${selectedTasks[activeTaskIndex].id}"]`);
        if (activeTaskElement) {
            const progressBar = activeTaskElement.querySelector(".progress");
            const clampedPercentage = Math.max(0, Math.min(100, percentage));
            progressBar.style.width = `${clampedPercentage}%`;
            selectedTasks[activeTaskIndex].progress = clampedPercentage; // Salva o progresso no objeto da tarefa
        }
    }
    
    /**
     * Reseta a barra de progresso de uma tarefa específica.
     * @param {number} index - Índice da tarefa em selectedTasks.
     */
    function resetTaskProgress(index) {
        if (index < 0 || index >= selectedTasks.length) return;
        selectedTasks[index].progress = 0;
        const taskElement = selectedTasksListDiv.querySelector(`.selected-task[data-task-id="${selectedTasks[index].id}"]`);
         if (taskElement) {
            const progressBar = taskElement.querySelector(".progress");
            if(progressBar) progressBar.style.width = `0%`;
        }
    }

    /**
     * Valida o tempo personalizado inserido pelo usuário (15-240 min).
     */
    function validateCustomTime(input) {
        const value = parseInt(input.value);
        const validationMsg = document.getElementById("timeValidation");
        if (isNaN(value) || value < 15 || value > 240) {
            validationMsg.style.display = "block";
            return false;
        } else {
            validationMsg.style.display = "none";
            return true;
        }
    }

    /**
     * Valida as configurações de tempo do modo automático (foco >= 3 * pausa).
     */
    function validateAutoTimeSettings() {
        const focusTime = parseInt(document.getElementById("focus-time").value);
        const breakTime = parseInt(document.getElementById("break-time").value);
        const validationMsg = document.getElementById("time-validation-message");
        if (focusTime / breakTime < 3) {
            validationMsg.style.display = "block";
            return false;
        } else {
            validationMsg.style.display = "none";
            return true;
        }
    }

    /**
     * Carrega e exibe as tarefas disponíveis para seleção.
     */
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

                    if (taskIndex !== -1) {
                        // Deselecionar (já implementado no evento do ícone de remover)
                    } else {
                        if (selectedTasks.length >= MAX_TASKS) {
                            alert(`Você pode selecionar no máximo ${MAX_TASKS} tarefas.`);
                            return;
                        }
                        selectedTasks.push({
                            id: taskId,
                            title: task.title,
                            eligibleForPoints: false,
                            progress: 0, // Inicializa progresso
                        });
                        this.classList.add("active");
                        this.disabled = true;
                        // Se for a primeira tarefa selecionada, torna-a ativa
                        if (selectedTasks.length === 1) {
                            setActiveTask(0);
                        }
                    }
                    renderSelectedTasks();
                    updateSelectedTasksCountAndValidation();
                    resetTimer(); // Reseta timer ao mudar seleção
                });
                taskListDiv.appendChild(button);
            });
            updateSelectedTasksCountAndValidation();
        } catch (e) {
            console.error("Erro ao carregar tarefas:", e);
            taskListDiv.innerHTML = "<p>Erro ao carregar tarefas.</p>";
        }
    }

    /**
     * Atualiza as informações da próxima sessão na interface.
     */
    function updateNextSessionInfo() {
        if (activeTaskIndex === -1) {
             nextSessionElement.textContent = "Selecione uma tarefa";
             timerModeElement.innerHTML = ".";
             return;
        }
        
        const currentActiveTaskTitle = selectedTasks[activeTaskIndex].title;

        if (timerMode === "auto") {
            if (isFocusTime) {
                timerModeElement.className = "timer-mode-indicator focus";
                timerModeElement.innerHTML = `<i class="fas fa-brain"></i> Foco: ${currentActiveTaskTitle}`;
                nextSessionElement.textContent = `Próxima pausa em: ${formatTime(autoSettings.focusDuration * 60)}`;
            } else {
                timerModeElement.className = "timer-mode-indicator break";
                timerModeElement.innerHTML = `<i class="fas fa-coffee"></i> Pausa`;
                nextSessionElement.textContent = `Próximo foco (${currentActiveTaskTitle}) em: ${formatTime(autoSettings.breakDuration * 60)}`;
            }
        } else {
            timerModeElement.className = "timer-mode-indicator focus";
            timerModeElement.innerHTML = `<i class="fas fa-brain"></i> Foco: ${currentActiveTaskTitle}`;
            nextSessionElement.textContent = `Tempo total: ${formatTime(selectedTime * 60)}`;
        }
    }

    /**
     * Formata o tempo em segundos para o formato MM:SS.
     */
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    /**
     * Atualiza o display visual do timer.
     */
    function updateTimerDisplay() {
        timeDisplay.textContent = formatTime(remainingTime);
    }

    /**
     * Inicializa os controles de modo do timer.
     */
    function initModeControls() {
        const modeRadios = document.querySelectorAll("input[name=\"timerMode\"]");
        const autoSettingsDiv = document.getElementById("auto-settings");
        const manualTimeOptions = document.getElementById("manual-time-options");
        const focusTimeInput = document.getElementById("focus-time");
        const breakTimeInput = document.getElementById("break-time");
        const pomodoroRatioCheckbox = document.getElementById("use-pomodoro-ratio");

        modeRadios.forEach((radio) => {
            radio.addEventListener("change", () => {
                timerMode = radio.value;
                autoSettingsDiv.style.display = timerMode === "auto" ? "block" : "none";
                manualTimeOptions.style.display = timerMode === "manual" ? "block" : "none";
                resetTimer();
                updateNextSessionInfo();
                updateSelectedTasksCountAndValidation();
            });
        });

        focusTimeInput.addEventListener("input", () => {
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
            resetTimer();
        });

        breakTimeInput.addEventListener("input", () => {
            let value = parseInt(breakTimeInput.value);
            if (isNaN(value) || value < 5) value = 5;
            if (value > 30) value = 30;
            breakTimeInput.value = value;
            autoSettings.breakDuration = value;
            validateAutoTimeSettings();
            resetTimer();
        });

        pomodoroRatioCheckbox.addEventListener("change", () => {
            autoSettings.usePomodoroRatio = pomodoroRatioCheckbox.checked;
            if (autoSettings.usePomodoroRatio) {
                const newBreak = Math.max(5, Math.min(30, Math.round(autoSettings.focusDuration * pomodoroRatio)));
                breakTimeInput.value = newBreak;
                autoSettings.breakDuration = newBreak;
                validateAutoTimeSettings();
                resetTimer();
            }
        });

        customTimeInput.addEventListener("input", () => {
            if (validateCustomTime(customTimeInput)) {
                selectedTime = parseInt(customTimeInput.value);
                resetTimer();
            }
        });

        autoSettingsDiv.style.display = "none";
        manualTimeOptions.style.display = "block";
    }

    /**
     * Inicia ou pausa o timer.
     */
    function toggleTimer() {
        if (isRunning) {
            // Pausa
            clearInterval(timer);
            isRunning = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Retomar';
        } else {
            // Inicia/Retoma
            if (activeTaskIndex === -1) {
                alert("Selecione uma tarefa para iniciar.");
                return;
            }
            isRunning = true;
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            startBtn.disabled = true; // Desabilita durante a execução para evitar cliques duplos
            cancelBtn.disabled = false;

            // Define a duração total do foco para a tarefa ATIVA
            totalFocusDurationForCurrentTask = (timerMode === "manual" ? selectedTime : autoSettings.focusDuration) * 60;
            // Garante que focusTimeElapsed comece de onde parou ou 0 se for nova tarefa
            focusTimeElapsed = (totalFocusDurationForCurrentTask - remainingTime);

            timer = setInterval(() => {
                if (remainingTime > 0) {
                    remainingTime--;
                    // Atualiza progresso apenas se estiver em modo foco
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
            // Reabilita o botão após um pequeno delay para evitar problemas
            setTimeout(() => { startBtn.disabled = false; }, 500);
        }
    }

    /**
     * Chamada quando uma sessão (foco ou pausa) termina.
     */
    function completeSession() {
        clearInterval(timer);
        isRunning = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
        startBtn.disabled = activeTaskIndex === -1; // Habilita se houver tarefa ativa
        cancelBtn.disabled = true;

        // Tocar som (opcional)
        // const alarmSound = new Audio('../../shared/assets/sounds/alarm.mp3');
        // alarmSound.play();

        if (timerMode === "auto") {
            if (isFocusTime) {
                // Foco da tarefa ativa terminou
                if (activeTaskIndex !== -1) {
                    selectedTasks[activeTaskIndex].eligibleForPoints = true;
                    updateActiveTaskProgress(100); // Garante 100%
                    saveFocusSession(totalFocusDurationForCurrentTask / 60, selectedTasks[activeTaskIndex]); // Salva info da tarefa focada
                    console.log(`Tarefa "${selectedTasks[activeTaskIndex].title}" elegível para pontos.`);
                }
                alert("Sessão de foco concluída! Hora da pausa.");
                isFocusTime = false;
                remainingTime = autoSettings.breakDuration * 60;
            } else {
                // Pausa terminou, avança para próxima tarefa
                alert("Pausa concluída! Preparando próximo foco.");
                isFocusTime = true;
                sessionCount++;
                // Tenta avançar para a próxima tarefa
                if (activeTaskIndex + 1 < selectedTasks.length) {
                    setActiveTask(activeTaskIndex + 1);
                    // O timer já foi resetado em setActiveTask
                } else {
                    // Todas as tarefas foram focadas
                    alert("Todas as tarefas selecionadas foram focadas nesta sessão!");
                    resetTimer(); // Reseta tudo
                    return; // Sai da função para não iniciar nada
                }
            }
        } else {
            // Modo manual terminou
            if (activeTaskIndex !== -1) {
                selectedTasks[activeTaskIndex].eligibleForPoints = true;
                updateActiveTaskProgress(100); // Garante 100%
                saveFocusSession(totalFocusDurationForCurrentTask / 60, selectedTasks[activeTaskIndex]);
                 console.log(`Tarefa "${selectedTasks[activeTaskIndex].title}" elegível para pontos.`);
            }
            alert("Sessão de foco concluída!");
            // Tenta avançar para a próxima tarefa automaticamente
             if (activeTaskIndex + 1 < selectedTasks.length) {
                 setActiveTask(activeTaskIndex + 1);
                 // O timer já foi resetado em setActiveTask
             } else {
                 alert("Todas as tarefas selecionadas foram focadas!");
                 resetTimer(); // Reseta tudo
                 return;
             }
        }

        updateTimerDisplay();
        updateNextSessionInfo();
    }
    
    /**
     * Reseta o timer para a tarefa ativa atual ou estado inicial.
     */
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
                 // No modo auto, sempre reseta para o tempo de foco da tarefa atual
                 isFocusTime = true; // Garante que está em modo foco ao resetar para uma tarefa
                 remainingTime = autoSettings.focusDuration * 60;
            }
            totalFocusDurationForCurrentTask = remainingTime; // Atualiza duração total para a tarefa ativa
            resetTaskProgress(activeTaskIndex); // Reseta o progresso visual da tarefa ativa
        }
        
        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
        startBtn.disabled = activeTaskIndex === -1;
        cancelBtn.disabled = true;
    }

    /**
     * Reseta o timer completamente (ao cancelar ou mudar modo/tempo).
     */
    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        isFocusTime = true;
        sessionCount = 0;
        focusTimeElapsed = 0;
        activeTaskIndex = selectedTasks.length > 0 ? 0 : -1; // Volta para a primeira tarefa ou nenhuma
        
        // Reseta progresso e elegibilidade de todas as tarefas selecionadas
        selectedTasks.forEach((task, index) => {
            task.eligibleForPoints = false;
            resetTaskProgress(index);
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

        renderSelectedTasks(); // Re-renderiza para mostrar a primeira como ativa
        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
        startBtn.disabled = activeTaskIndex === -1;
        cancelBtn.disabled = true;
    }

    /**
     * Salva a sessão de foco concluída no localStorage.
     * @param {number} durationMinutes - Duração da sessão de foco em minutos.
     * @param {object} focusedTask - Objeto da tarefa que foi focada { id, title }.
     */
    function saveFocusSession(durationMinutes, focusedTask) {
        if (!focusedTask) return;
        try {
            const sessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
            const sessionData = {
                date: new Date().toISOString().split("T")[0],
                time: new Date().toTimeString().split(" ")[0],
                durationMinutes: durationMinutes,
                task: { id: focusedTask.id, title: focusedTask.title }, // Salva a tarefa específica focada
                completedWithPoints: false, // Flag para ser usada na conclusão da tarefa
            };
            sessions.push(sessionData);
            localStorage.setItem("focusSessions", JSON.stringify(sessions));
            console.log("Sessão de foco salva:", sessionData);
        } catch (e) {
            console.error("Erro ao salvar sessão de foco:", e);
        }
    }

    // --- Inicialização ---
    loadAndDisplayTasks();
    initModeControls();
    resetTimer(); // Define o estado inicial

    // Event listeners para os botões principais
    startBtn.addEventListener("click", toggleTimer);
    cancelBtn.addEventListener("click", resetTimer);
});

// --- Lógica de Pontuação (Exemplo - Precisa ser integrada com a conclusão de tarefas) ---

/**
 * Função (exemplo) chamada quando uma tarefa é marcada como concluída.
 * @param {string} taskId - ID da tarefa concluída.
 */
function handleTaskCompletion(taskId) {
    let awardedPoints = 0;
    let taskWasEligible = false;

    // 1. Verifica se a tarefa estava elegível na ÚLTIMA sessão de foco salva para ELA
    try {
        const sessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
        // Encontra a última sessão salva PARA ESTA TAREFA que ainda não foi pontuada
        const lastRelevantSessionIndex = sessions.findLastIndex(s => s.task && s.task.id === taskId && !s.completedWithPoints);

        if (lastRelevantSessionIndex !== -1) {
            taskWasEligible = true;
            // Marca a sessão como pontuada para não dar pontos novamente pela mesma sessão
            sessions[lastRelevantSessionIndex].completedWithPoints = true;
            localStorage.setItem("focusSessions", JSON.stringify(sessions));
        }
    } catch (e) {
        console.error("Erro ao verificar elegibilidade de pontos da tarefa:", e);
    }

    // 2. Se a tarefa estava elegível, calcula e adiciona pontos
    if (taskWasEligible) {
        awardedPoints = calculatePointsForTask(taskId); // Implementar esta função
        updateUserPoints(awardedPoints); // Implementar esta função para salvar os pontos do usuário
        console.log(`Tarefa ${taskId} concluída com ${awardedPoints} pontos!`);
        // Adicionar lógica para conquistas aqui, se aplicável (ex: primeira tarefa com pontos)
        checkAndAwardAchievement('first_focus_task');
    } else {
        console.log(`Tarefa ${taskId} concluída sem pontos (não via sessão de foco completa).`);
    }

    // 3. Marca a tarefa como concluída no localStorage ("studyTasks")
    markTaskAsDoneInStorage(taskId);
    // Adicionar lógica para conquistas aqui (ex: concluir X tarefas)
    checkAndAwardAchievement('task_master_1'); // Exemplo: primeira tarefa concluída
}

/**
 * Calcula os pontos para uma tarefa concluída via sessão de foco (Exemplo).
 * @param {string} taskId - ID da tarefa.
 * @returns {number} - Pontos calculados.
 */
function calculatePointsForTask(taskId) {
    let basePoints = 10;
    // Poderia buscar a prioridade da tarefa e adicionar bônus
    return basePoints;
}

/**
 * Atualiza os pontos totais do usuário no localStorage (Exemplo).
 * @param {number} pointsToAdd - Pontos a serem adicionados.
 */
function updateUserPoints(pointsToAdd) {
    try {
        let currentPoints = parseInt(localStorage.getItem("userTotalPoints")) || 0;
        currentPoints += pointsToAdd;
        localStorage.setItem("userTotalPoints", currentPoints);
        console.log("Pontos totais atualizados:", currentPoints);
        window.dispatchEvent(new CustomEvent("userPointsChanged", { detail: { newTotalPoints: currentPoints } }));
        // Verificar conquistas relacionadas a pontos
        checkAndAwardAchievement('points_milestone_100', currentPoints);
    } catch (e) {
        console.error("Erro ao atualizar pontos do usuário:", e);
    }
}

/**
 * Marca a tarefa como concluída no localStorage ("studyTasks") (Placeholder).
 * @param {string} taskId - ID da tarefa.
 */
function markTaskAsDoneInStorage(taskId) {
    console.log(`(Placeholder) Marcando tarefa ${taskId} como concluída no storage.`);
    try {
        let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
        let taskFound = false;
        let completedTasksCount = 0;
        Object.keys(studyTasks).forEach(category => {
            const taskIndex = studyTasks[category].findIndex(t => t.id === taskId);
            if (taskIndex !== -1 && !studyTasks[category][taskIndex].done) { // Marca apenas se não estiver done
                studyTasks[category][taskIndex].done = true;
                taskFound = true;
            }
            // Conta tarefas concluídas
            completedTasksCount += studyTasks[category].filter(t => t.done).length;
        });
        if (taskFound) {
            localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
            localStorage.setItem("completedTasksCount", completedTasksCount); // Salva contagem
            window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
            window.dispatchEvent(new CustomEvent("completedTasksChanged", { detail: { count: completedTasksCount } })); // Evento para contador
            // Verificar conquistas relacionadas a número de tarefas concluídas
            checkAndAwardAchievement('task_master_10', completedTasksCount);
        } else {
            console.warn("Tarefa não encontrada ou já concluída:", taskId);
        }
    } catch (e) {
        console.error("Erro ao marcar tarefa como concluída:", e);
    }
}

// --- Funções de Conquistas (Placeholder) ---
/**
 * Verifica se uma conquista foi alcançada e a concede.
 * @param {string} achievementId - ID da conquista.
 * @param {*} value - Valor atual para comparação (opcional, ex: pontos, contagem).
 */
function checkAndAwardAchievement(achievementId, value = null) {
    let achievements = JSON.parse(localStorage.getItem('userAchievements')) || {};
    if (achievements[achievementId]) return; // Já conquistada

    let achieved = false;
    switch (achievementId) {
        case 'first_focus_task': achieved = true; break; // Concedida na primeira tarefa com pontos
        case 'task_master_1': achieved = true; break; // Concedida na primeira tarefa concluída (com ou sem pontos)
        case 'task_master_10': achieved = value >= 10; break;
        case 'points_milestone_100': achieved = value >= 100; break;
        // Adicionar mais casos para as 9+ conquistas
        case 'perfect_week': /* Lógica para verificar 7 dias seguidos de foco */ break;
        case 'marathon_runner': /* Lógica para sessão de foco longa (ex: > 120 min) */ break;
        case 'early_bird': /* Lógica para concluir tarefa antes das 8h */ break;
        case 'night_owl': /* Lógica para concluir tarefa depois das 22h */ break;
        case 'diversified_learner': /* Lógica para concluir tarefas de diferentes categorias */ break;
    }

    if (achieved) {
        achievements[achievementId] = { achievedDate: new Date().toISOString() };
        localStorage.setItem('userAchievements', JSON.stringify(achievements));
        console.log(`Conquista desbloqueada: ${achievementId}!`);
        // Exibir notificação para o usuário (implementação futura)
        // alert(`Conquista desbloqueada: ${achievementId}!`);
        window.dispatchEvent(new CustomEvent('achievementUnlocked', { detail: { id: achievementId } }));
    }
}

