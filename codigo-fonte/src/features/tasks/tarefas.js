/**
 * Gerenciador de Tarefas - Estudo Inteligente
 * 
 * Este script implementa todas as funcionalidades da página de tarefas,
 * incluindo criação, edição, exclusão, filtragem, ordenação e categorização
 * de tarefas por matérias.
 */

// Variáveis globais para armazenar o estado da aplicação
let tasks = {}; // Objeto que armazena todas as tarefas organizadas por matéria
let currentEditTaskId = null; // Rastreia o ID da tarefa em edição

// Referências aos elementos DOM principais
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const newTaskButton = document.getElementById("newTaskButton");
const taskModal = document.getElementById("taskModal");
const closeModalButton = taskModal ? taskModal.querySelector(".close-modal") : null;
const searchInput = document.querySelector(".search-input");
const filterSelect = document.getElementById("filterSelect");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const taskModalTitle = document.getElementById("taskModalTitle");
const saveTaskButton = document.getElementById("saveTaskButton");

/**
 * Carrega as tarefas do localStorage para a variável global tasks
 * Chamada durante a inicialização da página
 */
function loadTasksFromStorage() {
    console.log("tarefas.js: Loading tasks from storage"); // Debug
    tasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
}

/**
 * Converte códigos de matérias para nomes de exibição
 * @param {string} value - Código da matéria (ex: "math")
 * @returns {string} Nome de exibição da matéria (ex: "Matemática")
 */
function getSubjectName(value) {
    const subjects = {
        "math": "Matemática",
        "physics": "Física",
        "chemistry": "Química",
        "biology": "Biologia",
        "history": "História",
        "geography": "Geografia",
        "philosophy": "Filosofia",
        "sociology": "Sociologia",
        "portuguese": "Português",
        "literature": "Literatura",
        "english": "Inglês",
        "spanish": "Espanhol",
        "art": "Artes",
        "physical_education": "Educação Física",
        "other": "Outra",
        "Estudos Agendados": "Estudos Agendados"
    };
    return subjects[value] || value;
}

/**
 * Converte nomes de matérias para códigos (inverso de getSubjectName)
 * @param {string} name - Nome da matéria (ex: "Matemática")
 * @returns {string} Código da matéria (ex: "math")
 */
function getSubjectValue(name) {
    const subjectMap = {
        "Matemática": "math",
        "Física": "physics",
        "Química": "chemistry",
        "Biologia": "biology",
        "História": "history",
        "Geografia": "geography",
        "Filosofia": "philosophy",
        "Sociologia": "sociology",
        "Português": "portuguese",
        "Literatura": "literature",
        "Inglês": "english",
        "Espanhol": "spanish",
        "Artes": "art",
        "Educação Física": "physical_education"
    };
    // Se não encontrar no mapa, considera como matéria personalizada
    if (!subjectMap[name]) {
        // A lógica para "Outra" e customSubject é tratada separadamente ao popular o form
        return "other"; // Default para 'Outra' se não mapeado diretamente
    }
    return subjectMap[name] || "other";
}

/**
 * Renderiza todas as tarefas na interface com filtros aplicados
 * Agrupa tarefas por matéria e aplica filtros de busca e status
 */
function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = "";
    
    // Obtém termos de busca e filtros ativos
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const filterValue = filterSelect ? filterSelect.value : "all";
    const today = new Date().toISOString().split("T")[0];
    
    // Processa cada matéria e suas tarefas
    Object.entries(tasks).forEach(([subject, taskItems]) => {
        // Filtra tarefas com base na busca e filtro selecionado
        const filteredTasks = taskItems.filter(task => {
            // Verifica se a tarefa corresponde ao termo de busca
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                                (task.description && task.description.toLowerCase().includes(searchTerm)) ||
                                (task.due && task.due.toLowerCase().includes(searchTerm));
            
            // Verifica se a tarefa corresponde ao filtro de status
            let matchesFilter = true;
            if (filterValue === "all") {
                matchesFilter = true;
            } else if (filterValue === "completed") {
                matchesFilter = task.done;
            } else if (filterValue === "pending") {
                matchesFilter = !task.done;
            } else if (filterValue === "expired") {
                matchesFilter = !task.done && task.due && task.due < today && !isNaN(Date.parse(task.due));
            }
            return matchesSearch && matchesFilter;
        });
        
        // Cria o elemento de categoria se houver tarefas filtradas
        if (filteredTasks.length > 0) {
            const categoryDiv = createCategoryElement(subject);
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task, subject);
                categoryDiv.appendChild(taskElement);
            });
            taskList.appendChild(categoryDiv);
        }
    });
    
    // Atualiza o contador de tarefas e inicializa a funcionalidade de arrastar e soltar
    updateTaskCount();
    initSortable();
}

