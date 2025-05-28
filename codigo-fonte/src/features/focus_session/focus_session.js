document.addEventListener("DOMContentLoaded", function () {
    // Função auxiliar para obter elementos com segurança
    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`[FocusSession] Element with ID "${id}" not found.`);
        }
        return element;
    }

    function querySelector(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`[FocusSession] Element with selector "${selector}" not found.`);
        }
        return element;
    }

    // --- Elementos DOM Essenciais ---
    const startBtn = getElement("start-btn");
    const cancelBtn = getElement("cancel-btn");
    const timeDisplay = getElement("time-display");
    const progressCircle = getElement("clock-progress");
    // Slider e valor para Tempo Total
    const totalSessionTimeSlider = getElement("total-session-time-slider");
    const totalSessionTimeValueSpan = getElement("total-session-time-value");
    // Elementos dentro do Modal
    const breakTimeInput = getElement("break-time");
    const totalFocusCheckbox = getElement("total-focus-checkbox");
    // Botão para abrir o Modal
    const customizeCyclesBtn = getElement("customize-cycles-btn");
    // Modal
    const customizeModal = getElement("customize-modal");
    const modalCloseBtns = customizeModal ? customizeModal.querySelectorAll("[data-micromodal-close]") : [];
    // Outros elementos
    const taskListDiv = querySelector(".task-list");
    const selectedTasksListDiv = getElement("selectedTasksList");
    const selectedTasksCountElement = getElement("selectedTasksCount");
    const tasksValidationElement = getElement("tasksValidation");
    const nextSessionElement = getElement("nextSessionInfo");
    const timerModeElement = getElement("timerModeIndicator");
    const timerModeText = getElement("timerModeText");
    const progressPercentageElement = getElement("progress-percentage");
    const markersContainer = getElement("time-markers");
    const clockCircle = getElement("clock-circle");
    const soundToggleBtn = getElement("sound-toggle-btn"); // Botão de Som
    const soundToggleIcon = soundToggleBtn ? soundToggleBtn.querySelector("i") : null;

    // --- Elementos de Áudio ---
    const focusStartSound = getElement("focusStartSound");
    const focusEndSound = getElement("focusEndSound");
    const breakStartSound = getElement("breakStartSound");
    const breakEndSound = getElement("breakEndSound");

    // --- Validação de Elementos Essenciais ---
    const essentialElements = {
        startBtn, cancelBtn, timeDisplay, progressCircle, totalSessionTimeSlider,
        totalSessionTimeValueSpan, breakTimeInput, taskListDiv, selectedTasksListDiv,
        selectedTasksCountElement, tasksValidationElement, nextSessionElement,
        timerModeElement, timerModeText, progressPercentageElement, markersContainer,
        clockCircle, soundToggleBtn, soundToggleIcon, totalFocusCheckbox,
        customizeCyclesBtn, customizeModal, // Adiciona modal e botão
        focusStartSound, focusEndSound, breakStartSound, breakEndSound
    };

    let missingElements = false;
    for (const key in essentialElements) {
        if (!essentialElements[key]) {
            console.error(`[FocusSession] Essential DOM element or child is missing: ${key}. Script cannot initialize properly.`);
            missingElements = true;
        }
    }

    if (missingElements) {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Erro: Elementos essenciais para a sessão de foco não foram encontrados. Verifique o HTML.";
        errorDiv.style.color = "red";
        errorDiv.style.padding = "10px";
        errorDiv.style.border = "1px solid red";
        if (document.body) {
            document.body.prepend(errorDiv);
        } else {
            console.error("[FocusSession] document.body not available to display error message.");
        }
        return; // Stop script execution
    }

    // --- Variáveis de Estado ---
    let timer; // Referência para o setInterval
    let isRunning = false; // Timer está ativo?
    let remainingTime = 0; // Tempo restante no ciclo atual (foco ou pausa) em segundos
    let lastCycleDurationMinutes = 0; // Duração do último ciclo de foco concluído
    let isFocusTime = true; // Ciclo atual é de foco?
    let sessionCount = 0; // Ciclos de foco completados NA SESSÃO ATUAL
    let focusCyclesCompletedInBlock = 0; // Ciclos de foco completados desde a última pausa longa NA SESSÃO ATUAL
    let totalSessionRemainingTime = 0; // Tempo total restante na sessão (em segundos)
    let sessionStarted = false; // Indica se a sessão foi iniciada
    let soundEnabled = true; // Sons estão ativados?
    let totalFocusModeEnabled = false; // Modo Foco Total está ativo?
    let expectedEndTime = null; // Timestamp de quando o ciclo atual deve terminar (para persistência)
    let lastUpdateTime = null; // NOVO: Timestamp da última atualização do timer
    let oneMinuteWarningTriggered = false; // NOVO: Flag para controlar o aviso de 1 minuto

    const LONG_BREAK_INTERVAL = 4; // Ciclos de foco antes de uma pausa longa
    const MAX_TASKS = 8;
    const ONE_MINUTE_WARNING = 60; // NOVO: Constante para aviso de 1 minuto (em segundos)

    // --- Configurações do Timer Inteligente (Persistidas) ---
    let timerSettings = {
        totalSessionDuration: 60, // Duração total definida pelo usuário (minutos)
        baseBreakDuration: 5,     // Duração da pausa curta definida pelo usuário (minutos)
    };

    // --- Estado das Tarefas ---
    let allAvailableTasks = []; // Tarefas PENDENTES carregadas (array plano)
    let selectedTasks = []; // Tarefas selecionadas para a sessão (com estado de progresso)
    let activeTaskIndex = -1; // Índice da tarefa ativa DENTRO de selectedTasks

    // --- Funções do Modal ---
    function openModal(modalId) {
        const modal = getElement(modalId);
        if (modal) {
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            // Foco no primeiro elemento interativo ou no container
            const focusable = modal.querySelector("input, button");
            if (focusable) focusable.focus();
            else modal.querySelector(".modal-container").focus();
        }
    }

    function closeModal(modalId) {
        const modal = getElement(modalId);
        if (modal) {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            // Retorna o foco para o botão que abriu o modal
            if (customizeCyclesBtn) customizeCyclesBtn.focus();
        }
    }

    function initModalListeners() {
        customizeCyclesBtn.addEventListener("click", () => openModal("customize-modal"));
        modalCloseBtns.forEach(btn => {
            btn.addEventListener("click", () => closeModal("customize-modal"));
        });
        // Fechar ao clicar fora do container
        const modalOverlay = customizeModal.querySelector(".modal-overlay");
        if (modalOverlay) {
            modalOverlay.addEventListener("click", (event) => {
                if (event.target === modalOverlay) {
                    closeModal("customize-modal");
                }
            });
        }
        // Fechar com a tecla Esc
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && customizeModal.classList.contains("is-open")) {
                closeModal("customize-modal");
            }
        });
    }

    // --- Funções de Persistência e Sincronização ---

    function loadSettings() {
        try {
            const savedSettings = JSON.parse(localStorage.getItem("timerSettings")) || {};
            timerSettings.totalSessionDuration = parseInt(savedSettings.totalSessionDuration) || 60;
            timerSettings.baseBreakDuration = parseInt(savedSettings.baseBreakDuration) || 5;
            soundEnabled = typeof savedSettings.soundEnabled === "boolean" ? savedSettings.soundEnabled : true;
            totalFocusModeEnabled = typeof savedSettings.totalFocusModeEnabled === "boolean" ? savedSettings.totalFocusModeEnabled : false;

            // Atualiza inputs e toggles com valores carregados
            totalSessionTimeSlider.value = timerSettings.totalSessionDuration;
            totalSessionTimeValueSpan.textContent = timerSettings.totalSessionDuration;
            breakTimeInput.value = timerSettings.baseBreakDuration;
            totalFocusCheckbox.checked = totalFocusModeEnabled;
            updateSoundToggleVisual();

            console.log("[FocusSession] Settings loaded:", timerSettings, "Sound:", soundEnabled, "TotalFocus:", totalFocusModeEnabled);
        } catch (e) {
            console.error("[FocusSession] Error loading settings:", e);
        }
    }

    function saveSettings() {
        try {
            const settingsToSave = {
                totalSessionDuration: timerSettings.totalSessionDuration,
                baseBreakDuration: timerSettings.baseBreakDuration,
                soundEnabled: soundEnabled,
                totalFocusModeEnabled: totalFocusModeEnabled
            };
            localStorage.setItem("timerSettings", JSON.stringify(settingsToSave));
            console.log("[FocusSession] Settings saved:", settingsToSave);
        } catch (e) {
            console.error("[FocusSession] Error saving settings:", e);
        }
    }

    function getUserFocusStats() {
        try {
            const stats = JSON.parse(localStorage.getItem("userFocusStats")) || {};
            stats.totalFocusTimeMinutes = stats.totalFocusTimeMinutes || 0;
            stats.totalFocusSessions = stats.totalFocusSessions || 0;
            stats.totalPoints = stats.totalPoints || 0;
            stats.dailyFocus = stats.dailyFocus || {};
            return stats;
        } catch (e) {
            console.error("[FocusSession] Error getting userFocusStats:", e);
            return { totalFocusTimeMinutes: 0, totalFocusSessions: 0, totalPoints: 0, dailyFocus: {} };
        }
    }

    function saveUserFocusStats(stats) {
        try {
            localStorage.setItem("userFocusStats", JSON.stringify(stats));
            console.log("[FocusSession] userFocusStats saved:", stats);
            window.dispatchEvent(new CustomEvent("focusDataUpdated", { detail: { stats: stats } }));
            window.dispatchEvent(new CustomEvent("userPointsChanged", { detail: { newTotalPoints: stats.totalPoints } }));
        } catch (e) {
            console.error("[FocusSession] Error saving userFocusStats:", e);
        }
    }

    function getFocusSessionHistory() {
        try {
            const history = JSON.parse(localStorage.getItem("focusSessionHistory")) || [];
            return Array.isArray(history) ? history : [];
        } catch (e) {
            console.error("[FocusSession] Error getting focusSessionHistory:", e);
            return [];
        }
    }

    function saveFocusSessionHistory(history) {
        try {
            localStorage.setItem("focusSessionHistory", JSON.stringify(history));
            console.log("[FocusSession] focusSessionHistory saved. Length:", history.length);
        } catch (e) {
            console.error("[FocusSession] Error saving focusSessionHistory:", e);
        }
    }

    function addFocusSessionToHistory(sessionData) {
        const history = getFocusSessionHistory();
        history.push(sessionData);
        saveFocusSessionHistory(history);
    }

    function recordCompletedFocusCycle(durationMinutes) {
        console.log(`[FocusSession] Recording completed focus cycle. Duration: ${durationMinutes}`);
        const stats = getUserFocusStats();
        const today = new Date().toISOString().split("T")[0];

        stats.totalFocusTimeMinutes += durationMinutes;
        stats.totalFocusSessions += 1; // Contagem de sessões para ranking

        if (!stats.dailyFocus[today]) {
            stats.dailyFocus[today] = { minutes: 0, sessions: 0 };
        }
        stats.dailyFocus[today].minutes += durationMinutes;
        stats.dailyFocus[today].sessions += 1;

        let pointsEarned = 1; // Ponto base por ciclo de foco
        stats.totalPoints += pointsEarned;
        console.log(`[FocusSession] Points earned for cycle: ${pointsEarned}. New total: ${stats.totalPoints}`);

        saveUserFocusStats(stats);

        const activeTask = activeTaskIndex !== -1 && selectedTasks[activeTaskIndex] ? selectedTasks[activeTaskIndex].title : "Nenhuma";
        const now = new Date();
        addFocusSessionToHistory({
            date: today,
            time: now.toLocaleTimeString("pt-BR"),
            durationMinutes: durationMinutes,
            mode: "Timer Inteligente", // Modo único agora
            taskTitle: activeTask,
            pointsEarned: pointsEarned,
            isAutoSession: true // Sempre é "auto" agora
        });
    }

    function addBonusPoints(points, reason) {
        console.log(`[FocusSession] Adding bonus points: ${points}. Reason: ${reason}`);
        const stats = getUserFocusStats();
        stats.totalPoints += points;
        saveUserFocusStats(stats);
    }

    // --- Persistência do Timer ---
    function saveTimerState() {
        if (!isRunning) {
            localStorage.removeItem("timerState"); // Limpa se não estiver rodando
            console.log("[FocusSession] Timer not running, state cleared.");
            return;
        }
        const state = {
            isRunning: isRunning,
            remainingTime: remainingTime,
            isFocusTime: isFocusTime,
            sessionCount: sessionCount,
            focusCyclesCompletedInBlock: focusCyclesCompletedInBlock,
            totalSessionRemainingTime: totalSessionRemainingTime,
            sessionStarted: sessionStarted,
            activeTaskIndex: activeTaskIndex,
            selectedTasks: selectedTasks, // Salva o estado das tarefas selecionadas (incluindo progresso)
            expectedEndTime: expectedEndTime, // Salva o timestamp esperado para o fim
            lastCycleDurationMinutes: lastCycleDurationMinutes,
            oneMinuteWarningTriggered: oneMinuteWarningTriggered // NOVO: Salva o estado do aviso de 1 minuto
        };
        try {
            localStorage.setItem("timerState", JSON.stringify(state));
            console.log("[FocusSession] Timer state saved.");
        } catch (e) {
            console.error("[FocusSession] Error saving timer state:", e);
        }
    }

    function restoreTimerState() {
        let state;
        try {
            const savedState = localStorage.getItem("timerState");
            if (!savedState) return false; // Nenhum estado salvo
            state = JSON.parse(savedState);
            localStorage.removeItem("timerState"); // Remove após carregar
        } catch (e) {
            console.error("[FocusSession] Error restoring timer state:", e);
            localStorage.removeItem("timerState");
            return false;
        }

        if (!state || !state.isRunning || !state.expectedEndTime) {
            console.log("[FocusSession] Invalid or non-running saved state found.");
            return false; // Estado inválido ou não estava rodando
        }

        const now = Date.now();
        const expectedEnd = state.expectedEndTime;
        const calculatedRemaining = Math.max(0, Math.round((expectedEnd - now) / 1000));

        console.log(`[FocusSession] Restoring timer state. Expected End: ${new Date(expectedEnd).toLocaleTimeString()}, Now: ${new Date(now).toLocaleTimeString()}, Calculated Remaining: ${calculatedRemaining}`);

        // Restaura estado
        isRunning = state.isRunning;
        isFocusTime = state.isFocusTime;
        sessionCount = state.sessionCount || 0;
        focusCyclesCompletedInBlock = state.focusCyclesCompletedInBlock || 0;
        totalSessionRemainingTime = state.totalSessionRemainingTime || 0;
        sessionStarted = state.sessionStarted || false;
        activeTaskIndex = typeof state.activeTaskIndex === 'number' ? state.activeTaskIndex : -1;
        selectedTasks = Array.isArray(state.selectedTasks) ? state.selectedTasks : [];
        lastCycleDurationMinutes = state.lastCycleDurationMinutes || 0;
        oneMinuteWarningTriggered = state.oneMinuteWarningTriggered || false; // NOVO: Restaura o estado do aviso de 1 minuto

        // Ajusta o tempo restante com base no timestamp absoluto
        remainingTime = calculatedRemaining;
        expectedEndTime = expectedEnd; // Mantém o timestamp original

        // Se o tempo acabou enquanto estava fora
        if (remainingTime <= 0) {
            console.log("[FocusSession] Timer cycle ended while page was inactive.");
            // Simula o fim do ciclo para registrar pontos, trocar tarefa, etc.
            handleCycleEnd(true); // Chama handleCycleEnd indicando que terminou (true para simular fim natural)
            return true; // Estado restaurado, mas ciclo terminou
        }

        // Atualiza UI e reinicia o intervalo
        renderSelectedTasks(); // Renderiza tarefas com progresso salvo
        setActiveTask(activeTaskIndex); // Garante que a tarefa ativa está correta visualmente
        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.disabled = true;
        cancelBtn.disabled = false;
        totalSessionTimeSlider.disabled = true; // Desabilita slider durante a execução
        breakTimeInput.disabled = true;
        totalFocusCheckbox.disabled = true; // Desabilita durante a execução
        customizeCyclesBtn.disabled = true; // Desabilita botão do modal durante a execução

        // Inicia o timer com a nova abordagem baseada em timestamp
        lastUpdateTime = Date.now(); // NOVO: Inicializa o timestamp da última atualização
        timer = setInterval(tickAbsolute, 100); // NOVO: Usa o novo método de tick com intervalo mais curto para maior precisão
        console.log("[FocusSession] Timer state restored and resumed with absolute timing.");
        return true; // Estado restaurado com sucesso
    }

    // --- Inicialização ---
    function initializeApp() {
        console.log("[FocusSession] Initializing App...");
        loadSettings(); // Carrega configurações primeiro
        createTimeMarkers();
        loadTasksFromStorage();
        initInputListeners();
        initActionButtons();
        initModalListeners(); // Inicializa listeners do modal
        initBeforeUnloadListener();
        initVisibilityChangeListener(); // NOVO: Inicializa listener para mudanças de visibilidade

        // Adiciona listener para o evento tasksUpdated para sincronizar tarefas concluídas
        window.addEventListener("tasksUpdated", handleTasksUpdated);

        // Tenta restaurar o estado do timer (se estava rodando)
        if (!restoreTimerState()) {
            resetTimer();
        }
        console.log("[FocusSession] App initialized.");
    }

    // NOVO: Listener para mudanças de visibilidade da página
    function initVisibilityChangeListener() {
        document.addEventListener("visibilitychange", function() {
            if (isRunning) {
                if (document.visibilityState === "visible") {
                    console.log("[FocusSession] Page became visible. Updating timer state...");
                    // Quando a página volta a ficar visível, atualiza o tempo restante com base no timestamp absoluto
                    if (expectedEndTime) {
                        const now = Date.now();
                        remainingTime = Math.max(0, Math.round((expectedEndTime - now) / 1000));
                        
                        // Se o tempo acabou enquanto estava em segundo plano
                        if (remainingTime <= 0) {
                            console.log("[FocusSession] Timer cycle ended while page was hidden.");
                            clearInterval(timer);
                            handleCycleEnd(true);
                        } else {
                            // Atualiza a interface
                            updateTimerDisplay();
                            updateActiveTaskProgress();
                            
                            // Verifica se precisa disparar o aviso de 1 minuto
                            if (isFocusTime && remainingTime <= ONE_MINUTE_WARNING && !oneMinuteWarningTriggered) {
                                playSound("focusEnd"); // Toca o som de aviso
                                oneMinuteWarningTriggered = true;
                            }
                        }
                    }
                    lastUpdateTime = Date.now(); // Reinicia o timestamp da última atualização
                }
            }
        });
    }

    // --- Manipulação de Tarefas ---
    function loadTasksFromStorage() {
        console.log("[FocusSession] Loading tasks from storage...");
        allAvailableTasks = [];
        const storedData = localStorage.getItem("studyTasks");
        if (!storedData) {
            console.log("[FocusSession] No tasks found in storage.");
            renderAvailableTasks([]);
            return;
        }

        try {
            const tasksBySubject = JSON.parse(storedData);
            if (!tasksBySubject || typeof tasksBySubject !== "object" || Array.isArray(tasksBySubject)) {
                console.error("[FocusSession] Invalid tasks data format in storage.");
                renderAvailableTasks([]);
                return;
            }

            // Extrai tarefas pendentes de todas as matérias
            Object.keys(tasksBySubject).forEach(subject => {
                if (Array.isArray(tasksBySubject[subject])) {
                    const pendingTasks = tasksBySubject[subject].filter(task => task && !task.completed && !task.done);
                    allAvailableTasks.push(...pendingTasks);
                }
            });

            console.log(`[FocusSession] Loaded ${allAvailableTasks.length} pending tasks.`);
            renderAvailableTasks(allAvailableTasks);

            // Sincroniza tarefas selecionadas com as disponíveis
            syncSelectedTasksWithAvailable();
        } catch (e) {
            console.error("[FocusSession] Error parsing tasks from storage:", e);
            renderAvailableTasks([]);
        }
    }

    // Função para sincronizar tarefas selecionadas com as disponíveis
    // Remove tarefas concluídas da lista de selecionadas
    function syncSelectedTasksWithAvailable() {
        if (selectedTasks.length === 0) return;

        console.log("[FocusSession] Syncing selected tasks with available tasks...");
        const availableTaskIds = new Set(allAvailableTasks.map(t => t.id));

        // Filtra tarefas selecionadas para manter apenas as que ainda estão disponíveis (não concluídas)
        const originalLength = selectedTasks.length;
        selectedTasks = selectedTasks.filter(task => availableTaskIds.has(task.id));

        if (originalLength !== selectedTasks.length) {
            console.log(`[FocusSession] Removed ${originalLength - selectedTasks.length} completed tasks from selected list.`);

            // Ajusta o índice da tarefa ativa se necessário
            if (activeTaskIndex >= selectedTasks.length) {
                const firstPending = selectedTasks.findIndex(t => !t.completed);
                activeTaskIndex = firstPending !== -1 ? firstPending : -1;
            }

            // Atualiza a interface
            renderSelectedTasks();
            updateSelectedTasksCountAndValidation();
            setActiveTask(activeTaskIndex);
        }
    }

    // Handler para o evento tasksUpdated
    function handleTasksUpdated() {
        console.log("[FocusSession] Tasks updated event received. Reloading tasks...");

        // Recarrega todas as tarefas disponíveis
        loadTasksFromStorage();
    }

    function renderAvailableTasks(tasks) {
        if (!taskListDiv) return;
        taskListDiv.innerHTML = "";
        if (tasks.length === 0) {
            taskListDiv.innerHTML = "<p>Nenhuma tarefa pendente disponível.</p>";
            return;
        }

        tasks.forEach(task => {
            if (!task || typeof task.id === "undefined" || typeof task.title === "undefined") return;
            const taskButton = document.createElement("button");
            taskButton.className = "btn-task";
            taskButton.setAttribute("data-task-id", task.id);
            taskButton.setAttribute("aria-pressed", "false");
            taskButton.innerHTML = `
                <span class="task-title">${task.title}</span>
                <span class="task-subject">${task.subject || ""}</span>
            `;
            taskButton.addEventListener("click", () => toggleTaskSelection(task, taskButton));
            taskListDiv.appendChild(taskButton);
        });

        // Marca botões de tarefas já selecionadas
        selectedTasks.forEach(selectedTask => {
            const button = taskListDiv.querySelector(`.btn-task[data-task-id="${selectedTask.id}"]`);
            if (button) {
                button.classList.add("active");
                button.setAttribute("aria-pressed", "true");
            }
        });
    }

    function toggleTaskSelection(task, button) {
        if (isRunning) {
            alert("Cancele a sessão atual antes de alterar as tarefas.");
            return;
        }
        const taskIndexInSelected = selectedTasks.findIndex(t => t.id === task.id);
        if (taskIndexInSelected > -1) {
            const removingActive = (activeTaskIndex === taskIndexInSelected);
            selectedTasks.splice(taskIndexInSelected, 1);
            if (button) {
                button.classList.remove("active");
                button.setAttribute("aria-pressed", "false");
            }
            if (removingActive) {
                const firstPending = selectedTasks.findIndex(t => !t.completed);
                activeTaskIndex = firstPending !== -1 ? firstPending : -1;
            } else if (activeTaskIndex > taskIndexInSelected) {
                activeTaskIndex--;
            }
            setActiveTask(activeTaskIndex);
        } else {
            if (selectedTasks.length < MAX_TASKS) {
                selectedTasks.push({ ...task, progress: 0, completed: false });
                if (button) {
                    button.classList.add("active");
                    button.setAttribute("aria-pressed", "true");
                }
                if (selectedTasks.length === 1) {
                    setActiveTask(0);
                }
            } else {
                alert(`Você pode selecionar no máximo ${MAX_TASKS} tarefas.`);
            }
        }
        renderSelectedTasks();
        updateSelectedTasksCountAndValidation();
    }

    function renderSelectedTasks() {
        selectedTasksListDiv.innerHTML = "";
        if (selectedTasks.length === 0) {
            selectedTasksListDiv.innerHTML = "<p>Nenhuma tarefa selecionada para a sessão.</p>";
            activeTaskIndex = -1;
        } else {
            selectedTasks.forEach((task, index) => {
                if (!task || typeof task.id === "undefined" || typeof task.title === "undefined") return;
                const taskElement = document.createElement("div");
                taskElement.className = `selected-task ${index === activeTaskIndex ? "task-active" : ""} ${task.completed ? "completed" : ""}`;
                taskElement.setAttribute("data-task-id", task.id);
                const progressValue = task.progress || 0;
                const roundedProgress = Math.round(progressValue);
                taskElement.innerHTML = `
                    <span class="task-title">${task.title} ${task.completed ? "(Concluída)" : ""}</span>
                    <div class="task-progress-bar">
                        <div class="progress" style="width: ${progressValue}%;">
                            <span class="progress-text">${roundedProgress}%</span>
                        </div>
                    </div>
                    <i class="fas fa-times remove-task-icon" data-task-id="${task.id}" aria-label="Remover tarefa ${task.title} da sessão"></i>
                `;
                selectedTasksListDiv.appendChild(taskElement);
            });
            selectedTasksListDiv.querySelectorAll(".remove-task-icon").forEach((icon) => {
                icon.addEventListener("click", (e) => {
                    if (isRunning) {
                        alert("Cancele a sessão atual antes de remover tarefas.");
                        return;
                    }
                    const taskIdToRemove = e.target.getAttribute("data-task-id");
                    const taskButton = taskListDiv ? taskListDiv.querySelector(`.btn-task[data-task-id="${taskIdToRemove}"]`) : null;
                    const taskDefinition = allAvailableTasks.find(t => t.id === taskIdToRemove);
                    if (taskDefinition && taskButton) {
                        toggleTaskSelection(taskDefinition, taskButton);
                    } else {
                        const idx = selectedTasks.findIndex(t => t.id === taskIdToRemove);
                        if (idx > -1) {
                            selectedTasks.splice(idx, 1);
                            if (activeTaskIndex === idx) {
                                const firstPending = selectedTasks.findIndex(t => !t.completed);
                                activeTaskIndex = firstPending !== -1 ? firstPending : -1;
                            } else if (activeTaskIndex > idx) {
                                activeTaskIndex--;
                            }
                            renderSelectedTasks();
                            updateSelectedTasksCountAndValidation();
                        }
                    }
                    e.stopPropagation();
                });
            });
        }
        updateNextSessionInfo();
    }

    function setActiveTask(index) {
        let newActiveIndex = -1;
        if (index >= 0 && index < selectedTasks.length && !selectedTasks[index].completed) {
            newActiveIndex = index;
        } else if (selectedTasks.length > 0) {
            const firstAvailable = selectedTasks.findIndex(t => !t.completed);
            if (firstAvailable !== -1) {
                newActiveIndex = firstAvailable;
            }
        }
        activeTaskIndex = newActiveIndex;
        selectedTasksListDiv.querySelectorAll(".selected-task").forEach((taskEl, idx) => {
            taskEl.classList.toggle("task-active", idx === activeTaskIndex);
        });
        updateNextSessionInfo();
    }

    function updateActiveTaskProgress() {
        if (activeTaskIndex === -1 || !selectedTasks[activeTaskIndex] || selectedTasks[activeTaskIndex].completed || !isFocusTime || !isRunning) return;
        const totalDuration = lastCycleDurationMinutes * 60; // Usa a duração do ciclo que acabou de ser completado ou está rodando
        if (totalDuration <= 0) return;
        const elapsed = totalDuration - remainingTime;
        const percentage = (elapsed / totalDuration) * 100;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const activeTaskElementContainer = selectedTasksListDiv.querySelector(`.selected-task[data-task-id="${selectedTasks[activeTaskIndex].id}"]`);
        if (!activeTaskElementContainer) return;
        const progressBar = activeTaskElementContainer.querySelector(".progress");
        const progressText = activeTaskElementContainer.querySelector(".progress-text");
        if (progressBar && progressText) {
            progressBar.style.width = `${clampedPercentage}%`;
            const roundedPercentage = Math.round(clampedPercentage);
            progressText.textContent = `${roundedPercentage}%`;
            progressText.style.color = clampedPercentage > 50 ? "white" : "var(--text-color)";
            progressText.style.mixBlendMode = clampedPercentage > 50 ? "overlay" : "normal";
            selectedTasks[activeTaskIndex].progress = clampedPercentage;
        }
    }

    function markTaskAsCompleted() {
        if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex]) {
            const completedTaskId = selectedTasks[activeTaskIndex].id;
            console.log(`[FocusSession] Marking task ${completedTaskId} as completed IN SESSION.`);
            selectedTasks[activeTaskIndex].progress = 100;
            selectedTasks[activeTaskIndex].completed = true;
            saveTaskCompletionStatus(completedTaskId, true);
            renderSelectedTasks();
            let nextIndex = selectedTasks.findIndex(t => !t.completed);
            if (nextIndex !== -1) {
                setActiveTask(nextIndex);
            } else {
                activeTaskIndex = -1;
                updateNextSessionInfo();
                updateSelectedTasksCountAndValidation();
                if (selectedTasks.every(task => task.completed)) {
                    alert("Parabéns! Todas as tarefas selecionadas para esta sessão foram concluídas.");
                }
            }
        }
    }

    function saveTaskCompletionStatus(taskId, isCompleted) {
        console.log(`[FocusSession] Saving completion status (${isCompleted}) for task ${taskId} to localStorage (\"studyTasks\").`);
        const storedData = localStorage.getItem("studyTasks");
        let tasksBySubject = {};
        if (storedData) {
            try {
                tasksBySubject = JSON.parse(storedData);
                if (!tasksBySubject || typeof tasksBySubject !== "object" || Array.isArray(tasksBySubject)) return;
            } catch (e) { return; }
        }
        let taskFoundAndUpdated = false;
        Object.keys(tasksBySubject).forEach(subject => {
            if (Array.isArray(tasksBySubject[subject])) {
                const taskIndex = tasksBySubject[subject].findIndex(t => t && t.id === taskId);
                if (taskIndex !== -1) {
                    tasksBySubject[subject][taskIndex].completed = isCompleted;
                    tasksBySubject[subject][taskIndex].done = isCompleted;
                    taskFoundAndUpdated = true;
                }
            }
        });
        if (taskFoundAndUpdated) {
            localStorage.setItem("studyTasks", JSON.stringify(tasksBySubject));
            window.dispatchEvent(new CustomEvent("tasksUpdated"));
            if (isCompleted) {
                 const internalTaskIndex = allAvailableTasks.findIndex(t => t && t.id === taskId);
                 if (internalTaskIndex !== -1) {
                     allAvailableTasks.splice(internalTaskIndex, 1);
                     renderAvailableTasks(allAvailableTasks);
                 }
            } else {
                loadTasksFromStorage();
            }
        } else {
            console.warn(`[FocusSession] Task ${taskId} not found in localStorage (\"studyTasks\") object for saving.`);
        }
    }

    function updateSelectedTasksCountAndValidation() {
        const count = selectedTasks.length;
        selectedTasksCountElement.textContent = `${count}/${MAX_TASKS}`;
        const hasPendingSelected = selectedTasks.some(t => !t.completed);
        const canStart = !isRunning && count > 0 && hasPendingSelected;
        if (count === 0) {
            tasksValidationElement.textContent = "Selecione pelo menos uma tarefa.";
            tasksValidationElement.style.display = "flex";
        } else if (!hasPendingSelected) {
            tasksValidationElement.textContent = "Todas as tarefas selecionadas estão concluídas.";
            tasksValidationElement.style.display = "flex";
        } else {
            tasksValidationElement.style.display = "none";
        }
        startBtn.disabled = !canStart;
    }

    // --- Lógica do Timer (Adaptada para modo único e tempo absoluto) ---

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function updateTimerDisplay() {
        timeDisplay.textContent = formatTime(remainingTime);
        let totalTimeForProgress = 0;
        if (!isRunning) {
            calculateAutoDurations();
            totalTimeForProgress = currentCycleFocusDuration * 60;
            remainingTime = totalTimeForProgress; // Mostra tempo total quando parado
        } else {
            totalTimeForProgress = isFocusTime ? currentCycleFocusDuration * 60 : currentCycleBreakDuration * 60;
        }
        const currentProgressTime = Math.max(0, totalTimeForProgress - remainingTime);
        const progressPercentage = totalTimeForProgress > 0 ? (currentProgressTime / totalTimeForProgress) * 100 : 0;
        const clampedProgress = Math.max(0, Math.min(100, progressPercentage));
        const progressColor = isFocusTime ? "var(--primary-color)" : "var(--break-color, var(--secondary-color))";
        progressCircle.style.background = `conic-gradient(${progressColor} ${clampedProgress}%, transparent ${clampedProgress}%)`;
        progressPercentageElement.textContent = `${Math.round(clampedProgress)}%`;
        clockCircle.classList.toggle("timer-active", remainingTime <= 10 && remainingTime > 0 && isRunning);
    }

    function updateNextSessionInfo() {
        let currentActiveTaskTitle = "Nenhuma tarefa ativa";
        if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex]) {
            currentActiveTaskTitle = selectedTasks[activeTaskIndex].title;
        }
        if (!isRunning) {
            timerModeElement.className = "timer-mode-indicator auto";
            timerModeText.textContent = "Timer Inteligente";
            const hasPending = selectedTasks.some(t => !t.completed);
            const readyMsg = hasPending ? `Pronto (${timerSettings.totalSessionDuration} min)` : (selectedTasks.length > 0 ? "Todas selecionadas concluídas" : "Selecione tarefas pendentes");
            nextSessionElement.innerHTML = `<i class="fas fa-hourglass-start"></i> ${readyMsg}`;
        } else if (isFocusTime) {
            timerModeElement.className = "timer-mode-indicator focus";
            timerModeText.textContent = `Foco: ${currentActiveTaskTitle}`;
            const isLongBreakNext = (focusCyclesCompletedInBlock + 1) % LONG_BREAK_INTERVAL === 0;
            const nextBreakDuration = isLongBreakNext ? timerSettings.baseBreakDuration * 2 : timerSettings.baseBreakDuration;
            nextSessionElement.innerHTML = `<i class="fas fa-coffee"></i> Próxima pausa (${nextBreakDuration} min) em ${formatTime(remainingTime)}`;
        } else {
            timerModeElement.className = "timer-mode-indicator break";
            const isLongBreak = currentCycleBreakDuration > timerSettings.baseBreakDuration;
            timerModeText.textContent = isLongBreak ? "Pausa Longa" : "Pausa Curta";
            calculateAutoDurations();
            nextSessionElement.innerHTML = `<i class="fas fa-brain"></i> Próximo foco (${currentCycleFocusDuration} min) em ${formatTime(remainingTime)}`;
        }
    }

    function resetTimer() {
        console.log("[FocusSession] Resetting timer...");
        clearInterval(timer);
        isRunning = false;
        isFocusTime = true;
        sessionCount = 0;
        focusCyclesCompletedInBlock = 0;
        totalSessionRemainingTime = 0;
        sessionStarted = false;
        lastCycleDurationMinutes = 0;
        expectedEndTime = null;
        lastUpdateTime = null;
        oneMinuteWarningTriggered = false; // NOVO: Reseta o aviso de 1 minuto

        totalSessionRemainingTime = timerSettings.totalSessionDuration * 60;
        calculateAutoDurations();
        remainingTime = currentCycleFocusDuration * 60;

        updateTimerDisplay();
        updateNextSessionInfo();

        startBtn.disabled = !selectedTasks.some(t => !t.completed);
        cancelBtn.disabled = true;
        totalSessionTimeSlider.disabled = false; // Habilita slider
        breakTimeInput.disabled = false;
        totalFocusCheckbox.disabled = false;
        customizeCyclesBtn.disabled = false; // Habilita botão do modal

        console.log("[FocusSession] Timer reset complete.");
    }

    let currentCycleFocusDuration = 25; // Duração do ciclo de foco atual (calculado)
    let currentCycleBreakDuration = 5; // Duração do ciclo de pausa atual (calculado)

    function calculateAutoDurations() {
        const totalMinutes = timerSettings.totalSessionDuration;
        let calculatedFocusDuration = 25;
        if (totalMinutes <= 45) {
            calculatedFocusDuration = Math.min(40, Math.max(20, totalMinutes - timerSettings.baseBreakDuration));
        } else if (totalMinutes <= 90) {
            calculatedFocusDuration = 30;
        } else if (totalMinutes <= 150) {
            calculatedFocusDuration = 25;
        } else {
            calculatedFocusDuration = 20;
        }
        if (sessionStarted && totalSessionRemainingTime > 0) {
             const maxPossibleFocus = Math.floor(totalSessionRemainingTime / 60);
             currentCycleFocusDuration = Math.min(calculatedFocusDuration, maxPossibleFocus);
        } else {
             currentCycleFocusDuration = calculatedFocusDuration;
        }
        currentCycleFocusDuration = Math.max(5, currentCycleFocusDuration);
        // Break duration é calculado no fim do ciclo de foco
    }

    // NOVO: Função de tick baseada em timestamp absoluto
    function tickAbsolute() {
        const now = Date.now();
        
        // Calcula o tempo restante com base no timestamp absoluto
        if (expectedEndTime) {
            remainingTime = Math.max(0, Math.round((expectedEndTime - now) / 1000));
            
            // Verifica se é hora de tocar o som de aviso (1 minuto antes do fim do foco)
            if (isFocusTime && remainingTime <= ONE_MINUTE_WARNING && !oneMinuteWarningTriggered) {
                playSound("focusEnd"); // Toca o som de aviso
                oneMinuteWarningTriggered = true;
                console.log("[FocusSession] One minute warning triggered!");
            }
            
            // Atualiza a interface a cada tick para garantir animação suave
            updateTimerDisplay();
            updateActiveTaskProgress();
            
            // Salva o estado periodicamente (a cada 5 segundos)
            if (now % 5000 < 100) {
                saveTimerState();
            }
            
            // Verifica se o ciclo terminou
            if (remainingTime <= 0) {
                clearInterval(timer);
                handleCycleEnd();
            }
        }
    }

    function startTimer() {
        if (isRunning) return;
        if (selectedTasks.length === 0 || !selectedTasks.some(t => !t.completed)) {
            alert("Selecione pelo menos uma tarefa pendente antes de iniciar.");
            return;
        }

        console.log("[FocusSession] Starting timer...");
        isRunning = true;
        sessionStarted = true;
        isFocusTime = true;
        oneMinuteWarningTriggered = false; // NOVO: Reseta o aviso de 1 minuto

        // Configura o primeiro ciclo de foco
        calculateAutoDurations();
        remainingTime = currentCycleFocusDuration * 60;
        lastCycleDurationMinutes = currentCycleFocusDuration;
        
        // NOVO: Configura timestamps para timing absoluto
        expectedEndTime = Date.now() + remainingTime * 1000;
        lastUpdateTime = Date.now();

        // Atualiza UI
        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.disabled = true;
        cancelBtn.disabled = false;
        totalSessionTimeSlider.disabled = true; // Desabilita slider
        breakTimeInput.disabled = true;
        totalFocusCheckbox.disabled = true;
        customizeCyclesBtn.disabled = true; // Desabilita botão do modal

        // Inicia o timer com a nova abordagem baseada em timestamp
        timer = setInterval(tickAbsolute, 100); // Intervalo mais curto para maior precisão
        playSound("focusStart");
        saveTimerState();
        console.log(`[FocusSession] Timer started with absolute timing. Focus duration: ${currentCycleFocusDuration} min. Total session time: ${timerSettings.totalSessionDuration} min.`);
    }

    function cancelTimer() {
        if (!isRunning) return;
        if (confirm("Tem certeza que deseja cancelar a sessão atual? O progresso não será salvo.")) {
            console.log("[FocusSession] Timer cancelled by user.");
            clearInterval(timer);
            resetTimer();
            saveTimerState(); // Limpa o estado salvo
        }
    }

    function handleCycleEnd(autoTriggered = false) {
        clearInterval(timer);
        console.log(`[FocusSession] Cycle ended. Was focus: ${isFocusTime}. Auto-triggered: ${autoTriggered}`);

        if (isFocusTime) {
            // Fim de um ciclo de FOCO
            playSound("focusEnd");
            sessionCount++;
            focusCyclesCompletedInBlock++;
            recordCompletedFocusCycle(lastCycleDurationMinutes);

            // MODIFICADO: Sempre pergunta se quer marcar a tarefa como concluída, independente da tarefa
            if (activeTaskIndex !== -1) {
                const activeTask = selectedTasks[activeTaskIndex];
                if (activeTask && !activeTask.completed && confirm(`Deseja marcar a tarefa "${activeTask.title}" como concluída?`)) {
                    markTaskAsCompleted();
                }
            }

            // Verifica se ainda há tempo na sessão e tarefas pendentes
            const hasPendingTasks = selectedTasks.some(t => !t.completed);
            const hasTimeLeft = totalSessionRemainingTime > timerSettings.baseBreakDuration * 60;

            if (!hasPendingTasks || !hasTimeLeft) {
                // Fim da sessão completa
                console.log("[FocusSession] Session completed. No pending tasks or time left.");
                alert(`Sessão concluída! ${sessionCount} ciclos de foco completados.`);
                resetTimer();
                return;
            }

            // Configura o próximo ciclo (PAUSA)
            isFocusTime = false;
            oneMinuteWarningTriggered = false; // NOVO: Reseta o aviso de 1 minuto para o próximo ciclo
            const isLongBreak = focusCyclesCompletedInBlock % LONG_BREAK_INTERVAL === 0;
            currentCycleBreakDuration = isLongBreak ? timerSettings.baseBreakDuration * 2 : timerSettings.baseBreakDuration;
            remainingTime = currentCycleBreakDuration * 60;
            playSound("breakStart");
        } else {
            // Fim de um ciclo de PAUSA
            playSound("breakEnd");

            // Configura o próximo ciclo (FOCO)
            isFocusTime = true;
            oneMinuteWarningTriggered = false; // NOVO: Reseta o aviso de 1 minuto para o próximo ciclo
            calculateAutoDurations();
            remainingTime = currentCycleFocusDuration * 60;
            lastCycleDurationMinutes = currentCycleFocusDuration;

            // Seleciona próxima tarefa pendente se necessário
            if (activeTaskIndex === -1 || selectedTasks[activeTaskIndex].completed) {
                const nextPendingIndex = selectedTasks.findIndex(t => !t.completed);
                if (nextPendingIndex !== -1) {
                    setActiveTask(nextPendingIndex);
                }
            }
        }

        // NOVO: Configura timestamps para timing absoluto
        expectedEndTime = Date.now() + remainingTime * 1000;
        lastUpdateTime = Date.now();

        // Atualiza UI e reinicia o timer
        updateTimerDisplay();
        updateNextSessionInfo();
        timer = setInterval(tickAbsolute, 100); // Intervalo mais curto para maior precisão
        saveTimerState();
    }

    // --- Funcionalidades Adicionais ---

    function createTimeMarkers() {
        if (!markersContainer) return;
        markersContainer.innerHTML = "";
        for (let i = 0; i < 12; i++) {
            const marker = document.createElement("div");
            marker.className = "time-marker";
            marker.style.transform = `rotate(${i * 30}deg)`;
            markersContainer.appendChild(marker);
        }
    }

    function playSound(type) {
        if (!soundEnabled) return;
        let audioElement = null;
        switch (type) {
            case "focusStart":
                audioElement = focusStartSound;
                break;
            case "focusEnd":
                audioElement = focusEndSound;
                break;
            case "breakStart":
                audioElement = breakStartSound;
                break;
            case "breakEnd":
                audioElement = breakEndSound;
                break;
        }
        if (audioElement && audioElement.play) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.warn(`[FocusSession] Error playing sound (${type}):`, e));
        }
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        updateSoundToggleVisual();
        saveSettings();
        console.log(`[FocusSession] Sound ${soundEnabled ? "enabled" : "disabled"}.`);
    }

    function updateSoundToggleVisual() {
        if (soundToggleIcon) {
            soundToggleIcon.className = soundEnabled ? "fas fa-volume-up" : "fas fa-volume-mute";
            soundToggleBtn.setAttribute("aria-label", soundEnabled ? "Desativar sons" : "Ativar sons");
            soundToggleBtn.setAttribute("title", soundEnabled ? "Desativar sons" : "Ativar sons");
        }
    }

    function toggleTotalFocusMode() {
        totalFocusModeEnabled = totalFocusCheckbox.checked;
        saveSettings();
        console.log(`[FocusSession] Total Focus Mode ${totalFocusModeEnabled ? "enabled" : "disabled"}.`);
    }

    function initBeforeUnloadListener() {
        window.addEventListener("beforeunload", function(e) {
            saveTimerState(); // Salva o estado atual do timer
            if (isRunning && totalFocusModeEnabled && isFocusTime) {
                const message = "Você está em uma sessão de foco. Tem certeza que deseja sair?";
                e.returnValue = message;
                return message;
            }
        });
    }

    function initInputListeners() {
        // Listener para o Slider de Tempo Total
        totalSessionTimeSlider.addEventListener("input", function() {
            const value = parseInt(this.value);
            totalSessionTimeValueSpan.textContent = value;
            if (!isRunning) {
                timerSettings.totalSessionDuration = value;
                totalSessionRemainingTime = timerSettings.totalSessionDuration * 60;
                calculateAutoDurations();
                remainingTime = currentCycleFocusDuration * 60;
                updateTimerDisplay();
                updateNextSessionInfo();
            }
        });
        totalSessionTimeSlider.addEventListener("change", function() {
             // Salva ao soltar o slider
             timerSettings.totalSessionDuration = parseInt(this.value);
             saveSettings();
        });

        // Listener para o Input de Tempo de Pausa (dentro do modal)
        breakTimeInput.addEventListener("input", function() {
            validateInput(this, 5, 30);
        });
        breakTimeInput.addEventListener("blur", function() {
            if (validateInput(this, 5, 30, 5)) {
                timerSettings.baseBreakDuration = parseInt(this.value) || 5;
                if (!isRunning) updateNextSessionInfo();
                saveSettings();
            }
        });
        breakTimeInput.addEventListener("keydown", function(event) { if (event.key === "Enter") this.blur(); });

        // Listener para o Checkbox Foco Total (dentro do modal)
        totalFocusCheckbox.addEventListener("change", toggleTotalFocusMode);
    }

    function initActionButtons() {
        startBtn.addEventListener("click", startTimer);
        cancelBtn.addEventListener("click", cancelTimer);
        soundToggleBtn.addEventListener("click", toggleSound);
        // O listener do totalFocusCheckbox foi movido para initInputListeners
    }

    function validateInput(inputElement, min, max, defaultValue = null) {
        let valueStr = inputElement.value.trim();
        let value = parseInt(valueStr);
        let isValid = !isNaN(value) && value >= min && value <= max;
        const isBlurEvent = document.activeElement !== inputElement;

        if (isBlurEvent) {
            if (valueStr === "" && defaultValue !== null) {
                inputElement.value = defaultValue;
                return true;
            } else if (!isValid) {
                const finalValue = defaultValue !== null ? defaultValue : min;
                inputElement.value = finalValue;
                alert(`Valor inválido. Deve ser um número entre ${min} e ${max}. Restaurado para ${finalValue}.`);
                return true;
            }
            return true;
        } else {
            if (!/^[0-9]*$/.test(valueStr)) {
                 inputElement.value = valueStr.replace(/[^0-9]/g, "");
                 value = parseInt(inputElement.value);
                 isValid = !isNaN(value) && value >= min && value <= max;
            }
            if (!isNaN(value) && value > max) {
                 inputElement.value = max;
                 isValid = true;
            }
            return !isNaN(parseInt(inputElement.value)) || inputElement.value === "";
        }
    }

    // --- Inicialização da Aplicação ---
    initializeApp();
});
