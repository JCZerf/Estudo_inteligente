document.addEventListener("DOMContentLoaded", function () {
    // Elementos do DOM
    const startBtn = document.getElementById("start-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const timeDisplay = document.getElementById("time-display");
    const progressCircle = document.getElementById("clock-progress");
    const customTimeInput = document.getElementById("custom-time-input"); // Manual mode
    const totalSessionTimeInput = document.getElementById("total-session-time"); // Auto mode
    const breakTimeInput = document.getElementById("break-time"); // Auto mode
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
    let remainingTime = 0; // Tempo restante no ciclo atual (foco ou pausa)
    let timerMode = "manual"; // 'manual' ou 'auto'

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
    let sessionCount = 0; // Número total de ciclos de foco completados na sessão
    let focusCyclesCompletedInBlock = 0; // Ciclos de foco completados desde a última pausa longa
    let totalSessionRemainingTime = 0; // Tempo total restante na sessão automática
    const LONG_BREAK_INTERVAL = 4; // Número de ciclos de foco antes de uma pausa longa

    // Controle de tarefas
    let allAvailableTasks = []; // Todas as tarefas PENDENTES carregadas do sistema (FLAT ARRAY)
    let selectedTasks = []; // Tarefas selecionadas pelo usuário para a sessão
    let activeTaskIndex = -1; // Índice da tarefa ativa DENTRO de selectedTasks
    const MAX_TASKS = 8;

    // --- Inicialização ---

    function initializeApp() {
        console.log("[FocusSession] Initializing App...");
        createTimeMarkers();
        initModeControls();
        loadTasksFromStorage(); // Carrega tarefas do localStorage
        renderSelectedTasks(); // Renderiza lista de selecionadas (vazia inicialmente)
        resetTimer(); // Define o estado inicial do timer
        updateSelectedTasksCountAndValidation(); // Atualiza contagem e validação
        console.log("[FocusSession] App Initialized.");
    }

    // Inicializa os marcadores de tempo no relógio
    function createTimeMarkers() {
        const markersContainer = document.getElementById("time-markers");
        markersContainer.innerHTML = ''; // Limpa marcadores existentes
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

    // Função auxiliar para tocar sons
    function playSound(soundElement) {
        if (soundElement && typeof soundElement.play === 'function') {
            soundElement.currentTime = 0;
            soundElement.play().catch(error => {
                console.warn(`[FocusSession] Could not play sound ${soundElement.id}:`, error);
            });
        } else {
            console.warn(`[FocusSession] Sound element ${soundElement ? soundElement.id : 'undefined'} not found or is not playable.`);
        }
    }

    // Carrega tarefas do localStorage (CORRIGIDO para usar 'studyTasks' e estrutura de objeto)
    function loadTasksFromStorage() {
        console.log("[FocusSession] Loading tasks from localStorage key 'studyTasks'...");
        // A chave correta usada em tarefas.js é 'studyTasks'
        const storedData = localStorage.getItem('studyTasks');
        allAvailableTasks = []; // Limpa antes de carregar
        selectedTasks = []; // Limpa selecionadas também
        activeTaskIndex = -1; // Reseta índice ativo

        if (storedData) {
            console.log("[FocusSession] Found data string in localStorage ('studyTasks'):", storedData);
            try {
                // tarefas.js armazena um OBJETO onde as chaves são matérias
                const tasksBySubject = JSON.parse(storedData);
                console.log("[FocusSession] Parsed tasks object from localStorage:", tasksBySubject);

                // Verifica se é um objeto
                if (tasksBySubject && typeof tasksBySubject === 'object' && !Array.isArray(tasksBySubject)) {
                    // Itera sobre cada matéria (chave do objeto)
                    Object.values(tasksBySubject).forEach(subjectTasks => {
                        // Verifica se o valor da matéria é um array
                        if (Array.isArray(subjectTasks)) {
                            // Filtra as tarefas não concluídas desta matéria e adiciona ao array plano
                            const pendingTasks = subjectTasks.filter(task => task && task.completed !== true && task.id && task.title);
                            allAvailableTasks.push(...pendingTasks);
                        }
                    });
                    console.log(`[FocusSession] Flattened and filtered non-completed tasks (${allAvailableTasks.length}):`, allAvailableTasks);
                } else {
                    console.warn("[FocusSession] Parsed data from localStorage ('studyTasks') is not an object as expected.", tasksBySubject);
                    allAvailableTasks = [];
                }
            } catch (e) {
                console.error("[FocusSession] Error parsing tasks from localStorage ('studyTasks'):", e);
                allAvailableTasks = [];
            }
        } else {
            console.log("[FocusSession] No data found in localStorage for key 'studyTasks'.");
            allAvailableTasks = [];
        }
        // Chama a renderização mesmo que a lista esteja vazia (para mostrar a mensagem)
        renderAvailableTasks(allAvailableTasks);
    }

    // Renderiza as tarefas disponíveis para seleção (agora recebe um array plano)
    function renderAvailableTasks(tasks) {
        console.log("[FocusSession] Rendering available tasks list (flat array). Count:", tasks ? tasks.length : 0);
        taskListDiv.innerHTML = ""; // Limpa a lista antes de renderizar
        if (!tasks || tasks.length === 0) {
             console.log("[FocusSession] No available tasks to render.");
             taskListDiv.innerHTML = "<p>Nenhuma tarefa pendente encontrada.</p>";
             return;
        }
        tasks.forEach((task, index) => {
            // Verifica se a tarefa tem ID e Título antes de tentar renderizar
            if (!task || typeof task.id === 'undefined' || typeof task.title === 'undefined') {
                console.warn(`[FocusSession] Skipping rendering task at index ${index} due to missing id or title:`, task);
                return; // Pula esta tarefa se faltar dados essenciais
            }
            console.log(`[FocusSession] Rendering task button ${index}: ID=${task.id}, Title=${task.title}`);
            const isSelected = selectedTasks.some(st => st.id === task.id);
            const button = document.createElement("button");
            button.className = `btn btn-task ${isSelected ? 'active' : ''}`;
            button.textContent = task.title;
            button.setAttribute("data-task-id", task.id);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
            button.addEventListener("click", () => toggleTaskSelection(task, button));
            taskListDiv.appendChild(button);
        });
        console.log("[FocusSession] Finished rendering available tasks.");
    }

    // --- Lógica de Tarefas (sem alterações significativas, mantendo logs anteriores) ---

    // Alterna a seleção de uma tarefa
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
            button.classList.remove("active");
            button.setAttribute("aria-pressed", "false");
            if (removingActive) {
                activeTaskIndex = -1;
                if (selectedTasks.length > 0) setActiveTask(0);
            } else if (activeTaskIndex > taskIndexInSelected) {
                activeTaskIndex--;
            }
            console.log("[FocusSession] Selected tasks after deselection:", selectedTasks, "Active index:", activeTaskIndex);
        } else {
            if (selectedTasks.length < MAX_TASKS) {
                console.log(`[FocusSession] Selecting task: ${task.id}`);
                // Adiciona uma cópia da tarefa com progresso e estado de conclusão resetados para a sessão
                selectedTasks.push({ ...task, progress: 0, completed: false });
                button.classList.add("active");
                button.setAttribute("aria-pressed", "true");
                if (selectedTasks.length === 1) setActiveTask(0);
                console.log("[FocusSession] Selected tasks after selection:", selectedTasks, "Active index:", activeTaskIndex);
            } else {
                alert(`Você pode selecionar no máximo ${MAX_TASKS} tarefas.`);
            }
        }
        renderSelectedTasks();
        updateSelectedTasksCountAndValidation();
    }

    // Renderiza a lista de tarefas selecionadas na área designada
    function renderSelectedTasks() {
        console.log("[FocusSession] Rendering selected tasks list. Count:", selectedTasks.length, "Active index:", activeTaskIndex);
        selectedTasksListDiv.innerHTML = "";
        if (selectedTasks.length === 0) {
             selectedTasksListDiv.innerHTML = "<p>Nenhuma tarefa selecionada para a sessão.</p>";
             activeTaskIndex = -1;
        }
        selectedTasks.forEach((task, index) => {
             if (!task || typeof task.id === 'undefined' || typeof task.title === 'undefined') {
                console.warn(`[FocusSession] Skipping rendering selected task at index ${index} due to missing data:`, task);
                return;
            }
            const taskElement = document.createElement("div");
            // Usa task.completed da cópia local (selectedTasks) para o estado visual na sessão
            taskElement.className = `selected-task ${index === activeTaskIndex ? 'task-active' : ''} ${task.completed ? 'completed' : ''}`;
            taskElement.setAttribute("data-task-id", task.id);
            taskElement.innerHTML = `
                <span class="task-title">${task.title} ${task.completed ? '(Concluída na sessão)' : ''}</span>
                <div class="task-progress-bar">
                    <div class="progress" style="width: ${task.progress || 0}%;">
                        <span class="progress-text">${Math.round(task.progress || 0)}%</span>
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
                console.log(`[FocusSession] Remove icon clicked for task: ${taskIdToRemove}`);
                // Encontra o botão correspondente na lista de disponíveis para atualizar o estado visual
                const taskButton = taskListDiv.querySelector(`.btn-task[data-task-id="${taskIdToRemove}"]`);
                // Encontra a tarefa na lista de disponíveis (allAvailableTasks) para passar ao toggle
                // É importante usar a referência de allAvailableTasks aqui
                const taskDefinition = allAvailableTasks.find(t => t.id === taskIdToRemove);

                if (taskDefinition && taskButton) {
                    // Chama toggleTaskSelection com a definição original da tarefa e o botão
                    toggleTaskSelection(taskDefinition, taskButton);
                } else {
                     console.warn(`[FocusSession] Task definition or button not found for removal: ${taskIdToRemove}. Forcing removal from selected list.`);
                     // Força a remoção da lista de selecionadas se algo deu errado
                     const idx = selectedTasks.findIndex(t => t.id === taskIdToRemove);
                     if (idx > -1) {
                         selectedTasks.splice(idx, 1);
                         renderSelectedTasks(); // Re-renderiza a lista de selecionadas
                         updateSelectedTasksCountAndValidation(); // Atualiza contagem e botão
                     }
                }
                e.stopPropagation();
            });
        });
        updateNextSessionInfo();
        console.log("[FocusSession] Finished rendering selected tasks.");
    }

    // Define a tarefa ativa (index na lista selectedTasks)
    function setActiveTask(index) {
        console.log(`[FocusSession] Attempting to set active task index to: ${index}`);
        if (index >= 0 && index < selectedTasks.length) {
            // Verifica se a tarefa NESTA SESSÃO (selectedTasks) já está marcada como concluída
            if (selectedTasks[index].completed) {
                console.log(`[FocusSession] Task at index ${index} is marked completed in this session. Searching for next available.`);
                let nextAvailableIndex = -1;
                // Procura a próxima tarefa NÃO concluída na lista de selecionadas
                for (let i = index + 1; i < selectedTasks.length; i++) {
                    if (!selectedTasks[i].completed) { nextAvailableIndex = i; break; }
                }
                if (nextAvailableIndex === -1) {
                     for (let i = 0; i < index; i++) {
                        if (!selectedTasks[i].completed) { nextAvailableIndex = i; break; }
                    }
                }
                if (nextAvailableIndex !== -1) {
                    console.log(`[FocusSession] Found next available task in session at index: ${nextAvailableIndex}`);
                    index = nextAvailableIndex;
                } else {
                    console.log("[FocusSession] No available (non-completed) selected tasks found in this session.");
                    activeTaskIndex = -1;
                    renderSelectedTasks(); // Atualiza UI para remover destaque
                    updateNextSessionInfo();
                    return;
                }
            }
            activeTaskIndex = index;
            console.log(`[FocusSession] Active task index set to: ${activeTaskIndex}`);
            document.querySelectorAll('.selected-task').forEach((taskEl, idx) => {
                 taskEl.classList.toggle('task-active', idx === activeTaskIndex);
            });
        } else {
            console.log(`[FocusSession] Invalid index (${index}) or no selected tasks. Setting active index to -1.`);
            activeTaskIndex = -1;
            document.querySelectorAll('.selected-task').forEach(taskEl => {
                taskEl.classList.remove('task-active');
            });
        }
        updateNextSessionInfo();
    }

    // Atualiza a barra de progresso da tarefa ativa durante o foco
    function updateActiveTaskProgress() {
        if (activeTaskIndex === -1 || !selectedTasks[activeTaskIndex] || selectedTasks[activeTaskIndex].completed || !isFocusTime || !isRunning) return;
        const totalDuration = (timerMode === 'manual' ? manualFocusDuration : currentCycleFocusDuration) * 60;
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
            progressText.textContent = `${Math.round(clampedPercentage)}%`;
            if (clampedPercentage > 50) {
                progressText.style.color = "white";
                progressText.style.mixBlendMode = "overlay";
            } else {
                progressText.style.color = "var(--text-color)";
                progressText.style.mixBlendMode = "normal";
            }
        }
    }

    // Marca a tarefa ativa como concluída NA SESSÃO e salva no localStorage
    function markTaskAsCompleted() {
        if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex]) {
            const completedTaskId = selectedTasks[activeTaskIndex].id;
            console.log(`[FocusSession] Marking task ${completedTaskId} as completed IN SESSION.`);
            // Marca como concluída na lista da sessão (selectedTasks)
            selectedTasks[activeTaskIndex].progress = 100;
            selectedTasks[activeTaskIndex].completed = true;

            // Salva o estado concluído PERMANENTEMENTE no localStorage
            saveTaskCompletionStatus(completedTaskId, true);

            // Re-renderiza a lista de selecionadas para mostrar o estado atualizado
            renderSelectedTasks();

            // Tenta mover para a próxima tarefa não concluída na lista de selecionadas
            let nextIndex = -1;
            for (let i = 0; i < selectedTasks.length; i++) {
                 // Procura a próxima *diferente* da atual que não esteja completa na sessão
                 if (i !== activeTaskIndex && !selectedTasks[i].completed) { nextIndex = i; break; }
            }
            // Se não encontrou depois, tenta do início até a atual
            // (Não precisa verificar antes, pois a lógica acima cobre isso ao iterar de 0)
            // if (nextIndex === -1) { ... }

            if (nextIndex !== -1) {
                console.log(`[FocusSession] Moving to next available task in session at index ${nextIndex}`);
                setActiveTask(nextIndex);
            } else {
                console.log("[FocusSession] No more available tasks in the selected list for this session.");
                activeTaskIndex = -1; // Nenhuma tarefa ativa restante na sessão
                updateNextSessionInfo();
                // Verifica se TODAS as tarefas disponíveis (não apenas as selecionadas) foram concluídas
                // A lista allAvailableTasks já foi atualizada por saveTaskCompletionStatus
                if (allAvailableTasks.length === 0) {
                     alert("Parabéns! Todas as tarefas pendentes foram concluídas!");
                } else if (selectedTasks.every(task => task.completed)) {
                     alert("Parabéns! Todas as tarefas selecionadas para esta sessão foram concluídas.");
                }
            }
        }
    }

    // Função para salvar o status de conclusão da tarefa no localStorage (usando 'studyTasks')
    function saveTaskCompletionStatus(taskId, isCompleted) {
        console.log(`[FocusSession] Saving completion status (${isCompleted}) for task ${taskId} to localStorage ('studyTasks').`);
        const storedData = localStorage.getItem('studyTasks');
        let tasksBySubject = {};
        if (storedData) {
            try {
                tasksBySubject = JSON.parse(storedData);
                if (!tasksBySubject || typeof tasksBySubject !== 'object' || Array.isArray(tasksBySubject)) {
                    console.error("[FocusSession] Data in localStorage for 'studyTasks' is not a valid object. Cannot save completion status.");
                    return;
                }
            } catch (e) {
                console.error("[FocusSession] Error reading tasks from localStorage ('studyTasks') for saving completion:", e);
                return;
            }
        }

        let taskFoundAndUpdated = false;
        // Itera sobre as matérias para encontrar e atualizar a tarefa
        Object.keys(tasksBySubject).forEach(subject => {
            if (Array.isArray(tasksBySubject[subject])) {
                const taskIndex = tasksBySubject[subject].findIndex(t => t && t.id === taskId);
                if (taskIndex !== -1) {
                    tasksBySubject[subject][taskIndex].completed = isCompleted;
                    // Opcional: Atualizar data de conclusão, etc.
                    // tasksBySubject[subject][taskIndex].completionDate = new Date().toISOString();
                    taskFoundAndUpdated = true;
                }
            }
        });

        if (taskFoundAndUpdated) {
            localStorage.setItem('studyTasks', JSON.stringify(tasksBySubject));
            console.log(`[FocusSession] Task ${taskId} status saved to localStorage ('studyTasks').`);

            // Atualiza também a lista `allAvailableTasks` para remover a tarefa concluída da lista de disponíveis na UI
            const internalTaskIndex = allAvailableTasks.findIndex(t => t && t.id === taskId);
            if (internalTaskIndex !== -1) {
                allAvailableTasks.splice(internalTaskIndex, 1);
                renderAvailableTasks(allAvailableTasks); // Re-renderiza a lista de disponíveis
            }
        } else {
            console.warn(`[FocusSession] Task ${taskId} not found in localStorage ('studyTasks') object for saving completion.`);
        }
    }

    // Atualiza a contagem de tarefas selecionadas e habilita/desabilita botão Iniciar
    function updateSelectedTasksCountAndValidation() {
        const count = selectedTasks.length;
        selectedTasksCountElement.textContent = `${count}/${MAX_TASKS}`;
        // Verifica se há pelo menos uma tarefa selecionada E que não esteja marcada como concluída NESTA SESSÃO
        const canStart = !isRunning && count > 0 && selectedTasks.some(t => !t.completed);
        if (count === 0) {
            tasksValidationElement.textContent = "Selecione pelo menos uma tarefa.";
            tasksValidationElement.style.display = "flex";
        } else if (!selectedTasks.some(t => !t.completed)) {
             tasksValidationElement.textContent = "Todas as tarefas selecionadas nesta sessão estão concluídas.";
             tasksValidationElement.style.display = "flex";
        } else {
            tasksValidationElement.style.display = "none";
        }
        startBtn.disabled = !canStart;
        console.log(`[FocusSession] Start button enabled: ${!startBtn.disabled}`);
    }

    // --- Lógica do Timer (sem alterações significativas, mantendo logs anteriores) ---

    // Formata segundos para MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    // Atualiza o display visual do timer (relógio, progresso)
    function updateTimerDisplay() {
        timeDisplay.textContent = formatTime(remainingTime);
        let totalTimeForProgress = 0;
        if (!isRunning) {
            // Calcula o tempo total baseado no modo e duração atual para exibir progresso 0
            if (timerMode === 'manual') {
                totalTimeForProgress = manualFocusDuration * 60;
            } else {
                // Usa a duração calculada para o ciclo atual (que seria o primeiro se fosse iniciar)
                calculateAutoDurations(); // Garante que currentCycleFocusDuration está atualizado
                totalTimeForProgress = currentCycleFocusDuration * 60;
            }
        } else if (timerMode === 'manual') {
            totalTimeForProgress = manualFocusDuration * 60;
        } else { // Auto
            totalTimeForProgress = isFocusTime ? currentCycleFocusDuration * 60 : currentCycleBreakDuration * 60;
        }
        const progressPercentage = totalTimeForProgress > 0 ? ((totalTimeForProgress - remainingTime) / totalTimeForProgress) * 100 : 0;
        const clampedProgress = Math.max(0, Math.min(100, progressPercentage));
        const progressColor = isFocusTime ? 'var(--primary-color)' : 'var(--break-color, var(--secondary-color))';
        progressCircle.style.background = `conic-gradient(${progressColor} ${clampedProgress}%, transparent ${clampedProgress}%)`;
        progressPercentageElement.textContent = `${Math.round(clampedProgress)}%`;
        document.getElementById("clock-circle").classList.toggle("timer-active", remainingTime <= 10 && remainingTime > 0 && isRunning);
    }

    // Atualiza as informações de status (tarefa ativa, próxima pausa/foco)
    function updateNextSessionInfo() {
        let currentActiveTaskTitle = "Nenhuma tarefa ativa";
        if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex]) {
            currentActiveTaskTitle = selectedTasks[activeTaskIndex].title;
        }
        if (timerMode === "auto") {
            if (!isRunning) {
                 timerModeElement.className = "timer-mode-indicator auto";
                 timerModeText.textContent = "Modo Automático";
                 // Verifica se há tarefas PENDENTES selecionadas para mostrar 'Pronto'
                 const readyMsg = selectedTasks.some(t => !t.completed) ? `Pronto (${autoSettings.totalSessionDuration} min)` : (selectedTasks.length > 0 ? 'Todas selecionadas concluídas' : 'Selecione tarefas pendentes');
                 nextSessionElement.innerHTML = `<i class="fas fa-hourglass-start"></i> ${readyMsg}`;
            } else if (isFocusTime) {
                timerModeElement.className = "timer-mode-indicator focus";
                timerModeText.textContent = `Foco: ${currentActiveTaskTitle}`;
                const nextBreakDuration = (focusCyclesCompletedInBlock + 1) % LONG_BREAK_INTERVAL === 0 ? autoSettings.baseBreakDuration * 2 : autoSettings.baseBreakDuration;
                nextSessionElement.innerHTML = `<i class="fas fa-coffee"></i> Próxima pausa (${nextBreakDuration} min) em ${formatTime(remainingTime)}`;
            } else { // Em pausa
                timerModeElement.className = "timer-mode-indicator break";
                const isLongBreak = currentCycleBreakDuration > autoSettings.baseBreakDuration;
                timerModeText.textContent = isLongBreak ? "Pausa Longa" : "Pausa Curta";
                nextSessionElement.innerHTML = `<i class="fas fa-brain"></i> Próximo foco (${currentCycleFocusDuration} min) em ${formatTime(remainingTime)}`;
            }
        } else { // Modo Manual
             timerModeElement.className = "timer-mode-indicator focus";
             timerModeText.textContent = `Foco Manual: ${currentActiveTaskTitle}`;
             nextSessionElement.innerHTML = `<i class="fas fa-clock"></i> Duração: ${formatTime(manualFocusDuration * 60)}`;
        }
    }

    // Reseta o timer para o estado inicial (parado)
    function resetTimer() {
        console.log("[FocusSession] Resetting timer...");
        clearInterval(timer);
        isRunning = false;
        isFocusTime = true;
        sessionCount = 0;
        focusCyclesCompletedInBlock = 0;
        totalSessionRemainingTime = 0;
        if (timerMode === "manual") {
            remainingTime = manualFocusDuration * 60;
        } else { // Auto
            totalSessionRemainingTime = autoSettings.totalSessionDuration * 60;
            calculateAutoDurations(); // Calcula durações iniciais baseado no tempo total
            remainingTime = currentCycleFocusDuration * 60;
        }
        updateTimerDisplay();
        updateNextSessionInfo();
        // Reseta progresso visual das tarefas selecionadas (não apenas a ativa)
        selectedTasks.forEach(task => { task.progress = 0; });
        renderSelectedTasks(); // Re-renderiza para mostrar progresso 0

        updateSelectedTasksCountAndValidation();
        cancelBtn.disabled = true;
        document.getElementById("clock-circle").classList.remove("timer-active");
        customTimeInput.disabled = false;
        totalSessionTimeInput.disabled = false;
        breakTimeInput.disabled = false;
        console.log("[FocusSession] Timer reset complete.");
    }

    // Calcula as durações de foco/pausa para o modo automático
    function calculateAutoDurations() {
        const totalMinutes = autoSettings.totalSessionDuration;
        // Lógica de adaptação simples (pode ser melhorada)
        if (totalMinutes <= 45) {
            currentCycleFocusDuration = Math.min(40, Math.max(20, totalMinutes - autoSettings.baseBreakDuration));
        } else if (totalMinutes <= 90) {
            currentCycleFocusDuration = 30;
        } else if (totalMinutes <= 150) {
            currentCycleFocusDuration = 25;
        } else { // >= 150
            currentCycleFocusDuration = 20;
        }
        // Garante que o foco não seja maior que o tempo total restante na sessão
        // Usa Math.max com 1 para garantir que haja pelo menos 1 min se houver tempo restante
        // Considera o tempo total restante da SESSÃO, não apenas do ciclo
        currentCycleFocusDuration = Math.min(currentCycleFocusDuration, Math.max(1, Math.ceil(totalSessionRemainingTime / 60)));
        console.log(`[FocusSession] Calculated auto durations: Focus=${currentCycleFocusDuration}min based on total remaining ${totalSessionRemainingTime/60}min`);
    }

    // Função principal do tick do timer
    function tick() {
        if (remainingTime <= 0) {
            handleCycleEnd();
        } else {
            remainingTime--;
            if (timerMode === 'auto') {
                totalSessionRemainingTime--;
            }
            updateTimerDisplay();
            updateActiveTaskProgress();
            // Verifica se o tempo total da sessão automática acabou
            if (timerMode === 'auto' && totalSessionRemainingTime <= 0 && isRunning) {
                 console.log("[FocusSession] Auto session total time ended.");
                 handleSessionEnd();
            }
        }
    }

    // Lida com o fim de um ciclo (foco ou pausa)
    function handleCycleEnd() {
        console.log(`[FocusSession] Cycle ended. Mode: ${timerMode}, IsFocus: ${isFocusTime}`);
        clearInterval(timer);
        isRunning = false;
        if (timerMode === "manual") {
            playSound(focusEndSound);
            alert("Sessão de foco manual concluída!");
            // Perguntar sobre conclusão da tarefa manual
             if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex] && !selectedTasks[activeTaskIndex].completed) {
                const taskTitle = selectedTasks[activeTaskIndex].title;
                const confirmCompletion = confirm(`Sessão manual concluída! Você finalizou a tarefa "${taskTitle}"?`);
                if (confirmCompletion) {
                    markTaskAsCompleted();
                }
            }
            resetTimer();
        } else { // Modo Automático
            if (isFocusTime) {
                playSound(focusEndSound);
                sessionCount++;
                focusCyclesCompletedInBlock++;
                console.log(`[FocusSession] Focus cycle ${sessionCount} ended. Cycles in block: ${focusCyclesCompletedInBlock}`);
                let taskCompletedDuringCycle = false;
                if (activeTaskIndex !== -1 && selectedTasks[activeTaskIndex] && !selectedTasks[activeTaskIndex].completed) {
                    const taskTitle = selectedTasks[activeTaskIndex].title;
                    const confirmCompletion = confirm(`Ciclo de foco concluído! Você finalizou a tarefa "${taskTitle}"?`);
                    if (confirmCompletion) {
                        markTaskAsCompleted(); // Marca como concluída na sessão e no localStorage
                        taskCompletedDuringCycle = true;
                    }
                }
                // Verifica se ainda há tempo na sessão total E tarefas selecionadas pendentes NA SESSÃO
                const hasMoreTime = totalSessionRemainingTime > 0;
                const hasPendingSelectedTasks = selectedTasks.some(t => !t.completed);
                if (!hasMoreTime || !hasPendingSelectedTasks) {
                    console.log(`[FocusSession] Ending session. HasTime: ${hasMoreTime}, HasPendingSelected: ${hasPendingSelectedTasks}`);
                    handleSessionEnd();
                    return;
                }
                console.log("[FocusSession] Preparing for break...");
                isFocusTime = false;
                currentCycleBreakDuration = autoSettings.baseBreakDuration;
                if (focusCyclesCompletedInBlock % LONG_BREAK_INTERVAL === 0) {
                    console.log("[FocusSession] Long break triggered.");
                    currentCycleBreakDuration *= 2;
                }
                remainingTime = currentCycleBreakDuration * 60;
                remainingTime = Math.min(remainingTime, totalSessionRemainingTime);
                if (remainingTime <= 0) {
                    console.log("[FocusSession] Not enough time for break. Ending session.");
                    handleSessionEnd();
                    return;
                }
                playSound(breakStartSound);
                updateNextSessionInfo();
                updateTimerDisplay();
                timer = setInterval(tick, 1000);
                isRunning = true;
                console.log(`[FocusSession] Break started. Duration: ${currentCycleBreakDuration} min.`);
            } else {
                playSound(breakEndSound);
                console.log("[FocusSession] Break ended.");
                isFocusTime = true;
                if (currentCycleBreakDuration > autoSettings.baseBreakDuration) {
                    console.log("[FocusSession] Resetting focus cycle block counter after long break.");
                    focusCyclesCompletedInBlock = 0;
                }
                const hasMoreTime = totalSessionRemainingTime > 0;
                const hasPendingSelectedTasks = selectedTasks.some(t => !t.completed);
                if (!hasMoreTime || !hasPendingSelectedTasks) {
                     console.log(`[FocusSession] Ending session after break. HasTime: ${hasMoreTime}, HasPendingSelected: ${hasPendingSelectedTasks}`);
                    handleSessionEnd();
                    return;
                }
                console.log("[FocusSession] Preparing for next focus cycle...");
                // Garante que haja uma tarefa ativa não concluída NA SESSÃO
                if (activeTaskIndex === -1 || (selectedTasks[activeTaskIndex] && selectedTasks[activeTaskIndex].completed)) {
                    const nextAvailableIdx = selectedTasks.findIndex(t => !t.completed);
                    if (nextAvailableIdx !== -1) {
                         setActiveTask(nextAvailableIdx);
                    } else {
                         console.log("[FocusSession] No available task found in session for next focus cycle. Ending session.");
                         handleSessionEnd();
                         return;
                    }
                }
                calculateAutoDurations(); // Recalcula duração do próximo foco
                remainingTime = currentCycleFocusDuration * 60;
                remainingTime = Math.min(remainingTime, totalSessionRemainingTime);
                 if (remainingTime <= 0) {
                    console.log("[FocusSession] Not enough time for next focus cycle. Ending session.");
                    handleSessionEnd();
                    return;
                }
                playSound(focusStartSound);
                updateNextSessionInfo();
                updateTimerDisplay();
                timer = setInterval(tick, 1000);
                isRunning = true;
                console.log(`[FocusSession] Focus cycle started. Duration: ${currentCycleFocusDuration} min.`);
            }
        }
    }

    // Lida com o fim da sessão automática completa
    function handleSessionEnd() {
        console.log("[FocusSession] Handling session end.");
        clearInterval(timer);
        isRunning = false;
        playSound(breakEndSound);
        if (totalSessionRemainingTime <= 0) {
             alert("Sessão de foco automática concluída! Tempo esgotado.");
        } else if (!selectedTasks.some(t => !t.completed)) {
             alert("Sessão de foco automática concluída! Todas as tarefas selecionadas foram finalizadas.");
        }
        resetTimer();
    }

    // Inicia o timer
    function startTimer() {
        console.log("[FocusSession] Start button clicked.");
        if (selectedTasks.length === 0) {
            alert("Por favor, selecione pelo menos uma tarefa para iniciar.");
            return;
        }
        // Verifica se há pelo menos uma tarefa selecionada NÃO CONCLUÍDA NA SESSÃO
        const firstPendingIndex = selectedTasks.findIndex(t => !t.completed);
        if (firstPendingIndex === -1) {
             alert("Todas as tarefas selecionadas nesta sessão já estão concluídas. Selecione novas tarefas ou remova as concluídas.");
             return;
        }
        // Define a primeira tarefa pendente como ativa se nenhuma estiver ou a atual estiver concluída NA SESSÃO
        if (activeTaskIndex === -1 || (selectedTasks[activeTaskIndex] && selectedTasks[activeTaskIndex].completed)) {
            setActiveTask(firstPendingIndex);
        }
        if (activeTaskIndex === -1) {
             console.error("[FocusSession] Failed to set an active task before starting timer.");
             alert("Erro ao definir tarefa ativa. Tente selecionar a tarefa novamente.");
             return;
        }
        console.log(`[FocusSession] Starting timer. Mode: ${timerMode}, Active Task Index: ${activeTaskIndex}`);
        isRunning = true;
        startBtn.disabled = true;
        cancelBtn.disabled = false;
        customTimeInput.disabled = true;
        totalSessionTimeInput.disabled = true;
        breakTimeInput.disabled = true;
        if (timerMode === "manual") {
            isFocusTime = true;
            remainingTime = manualFocusDuration * 60;
            console.log(`[FocusSession] Manual mode started. Duration: ${manualFocusDuration} min.`);
            playSound(focusStartSound);
        } else { // Auto
            isFocusTime = true;
            sessionCount = 0;
            focusCyclesCompletedInBlock = 0;
            totalSessionRemainingTime = autoSettings.totalSessionDuration * 60;
            calculateAutoDurations();
            remainingTime = currentCycleFocusDuration * 60;
            remainingTime = Math.min(remainingTime, totalSessionRemainingTime);
            if (remainingTime <= 0) {
                alert("Duração total da sessão é muito curta para iniciar um ciclo de foco.");
                cancelTimer();
                return;
            }
             console.log(`[FocusSession] Auto mode started. Total Duration: ${autoSettings.totalSessionDuration} min, First Focus: ${currentCycleFocusDuration} min.`);
            playSound(focusStartSound);
        }
        updateNextSessionInfo();
        updateTimerDisplay();
        timer = setInterval(tick, 1000);
    }

    // Cancela o timer e reseta o estado
    function cancelTimer() {
        console.log("[FocusSession] Cancel button clicked.");
        clearInterval(timer);
        isRunning = false;
        resetTimer();
    }

    // --- Controles de Modo e Input (sem alterações significativas, mantendo logs anteriores) ---

    // Inicializa os controles de seleção de modo (Manual/Automático)
    function initModeControls() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (isRunning) {
                    alert("Cancele a sessão atual para trocar de modo.");
                    return;
                }
                const tabId = button.getAttribute('data-tab');
                console.log(`[FocusSession] Tab changed to: ${tabId}`);
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                timerMode = tabId === 'manual-tab' ? 'manual' : 'auto';
                resetTimer();
            });
        });
        customTimeInput.addEventListener('input', function() {
            if (validateInput(this, 15, 240)) {
                manualFocusDuration = parseInt(this.value);
                if (!isRunning) {
                    remainingTime = manualFocusDuration * 60;
                    updateTimerDisplay();
                    updateNextSessionInfo();
                }
            }
        });
        customTimeInput.addEventListener('blur', function() {
             if (validateInput(this, 15, 240, 25)) {
                 manualFocusDuration = parseInt(this.value);
                 if (!isRunning) {
                    remainingTime = manualFocusDuration * 60;
                    updateTimerDisplay();
                    updateNextSessionInfo();
                 }
             }
        });
        customTimeInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') this.blur();
        });
        totalSessionTimeInput.addEventListener('input', function() {
            if (validateInput(this, 20, 240)) {
                autoSettings.totalSessionDuration = parseInt(this.value);
                if (!isRunning) resetTimer();
            }
        });
         totalSessionTimeInput.addEventListener('blur', function() {
             if (validateInput(this, 20, 240, 60)) {
                 autoSettings.totalSessionDuration = parseInt(this.value);
                 if (!isRunning) resetTimer();
             }
        });
        totalSessionTimeInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') this.blur();
        });
        breakTimeInput.addEventListener('input', function() {
            if (validateInput(this, 5, 30)) {
                autoSettings.baseBreakDuration = parseInt(this.value);
                 if (!isRunning && timerMode === 'auto') updateNextSessionInfo();
            }
        });
         breakTimeInput.addEventListener('blur', function() {
             if (validateInput(this, 5, 30, 5)) {
                 autoSettings.baseBreakDuration = parseInt(this.value);
                  if (!isRunning && timerMode === 'auto') updateNextSessionInfo();
             }
        });
        breakTimeInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') this.blur();
        });
        startBtn.addEventListener("click", startTimer);
        cancelBtn.addEventListener("click", cancelTimer);
    }

    // Função auxiliar para validar input numérico
    function validateInput(inputElement, min, max, defaultValue = null) {
        let valueStr = inputElement.value.trim();
        let value = parseInt(valueStr);
        let isValid = !isNaN(value) && value >= min && value <= max;
        const isBlurEvent = document.activeElement !== inputElement;
        if (isBlurEvent) {
            if (valueStr === '' && defaultValue !== null) {
                inputElement.value = defaultValue;
                console.log(`[FocusSession] Input ${inputElement.id} was empty on blur, set to default: ${defaultValue}`);
                return true;
            } else if (!isValid && defaultValue !== null) {
                inputElement.value = defaultValue;
                console.log(`[FocusSession] Input ${inputElement.id} was invalid on blur, set to default: ${defaultValue}`);
                return true;
            } else if (!isValid) {
                 console.warn(`[FocusSession] Input ${inputElement.id} is invalid on blur and has no default.`);
                 return false;
            }
        }
        // Permite digitar valores fora do range temporariamente durante o input
        // A validação final ocorre no blur ou antes de usar o valor
        return !isNaN(value) && value <= max; // Apenas verifica se é número e não excede max durante digitação
    }

    // --- Inicializar a aplicação ---
    initializeApp();
});