/**
 * Cria um elemento DOM para uma categoria/matéria
 * @param {string} subject - Nome da matéria
 * @returns {HTMLElement} Elemento DOM da categoria
 */
function createCategoryElement(subject) {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "task-category";
    
    // Cria o título da categoria com ícone de edição para matérias personalizadas
    const categoryTitle = document.createElement("h3");
    categoryTitle.innerHTML = `
        <span>${subject}</span>
        ${subject.toLowerCase() !== "estudos agendados" && !Object.values(getSubjectName("")).includes(subject) ? 
        '<i class="fas fa-edit subject-edit" title="Editar nome da matéria"></i>' : ''}
    `; // Não permite editar "Estudos Agendados" ou matérias padrão
    categoryTitle.style.setProperty("--subject-color", getSubjectColor(subject));
    
    // Adiciona funcionalidade de edição para matérias personalizadas
    if (subject.toLowerCase() !== "estudos agendados" && !Object.values(getSubjectName("")).includes(subject)) {
        const editIcon = categoryTitle.querySelector(".subject-edit");
        if(editIcon) {
            editIcon.addEventListener("click", (e) => {
                e.stopPropagation(); // Impede que o clique no ícone abra o modal da tarefa
                const newName = prompt("Digite o novo nome para esta matéria:", subject);
                if (newName && newName.trim() && newName !== subject) {
                    renameSubject(subject, newName.trim());
                }
            });
        }
    }
    
    categoryDiv.appendChild(categoryTitle);
    return categoryDiv;
}

/**
 * Cria um elemento DOM para uma tarefa individual
 * @param {Object} task - Objeto da tarefa
 * @param {string} subject - Nome da matéria à qual a tarefa pertence
 * @returns {HTMLElement} Elemento DOM da tarefa
 */
function createTaskElement(task, subject) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task ${task.done ? "task-done" : ""} ${isTaskExpired(task.due) && !task.done ? "task-expired" : ""}`;
    taskDiv.dataset.taskId = task.id;
    taskDiv.dataset.subject = subject; // Armazena a categoria/matéria original
    taskDiv.dataset.priority = task.priority;

    // Adiciona evento de clique para abrir o modal de edição
    taskDiv.addEventListener("click", () => openEditTaskModal(task.id, subject));

    // Adiciona tooltip para observações se existirem
    if (task.description && task.description.trim()) {
        taskDiv.classList.add("tooltip-container");
        const tooltipText = document.createElement("span");
        tooltipText.classList.add("tooltip-text");
        tooltipText.textContent = "Observações: " + task.description;
        taskDiv.appendChild(tooltipText);
    }

    // Cria a parte esquerda do item de tarefa (checkbox, título, etc.)
    const leftDiv = document.createElement("div");
    leftDiv.className = "task-left";
    leftDiv.innerHTML = `
        <i class="fas fa-grip-lines task-handle"></i>
        <input type="checkbox" class="task-checkbox" ${task.done ? "checked" : ""} 
               aria-label="${task.done ? 'Desmarcar tarefa' : 'Marcar tarefa como concluída'}">
        <span class="priority-${task.priority}"></span>
        <span>${task.title}</span>
    `;

    // Cria a parte direita do item de tarefa (data, botões de ação)
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "task-actions";
    actionsDiv.innerHTML = `
        <span class="task-due">${task.due ? new Date(task.due + "T00:00:00").toLocaleDateString("pt-BR") : "Sem prazo"}</span>
        <button class="btn-focus" title="Iniciar sessão de foco" aria-label="Iniciar foco na tarefa ${task.title}">
            <i class="fas fa-clock"></i>
        </button>
        <button class="btn-delete" title="Excluir tarefa" aria-label="Excluir tarefa ${task.title}">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    // Adiciona event listeners para as ações
    leftDiv.querySelector(".task-checkbox").addEventListener("click", (e) => {
        e.stopPropagation(); // Impede que o clique no checkbox abra o modal
        toggleTaskDone(task.id, subject);
    });
    actionsDiv.querySelector(".btn-focus").addEventListener("click", (e) => {
        e.stopPropagation();
        setFocusTask(task, subject);
    });
    actionsDiv.querySelector(".btn-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        showDeleteConfirmation(task.id, subject, task.title);
    });

    taskDiv.appendChild(leftDiv);
    taskDiv.appendChild(actionsDiv);
    return taskDiv;
}

