// tarefas.js
let tasks = {}; // Initialize, will be populated by loadTasksFromStorage on DOMContentLoaded
let currentEditTaskId = null; // To track the ID of the task being edited

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

// Function to load tasks from localStorage and update the global 'tasks' variable
function loadTasksFromStorage() {
    console.log("tarefas.js: Loading tasks from storage"); // Debug
    tasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
}

// Mapeia valores do select para nomes de matérias
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

// Mapeia nomes de matérias para valores do select (inverso de getSubjectName)
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
    // Se não encontrar no mapa, verifica se é uma matéria personalizada (não listada)
    if (!subjectMap[name]) {
        // Verifica se existe uma option com esse nome (improvável para personalizadas)
        // A lógica para "Outra" e customSubject deve ser tratada separadamente ao popular o form
        return "other"; // Default para 'Outra' se não mapeado diretamente
    }
    return subjectMap[name] || "other";
}


// Renderiza todas as tarefas com filtros
function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = "";
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const filterValue = filterSelect ? filterSelect.value : "all";
    const today = new Date().toISOString().split("T")[0];
    
    Object.entries(tasks).forEach(([subject, taskItems]) => {
        const filteredTasks = taskItems.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                                (task.description && task.description.toLowerCase().includes(searchTerm)) ||
                                (task.due && task.due.toLowerCase().includes(searchTerm));
            
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
        
        if (filteredTasks.length > 0) {
            const categoryDiv = createCategoryElement(subject);
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task, subject);
                categoryDiv.appendChild(taskElement);
            });
            taskList.appendChild(categoryDiv);
        }
    });
    
    updateTaskCount();
    initSortable();
}

