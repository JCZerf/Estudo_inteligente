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
    const enableCustomFocusTimeCheckbox = getElement("enable-custom-focus-time"); // NOVO
    const customFocusTimeInput = getElement("custom-focus-time"); // NOVO
    const customFocusTimeContainer = getElement("custom-focus-time-container"); // NOVO
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
        customizeCyclesBtn, customizeModal,
        enableCustomFocusTimeCheckbox, customFocusTimeInput, customFocusTimeContainer, // NOVO
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
    let lastUpdateTime = null; // Timestamp da última atualização do timer
    let oneMinuteWarningTriggered = false; // Flag para controlar o aviso de 1 minuto
    let notificationPermission = "default"; // Estado da permissão de notificação

    const LONG_BREAK_INTERVAL = 4; // Ciclos de foco antes de uma pausa longa
    const MAX_TASKS = 8;
    const ONE_MINUTE_WARNING = 60; // Constante para aviso de 1 minuto (em segundos)
    const MIN_FOCUS_TIME = 15; // NOVO: Tempo mínimo de foco
    const MAX_FOCUS_TIME = 50; // NOVO: Tempo máximo de foco customizado
    const DEFAULT_FOCUS_TIME = 25; // NOVO: Tempo de foco padrão

    // --- Configurações do Timer Inteligente (Persistidas) ---
    let timerSettings = {
        totalSessionDuration: 60, // Duração total definida pelo usuário (minutos)
        baseBreakDuration: 5,     // Duração da pausa curta definida pelo usuário (minutos)
        enableCustomFocus: false, // NOVO: Flag para tempo de foco customizado
        customFocusDuration: DEFAULT_FOCUS_TIME // NOVO: Tempo de foco customizado
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
            if (customizeCyclesBtn) customizeCyclesBtn.focus();
        }
    }

    function initModalListeners() {
        customizeCyclesBtn.addEventListener("click", () => openModal("customize-modal"));
        modalCloseBtns.forEach(btn => {
            btn.addEventListener("click", () => closeModal("customize-modal"));
        });
        const modalOverlay = customizeModal.querySelector(".modal-overlay");
        if (modalOverlay) {
            modalOverlay.addEventListener("click", (event) => {
                if (event.target === modalOverlay) {
                    closeModal("customize-modal");
                }
            });
        }
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
            timerSettings.enableCustomFocus = typeof savedSettings.enableCustomFocus === "boolean" ? savedSettings.enableCustomFocus : false; // NOVO
            timerSettings.customFocusDuration = parseInt(savedSettings.customFocusDuration) || DEFAULT_FOCUS_TIME; // NOVO

            // Atualiza inputs e toggles com valores carregados
            totalSessionTimeSlider.value = timerSettings.totalSessionDuration;
            totalSessionTimeValueSpan.textContent = timerSettings.totalSessionDuration;
            breakTimeInput.value = timerSettings.baseBreakDuration;
            totalFocusCheckbox.checked = totalFocusModeEnabled;
            enableCustomFocusTimeCheckbox.checked = timerSettings.enableCustomFocus; // NOVO
            customFocusTimeInput.value = timerSettings.customFocusDuration; // NOVO
            customFocusTimeContainer.style.display = timerSettings.enableCustomFocus ? "flex" : "none"; // NOVO
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
                totalFocusModeEnabled: totalFocusModeEnabled,
                enableCustomFocus: timerSettings.enableCustomFocus, // NOVO
                customFocusDuration: timerSettings.customFocusDuration // NOVO
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
        stats.totalFocusSessions += 1;

        if (!stats.dailyFocus[today]) {
            stats.dailyFocus[today] = { minutes: 0, sessions: 0 };
        }
        stats.dailyFocus[today].minutes += durationMinutes;
        stats.dailyFocus[today].sessions += 1;

        let pointsEarned = 1;
        stats.totalPoints += pointsEarned;
        console.log(`[FocusSession] Points earned for cycle: ${pointsEarned}. New total: ${stats.totalPoints}`);

        saveUserFocusStats(stats);

        const activeTask = activeTaskIndex !== -1 && selectedTasks[activeTaskIndex] ? selectedTasks[activeTaskIndex].title : "Nenhuma";
        const now = new Date();
        addFocusSessionToHistory({
            date: today,
            time: now.toLocaleTimeString("pt-BR"),
            durationMinutes: durationMinutes,
            mode: "Timer Inteligente",
            taskTitle: activeTask,
            pointsEarned: pointsEarned,
            isAutoSession: !timerSettings.enableCustomFocus // Indica se foi custom ou auto
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
            localStorage.removeItem("timerState");
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
            selectedTasks: selectedTasks,
            expectedEndTime: expectedEndTime,
            lastCycleDurationMinutes: lastCycleDurationMinutes,
            oneMinuteWarningTriggered: oneMinuteWarningTriggered
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
            if (!savedState) return false;
            state = JSON.parse(savedState);
            localStorage.removeItem("timerState");
        } catch (e) {
            console.error("[FocusSession] Error restoring timer state:", e);
            localStorage.removeItem("timerState");
            return false;
        }

        if (!state || !state.isRunning || !state.expectedEndTime) {
            console.log("[FocusSession] Invalid or non-running saved state found.");
            return false;
        }

        const now = Date.now();
        const expectedEnd = state.expectedEndTime;
        const calculatedRemaining = Math.max(0, Math.round((expectedEnd - now) / 1000));

        console.log(`[FocusSession] Restoring timer state. Expected End: ${new Date(expectedEnd).toLocaleTimeString()}, Now: ${new Date(now).toLocaleTimeString()}, Calculated Remaining: ${calculatedRemaining}`);

        isRunning = state.isRunning;
        isFocusTime = state.isFocusTime;
        sessionCount = state.sessionCount || 0;
        focusCyclesCompletedInBlock = state.focusCyclesCompletedInBlock || 0;
        totalSessionRemainingTime = state.totalSessionRemainingTime || 0;
        sessionStarted = state.sessionStarted || false;
        activeTaskIndex = typeof state.activeTaskIndex === "number" ? state.activeTaskIndex : -1;
        selectedTasks = Array.isArray(state.selectedTasks) ? state.selectedTasks : [];
        lastCycleDurationMinutes = state.lastCycleDurationMinutes || 0;
        oneMinuteWarningTriggered = state.oneMinuteWarningTriggered || false;

        remainingTime = calculatedRemaining;
        expectedEndTime = expectedEnd;

        if (remainingTime <= 0) {
            console.log("[FocusSession] Timer cycle ended while page was inactive.");
            handleCycleEnd(true);
            return true;
        }

        renderSelectedTasks();
        setActiveTask(activeTaskIndex);
        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.disabled = true;
        cancelBtn.disabled = false;
        totalSessionTimeSlider.disabled = true;
        breakTimeInput.disabled = true;
        totalFocusCheckbox.disabled = true;
        customizeCyclesBtn.disabled = true;
        enableCustomFocusTimeCheckbox.disabled = true; // NOVO: Desabilita no modal durante a sessão
        customFocusTimeInput.disabled = true; // NOVO: Desabilita no modal durante a sessão

        lastUpdateTime = Date.now();
        timer = setInterval(tickAbsolute, 100);
        console.log("[FocusSession] Timer state restored and resumed with absolute timing.");
        return true;
    }

    // --- Inicialização ---
    function initializeApp() {
        console.log("[FocusSession] Initializing App...");
        loadSettings();
        createTimeMarkers();
        loadTasksFromStorage();
        initInputListeners();
        initActionButtons();
        initModalListeners();
        initBeforeUnloadListener();
        initVisibilityChangeListener();
        checkNotificationPermission();

        window.addEventListener("tasksUpdated", handleTasksUpdated);

        if (!restoreTimerState()) {
            resetTimer();
        }
        console.log("[FocusSession] App initialized.");
    }

    // --- Notificações ---
    function checkNotificationPermission() {
        if (!("Notification" in window)) {
            console.warn("[FocusSession] Notifications not supported by this browser.");
            notificationPermission = "unsupported";
            return;
        }
        notificationPermission = Notification.permission;
        console.log(`[FocusSession] Notification permission status: ${notificationPermission}`);
    }

    function requestNotificationPermission() {
        if (notificationPermission === "default") {
            Notification.requestPermission().then(permission => {
                notificationPermission = permission;
                console.log(`[FocusSession] Notification permission request result: ${permission}`);
                if (permission === "granted") {
                    console.log("[FocusSession] Notification permission granted.");
                } else {
                    console.warn("[FocusSession] Notification permission denied or dismissed.");
                }
            });
        }
    }

    function showNotification(title, body, soundPath) {
        if (notificationPermission !== "granted") {
            console.log("[FocusSession] Cannot show notification, permission not granted.");
            return;
        }

        const options = {
            body: body,
            icon: "../../shared/assets/img/logo-estudo-inteligente.png",
        };

        try {
            const notification = new Notification(title, options);
            console.log("[FocusSession] Notification shown:", title);
            
            if (soundEnabled && soundPath) {
                const audio = new Audio(soundPath);
                audio.play().catch(e => console.warn(`[FocusSession] Error playing notification sound (${soundPath}):`, e));
            }

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (e) {
            console.error("[FocusSession] Error showing notification:", e);
        }
    }

    // --- Listener para mudanças de visibilidade da página ---
    function initVisibilityChangeListener() {
        document.addEventListener("visibilitychange", function() {
            if (isRunning) {
                if (document.visibilityState === "visible") {
                    console.log("[FocusSession] Page became visible. Updating timer state...");
                    if (expectedEndTime) {
                        const now = Date.now();
                        remainingTime = Math.max(0, Math.round((expectedEndTime - now) / 1000));
                        if (remainingTime <= 0) {
                            console.log("[FocusSession] Timer cycle ended while page was hidden.");
                            clearInterval(timer);
                            handleCycleEnd(true);
                        } else {
                            updateTimerDisplay();
                            updateActiveTaskProgress();
                            if (isFocusTime && remainingTime <= ONE_MINUTE_WARNING && !oneMinuteWarningTriggered) {
                                playSound("focusEnd");
                                oneMinuteWarningTriggered = true;
                            }
                        }
                    }
                    lastUpdateTime = Date.now();
                } else {
                    console.log("[FocusSession] Page became hidden.");
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

            Object.keys(tasksBySubject).forEach(subject => {
                if (Array.isArray(tasksBySubject[subject])) {
                    const pendingTasks = tasksBySubject[subject].filter(task => task && !task.completed && !task.done);
                    allAvailableTasks.push(...pendingTasks);
                }
            });

            console.log(`[FocusSession] Loaded ${allAvailableTasks.length} pending tasks.`);
            renderAvailableTasks(allAvailableTasks);
            syncSelectedTasksWithAvailable();
        } catch (e) {
            console.error("[FocusSession] Error parsing tasks from storage:", e);
            renderAvailableTasks([]);
        }
    }

    function syncSelectedTasksWithAvailable() {
        if (selectedTasks.length === 0) return;

        console.log("[FocusSession] Syncing selected tasks with available tasks...");
        const availableTaskIds = new Set(allAvailableTasks.map(t => t.id));

        const originalLength = selectedTasks.length;
        selectedTasks = selectedTasks.filter(task => availableTaskIds.has(task.id));

        if (originalLength !== selectedTasks.length) {
            console.log(`[FocusSession] Removed ${originalLength - selectedTasks.length} completed tasks from selected list.`);
            if (activeTaskIndex >= selectedTasks.length) {
                const firstPending = selectedTasks.findIndex(t => !t.completed);
                activeTaskIndex = firstPending !== -1 ? firstPending : -1;
            }
            renderSelectedTasks();
            updateSelectedTasksCountAndValidation();
            setActiveTask(activeTaskIndex);
        }
    }

    function handleTasksUpdated() {
        console.log("[FocusSession] Tasks updated event received. Reloading tasks...");
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
                selectedTasks.push({ ...task, progress: 0, completed: false, investedTime: 0 }); // Adiciona investedTime
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
                const investedTime = task.investedTime || 0;
                taskElement.innerHTML = `
                    <span class="task-title">${task.title} ${task.completed ? "(Concluída)" : ""}</span>
                    <div class="task-progress-info">
                        <span class="invested-time">${investedTime} min</span>
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
        
        const totalDurationSeconds = lastCycleDurationMinutes * 60;
        if (totalDurationSeconds <= 0) return;
        
        const elapsedSeconds = totalDurationSeconds - remainingTime;
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        
        const activeTaskElementContainer = selectedTasksListDiv.querySelector(`.selected-task[data-task-id="${selectedTasks[activeTaskIndex].id}"]`);
        if (!activeTaskElementContainer) return;
        
        const investedTimeElement = activeTaskElementContainer.querySelector(".invested-time");
        if (investedTimeElement) {
            investedTimeElement.textContent = `${elapsedMinutes} min`;
            selectedTasks[activeTaskIndex].investedTime = elapsedMinutes;
        }
    }

    function markTaskAsCompleted() {
        if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex]) {
            const completedTaskId = selectedTasks[activeTaskIndex].id;
            console.log(`[FocusSession] Marking task ${completedTaskId} as completed IN SESSION.`);
            selectedTasks[activeTaskIndex].completed = true;
            // Não zera investedTime, mantém o tempo final
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
            calculateFocusDuration(); // Calcula a duração do foco (custom ou auto)
            totalTimeForProgress = currentCycleFocusDuration * 60;
            remainingTime = totalTimeForProgress;
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
            calculateFocusDuration(); // Calcula a duração do próximo foco
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
        oneMinuteWarningTriggered = false;

        totalSessionRemainingTime = timerSettings.totalSessionDuration * 60;
        calculateFocusDuration(); // Calcula a duração inicial do foco
        remainingTime = currentCycleFocusDuration * 60;

        updateTimerDisplay();
        updateNextSessionInfo();

        startBtn.disabled = !selectedTasks.some(t => !t.completed);
        cancelBtn.disabled = true;
        totalSessionTimeSlider.disabled = false;
        breakTimeInput.disabled = false;
        totalFocusCheckbox.disabled = false;
        customizeCyclesBtn.disabled = false;
        enableCustomFocusTimeCheckbox.disabled = false; // NOVO: Habilita no modal
        customFocusTimeInput.disabled = !timerSettings.enableCustomFocus; // NOVO: Habilita/desabilita input custom

        console.log("[FocusSession] Timer reset complete.");
    }

    let currentCycleFocusDuration = DEFAULT_FOCUS_TIME;
    let currentCycleBreakDuration = 5;

    // NOVO: Função separada para calcular a duração do foco (custom ou auto)
    function calculateFocusDuration() {
        if (timerSettings.enableCustomFocus) {
            currentCycleFocusDuration = timerSettings.customFocusDuration;
            console.log(`[FocusSession] Using custom focus duration: ${currentCycleFocusDuration} min`);
        } else {
            // Lógica de cálculo automático (ajustada para mínimo de 15 min)
            const totalMinutes = timerSettings.totalSessionDuration;
            let calculatedFocusDuration = DEFAULT_FOCUS_TIME;
            if (totalMinutes <= 45) {
                calculatedFocusDuration = Math.min(40, Math.max(MIN_FOCUS_TIME, totalMinutes - timerSettings.baseBreakDuration));
            } else if (totalMinutes <= 90) {
                calculatedFocusDuration = 30;
            } else if (totalMinutes <= 150) {
                calculatedFocusDuration = 25;
            } else {
                calculatedFocusDuration = 20; // Mantém 20 para sessões muito longas
            }
            currentCycleFocusDuration = Math.max(MIN_FOCUS_TIME, calculatedFocusDuration); // Garante o mínimo de 15
            console.log(`[FocusSession] Using calculated focus duration: ${currentCycleFocusDuration} min`);
        }

        // Ajusta se o tempo restante total for menor que a duração calculada
        if (sessionStarted && totalSessionRemainingTime > 0) {
             const maxPossibleFocus = Math.floor(totalSessionRemainingTime / 60);
             currentCycleFocusDuration = Math.min(currentCycleFocusDuration, maxPossibleFocus);
             currentCycleFocusDuration = Math.max(MIN_FOCUS_TIME, currentCycleFocusDuration); // Garante mínimo mesmo com tempo restante
             console.log(`[FocusSession] Adjusted focus duration based on remaining session time: ${currentCycleFocusDuration} min`);
        }
    }

    function tickAbsolute() {
        const now = Date.now();
        if (expectedEndTime) {
            remainingTime = Math.max(0, Math.round((expectedEndTime - now) / 1000));
            if (isFocusTime && remainingTime <= ONE_MINUTE_WARNING && !oneMinuteWarningTriggered) {
                if (document.hidden) {
                    showNotification("Fim do Foco em 1 Minuto!", "Prepare-se para a pausa.", focusEndSound.src);
                } else {
                    playSound("focusEnd");
                }
                oneMinuteWarningTriggered = true;
                console.log("[FocusSession] One minute warning triggered!");
            }
            updateTimerDisplay();
            updateActiveTaskProgress();
            if (now % 5000 < 100) {
                saveTimerState();
            }
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

        if (notificationPermission === "default") {
            requestNotificationPermission();
        }

        console.log("[FocusSession] Starting timer...");
        isRunning = true;
        sessionStarted = true;
        isFocusTime = true;
        oneMinuteWarningTriggered = false;

        calculateFocusDuration(); // Calcula a duração do primeiro foco
        remainingTime = currentCycleFocusDuration * 60;
        lastCycleDurationMinutes = currentCycleFocusDuration;
        expectedEndTime = Date.now() + remainingTime * 1000;
        lastUpdateTime = Date.now();

        updateTimerDisplay();
        updateNextSessionInfo();
        startBtn.disabled = true;
        cancelBtn.disabled = false;
        totalSessionTimeSlider.disabled = true;
        breakTimeInput.disabled = true;
        totalFocusCheckbox.disabled = true;
        customizeCyclesBtn.disabled = true;
        enableCustomFocusTimeCheckbox.disabled = true; // NOVO: Desabilita no modal
        customFocusTimeInput.disabled = true; // NOVO: Desabilita no modal

        timer = setInterval(tickAbsolute, 100);
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
            saveTimerState();
        }
    }

    function handleCycleEnd(autoTriggered = false) {
        clearInterval(timer);
        console.log(`[FocusSession] Cycle ended. Was focus: ${isFocusTime}. Auto-triggered: ${autoTriggered}`);

        let soundToPlay = null;
        let notificationTitle = "";
        let notificationBody = "";
        let soundPath = "";

        if (isFocusTime) {
            soundToPlay = "focusEnd";
            notificationTitle = "Foco Concluído!";
            notificationBody = "Hora de fazer uma pausa.";
            soundPath = focusEndSound.src;

            sessionCount++;
            focusCyclesCompletedInBlock++;
            recordCompletedFocusCycle(lastCycleDurationMinutes);

            if (activeTaskIndex !== -1) {
                const activeTask = selectedTasks[activeTaskIndex];
                if (activeTask && !activeTask.completed && confirm(`Deseja marcar a tarefa "${activeTask.title}" como concluída?`)) {
                    markTaskAsCompleted();
                }
            }

            const hasPendingTasks = selectedTasks.some(t => !t.completed);
            const hasTimeLeft = totalSessionRemainingTime > timerSettings.baseBreakDuration * 60;

            if (!hasPendingTasks || !hasTimeLeft) {
                console.log("[FocusSession] Session completed. No pending tasks or time left.");
                alert(`Sessão concluída! ${sessionCount} ciclos de foco completados.`);
                resetTimer();
                return;
            }

            isFocusTime = false;
            oneMinuteWarningTriggered = false;
            const isLongBreak = focusCyclesCompletedInBlock % LONG_BREAK_INTERVAL === 0;
            currentCycleBreakDuration = isLongBreak ? timerSettings.baseBreakDuration * 2 : timerSettings.baseBreakDuration;
            remainingTime = currentCycleBreakDuration * 60;
            soundToPlay = "breakStart";
        } else {
            soundToPlay = "breakEnd";
            notificationTitle = "Pausa Concluída!";
            notificationBody = "Hora de voltar ao foco.";
            soundPath = breakEndSound.src;

            isFocusTime = true;
            oneMinuteWarningTriggered = false;
            calculateFocusDuration(); // Calcula a duração do próximo foco
            remainingTime = currentCycleFocusDuration * 60;
            lastCycleDurationMinutes = currentCycleFocusDuration;

            if (activeTaskIndex === -1 || selectedTasks[activeTaskIndex].completed) {
                const nextPendingIndex = selectedTasks.findIndex(t => !t.completed);
                if (nextPendingIndex !== -1) {
                    setActiveTask(nextPendingIndex);
                }
            }
            soundToPlay = "focusStart";
        }

        if (document.hidden) {
            showNotification(notificationTitle, notificationBody, soundPath);
        } else {
            playSound(soundToPlay);
        }

        expectedEndTime = Date.now() + remainingTime * 1000;
        lastUpdateTime = Date.now();

        updateTimerDisplay();
        updateNextSessionInfo();
        timer = setInterval(tickAbsolute, 100);
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
            case "focusStart": audioElement = focusStartSound; break;
            case "focusEnd": audioElement = focusEndSound; break;
            case "breakStart": audioElement = breakStartSound; break;
            case "breakEnd": audioElement = breakEndSound; break;
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
        if (soundEnabled && notificationPermission === "default") {
            requestNotificationPermission();
        }
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

    // NOVO: Função para alternar e salvar o modo de foco customizado
    function toggleCustomFocusMode() {
        timerSettings.enableCustomFocus = enableCustomFocusTimeCheckbox.checked;
        customFocusTimeContainer.style.display = timerSettings.enableCustomFocus ? "flex" : "none";
        customFocusTimeInput.disabled = !timerSettings.enableCustomFocus;
        if (!isRunning) {
            calculateFocusDuration();
            remainingTime = currentCycleFocusDuration * 60;
            updateTimerDisplay();
            updateNextSessionInfo();
        }
        saveSettings();
        console.log(`[FocusSession] Custom Focus Mode ${timerSettings.enableCustomFocus ? "enabled" : "disabled"}.`);
    }

    function initBeforeUnloadListener() {
        window.addEventListener("beforeunload", function(e) {
            saveTimerState();
            if (isRunning && totalFocusModeEnabled && isFocusTime) {
                const message = "Você está em uma sessão de foco. Tem certeza que deseja sair?";
                e.returnValue = message;
                return message;
            }
        });
    }

    function initInputListeners() {
        totalSessionTimeSlider.addEventListener("input", function() {
            const value = parseInt(this.value);
            totalSessionTimeValueSpan.textContent = value;
            if (!isRunning) {
                timerSettings.totalSessionDuration = value;
                totalSessionRemainingTime = timerSettings.totalSessionDuration * 60;
                calculateFocusDuration();
                remainingTime = currentCycleFocusDuration * 60;
                updateTimerDisplay();
                updateNextSessionInfo();
            }
        });
        totalSessionTimeSlider.addEventListener("change", function() {
             timerSettings.totalSessionDuration = parseInt(this.value);
             saveSettings();
        });

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

        totalFocusCheckbox.addEventListener("change", toggleTotalFocusMode);

        // NOVO: Listeners para customização de foco
        enableCustomFocusTimeCheckbox.addEventListener("change", toggleCustomFocusMode);
        customFocusTimeInput.addEventListener("input", function() {
            validateInput(this, MIN_FOCUS_TIME, MAX_FOCUS_TIME);
        });
        customFocusTimeInput.addEventListener("blur", function() {
            if (validateInput(this, MIN_FOCUS_TIME, MAX_FOCUS_TIME, DEFAULT_FOCUS_TIME)) {
                timerSettings.customFocusDuration = parseInt(this.value) || DEFAULT_FOCUS_TIME;
                if (!isRunning && timerSettings.enableCustomFocus) {
                    calculateFocusDuration();
                    remainingTime = currentCycleFocusDuration * 60;
                    updateTimerDisplay();
                    updateNextSessionInfo();
                }
                saveSettings();
            }
        });
        customFocusTimeInput.addEventListener("keydown", function(event) { if (event.key === "Enter") this.blur(); });
    }

    function initActionButtons() {
        startBtn.addEventListener("click", startTimer);
        cancelBtn.addEventListener("click", cancelTimer);
        soundToggleBtn.addEventListener("click", toggleSound);
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