/**
 * Abre o modal para criar uma nova tarefa
 * Reseta o formulário e configura os valores padrão
 */
function openNewTaskModal() {
    currentEditTaskId = null;
    if (taskModalTitle) taskModalTitle.textContent = "Nova Tarefa";
    if (saveTaskButton) saveTaskButton.textContent = "Salvar Tarefa";
    if (taskForm) taskForm.reset();
    document.getElementById("customSubject").classList.add("hidden");
    document.getElementById("taskSubject").value = "math"; // Default
    document.querySelector('input[name="priority"][value="medium"]').checked = true; // Default priority
    if (taskModal) taskModal.style.display = "block";
}

/**
 * Abre o modal para editar uma tarefa existente
 * Preenche o formulário com os dados da tarefa selecionada
 * @param {string} taskId - ID da tarefa a ser editada
 * @param {string} subjectName - Nome da matéria da tarefa
 */
function openEditTaskModal(taskId, subjectName) {
    const task = tasks[subjectName]?.find(t => t.id === taskId);
    if (!task) {
        console.error("Tarefa não encontrada para edição:", taskId, subjectName);
        return;
    }
    currentEditTaskId = taskId;
    if (taskModalTitle) taskModalTitle.textContent = "Editar Tarefa";
    if (saveTaskButton) saveTaskButton.textContent = "Salvar Alterações";

    // Preenche os campos do formulário com os dados da tarefa
    document.getElementById("editTaskId").value = taskId;
    document.getElementById("taskTitle").value = task.title;
    
    // Configura o campo de matéria, lidando com matérias personalizadas
    const subjectSelect = document.getElementById("taskSubject");
    const customSubjectInput = document.getElementById("customSubject");
    const subjectValue = getSubjectValue(subjectName); // Tenta mapear o nome da matéria para o valor do select
    
    if (subjectSelect.querySelector(`option[value="${subjectValue}"]`)) {
        subjectSelect.value = subjectValue;
        customSubjectInput.classList.add("hidden");
        customSubjectInput.value = "";
    } else { // Matéria personalizada (não está no select padrão)
        subjectSelect.value = "other";
        customSubjectInput.classList.remove("hidden");
        customSubjectInput.value = subjectName;
    }
    
    // Preenche os demais campos
    document.getElementById("taskDueDate").value = task.due || "";
    document.querySelector(`input[name="priority"][value="${task.priority || 'medium'}"]`).checked = true;
    document.getElementById("taskDescription").value = task.description || "";

    // Exibe o modal
    if (taskModal) taskModal.style.display = "block";
}

/**
 * Define uma tarefa para iniciar uma sessão de foco
 * Salva a tarefa no localStorage e redireciona para a página de sessão de foco
 * @param {Object} task - Objeto da tarefa
 * @param {string} subject - Nome da matéria da tarefa
 */
function setFocusTask(task, subject) {
    const focusTask = { ...task, subject: subject };
    localStorage.setItem("focusTask", JSON.stringify(focusTask));
    window.location.href = "../pomodoro/sessao_de_foco.html";
}

/**
 * Verifica se uma tarefa está com o prazo vencido
 * @param {string} dueDate - Data de vencimento no formato YYYY-MM-DD
 * @returns {boolean} Verdadeiro se a tarefa estiver vencida
 */
