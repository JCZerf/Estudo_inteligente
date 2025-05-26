document.addEventListener("DOMContentLoaded", function () {
    // Helper function to safely get elements
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

    // Elementos do DOM (com verificação)
    const startBtn = getElement("start-btn");
    const cancelBtn = getElement("cancel-btn");
    const timeDisplay = getElement("time-display");
    const progressCircle = getElement("clock-progress");
    const customTimeInput = getElement("custom-time-input"); // Manual mode
    const totalSessionTimeInput = getElement("total-session-time"); // Auto mode
    const breakTimeInput = getElement("break-time"); // Auto mode
    const taskListDiv = querySelector(".task-list");
    const selectedTasksListDiv = getElement("selectedTasksList");
    const selectedTasksCountElement = getElement("selectedTasksCount");
    const tasksValidationElement = getElement("tasksValidation");
    const nextSessionElement = getElement("nextSessionInfo");
    const timerModeElement = getElement("timerModeIndicator");
    const timerModeText = getElement("timerModeText");
    const progressPercentageElement = getElement("progress-percentage");
    const markersContainer = getElement("time-markers"); // Added check
    const clockCircle = getElement("clock-circle"); // Added check

    // Elementos de áudio (com verificação)
    const focusStartSound = getElement("focusStartSound");
    const focusEndSound = getElement("focusEndSound");
    const breakStartSound = getElement("breakStartSound");
    const breakEndSound = getElement("breakEndSound");

    // Early exit if essential elements are missing
    if (!startBtn || !cancelBtn || !timeDisplay || !progressCircle || !taskListDiv || !selectedTasksListDiv || !selectedTasksCountElement || !tasksValidationElement || !nextSessionElement || !timerModeElement || !timerModeText || !progressPercentageElement || !markersContainer || !clockCircle) {
        console.error("[FocusSession] Essential DOM elements are missing. Script cannot initialize properly.");
        // Optionally display a user-friendly error message on the page
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Erro: Elementos essenciais para a sessão de foco não foram encontrados. Verifique o HTML.';
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '10px';
        errorDiv.style.border = '1px solid red';
        // Try to prepend to body, or append if body is not ready (though DOMContentLoaded should ensure it is)
        if (document.body) {
            document.body.prepend(errorDiv);
        } else {
            console.error("[FocusSession] document.body not available to display error message.");
        }
        return; // Stop script execution
    }

    // Variáveis de controle do timer
    let timer;
    let isRunning = false;
    let remainingTime = 0; // Tempo restante no ciclo atual (foco ou pausa)
    let timerMode = "manual"; // 'manual' ou 'auto'
    let lastCycleDurationMinutes = 0; // Armazena a duração do último ciclo de foco concluído

    // Configurações Modo Manual
    let manualFocusDuration = 25; // Duração definida pelo usuário

    // Configurações e Estado Modo Automático
    let autoSettings = {
        totalSessionDuration: 60, // Duração total definida pelo usuário
        baseBreakDuration: 5,     // Duração da pausa curta definida pelo usuário
    };
    let currentCycleFocusDuration = 0; // Duração calculada para o ciclo de foco atual
    let currentCycleBreakDuration = 0; // Duração calculada para o ciclo de pausa atual
    let isFocusTime = true; // Indica se o ciclo atual é de foco
    let sessionCount = 0; // Número total de ciclos de foco completados NA SESSÃO ATUAL
    let focusCyclesCompletedInBlock = 0; // Ciclos de foco completados desde a última pausa longa NA SESSÃO ATUAL
    let totalSessionRemainingTime = 0; // Tempo total restante na sessão automática
    let autoSessionStarted = false; // Indica se a sessão automática foi iniciada
    const LONG_BREAK_INTERVAL = 4; // Número de ciclos de foco antes de uma pausa longa

    // Controle de tarefas
    let allAvailableTasks = []; // Todas as tarefas PENDENTES carregadas do sistema (FLAT ARRAY)
    let selectedTasks = []; // Tarefas selecionadas pelo usuário para a sessão
    let activeTaskIndex = -1; // Índice da tarefa ativa DENTRO de selectedTasks
    const MAX_TASKS = 8;

    // --- Funções de Persistência e Sincronização ---

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

    // CORREÇÃO: Modificada para aceitar `isAutoSession` e registrar corretamente
    function recordCompletedFocusCycle(durationMinutes, mode, isAutoSession = false) {
        console.log(`[FocusSession] Recording completed focus cycle. Duration: ${durationMinutes}, Mode: ${mode}, IsAutoSession: ${isAutoSession}`);
        const stats = getUserFocusStats();
        const today = new Date().toISOString().split("T")[0];

        stats.totalFocusTimeMinutes += durationMinutes;
        // CORREÇÃO: Só incrementa totalFocusSessions se for um ciclo de foco real (manual ou auto)
        // A contagem de sessões para o ranking agora é feita aqui.
        stats.totalFocusSessions += 1;

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
            mode: mode,
            taskTitle: activeTask,
            pointsEarned: pointsEarned,
            isAutoSession: isAutoSession // Adiciona flag se foi parte de uma sessão auto
        });
    }

    function addBonusPoints(points, reason) {
        console.log(`[FocusSession] Adding bonus points: ${points}. Reason: ${reason}`);
        const stats = getUserFocusStats();
        stats.totalPoints += points;
        saveUserFocusStats(stats);
    }

    // --- Inicialização ---
    function initializeApp() {
        console.log("[FocusSession] Initializing App...");
        createTimeMarkers();
        initModeControls();
        loadTasksFromStorage();
        renderSelectedTasks();
        resetTimer();
        updateSelectedTasksCountAndValidation();
        // Adiciona listener para evento 'tasksUpdated' de outras telas
        window.addEventListener("tasksUpdated", handleExternalTaskUpdate);
        console.log("[FocusSession] App Initialized.");
    }

    function createTimeMarkers() {
        // markersContainer already checked in the beginning
        markersContainer.innerHTML = ""; // Clear existing markers
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

    function playSound(soundElement) {
        // Check if the element exists before trying to play
        if (soundElement && typeof soundElement.play === "function") {
            soundElement.currentTime = 0;
            soundElement.play().catch(error => {
                console.warn(`[FocusSession] Could not play sound ${soundElement.id}:`, error);
            });
        } else {
            // Warning already logged if element is null during initialization
            if (soundElement) { // Log only if element exists but is not playable
                 console.warn(`[FocusSession] Sound element ${soundElement.id} is not playable.`);
            }
        }
    }

    // CORREÇÃO: Modificada para recarregar tarefas PENDENTES
    function loadTasksFromStorage() {
        console.log("[FocusSession] Loading tasks from localStorage key \"studyTasks\"...");
        const storedData = localStorage.getItem("studyTasks");
        allAvailableTasks = [];

        if (storedData) {
            try {
                const tasksBySubject = JSON.parse(storedData);
                if (tasksBySubject && typeof tasksBySubject === "object" && !Array.isArray(tasksBySubject)) {
                    Object.values(tasksBySubject).forEach(subjectTasks => {
                        if (Array.isArray(subjectTasks)) {
                            // CORREÇÃO: Filtra apenas tarefas NÃO completadas
                            const pendingTasks = subjectTasks.filter(task => task && !task.completed && task.id && task.title);
                            allAvailableTasks.push(...pendingTasks);
                        }
                    });
                    console.log(`[FocusSession] Loaded ${allAvailableTasks.length} PENDING tasks:`, allAvailableTasks);
                } else {
                    console.warn("[FocusSession] Parsed data from localStorage (\"studyTasks\") is not an object.");
                }
            } catch (e) {
                console.error("[FocusSession] Error parsing tasks from localStorage (\"studyTasks\"):", e);
            }
        }
        // CORREÇÃO: Não limpa selectedTasks aqui, permite manter seleção entre recargas
        // selectedTasks = [];
        // activeTaskIndex = -1;
        renderAvailableTasks(allAvailableTasks);
        // Sincroniza a lista de selecionadas com as disponíveis (remove tarefas que não existem mais ou foram completadas externamente)
        syncSelectedTasksWithAvailable();
    }

    // CORREÇÃO: Nova função para lidar com atualizações externas de tarefas
    function handleExternalTaskUpdate() {
        console.log("[FocusSession] Received 'tasksUpdated' event. Reloading tasks...");
        loadTasksFromStorage(); // Recarrega a lista de tarefas disponíveis
        // A função loadTasksFromStorage agora chama syncSelectedTasksWithAvailable
    }

    // CORREÇÃO: Nova função para sincronizar tarefas selecionadas com as disponíveis
    function syncSelectedTasksWithAvailable() {
        const currentSelectedIds = selectedTasks.map(t => t.id);
        let changed = false;
        selectedTasks = selectedTasks.filter(selectedTask => {
            const stillAvailable = allAvailableTasks.some(availableTask => availableTask.id === selectedTask.id);
            if (!stillAvailable) {
                console.log(`[FocusSession] Removing task ${selectedTask.id} from selection because it's no longer available/pending.`);
                changed = true;
            }
            return stillAvailable;
        });

        // Re-renderiza se houve mudança
        if (changed) {
            console.log("[FocusSession] Selected tasks updated after sync:", selectedTasks);
            if (activeTaskIndex >= selectedTasks.length) {
                activeTaskIndex = selectedTasks.length > 0 ? 0 : -1;
            }
            renderSelectedTasks();
            renderAvailableTasks(allAvailableTasks); // Re-renderiza botões disponíveis para refletir estado
            updateSelectedTasksCountAndValidation();
        }
    }

    function renderAvailableTasks(tasks) {
        console.log("[FocusSession] Rendering available tasks list. Count:", tasks ? tasks.length : 0);
        // taskListDiv already checked
        taskListDiv.innerHTML = "";
        if (!tasks || tasks.length === 0) {
            taskListDiv.innerHTML = "<p>Nenhuma tarefa pendente encontrada.</p>";
            return;
        }
        tasks.forEach((task) => {
            if (!task || typeof task.id === "undefined" || typeof task.title === "undefined") return;
            const isSelected = selectedTasks.some(st => st.id === task.id);
            const button = document.createElement("button");
            button.className = `btn btn-task ${isSelected ? "active" : ""}`;
            button.textContent = task.title;
            button.setAttribute("data-task-id", task.id);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
            button.addEventListener("click", () => toggleTaskSelection(task, button));
            taskListDiv.appendChild(button);
        });
    }

    // --- Lógica de Tarefas ---

    function toggleTaskSelection(task, button) {
        console.log(`[FocusSession] Toggling selection for task: ${task.id}`);
        if (isRunning) {
            alert("Cancele a sessão atual para modificar as tarefas.");
            return;
        }
        const taskIndexInSelected = selectedTasks.findIndex(t => t.id === task.id);
        if (taskIndexInSelected > -1) {
            console.log(`[FocusSession] Deselecting task: ${task.id}`);
            const removingActive = (activeTaskIndex === taskIndexInSelected);
            selectedTasks.splice(taskIndexInSelected, 1);
            if (button) { // Check if button exists
                button.classList.remove("active");
                button.setAttribute("aria-pressed", "false");
            }
            if (removingActive) {
                activeTaskIndex = selectedTasks.length > 0 ? 0 : -1; // Define para 0 se houver outras, senão -1
            } else if (activeTaskIndex > taskIndexInSelected) {
                activeTaskIndex--;
            }
            setActiveTask(activeTaskIndex); // Atualiza visualmente
        } else {
            if (selectedTasks.length < MAX_TASKS) {
                console.log(`[FocusSession] Selecting task: ${task.id}`);
                selectedTasks.push({ ...task, progress: 0, completed: false });
                if (button) { // Check if button exists
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
        console.log("[FocusSession] Rendering selected tasks list. Count:", selectedTasks.length, "Active index:", activeTaskIndex);
        // selectedTasksListDiv already checked
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
                // Check if task.progress is defined, default to 0
                const progressValue = task.progress || 0;
                const roundedProgress = Math.round(progressValue);
                taskElement.innerHTML = `
                    <span class="task-title">${task.title} ${task.completed ? "(Concluída na sessão)" : ""}</span>
                    <div class="task-progress-bar">
                        <div class="progress" style="width: ${progressValue}%;">
                            <span class="progress-text">${roundedProgress}%</span>
                        </div>
                    </div>
                    <i class="fas fa-times remove-task-icon" data-task-id="${task.id}" aria-label="Remover tarefa ${task.title} da sessão"></i>
                `;
                selectedTasksListDiv.appendChild(taskElement);
            });
            // Add event listeners for remove icons
            selectedTasksListDiv.querySelectorAll(".remove-task-icon").forEach((icon) => {
                icon.addEventListener("click", (e) => {
                    if (isRunning) {
                        alert("Cancele a sessão atual antes de remover tarefas.");
                        return;
                    }
                    const taskIdToRemove = e.target.getAttribute("data-task-id");
                    // Find the corresponding button in the available list
                    const taskButton = taskListDiv ? taskListDiv.querySelector(`.btn-task[data-task-id="${taskIdToRemove}"]`) : null;
                    const taskDefinition = allAvailableTasks.find(t => t.id === taskIdToRemove);

                    if (taskDefinition && taskButton) {
                        // Use toggleTaskSelection if the button exists in the available list
                        toggleTaskSelection(taskDefinition, taskButton);
                    } else {
                        // If button doesn't exist (e.g., task was removed externally), just remove from selected list
                        const idx = selectedTasks.findIndex(t => t.id === taskIdToRemove);
                        if (idx > -1) {
                            console.log(`[FocusSession] Removing task ${taskIdToRemove} directly from selection (button not found).`);
                            selectedTasks.splice(idx, 1);
                            // Adjust active index if needed
                            if (activeTaskIndex === idx) {
                                activeTaskIndex = selectedTasks.length > 0 ? 0 : -1;
                            } else if (activeTaskIndex > idx) {
                                activeTaskIndex--;
                            }
                            renderSelectedTasks(); // Re-render the list
                            updateSelectedTasksCountAndValidation(); // Update count and validation
                        }
                    }
                    e.stopPropagation(); // Prevent event bubbling
                });
            });
        }
        updateNextSessionInfo();
        console.log("[FocusSession] Finished rendering selected tasks.");
    }

    function setActiveTask(index) {
        console.log(`[FocusSession] Attempting to set active task index to: ${index}`);
        let newActiveIndex = -1; // Default to no active task

        if (index >= 0 && index < selectedTasks.length) {
            if (selectedTasks[index].completed) {
                console.log(`[FocusSession] Task at index ${index} is completed in session. Finding next.`);
                // Try finding the next available task after the current index
                for (let i = index + 1; i < selectedTasks.length; i++) {
                    if (!selectedTasks[i].completed) {
                        newActiveIndex = i;
                        break;
                    }
                }
                // If no task found after, try searching from the beginning up to the current index
                if (newActiveIndex === -1) {
                    for (let i = 0; i < index; i++) {
                        if (!selectedTasks[i].completed) {
                            newActiveIndex = i;
                            break;
                        }
                    }
                }
                // If still no available task found, newActiveIndex remains -1
            } else {
                // If the task at the target index is not completed, set it as active
                newActiveIndex = index;
            }
        } else if (selectedTasks.length > 0) {
             // If index is invalid but there are tasks, try finding the first available one
             const firstAvailable = selectedTasks.findIndex(t => !t.completed);
             if (firstAvailable !== -1) {
                 newActiveIndex = firstAvailable;
             }
        }

        activeTaskIndex = newActiveIndex; // Update the global active index

        console.log(`[FocusSession] Active task index set to: ${activeTaskIndex}`);

        // Update visual representation
        // selectedTasksListDiv already checked
        selectedTasksListDiv.querySelectorAll(".selected-task").forEach((taskEl, idx) => {
            taskEl.classList.toggle("task-active", idx === activeTaskIndex);
        });

        updateNextSessionInfo(); // Update info display
    }

    function updateActiveTaskProgress() {
        if (activeTaskIndex === -1 || !selectedTasks[activeTaskIndex] || selectedTasks[activeTaskIndex].completed || !isFocusTime || !isRunning) return;

        const totalDuration = (timerMode === "manual" ? manualFocusDuration : currentCycleFocusDuration) * 60;
        if (totalDuration <= 0) return;

        const elapsed = totalDuration - remainingTime;
        const percentage = (elapsed / totalDuration) * 100;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));

        // Find the container for the active task
        // selectedTasksListDiv already checked
        const activeTaskElementContainer = selectedTasksListDiv.querySelector(`.selected-task[data-task-id="${selectedTasks[activeTaskIndex].id}"]`);
        if (!activeTaskElementContainer) {
            console.warn(`[FocusSession] Could not find DOM element for active task ID: ${selectedTasks[activeTaskIndex].id}`);
            return; // Exit if the element is not found
        }

        const progressBar = activeTaskElementContainer.querySelector(".progress");
        const progressText = activeTaskElementContainer.querySelector(".progress-text");

        if (progressBar && progressText) {
            progressBar.style.width = `${clampedPercentage}%`;
            const roundedPercentage = Math.round(clampedPercentage);
            progressText.textContent = `${roundedPercentage}%`;
            // Adjust text color for better visibility based on progress
            progressText.style.color = clampedPercentage > 50 ? "white" : "var(--text-color)";
            progressText.style.mixBlendMode = clampedPercentage > 50 ? "overlay" : "normal"; // Optional visual effect
            // Update the progress in the task object
            selectedTasks[activeTaskIndex].progress = clampedPercentage;
        } else {
            console.warn(`[FocusSession] Progress bar or text element not found within task container for ID: ${selectedTasks[activeTaskIndex].id}`);
        }
    }

    function markTaskAsCompleted() {
        if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex]) {
            const completedTaskId = selectedTasks[activeTaskIndex].id;
            console.log(`[FocusSession] Marking task ${completedTaskId} as completed IN SESSION.`);
            selectedTasks[activeTaskIndex].progress = 100;
            selectedTasks[activeTaskIndex].completed = true;

            saveTaskCompletionStatus(completedTaskId, true); // Salva no localStorage

            renderSelectedTasks(); // Re-renderiza lista de selecionadas para mostrar como concluída

            // Encontra a próxima tarefa NÃO concluída na sessão
            let nextIndex = -1;
            for (let i = 0; i < selectedTasks.length; i++) {
                if (!selectedTasks[i].completed) {
                    nextIndex = i;
                    break;
                }
            }

            if (nextIndex !== -1) {
                console.log(`[FocusSession] Moving to next available task in session at index ${nextIndex}`);
                setActiveTask(nextIndex); // Define a próxima tarefa como ativa
            } else {
                console.log("[FocusSession] All selected tasks completed in this session.");
                activeTaskIndex = -1; // Nenhuma tarefa ativa
                updateNextSessionInfo();
                updateSelectedTasksCountAndValidation(); // Atualiza validação e contagem
                if (selectedTasks.every(task => task.completed)) {
                    alert("Parabéns! Todas as tarefas selecionadas para esta sessão foram concluídas.");
                }
            }
        }
    }

    // CORREÇÃO: Modificada para lidar com `completed` e `done`
    function saveTaskCompletionStatus(taskId, isCompleted) {
        console.log(`[FocusSession] Saving completion status (${isCompleted}) for task ${taskId} to localStorage (\"studyTasks\").`);
        const storedData = localStorage.getItem("studyTasks");
        let tasksBySubject = {};
        if (storedData) {
            try {
                tasksBySubject = JSON.parse(storedData);
                if (!tasksBySubject || typeof tasksBySubject !== "object" || Array.isArray(tasksBySubject)) {
                    console.error("[FocusSession] Data in localStorage for \"studyTasks\" is not a valid object.");
                    return;
                }
            } catch (e) {
                console.error("[FocusSession] Error reading tasks from localStorage (\"studyTasks\") for saving:", e);
                return;
            }
        }

        let taskFoundAndUpdated = false;
        Object.keys(tasksBySubject).forEach(subject => {
            if (Array.isArray(tasksBySubject[subject])) {
                const taskIndex = tasksBySubject[subject].findIndex(t => t && t.id === taskId);
                if (taskIndex !== -1) {
                    tasksBySubject[subject][taskIndex].completed = isCompleted;
                    tasksBySubject[subject][taskIndex].done = isCompleted; // Sincroniza 'done'
                    taskFoundAndUpdated = true;
                }
            }
        });

        if (taskFoundAndUpdated) {
            localStorage.setItem("studyTasks", JSON.stringify(tasksBySubject));
            console.log(`[FocusSession] Task ${taskId} status saved to localStorage (\"studyTasks\").`);
            // CORREÇÃO: Dispara evento para outras telas saberem da mudança
            window.dispatchEvent(new CustomEvent("tasksUpdated"));
            // Atualiza a lista interna de disponíveis APÓS salvar e disparar evento
            // Isso garante que a lógica de recarga funcione corretamente
            if (isCompleted) {
                 const internalTaskIndex = allAvailableTasks.findIndex(t => t && t.id === taskId);
                 if (internalTaskIndex !== -1) {
                     allAvailableTasks.splice(internalTaskIndex, 1);
                     renderAvailableTasks(allAvailableTasks); // Re-render available tasks to remove the completed one
                 }
            } else {
                // Se desmarcou (isCompleted = false), precisa recarregar a lista de disponíveis
                // para que a tarefa reapareça como pendente.
                loadTasksFromStorage();
            }
        } else {
            console.warn(`[FocusSession] Task ${taskId} not found in localStorage (\"studyTasks\") object for saving.`);
        }
    }

    function updateSelectedTasksCountAndValidation() {
        const count = selectedTasks.length;
        // selectedTasksCountElement and tasksValidationElement already checked
        selectedTasksCountElement.textContent = `${count}/${MAX_TASKS}`;
        const hasPendingSelected = selectedTasks.some(t => !t.completed);
        const canStart = !isRunning && count > 0 && hasPendingSelected;

        if (count === 0) {
            tasksValidationElement.textContent = "Selecione pelo menos uma tarefa.";
            tasksValidationElement.style.display = "flex";
        } else if (!hasPendingSelected) {
            tasksValidationElement.textContent = "Todas as tarefas selecionadas nesta sessão estão concluídas.";
            tasksValidationElement.style.display = "flex";
        } else {
            tasksValidationElement.style.display = "none";
        }
        // startBtn already checked
        startBtn.disabled = !canStart;
        console.log(`[FocusSession] Start button enabled: ${!startBtn.disabled}`);
    }

    // --- Lógica do Timer ---

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function updateTimerDisplay() {
        // timeDisplay, progressCircle, progressPercentageElement, clockCircle already checked
        timeDisplay.textContent = formatTime(remainingTime);
        let totalTimeForProgress = 0;

        // Determine the total duration for the current cycle/mode for progress calculation
        if (!isRunning) {
            // If timer is not running, show progress based on the *next* focus cycle duration
            if (timerMode === "manual") {
                totalTimeForProgress = manualFocusDuration * 60;
            } else {
                calculateAutoDurations(); // Ensure durations are calculated
                totalTimeForProgress = currentCycleFocusDuration * 60;
            }
            // When not running, remaining time should reflect the full duration for the display
            remainingTime = totalTimeForProgress;
        } else if (timerMode === "manual") {
            totalTimeForProgress = manualFocusDuration * 60;
        } else { // Auto mode, running
            totalTimeForProgress = isFocusTime ? currentCycleFocusDuration * 60 : currentCycleBreakDuration * 60;
        }

        // Calculate progress percentage
        // Ensure remainingTime doesn't exceed totalTimeForProgress visually due to potential rounding or state issues
        const currentProgressTime = Math.max(0, totalTimeForProgress - remainingTime);
        const progressPercentage = totalTimeForProgress > 0 ? (currentProgressTime / totalTimeForProgress) * 100 : 0;
        const clampedProgress = Math.max(0, Math.min(100, progressPercentage));

        // Update visual elements
        const progressColor = isFocusTime ? "var(--primary-color)" : "var(--break-color, var(--secondary-color))"; // Use fallback for break color
        progressCircle.style.background = `conic-gradient(${progressColor} ${clampedProgress}%, transparent ${clampedProgress}%)`;
        progressPercentageElement.textContent = `${Math.round(clampedProgress)}%`;

        // Add visual cue when time is low (e.g., last 10 seconds)
        clockCircle.classList.toggle("timer-active", remainingTime <= 10 && remainingTime > 0 && isRunning);
    }


    function updateNextSessionInfo() {
        // timerModeElement, timerModeText, nextSessionElement already checked
        let currentActiveTaskTitle = "Nenhuma tarefa ativa";
        if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex]) {
            currentActiveTaskTitle = selectedTasks[activeTaskIndex].title;
        }

        if (timerMode === "auto") {
            if (!isRunning) {
                timerModeElement.className = "timer-mode-indicator auto";
                timerModeText.textContent = "Modo Automático";
                const hasPending = selectedTasks.some(t => !t.completed);
                const readyMsg = hasPending ? `Pronto (${autoSettings.totalSessionDuration} min)` : (selectedTasks.length > 0 ? "Todas selecionadas concluídas" : "Selecione tarefas pendentes");
                nextSessionElement.innerHTML = `<i class="fas fa-hourglass-start"></i> ${readyMsg}`;
            } else if (isFocusTime) {
                timerModeElement.className = "timer-mode-indicator focus";
                timerModeText.textContent = `Foco: ${currentActiveTaskTitle}`;
                // Calculate next break duration accurately
                const isLongBreakNext = (focusCyclesCompletedInBlock + 1) % LONG_BREAK_INTERVAL === 0;
                const nextBreakDuration = isLongBreakNext ? autoSettings.baseBreakDuration * 2 : autoSettings.baseBreakDuration;
                nextSessionElement.innerHTML = `<i class="fas fa-coffee"></i> Próxima pausa (${nextBreakDuration} min) em ${formatTime(remainingTime)}`;
            } else { // Auto mode, break time
                timerModeElement.className = "timer-mode-indicator break";
                const isLongBreak = currentCycleBreakDuration > autoSettings.baseBreakDuration;
                timerModeText.textContent = isLongBreak ? "Pausa Longa" : "Pausa Curta";
                calculateAutoDurations(); // Ensure next focus duration is calculated for the info message
                nextSessionElement.innerHTML = `<i class="fas fa-brain"></i> Próximo foco (${currentCycleFocusDuration} min) em ${formatTime(remainingTime)}`;
            }
        } else { // Manual mode
            timerModeElement.className = "timer-mode-indicator focus";
            timerModeText.textContent = `Foco Manual: ${currentActiveTaskTitle}`;
            nextSessionElement.innerHTML = `<i class="fas fa-clock"></i> Duração: ${formatTime(manualFocusDuration * 60)}`;
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
        autoSessionStarted = false;
        lastCycleDurationMinutes = 0;

        // Reset remaining time based on current mode
        if (timerMode === "manual") {
            remainingTime = manualFocusDuration * 60;
        } else {
            totalSessionRemainingTime = autoSettings.totalSessionDuration * 60;
            calculateAutoDurations(); // Calculate initial focus duration for auto mode
            remainingTime = currentCycleFocusDuration * 60;
        }

        updateTimerDisplay(); // Update display with reset values (will set progress to 0%)
        updateNextSessionInfo(); // Update info display

        // Re-enable/disable buttons and inputs
        // startBtn, cancelBtn, customTimeInput, totalSessionTimeInput, breakTimeInput already checked
        startBtn.disabled = !selectedTasks.some(t => !t.completed); // Can start only if there are pending selected tasks
        cancelBtn.disabled = true;
        if (customTimeInput) customTimeInput.disabled = timerMode !== 'manual'; // Enable only in manual mode
        if (totalSessionTimeInput) totalSessionTimeInput.disabled = timerMode !== 'auto'; // Enable only in auto mode
        if (breakTimeInput) breakTimeInput.disabled = timerMode !== 'auto'; // Enable only in auto mode

        console.log("[FocusSession] Timer reset complete.");
    }


    function calculateAutoDurations() {
        const totalMinutes = autoSettings.totalSessionDuration;
        let calculatedFocusDuration = 25; // Default focus duration

        // Example logic for dynamic focus duration based on total session time
        if (totalMinutes <= 45) {
            // Shorter sessions might have slightly longer focus periods relative to breaks
            calculatedFocusDuration = Math.min(40, Math.max(20, totalMinutes - autoSettings.baseBreakDuration));
        } else if (totalMinutes <= 90) {
            calculatedFocusDuration = 30;
        } else if (totalMinutes <= 150) {
            calculatedFocusDuration = 25;
        } else { // Longer sessions
            calculatedFocusDuration = 20;
        }

        // Ensure focus duration is reasonable and doesn't exceed remaining total time (if session started)
        if (autoSessionStarted && totalSessionRemainingTime > 0) {
             // Calculate based on remaining time, but ensure it's not excessively short
             const maxPossibleFocus = Math.floor(totalSessionRemainingTime / 60);
             currentCycleFocusDuration = Math.min(calculatedFocusDuration, maxPossibleFocus);
        } else {
             currentCycleFocusDuration = calculatedFocusDuration;
        }
        // Ensure focus duration is at least a minimum value (e.g., 5 minutes)
        currentCycleFocusDuration = Math.max(5, currentCycleFocusDuration);

        console.log(`[FocusSession] Calculated Auto Durations - Focus: ${currentCycleFocusDuration} min, Base Break: ${autoSettings.baseBreakDuration} min`);
        // Break duration is calculated when the focus cycle ends
    }


    function tick() {
        if (remainingTime <= 0) {
            handleCycleEnd();
        } else {
            remainingTime--;
            if (timerMode === "auto" && autoSessionStarted) { // Ensure total time only decreases if auto session is running
                totalSessionRemainingTime--;
            }
            updateTimerDisplay();
            updateActiveTaskProgress();

            // Check if total auto session time has run out
            if (timerMode === "auto" && autoSessionStarted && totalSessionRemainingTime <= 0 && isRunning) {
                console.log("[FocusSession] Auto session total time ended during tick.");
                handleSessionEnd(true); // End session because time ran out
            }
        }
    }


    function handleCycleEnd() {
        console.log(`[FocusSession] Cycle ended. Mode: ${timerMode}, IsFocus: ${isFocusTime}`);
        clearInterval(timer); // Stop the interval timer
        isRunning = false; // Mark timer as not running

        if (timerMode === "manual") {
            playSound(focusEndSound);
            lastCycleDurationMinutes = manualFocusDuration;
            recordCompletedFocusCycle(lastCycleDurationMinutes, "manual");

            let taskCompletedDuringCycle = false;
            if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex] && !selectedTasks[activeTaskIndex].completed) {
                const taskTitle = selectedTasks[activeTaskIndex].title;
                // Use confirm dialog to ask user about task completion
                const confirmCompletion = confirm(`Sessão manual concluída! Você finalizou a tarefa "${taskTitle}"?`);
                if (confirmCompletion) {
                    markTaskAsCompleted();
                    taskCompletedDuringCycle = true;
                }
            }
            // Provide feedback even if no task was active or completed
            if (!taskCompletedDuringCycle) {
                 alert("Sessão de foco manual concluída!");
            }
            resetTimer(); // Reset for the next session

        } else { // Modo Automático
            if (isFocusTime) { // End of a Focus Cycle
                playSound(focusEndSound);
                lastCycleDurationMinutes = currentCycleFocusDuration;
                recordCompletedFocusCycle(lastCycleDurationMinutes, "auto", true); // Record as part of auto session
                sessionCount++;
                focusCyclesCompletedInBlock++;
                console.log(`[FocusSession] Focus cycle ${sessionCount} ended. Cycles in block: ${focusCyclesCompletedInBlock}`);

                // Ask about task completion after focus cycle
                let taskCompletedDuringCycle = false;
                if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex] && !selectedTasks[activeTaskIndex].completed) {
                    const taskTitle = selectedTasks[activeTaskIndex].title;
                    const confirmCompletion = confirm(`Ciclo de foco (${currentCycleFocusDuration} min) concluído! Você finalizou a tarefa "${taskTitle}"?`);
                    if (confirmCompletion) {
                        markTaskAsCompleted(); // This function handles moving to the next task if available
                        taskCompletedDuringCycle = true;
                    }
                }

                // Award bonus points for consecutive focus cycles
                if (sessionCount > 1 && focusCyclesCompletedInBlock > 1) {
                    addBonusPoints(2, "Bloco de foco com múltiplas sessões");
                }

                // Check if the session should end (no more time or no pending tasks)
                const hasMoreTime = totalSessionRemainingTime > 0;
                const hasPendingSelectedTasks = selectedTasks.some(t => !t.completed);
                if (!hasMoreTime || !hasPendingSelectedTasks) {
                    console.log(`[FocusSession] Ending session after focus. HasTime: ${hasMoreTime}, HasPendingSelected: ${hasPendingSelectedTasks}`);
                    handleSessionEnd(!hasMoreTime); // End session (true if ended by time)
                    return; // Stop further processing for this cycle
                }

                // Prepare for the break
                console.log("[FocusSession] Preparing for break...");
                isFocusTime = false; // Switch to break time
                // Determine break duration (long or short)
                currentCycleBreakDuration = autoSettings.baseBreakDuration;
                if (focusCyclesCompletedInBlock % LONG_BREAK_INTERVAL === 0) {
                    console.log("[FocusSession] Long break triggered.");
                    currentCycleBreakDuration *= 2; // Double the base break for a long break
                }
                // Ensure break doesn't exceed remaining total session time
                remainingTime = Math.min(currentCycleBreakDuration * 60, totalSessionRemainingTime);

                if (remainingTime <= 0) {
                    console.log("[FocusSession] Not enough time for break. Ending session.");
                    handleSessionEnd(true); // End session due to lack of time
                    return;
                }

                playSound(breakStartSound);
                updateNextSessionInfo(); // Show break info
                updateTimerDisplay(); // Show break timer
                timer = setInterval(tick, 1000); // Start the break timer
                isRunning = true;
                console.log(`[FocusSession] Break started. Duration: ${currentCycleBreakDuration} min (Actual: ${Math.floor(remainingTime/60)} min).`);

            } else { // End of a Break Cycle
                playSound(breakEndSound);
                console.log("[FocusSession] Break ended.");
                isFocusTime = true; // Switch back to focus time

                // Reset block counter if it was a long break
                if (currentCycleBreakDuration > autoSettings.baseBreakDuration) {
                    console.log("[FocusSession] Resetting focus cycle block counter after long break.");
                    focusCyclesCompletedInBlock = 0;
                }

                // Check if the session should end (no more time or no pending tasks)
                const hasMoreTime = totalSessionRemainingTime > 0;
                const hasPendingSelectedTasks = selectedTasks.some(t => !t.completed);
                if (!hasMoreTime || !hasPendingSelectedTasks) {
                    console.log(`[FocusSession] Ending session after break. HasTime: ${hasMoreTime}, HasPendingSelected: ${hasPendingSelectedTasks}`);
                    handleSessionEnd(!hasMoreTime); // End session
                    return;
                }

                // Prepare for the next focus cycle
                console.log("[FocusSession] Preparing for next focus cycle...");

                // Ensure there's an active, non-completed task
                if (activeTaskIndex === -1 || (selectedTasks[activeTaskIndex] && selectedTasks[activeTaskIndex].completed)) {
                    const nextAvailableIdx = selectedTasks.findIndex(t => !t.completed);
                    if (nextAvailableIdx !== -1) {
                        setActiveTask(nextAvailableIdx); // Set the next available task
                    } else {
                        // This case should have been caught earlier, but as a safeguard:
                        console.log("[FocusSession] No available task found for next focus cycle. Ending session.");
                        handleSessionEnd(false); // End session because no tasks left
                        return;
                    }
                }

                calculateAutoDurations(); // Calculate duration for the next focus cycle
                // Ensure focus cycle doesn't exceed remaining total session time
                remainingTime = Math.min(currentCycleFocusDuration * 60, totalSessionRemainingTime);

                if (remainingTime <= 0) {
                    console.log("[FocusSession] Not enough time for next focus cycle. Ending session.");
                    handleSessionEnd(true); // End session due to lack of time
                    return;
                }

                playSound(focusStartSound);
                updateNextSessionInfo(); // Show focus info
                updateTimerDisplay(); // Show focus timer
                timer = setInterval(tick, 1000); // Start the focus timer
                isRunning = true;
                console.log(`[FocusSession] Focus cycle started. Duration: ${currentCycleFocusDuration} min (Actual: ${Math.floor(remainingTime/60)} min).`);
            }
        }
    }


    function handleSessionEnd(endedByTime) {
        console.log(`[FocusSession] Handling session end. Ended by time: ${endedByTime}`);
        clearInterval(timer);
        isRunning = false;
        playSound(breakEndSound); // Play a sound indicating the end

        // Award bonus points if the auto session completed its full duration
        if (endedByTime && autoSessionStarted && timerMode === 'auto') {
            addBonusPoints(2, "Sessão automática completada (tempo total)");
        }

        // Provide user feedback based on why the session ended
        if (endedByTime && timerMode === 'auto') {
            alert("Sessão de foco automática concluída! Tempo esgotado.");
        } else if (!selectedTasks.some(t => !t.completed)) {
            // This alert might be redundant if markTaskAsCompleted already showed one
            // Consider removing or making it conditional
             console.log("[FocusSession] Session ended because all selected tasks were completed.");
             // alert("Sessão de foco automática concluída! Todas as tarefas selecionadas foram finalizadas.");
        } else {
             // Generic end message if not ended by time or task completion (e.g., manual cancel)
             // This function is usually called after time runs out or tasks are done,
             // so this branch might not be reached often in auto mode.
             console.log("[FocusSession] Session ended.");
        }

        resetTimer(); // Reset the timer and UI for a new session
    }


    function startTimer() {
        console.log("[FocusSession] Start button clicked.");
        // Ensure there are tasks selected and at least one is pending
        if (selectedTasks.length === 0) {
            alert("Por favor, selecione pelo menos uma tarefa para iniciar.");
            return;
        }
        const firstPendingIndex = selectedTasks.findIndex(t => !t.completed);
        if (firstPendingIndex === -1) {
            alert("Todas as tarefas selecionadas nesta sessão já estão concluídas. Remova-as ou adicione novas tarefas pendentes.");
            return;
        }

        // Set the first pending task as active if none is active or the current one is completed
        if (activeTaskIndex === -1 || (selectedTasks[activeTaskIndex] && selectedTasks[activeTaskIndex].completed)) {
            setActiveTask(firstPendingIndex);
        }

        // Double-check if an active task was successfully set
        if (activeTaskIndex === -1) {
            console.error("[FocusSession] Failed to set an active task before starting timer.");
            alert("Erro ao definir tarefa ativa. Verifique as tarefas selecionadas.");
            return;
        }

        console.log(`[FocusSession] Starting timer. Mode: ${timerMode}, Active Task Index: ${activeTaskIndex}`);
        isRunning = true;

        // Update UI state: disable inputs, enable cancel, disable start
        // Elements already checked
        startBtn.disabled = true;
        cancelBtn.disabled = false;
        if (customTimeInput) customTimeInput.disabled = true;
        if (totalSessionTimeInput) totalSessionTimeInput.disabled = true;
        if (breakTimeInput) breakTimeInput.disabled = true;

        // Initialize timer based on mode
        if (timerMode === "manual") {
            isFocusTime = true;
            remainingTime = manualFocusDuration * 60;
            playSound(focusStartSound);
        } else { // Auto mode
            isFocusTime = true;
            sessionCount = 0; // Reset counters for the new auto session
            focusCyclesCompletedInBlock = 0;
            autoSessionStarted = true; // Mark auto session as started
            totalSessionRemainingTime = autoSettings.totalSessionDuration * 60;
            calculateAutoDurations(); // Calculate initial focus duration
            remainingTime = Math.min(currentCycleFocusDuration * 60, totalSessionRemainingTime); // Set initial time

            if (remainingTime <= 0) {
                alert("Duração total da sessão é muito curta para iniciar um ciclo de foco. Aumente o tempo total.");
                cancelTimer(); // Cancel immediately if no time for first cycle
                return;
            }
            playSound(focusStartSound);
        }

        updateNextSessionInfo(); // Update display
        updateTimerDisplay(); // Update display
        timer = setInterval(tick, 1000); // Start the countdown
    }


    function cancelTimer() {
        console.log("[FocusSession] Cancel button clicked.");
        clearInterval(timer); // Stop the timer interval
        isRunning = false; // Set running state to false
        // Optionally, record partial progress or prompt user? For now, just reset.
        resetTimer(); // Reset the timer and UI to initial state
    }

    // --- Controles de Modo e Input ---

    function initModeControls() {
        const tabButtons = document.querySelectorAll(".tab-btn");
        const tabContents = document.querySelectorAll(".tab-content");

        // Check if essential mode control elements exist
        if (!tabButtons.length || !tabContents.length) {
             console.warn("[FocusSession] Mode tab buttons or content areas not found. Mode switching disabled.");
             // Disable mode switching if elements are missing? Or just log warning.
        } else {
            tabButtons.forEach(button => {
                button.addEventListener("click", () => {
                    if (isRunning) {
                        alert("Cancele a sessão atual para trocar de modo.");
                        return;
                    }
                    const tabId = button.getAttribute("data-tab");
                    const targetContent = document.getElementById(tabId);

                    if (!targetContent) {
                        console.warn(`[FocusSession] Tab content with ID "${tabId}" not found.`);
                        return;
                    }

                    // Deactivate all tabs and content
                    tabButtons.forEach(btn => btn.classList.remove("active"));
                    tabContents.forEach(content => content.classList.remove("active"));

                    // Activate the clicked tab and corresponding content
                    button.classList.add("active");
                    targetContent.classList.add("active");

                    // Update timer mode and reset
                    timerMode = tabId === "manual-tab" ? "manual" : "auto";
                    resetTimer(); // Reset timer when switching modes
                });
            });
        }


        // Add input validation and event listeners (check if inputs exist first)
        if (customTimeInput) {
            customTimeInput.addEventListener("input", function() {
                if (validateInput(this, 15, 240)) {
                    manualFocusDuration = parseInt(this.value) || 25; // Use default if parsing fails
                    if (!isRunning) {
                        resetTimer(); // Reset timer to reflect new duration immediately
                    }
                }
            });
            customTimeInput.addEventListener("blur", function() {
                if (validateInput(this, 15, 240, 25)) { // Validate with default on blur
                    manualFocusDuration = parseInt(this.value) || 25;
                    if (!isRunning) {
                        resetTimer();
                    }
                }
            });
            customTimeInput.addEventListener("keydown", function(event) { if (event.key === "Enter") this.blur(); });
        }

        if (totalSessionTimeInput) {
            totalSessionTimeInput.addEventListener("input", function() {
                if (validateInput(this, 20, 240)) {
                    autoSettings.totalSessionDuration = parseInt(this.value) || 60;
                    if (!isRunning) resetTimer();
                }
            });
            totalSessionTimeInput.addEventListener("blur", function() {
                if (validateInput(this, 20, 240, 60)) {
                    autoSettings.totalSessionDuration = parseInt(this.value) || 60;
                    if (!isRunning) resetTimer();
                }
            });
            totalSessionTimeInput.addEventListener("keydown", function(event) { if (event.key === "Enter") this.blur(); });
        }

        if (breakTimeInput) {
            breakTimeInput.addEventListener("input", function() {
                if (validateInput(this, 5, 30)) {
                    autoSettings.baseBreakDuration = parseInt(this.value) || 5;
                    if (!isRunning && timerMode === "auto") updateNextSessionInfo(); // Update info if relevant
                }
            });
            breakTimeInput.addEventListener("blur", function() {
                if (validateInput(this, 5, 30, 5)) {
                    autoSettings.baseBreakDuration = parseInt(this.value) || 5;
                    if (!isRunning && timerMode === "auto") updateNextSessionInfo();
                }
            });
            breakTimeInput.addEventListener("keydown", function(event) { if (event.key === "Enter") this.blur(); });
        }

        // Add listeners to start/cancel buttons (already checked for existence)
        startBtn.addEventListener("click", startTimer);
        cancelBtn.addEventListener("click", cancelTimer);
    }

    function validateInput(inputElement, min, max, defaultValue = null) {
        let valueStr = inputElement.value.trim();
        let value = parseInt(valueStr);
        let isValid = !isNaN(value) && value >= min && value <= max;
        const isBlurEvent = document.activeElement !== inputElement; // Check if it's a blur event

        if (isBlurEvent) {
            // On blur, enforce range and apply default if empty or invalid
            if (valueStr === "" && defaultValue !== null) {
                inputElement.value = defaultValue; // Set to default if empty
                console.log(`[FocusSession] Input ${inputElement.id} was empty, set to default: ${defaultValue}`);
                return true; // Consider it valid as default is applied
            } else if (!isValid) {
                const finalValue = defaultValue !== null ? defaultValue : min; // Use default or min if invalid
                inputElement.value = finalValue;
                alert(`Valor inválido. Deve ser um número entre ${min} e ${max}. Restaurado para ${finalValue}.`);
                console.log(`[FocusSession] Input ${inputElement.id} invalid (${valueStr}), set to: ${finalValue}`);
                return true; // Value is now corrected
            }
            // If valid and blur, no action needed, just return true
            return true;
        } else {
            // On input event, allow intermediate states but prevent non-numeric and exceeding max
            if (!/^[0-9]*$/.test(valueStr)) {
                 // Remove non-numeric characters immediately
                 inputElement.value = valueStr.replace(/[^0-9]/g, "");
                 console.log(`[FocusSession] Input ${inputElement.id} non-numeric removed: ${inputElement.value}`);
                 // Re-validate after cleaning
                 value = parseInt(inputElement.value);
                 isValid = !isNaN(value) && value >= min && value <= max;
                 // Don't return false yet, allow user to continue typing
            }
            // Prevent typing a value greater than max
            if (!isNaN(value) && value > max) {
                 inputElement.value = max; // Cap at max value
                 console.log(`[FocusSession] Input ${inputElement.id} capped at max: ${max}`);
                 isValid = true; // It's now valid (at max)
            }
            // For input event, return true if potentially valid, false only if fundamentally wrong (like non-numeric initially)
            // The goal is to guide the user without being overly restrictive during typing.
            // The blur event handles the final validation.
            return !isNaN(parseInt(inputElement.value)) || inputElement.value === ""; // Allow empty string during input
        }
    }


    // --- Inicialização da Aplicação ---
    initializeApp(); // Start the application logic
});

