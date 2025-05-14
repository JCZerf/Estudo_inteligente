let tasks = JSON.parse(localStorage.getItem("studyTasks")) || {};

const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const newTaskButton = document.getElementById("newTaskButton");
const taskModal = document.getElementById("taskModal");
const closeModalButton = taskModal ? taskModal.querySelector(".close-modal") : null;
const searchInput = document.querySelector(".search-input");
const filterSelect = document.getElementById("filterSelect");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

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
            } else if (filterValue === "today") {
                matchesFilter = task.due === today && !task.done;
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
        ${subject === "Outra" ? '<i class="fas fa-edit subject-edit" title="Editar nome da matéria"></i>' : ''}
    `;
    categoryTitle.style.setProperty("--subject-color", getSubjectColor(subject));
    
    // Adicionar funcionalidade de edição para matérias "Outra"
    if (subject === "Outra") {
        const editIcon = categoryTitle.querySelector(".subject-edit");
        editIcon.addEventListener("click", () => {
            const newName = prompt("Digite o novo nome para esta matéria:", subject);
            if (newName && newName.trim() && newName !== subject) {
                renameSubject(subject, newName.trim());
            }
        });
    }
    
    categoryDiv.appendChild(categoryTitle);
    return categoryDiv;
}

function createTaskElement(task, subject) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task ${task.done ? "task-done" : ""} ${isTaskExpired(task.due) && !task.done ? "task-expired" : ""}`;
    taskDiv.dataset.taskId = task.id;
    taskDiv.dataset.subject = subject;
    taskDiv.dataset.priority = task.priority;

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

    leftDiv.querySelector(".task-checkbox").addEventListener("change", () => toggleTaskDone(task.id, subject));
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

function setFocusTask(task, subject) {
    const focusTask = { ...task, subject: subject };
    localStorage.setItem("focusTask", JSON.stringify(focusTask));
    window.location.href = "../05-sessão_de_foco/sessao_de_foco.html";
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

function addNewTask(title, subjectValue, dueDate, priority, description = "") {
    let subjectName;
    const customSubjectInput = document.getElementById("customSubject");
    
    if (subjectValue === "other" && customSubjectInput && customSubjectInput.value.trim()) {
        subjectName = customSubjectInput.value.trim();
    } else {
        subjectName = getSubjectName(subjectValue);
    }
    
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
    saveTasks();
    renderTasks();
    
    // Resetar o campo personalizado após adicionar
    if (customSubjectInput) {
        customSubjectInput.value = "";
        customSubjectInput.classList.add("hidden");
    }
}

function saveTasks() {
    localStorage.setItem("studyTasks", JSON.stringify(tasks));
    updateTaskCount();
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
        new Sortable(taskList, {
            animation: 150,
            handle: ".task-handle",
            ghostClass: "sortable-ghost",
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
            if (confirm(`Deseja importar ${Object.values(importedTasks).flat().length} tarefas? Isso substituirá suas tarefas atuais.`)) {
                tasks = importedTasks;
                saveTasks();
                renderTasks(); 
                showToast("Tarefas importadas com sucesso!");
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
        confirmDeleteBtnEl.onclick = () => {
            deleteTask(taskId, subject);
            modal.style.display = "none";
        };
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
    if (tasks[oldName]) {
        tasks[newName] = tasks[oldName];
        delete tasks[oldName];
        saveTasks();
        renderTasks();
        showToast(`Matéria renomeada para "${newName}"`);
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
            }
        });
    }
}

function setupEventListeners() {
    setupSubjectEditing();
    
    if (newTaskButton) newTaskButton.addEventListener("click", () => { if (taskModal) taskModal.style.display = "block"; });
    if (closeModalButton) closeModalButton.addEventListener("click", () => { if (taskModal) taskModal.style.display = "none"; });
    window.addEventListener("click", (e) => { if (e.target === taskModal) { if (taskModal) taskModal.style.display = "none"; } });

    if (taskForm) {
        taskForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const title = document.getElementById("taskTitle").value.trim();
            const subject = document.getElementById("taskSubject").value;
            const dueDate = document.getElementById("taskDueDate").value;
            const priority = taskForm.querySelector("input[name='priority']:checked").value;
            const description = document.getElementById("taskDescription").value;
            if (title.length < 3) {
                alert("O título deve ter pelo menos 3 caracteres.");
                return;
            }
            addNewTask(title, subject, dueDate, priority, description);
            this.reset();
            if (taskModal) taskModal.style.display = "none";
        });
    }

    if (searchInput) searchInput.addEventListener("input", renderTasks);
    if (filterSelect) {
        if (!filterSelect.querySelector('option[value="today"]')) {
            const todayOption = document.createElement('option');
            todayOption.value = "today";
            todayOption.textContent = "Hoje";
            const completedOption = filterSelect.querySelector('option[value="completed"]');
            if (completedOption) {
                filterSelect.insertBefore(todayOption, completedOption);
            } else {
                filterSelect.appendChild(todayOption);
            }
        }
        filterSelect.addEventListener("change", renderTasks);
    }

    if (exportBtn) exportBtn.addEventListener("click", exportTasks);
    if (importInput) importInput.addEventListener("change", importTasks);

    document.addEventListener("themeChanged", renderTasks);
}

// Inicialização
document.addEventListener("DOMContentLoaded", function() {
    setupEventListeners();
    if (filterSelect && filterSelect.querySelector('option[value="today"]')) {
        filterSelect.value = "today";
    }
    renderTasks();
});