function isTaskExpired(dueDate) {
    if (!dueDate || isNaN(Date.parse(dueDate))) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const taskDueDate = new Date(dueDate + "T00:00:00"); 
    return taskDueDate < today;
}

/**
 * Obtém a cor associada a uma matéria, adaptando-se ao tema atual
 * @param {string} subject - Nome da matéria
 * @returns {string} Código de cor hexadecimal
 */
function getSubjectColor(subject) {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    const colors = {
        "Matemática": theme === "dark" ? "#63b3ed" : "#4682B4",
        "Física": theme === "dark" ? "#9b59b6" : "#9b59b6",
        "Química": theme === "dark" ? "#e67e22" : "#e67e22",
        "Biologia": theme === "dark" ? "#58d68d" : "#2ecc71",
        "História": theme === "dark" ? "#f6ad55" : "#f39c12",
        "Geografia": theme === "dark" ? "#1abc9c" : "#1abc9c",
        "Filosofia": theme === "dark" ? "#7f8c8d" : "#7f8c8d",
        "Sociologia": theme === "dark" ? "#bdc3c7" : "#34495e",
        "Português": theme === "dark" ? "#e74c3c" : "#e74c3c",
        "Literatura": theme === "dark" ? "#c0392b" : "#c0392b",
        "Inglês": theme === "dark" ? "#3498db" : "#3498db",
        "Espanhol": theme === "dark" ? "#f1c40f" : "#f1c40f",
        "Artes": theme === "dark" ? "#fd79a8" : "#e84393",
        "Educação Física": theme === "dark" ? "#00b894" : "#27ae60",
        "Outra": theme === "dark" ? "#a0aec0" : "#8a2be2",
        "Estudos Agendados": theme === "dark" ? "#f1c40f" : "#f39c12"
    };
    return colors[subject] || "#4682B4";
}

/**
 * Alterna o estado de conclusão de uma tarefa
 * @param {string} taskId - ID da tarefa
 * @param {string} taskSubject - Nome da matéria da tarefa
 */
function toggleTaskDone(taskId, taskSubject) {
    if (tasks[taskSubject]) {
        const task = tasks[taskSubject].find(t => t.id === taskId);
        if (task) {
            task.done = !task.done;
            saveTasks();
            showToast(task.done ? "Tarefa marcada como concluída!" : "Tarefa desmarcada.");
        }
    }
    renderTasks(); 
}

/**
 * Processa o envio do formulário de tarefa (nova ou edição)
 * @param {Event} event - Evento de submit do formulário
 */