function createCategoryElement(subject) {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "task-category";
    
    const categoryTitle = document.createElement("h3");
    categoryTitle.innerHTML = `
        <span>${subject}</span>
        ${subject.toLowerCase() !== "estudos agendados" && !Object.values(getSubjectName("")).includes(subject) ? 
        '<i class="fas fa-edit subject-edit" title="Editar nome da matéria"></i>' : ''}
    `; // Não permite editar "Estudos Agendados" ou matérias padrão
    categoryTitle.style.setProperty("--subject-color", getSubjectColor(subject));
    
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

function createTaskElement(task, subject) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task ${task.done ? "task-done" : ""} ${isTaskExpired(task.due) && !task.done ? "task-expired" : ""}`;
    taskDiv.dataset.taskId = task.id;
    taskDiv.dataset.subject = subject; // Armazena a categoria/matéria original
    taskDiv.dataset.priority = task.priority;

    // Adiciona evento de clique para abrir o modal de edição
    taskDiv.addEventListener("click", () => openEditTaskModal(task.id, subject));

    const leftDiv = document.createElement("div");
    leftDiv.className = "task-left";
    leftDiv.innerHTML = `
        <i class="fas fa-grip-lines task-handle"></i>
        <input type="checkbox" class="task-checkbox" ${task.done ? "checked" : ""} 
               aria-label="${task.done ? 'Desmarcar tarefa' : 'Marcar tarefa como concluída'}">
        <span class="priority-${task.priority}"></span>
        <span>${task.title}</span>
    `;

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

function openEditTaskModal(taskId, subjectName) {
    const task = tasks[subjectName]?.find(t => t.id === taskId);
    if (!task) {
        console.error("Tarefa não encontrada para edição:", taskId, subjectName);
        return;
    }
    currentEditTaskId = taskId;
    if (taskModalTitle) taskModalTitle.textContent = "Editar Tarefa";
    if (saveTaskButton) saveTaskButton.textContent = "Salvar Alterações";

    document.getElementById("editTaskId").value = taskId;
    document.getElementById("taskTitle").value = task.title;
    
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
    
    document.getElementById("taskDueDate").value = task.due || "";
    document.querySelector(`input[name="priority"][value="${task.priority || 'medium'}"]`).checked = true;
    document.getElementById("taskDescription").value = task.description || "";

    if (taskModal) taskModal.style.display = "block";
}


function setFocusTask(task, subject) {
    const focusTask = { ...task, subject: subject };
    localStorage.setItem("focusTask", JSON.stringify(focusTask));
    window.location.href = "../pomodoro/sessao_de_foco.html";
}

function isTaskExpired(dueDate) {
    if (!dueDate || isNaN(Date.parse(dueDate))) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const taskDueDate = new Date(dueDate + "T00:00:00"); 
    return taskDueDate < today;
}

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

function handleTaskFormSubmit(event) {
    event.preventDefault();
    const title = document.getElementById("taskTitle").value.trim();
    const subjectValue = document.getElementById("taskSubject").value;
    const customSubjectInput = document.getElementById("customSubject");
    const dueDate = document.getElementById("taskDueDate").value;
    const priority = taskForm.querySelector("input[name='priority']:checked").value;
    const description = document.getElementById("taskDescription").value.trim();
    const editingId = document.getElementById("editTaskId").value;

    let subjectName;
    if (subjectValue === "other" && customSubjectInput.value.trim()) {
        subjectName = customSubjectInput.value.trim();
    } else {
        subjectName = getSubjectName(subjectValue);
    }

    if (!title) {
        alert("O título da tarefa é obrigatório.");
        return;
    }

    if (editingId) { // Editing existing task
        let originalSubjectName = null;
        // Find the original subject name of the task being edited
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

        const updatedTask = {
            ...tasks[originalSubjectName][taskIndex], // Preserve existing properties like 'id', 'done'
            title: title,
            due: dueDate || null,
            description: description,
            priority: priority || "medium",
            // Matéria (subjectName) pode ter mudado
        };

        if (originalSubjectName !== subjectName) {
            // Remove from old subject category
            tasks[originalSubjectName].splice(taskIndex, 1);
            if (tasks[originalSubjectName].length === 0) {
                delete tasks[originalSubjectName];
            }
            // Add to new subject category
            if (!tasks[subjectName]) {
                tasks[subjectName] = [];
            }
            tasks[subjectName].push(updatedTask);
            showToast("Tarefa atualizada e movida para " + subjectName + "!");
        } else {
            // Update in the same subject category
            tasks[originalSubjectName][taskIndex] = updatedTask;
            showToast("Tarefa atualizada com sucesso!");
        }

    } else { // Adding new task
        const newId = `task-${Date.now()}`;
        const newTask = {
            id: newId,
            title: title,
            due: dueDate || null,
            description: description,
            priority: priority || "medium",
            done: false
        };
        
        if (!tasks[subjectName]) {
            tasks[subjectName] = [];
        }
        tasks[subjectName].push(newTask);
        showToast("Nova tarefa adicionada!");
    }
    
    saveTasks();
    renderTasks(); 
    if (taskModal) taskModal.style.display = "none";
    taskForm.reset();
    document.getElementById("editTaskId").value = ""; // Clear edit ID
    customSubjectInput.value = "";
    customSubjectInput.classList.add("hidden");
}


function saveTasks() {
    localStorage.setItem("studyTasks", JSON.stringify(tasks));
    updateTaskCount();
    // Disparar evento para notificar outras partes da aplicação (ex: cronograma)
    window.dispatchEvent(new CustomEvent('studyItemsChanged', { detail: { storageKey: 'studyTasks' } }));
}

function updateTaskCount() {
    const allTaskItems = Object.values(tasks).flat();
    const completedTasks = allTaskItems.filter(task => task.done).length;
    const pendingTasks = allTaskItems.length - completedTasks;
    const counterElement = document.querySelector(".task-counter");
    if (counterElement) {
        counterElement.textContent = `Total: ${allTaskItems.length} | Concluídas: ${completedTasks} | Pendentes: ${pendingTasks}`;
    }
}

function initSortable() {
    if (typeof Sortable !== "undefined" && taskList) {
        // Destruir instâncias Sortable existentes para evitar duplicatas ou comportamento inesperado
        const sortableInstances = Sortable.get(taskList);
        if (sortableInstances) {
            // Sortable.get pode retornar uma instância ou undefined. Não há um método destroyAll.
            // Se for uma instância única, podemos tentar destruí-la.
            // Esta parte é complexa pois Sortable não tem um método fácil para gerenciar múltiplas instâncias em filhos.
            // A melhor abordagem é inicializar Sortable nos elementos filhos (categorias) se necessário.
            // Por ora, a inicialização no taskList (pai) pode ser suficiente se a estrutura for simples.
        }
        new Sortable(taskList, {
            group: 'shared-categories',
            animation: 150,
            // handle: ".task-handle", // Comentado para permitir arrastar a categoria inteira se desejado
            ghostClass: "sortable-ghost",
            onEnd: function (evt) {
                // Lógica para salvar a nova ordem das categorias (se aplicável)
                // Esta parte requer mais detalhes sobre como a ordem das categorias é armazenada e gerenciada
            }
        });

        // Habilitar sortable para tarefas dentro de cada categoria
        document.querySelectorAll('.task-category').forEach(categoryEl => {
            new Sortable(categoryEl, {
                group: 'shared-tasks',
                animation: 150,
                handle: '.task-handle',
                ghostClass: 'sortable-ghost-task',
                onEnd: function(evt) {
                    const taskId = evt.item.dataset.taskId;
                    const oldSubject = evt.from.querySelector('h3 span').textContent;
                    const newSubject = evt.to.querySelector('h3 span').textContent;
                    const newIndex = evt.newDraggableIndex;

                    // Encontrar a tarefa
                    const taskToMove = tasks[oldSubject]?.find(t => t.id === taskId);
                    if (!taskToMove) return;

                    // Remover da lista antiga
                    tasks[oldSubject] = tasks[oldSubject].filter(t => t.id !== taskId);
                    if (tasks[oldSubject].length === 0) delete tasks[oldSubject];

                    // Adicionar à nova lista na nova posição
                    if (!tasks[newSubject]) tasks[newSubject] = [];
                    tasks[newSubject].splice(newIndex, 0, taskToMove);
                    
                    saveTasks();
                    renderTasks(); // Re-render para garantir consistência, especialmente se a categoria mudou
                }
            });
        });
    }
}

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
    if (event.target) event.target.value = null;
}

function showDeleteConfirmation(taskId, subject, taskTitle) {
    const modalId = "confirmDeleteModal";
    let modal = document.getElementById(modalId);
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
        modal.querySelector(`.close-modal[data-close-id="${modalId}"]`).addEventListener("click", () => modal.style.display = "none");
        modal.querySelector(`.btn-secondary[data-close-id="${modalId}"]`).addEventListener("click", () => modal.style.display = "none");
        window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
    }
    const deleteTaskNameEl = modal.querySelector("#deleteTaskName");
    if(deleteTaskNameEl) deleteTaskNameEl.textContent = taskTitle;
    
    const confirmDeleteBtnEl = modal.querySelector("#confirmDeleteBtn");
    if(confirmDeleteBtnEl) {
        // Remove previous listener to avoid multiple deletions
        const newConfirmBtn = confirmDeleteBtnEl.cloneNode(true);
        confirmDeleteBtnEl.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtnEl);
        newConfirmBtn.addEventListener('click', () => {
            deleteTask(taskId, subject);
            modal.style.display = "none";
        });
    }
    modal.style.display = "block";
}

function deleteTask(taskId, subject) {
    if (tasks[subject]) {
        tasks[subject] = tasks[subject].filter(task => task.id !== taskId);
        if (tasks[subject].length === 0) {
            delete tasks[subject];
        }
        saveTasks();
        showToast("Tarefa excluída com sucesso!");
        renderTasks(); 
    }
}

function renameSubject(oldName, newName) {
    if (tasks[oldName] && oldName !== newName) {
        if (tasks[newName]) { // If newName category already exists, merge tasks
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

function showToast(message) {
    const toastId = "toastNotification";
    let toast = document.getElementById(toastId);
    if (!toast) {
        toast = document.createElement("div");
        toast.id = toastId;
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => { if(toast.parentElement) toast.parentElement.removeChild(toast); }, 300);
    }, 3000);
}

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
                customSubjectInput.value = ""; // Clear custom input when a standard subject is chosen
            }
        });
    }
}

function setupEventListeners() {
    setupSubjectEditing();
    
    if (newTaskButton) newTaskButton.addEventListener("click", openNewTaskModal);
    if (closeModalButton) closeModalButton.addEventListener("click", () => { 
        if (taskModal) taskModal.style.display = "none"; 
        if (taskForm) taskForm.reset(); 
        document.getElementById("editTaskId").value = ""; 
    });
    window.addEventListener("click", (e) => { 
        if (e.target === taskModal) { 
            if (taskModal) taskModal.style.display = "none"; 
            if (taskForm) taskForm.reset(); 
            document.getElementById("editTaskId").value = ""; 
        }
    });

    if (taskForm) {
        taskForm.addEventListener("submit", handleTaskFormSubmit);
    }

    if (searchInput) searchInput.addEventListener("input", renderTasks);
    if (filterSelect) filterSelect.addEventListener("change", renderTasks);
    if (exportBtn) exportBtn.addEventListener("click", exportTasks);
    if (importInput) importInput.addEventListener("change", importTasks);

    // Listener for storage changes from other tabs/windows
    window.addEventListener('storage', function(event) {
        if (event.key === 'studyTasks') {
            console.log("Storage event detected in tarefas.js for studyTasks, reloading tasks.");
            loadTasksFromStorage(); // Reload tasks from storage
            renderTasks(); // Re-render the UI
        }
    });
    // Listener for custom event from cronograma.js or other internal changes
    window.addEventListener('studyItemsChanged', (event) => {
        if (event.detail && event.detail.storageKey === 'studyTasks') {
            console.log("tarefas.js: studyItemsChanged event detected for studyTasks, reloading tasks.");
            loadTasksFromStorage();
            renderTasks();
        }
    });
}

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
    loadTasksFromStorage();
    renderTasks();
    setupEventListeners();
});