function handleTaskFormSubmit(event) {
    event.preventDefault();
    // Coleta os dados do formulário
    const title = document.getElementById("taskTitle").value.trim();
    const subjectValue = document.getElementById("taskSubject").value;
    const customSubjectInput = document.getElementById("customSubject");
    const dueDate = document.getElementById("taskDueDate").value;
    const priority = taskForm.querySelector("input[name='priority']:checked").value;
    const description = document.getElementById("taskDescription").value.trim();
    const editingId = document.getElementById("editTaskId").value;

    // Determina o nome da matéria (padrão ou personalizada)
    let subjectName;
    if (subjectValue === "other" && customSubjectInput.value.trim()) {
        subjectName = customSubjectInput.value.trim();
    } else {
        subjectName = getSubjectName(subjectValue);
    }

    // Validação básica
    if (!title) {
        alert("O título da tarefa é obrigatório.");
        return;
    }

    if (editingId) { // Editando tarefa existente
        let originalSubjectName = null;
        // Encontra a matéria original da tarefa sendo editada
        for (const subj in tasks) {
            if (tasks[subj].find(t => t.id === editingId)) {
                originalSubjectName = subj;
                break;
            }
        }

        if (!originalSubjectName) {
            console.error("Não foi possível encontrar a tarefa original para edição.");
            return;
        }

        const taskIndex = tasks[originalSubjectName].findIndex(t => t.id === editingId);
        if (taskIndex === -1) {
             console.error("Índice da tarefa não encontrado para edição.");
            return;
        }

        // Cria objeto atualizado preservando propriedades existentes
        const updatedTask = {
            ...tasks[originalSubjectName][taskIndex], // Preserva propriedades como 'id', 'done'
            title: title,
            due: dueDate || null,
            description: description,
            priority: priority || "medium",
            // Matéria (subjectName) pode ter mudado
        };

        if (originalSubjectName !== subjectName) {
            // Remove da categoria antiga
            tasks[originalSubjectName].splice(taskIndex, 1);
            if (tasks[originalSubjectName].length === 0) {
                delete tasks[originalSubjectName];
            }
            // Adiciona à nova categoria
            if (!tasks[subjectName]) {
                tasks[subjectName] = [];
            }
            tasks[subjectName].push(updatedTask);
            showToast("Tarefa atualizada e movida para " + subjectName + "!");
        } else {
            // Atualiza na mesma categoria
            tasks[originalSubjectName][taskIndex] = updatedTask;
            showToast("Tarefa atualizada com sucesso!");
        }

    } else { // Adicionando nova tarefa
        const newId = `task-${Date.now()}`;
        const newTask = {
            id: newId,
            title: title,
            due: dueDate || null,
            description: description,
            priority: priority || "medium",
            done: false
        };
        
        // Cria a categoria se não existir
        if (!tasks[subjectName]) {
            tasks[subjectName] = [];
        }
        tasks[subjectName].push(newTask);
        showToast("Nova tarefa adicionada!");
    }
    
    // Salva as alterações e atualiza a interface
    saveTasks();
    renderTasks(); 
    if (taskModal) taskModal.style.display = "none";
    taskForm.reset();
    document.getElementById("editTaskId").value = ""; // Limpa ID de edição
    customSubjectInput.value = "";
    customSubjectInput.classList.add("hidden");
}

/**
 * Salva as tarefas no localStorage e atualiza a interface
 * Dispara evento para notificar outras partes da aplicação
 */
function saveTasks() {
    localStorage.setItem("studyTasks", JSON.stringify(tasks));
    updateTaskCount();
    // Dispara evento para notificar outras partes da aplicação (ex: cronograma)
    window.dispatchEvent(new CustomEvent('studyItemsChanged', { detail: { storageKey: 'studyTasks' } }));
}

/**
 * Atualiza o contador de tarefas na interface
 * Calcula o total de tarefas, concluídas e pendentes
 */
function updateTaskCount() {
    const allTaskItems = Object.values(tasks).flat();
    const completedTasks = allTaskItems.filter(task => task.done).length;
    const pendingTasks = allTaskItems.length - completedTasks;
    const counterElement = document.querySelector(".task-counter");
    if (counterElement) {
        counterElement.textContent = `Total: ${allTaskItems.length} | Concluídas: ${completedTasks} | Pendentes: ${pendingTasks}`;
    }
}

/**
 * Inicializa a funcionalidade de arrastar e soltar para reordenar tarefas
 * Usa a biblioteca Sortable.js para permitir reorganização por drag-and-drop
 */
function initSortable() {
    if (typeof Sortable !== "undefined" && taskList) {
        // Tenta destruir instâncias Sortable existentes para evitar duplicatas
        const sortableInstances = Sortable.get(taskList);
        if (sortableInstances) {
            // Esta parte é complexa pois Sortable não tem um método fácil para gerenciar múltiplas instâncias
            // A melhor abordagem é inicializar Sortable nos elementos filhos (categorias) se necessário
        }
        
        // Inicializa Sortable para o container principal (categorias)
        new Sortable(taskList, {
            group: 'shared-categories',
            animation: 150,
            ghostClass: "sortable-ghost",
            onEnd: function (evt) {
                // Lógica para salvar a nova ordem das categorias (se aplicável)
            }
        });

        // Inicializa Sortable para cada categoria (tarefas dentro de categorias)
        document.querySelectorAll('.task-category').forEach(categoryEl => {
            new Sortable(categoryEl, {
                group: 'shared-tasks',
                animation: 150,
                handle: '.task-handle',
                ghostClass: 'sortable-ghost-task',
                onEnd: function(evt) {
                    // Obtém informações sobre a tarefa movida
                    const taskId = evt.item.dataset.taskId;
                    const oldSubject = evt.from.querySelector('h3 span').textContent;
                    const newSubject = evt.to.querySelector('h3 span').textContent;
                    const newIndex = evt.newDraggableIndex;

                    // Encontra a tarefa a ser movida
                    const taskToMove = tasks[oldSubject]?.find(t => t.id === taskId);
                    if (!taskToMove) return;

                    // Remove da lista antiga
                    tasks[oldSubject] = tasks[oldSubject].filter(t => t.id !== taskId);
                    if (tasks[oldSubject].length === 0) delete tasks[oldSubject];

                    // Adiciona à nova lista na nova posição
                    if (!tasks[newSubject]) tasks[newSubject] = [];
                    tasks[newSubject].splice(newIndex, 0, taskToMove);
                    
                    // Salva as alterações e atualiza a interface
                    saveTasks();
                    renderTasks(); // Re-renderiza para garantir consistência
                }
            });
        });
    }
}

/**
 * Exporta todas as tarefas para um arquivo JSON
 * Cria um arquivo para download com as tarefas atuais
 */
function exportTasks() {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tarefas-estudo-inteligente-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Importa tarefas de um arquivo JSON
 * @param {Event} event - Evento de mudança do input de arquivo
 */
function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            // Validação básica da estrutura importada
            if (typeof importedTasks === 'object' && importedTasks !== null) {
                if (confirm(`Deseja importar as tarefas? Isso substituirá suas tarefas atuais.`)) {
                    tasks = importedTasks; 
                    saveTasks();
                    renderTasks(); 
                    showToast("Tarefas importadas com sucesso!");
                }
            } else {
                alert("Formato de arquivo inválido.");
            }
        } catch (error) {
            alert("Erro ao importar tarefas. O arquivo pode estar corrompido.");
            console.error("Import error:", error);
        }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = null; // Limpa o input para permitir reimportação
}

/**
 * Exibe um modal de confirmação para exclusão de tarefa
 * @param {string} taskId - ID da tarefa a ser excluída
 * @param {string} subject - Nome da matéria da tarefa
 * @param {string} taskTitle - Título da tarefa
 */
function showDeleteConfirmation(taskId, subject, taskTitle) {
    const modalId = "confirmDeleteModal";
    let modal = document.getElementById(modalId);
    
    // Cria o modal se não existir
    if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal"; 
        modal.id = modalId;
        modal.style.display = "none";
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" data-close-id="${modalId}" aria-label="Fechar modal">&times;</span>
                <h3><i class="fas fa-exclamation-triangle"></i> Confirmar Exclusão</h3>
                <p>Você está prestes a excluir a tarefa: <strong id="deleteTaskName"></strong></p>
                <p>Esta ação não pode ser desfeita.</p>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" data-close-id="${modalId}"><i class="fas fa-times"></i> Cancelar</button>
                    <button id="confirmDeleteBtn" class="btn btn-danger"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Adiciona event listeners para fechar o modal
        modal.querySelector(`.close-modal[data-close-id="${modalId}"]`).addEventListener("click", () => modal.style.display = "none");
        modal.querySelector(`.btn-secondary[data-close-id="${modalId}"]`).addEventListener("click", () => modal.style.display = "none");
        window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
    }
    
    // Atualiza o conteúdo do modal com o nome da tarefa
    const deleteTaskNameEl = modal.querySelector("#deleteTaskName");
    if(deleteTaskNameEl) deleteTaskNameEl.textContent = taskTitle;
    
    // Configura o botão de confirmação
    const confirmDeleteBtnEl = modal.querySelector("#confirmDeleteBtn");
    if(confirmDeleteBtnEl) {
        // Remove listener anterior para evitar múltiplas exclusões
        const newConfirmBtn = confirmDeleteBtnEl.cloneNode(true);
        confirmDeleteBtnEl.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtnEl);
        newConfirmBtn.addEventListener('click', () => {
            deleteTask(taskId, subject);
            modal.style.display = "none";
        });
    }
    
    // Exibe o modal
    modal.style.display = "block";
}

/**
 * Exclui uma tarefa específica
 * @param {string} taskId - ID da tarefa a ser excluída
 * @param {string} subject - Nome da matéria da tarefa
 */
function deleteTask(taskId, subject) {
    if (tasks[subject]) {
        // Remove a tarefa da lista
        tasks[subject] = tasks[subject].filter(task => task.id !== taskId);
        // Remove a categoria se ficar vazia
        if (tasks[subject].length === 0) {
            delete tasks[subject];
        }
        saveTasks();
        showToast("Tarefa excluída com sucesso!");
        renderTasks(); 
    }
}

/**
 * Renomeia uma categoria/matéria
 * @param {string} oldName - Nome atual da matéria
 * @param {string} newName - Novo nome para a matéria
 */
function renameSubject(oldName, newName) {
    if (tasks[oldName] && oldName !== newName) {
        if (tasks[newName]) { // Se a nova categoria já existir, mescla as tarefas
            tasks[newName] = tasks[newName].concat(tasks[oldName]);
        } else {
            tasks[newName] = tasks[oldName];
        }
        delete tasks[oldName];
        saveTasks();
        renderTasks();
        showToast(`Matéria "${oldName}" renomeada para "${newName}"`);
    } else if (oldName === newName) {
        showToast("O novo nome da matéria é igual ao antigo.");
    } else {
        showToast("Matéria original não encontrada.");
    }
}

/**
 * Exibe uma notificação toast temporária
 * @param {string} message - Mensagem a ser exibida
 */
function showToast(message) {
    const toastId = "toastNotification";
    let toast = document.getElementById(toastId);
    
    // Cria o elemento toast se não existir
    if (!toast) {
        toast = document.createElement("div");
        toast.id = toastId;
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    
    // Define o conteúdo e exibe o toast
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.classList.add("show");
    
    // Remove o toast após um tempo
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => { if(toast.parentElement) toast.parentElement.removeChild(toast); }, 300);
    }, 3000);
}

/**
 * Configura a funcionalidade de edição de matéria personalizada
 * Mostra/oculta o campo de matéria personalizada conforme seleção
 */
function setupSubjectEditing() {
    const subjectSelect = document.getElementById("taskSubject");
    const customSubjectInput = document.getElementById("customSubject");
    
    if (subjectSelect && customSubjectInput) {
        subjectSelect.addEventListener("change", function() {
            if (this.value === "other") {
                customSubjectInput.classList.remove("hidden");
                customSubjectInput.required = true;
            } else {
                customSubjectInput.classList.add("hidden");
                customSubjectInput.required = false;
                customSubjectInput.value = ""; // Limpa o input quando uma matéria padrão é escolhida
            }
        });
    }
}

/**
 * Inicializa a página quando o DOM estiver carregado
 * Configura event listeners e carrega dados iniciais
 */
document.addEventListener("DOMContentLoaded", function() {
    // Carrega as tarefas do localStorage
    loadTasksFromStorage();
    
    // Configura event listeners para os controles principais
    if (newTaskButton) {
        newTaskButton.addEventListener("click", openNewTaskModal);
    }
    
    if (closeModalButton) {
        closeModalButton.addEventListener("click", function() {
            if (taskModal) taskModal.style.display = "none";
        });
    }
    
    if (taskForm) {
        taskForm.addEventListener("submit", handleTaskFormSubmit);
    }
    
    if (searchInput) {
        searchInput.addEventListener("input", renderTasks);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener("change", renderTasks);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener("click", exportTasks);
    }
    
    if (importInput) {
        importInput.addEventListener("change", importTasks);
    }
    
    // Configura o comportamento de matéria personalizada
    setupSubjectEditing();
    
    // Fecha o modal ao clicar fora dele
    window.addEventListener("click", function(event) {
        if (event.target === taskModal) {
            taskModal.style.display = "none";
        }
    });
    
    // Renderiza as tarefas iniciais
    renderTasks();
    
    // Configura o evento para atualizar quando o tema mudar
    document.addEventListener("themeChanged", function() {
        renderTasks(); // Re-renderiza para atualizar cores baseadas no tema
    });
});
