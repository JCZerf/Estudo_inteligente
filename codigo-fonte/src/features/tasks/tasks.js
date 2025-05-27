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
const taskSubjectSelect = document.getElementById("taskSubject"); // Adicionado
const customSubjectInput = document.getElementById("customSubject"); // Adicionado

/**
 * Carrega as tarefas do localStorage para a variável global tasks
 * Chamada durante a inicialização da página
 */
function loadTasksFromStorage() {
    console.log("tasks.js: Loading tasks from storage"); // Debug
    tasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
}

/**
 * Converte códigos de matérias para nomes de exibição
 * @param {string} value - Código da matéria (ex: "math")
 * @returns {string} Nome de exibição da matéria (ex: "Matemática")
 */
function getSubjectName(value) {
    const selectElement = document.getElementById("taskSubject");
    if (selectElement) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === value) {
                return selectElement.options[i].text;
            }
        }
    }
    // Fallback se o select não estiver disponível ou o valor não for encontrado
    const subjects = {
        "math": "Matemática", "physics": "Física", "chemistry": "Química",
        "biology": "Biologia", "history": "História", "geography": "Geografia",
        "philosophy": "Filosofia", "sociology": "Sociologia", "portuguese": "Português",
        "literature": "Literatura", "english": "Inglês", "spanish": "Espanhol",
        "art": "Artes", "physical_education": "Educação Física",
        "other": "Outra (personalizar)", // Atualizado para corresponder ao texto da opção
        "Estudos Agendados": "Estudos Agendados"
    };
    return subjects[value] || value; // Retorna o próprio valor se não mapeado
}

/**
 * Converte nomes de matérias para códigos (inverso de getSubjectName)
 * @param {string} name - Nome da matéria (ex: "Matemática")
 * @returns {string} Código da matéria (ex: "math")
 */
function getSubjectValue(name) {
    const selectElement = document.getElementById("taskSubject");
    if (selectElement) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].text === name) {
                return selectElement.options[i].value;
            }
        }
    }
    // Se não encontrar no select, assume que é 'other'
    return "other";
}

/**
 * Renderiza todas as tarefas na interface com filtros aplicados
 * Agrupa tarefas por matéria e aplica filtros de busca e status
 */
function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = "";
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const filterValue = filterSelect ? filterSelect.value : "all";
    const today = new Date().toISOString().split("T")[0];
    
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
    const subjectValue = getSubjectValue(subject); // Obtém o valor correspondente ao nome
    const isDefaultSubject = taskSubjectSelect ? Array.from(taskSubjectSelect.options).some(opt => opt.value === subjectValue && opt.value !== 'other') : false;

    categoryTitle.innerHTML = `
        <span>${subject}</span>
        ${subject.toLowerCase() !== "estudos agendados" && !isDefaultSubject ? 
        '<i class="fas fa-edit subject-edit" title="Editar nome da matéria"></i>' : ''}
    `; // Permite editar apenas matérias personalizadas (não padrão e não "Estudos Agendados")
    categoryTitle.style.setProperty("--subject-color", getSubjectColor(subject));
    
    // Adiciona funcionalidade de edição para matérias personalizadas
    if (subject.toLowerCase() !== "estudos agendados" && !isDefaultSubject) {
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
        <div class="task-priority-indicator" title="Prioridade: ${task.priority || 'Média'}">
             <span class="priority-dot priority-${task.priority || 'medium'}"></span>
             <span class="priority-text sr-only">Prioridade ${task.priority || 'Média'}</span> 
        </div>
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
    if (customSubjectInput) customSubjectInput.classList.add("hidden"); // Garante que esteja oculto
    if (taskSubjectSelect) taskSubjectSelect.value = "math"; // Default
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
    const subjectValue = getSubjectValue(subjectName); // Tenta mapear o nome da matéria para o valor do select
    
    if (taskSubjectSelect.querySelector(`option[value="${subjectValue}"]`)) {
        taskSubjectSelect.value = subjectValue;
        customSubjectInput.classList.add("hidden");
        customSubjectInput.value = "";
    } else { // Matéria personalizada (não está no select padrão)
        taskSubjectSelect.value = "other";
        customSubjectInput.classList.remove("hidden");
        customSubjectInput.value = subjectName;
    }
    
    // Preenche os demais campos
    document.getElementById("taskDueDate").value = task.due || "";
    document.querySelector(`input[name="priority"][value="${task.priority || 'medium'}"]`).checked = true;
    document.getElementById("taskDescription").value = task.description || "";

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
    window.location.href = "../focus_session/focus_session.html";
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
        "Outra (personalizar)": theme === "dark" ? "#a0aec0" : "#8a2be2", // Cor para 'Outra'
        "Estudos Agendados": theme === "dark" ? "#f1c40f" : "#f39c12"
    };
    // Se for uma matéria personalizada não listada, usa a cor de 'Outra'
    return colors[subject] || colors["Outra (personalizar)"];
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
    const taskId = document.getElementById("editTaskId").value;
    const title = document.getElementById("taskTitle").value.trim();
    const subjectValue = taskSubjectSelect.value;
    let subjectName = "";
    if (subjectValue === "other") {
        subjectName = customSubjectInput.value.trim();
        if (!subjectName) {
            alert("Por favor, digite o nome da matéria personalizada.");
            return;
        }
    } else {
        subjectName = getSubjectName(subjectValue);
    }
    const dueDate = document.getElementById("taskDueDate").value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const description = document.getElementById("taskDescription").value.trim();

    if (!title || !subjectName) {
        alert("Por favor, preencha o título e a matéria da tarefa.");
        return;
    }

    const taskData = {
        id: taskId || `task-${Date.now()}`,
        title: title,
        due: dueDate,
        priority: priority,
        description: description,
        done: false // Tarefas novas ou editadas começam como não concluídas
    };

    if (taskId) {
        // Edição: Encontra a categoria original e atualiza ou move a tarefa
        let originalSubject = null;
        for (const subj in tasks) {
            const index = tasks[subj].findIndex(t => t.id === taskId);
            if (index !== -1) {
                originalSubject = subj;
                // Atualiza a propriedade 'done' se ela já existia
                taskData.done = tasks[subj][index].done;
                // Remove da categoria antiga
                tasks[subj].splice(index, 1);
                if (tasks[subj].length === 0) {
                    delete tasks[subj];
                }
                break;
            }
        }
        if (!originalSubject) {
            console.error("Erro ao editar: Tarefa original não encontrada.");
            return; // Evita adicionar como nova se a original não foi encontrada
        }
    }

    if (!tasks[subjectName]) {
        tasks[subjectName] = [];
    }
    tasks[subjectName].push(taskData);

    saveTasks();
    closeModal();
    renderTasks();
    showToast(taskId ? "Tarefa atualizada com sucesso!" : "Tarefa adicionada com sucesso!");
}

/**
 * Fecha o modal de tarefas
 */
function closeModal() {
    if (taskModal) taskModal.style.display = "none";
    if (taskForm) taskForm.reset();
    currentEditTaskId = null;
}

/**
 * Salva o estado atual das tarefas no localStorage
 */
function saveTasks() {
    localStorage.setItem("studyTasks", JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
}

/**
 * Renomeia uma matéria personalizada
 * @param {string} oldName - Nome antigo da matéria
 * @param {string} newName - Novo nome da matéria
 */
function renameSubject(oldName, newName) {
    if (tasks[newName]) {
        alert("Já existe uma matéria com este nome.");
        return;
    }
    if (tasks[oldName]) {
        tasks[newName] = tasks[oldName];
        delete tasks[oldName];
        saveTasks();
        renderTasks();
        showToast(`Matéria "${oldName}" renomeada para "${newName}".`);
    }
}

/**
 * Exibe uma mensagem de confirmação antes de excluir uma tarefa
 * @param {string} taskId - ID da tarefa
 * @param {string} subject - Nome da matéria
 * @param {string} title - Título da tarefa
 */
function showDeleteConfirmation(taskId, subject, title) {
    if (confirm(`Tem certeza que deseja excluir a tarefa "${title}"?`)) {
        deleteTask(taskId, subject);
    }
}

/**
 * Exclui uma tarefa
 * @param {string} taskId - ID da tarefa
 * @param {string} subject - Nome da matéria
 */
function deleteTask(taskId, subject) {
    if (tasks[subject]) {
        tasks[subject] = tasks[subject].filter(task => task.id !== taskId);
        // Remove a categoria se ficar vazia
        if (tasks[subject].length === 0) {
            delete tasks[subject];
        }
        saveTasks();
        renderTasks();
        showToast("Tarefa excluída com sucesso!");
    }
}

/**
 * Atualiza a contagem de tarefas exibida no rodapé
 */
function updateTaskCount() {
    const taskCounter = document.querySelector(".task-counter");
    if (!taskCounter) return;
    let totalTasks = 0;
    let completedTasks = 0;
    Object.values(tasks).flat().forEach(task => {
        totalTasks++;
        if (task.done) {
            completedTasks++;
        }
    });
    taskCounter.textContent = `Total: ${totalTasks} tarefas | Concluídas: ${completedTasks}`;
}

/**
 * Inicializa a funcionalidade de arrastar e soltar (SortableJS)
 * Permite reordenar tarefas dentro e entre categorias
 */
function initSortable() {
    const categories = taskList.querySelectorAll(".task-category");
    categories.forEach(category => {
        new Sortable(category, {
            group: "shared-tasks",
            animation: 150,
            handle: ".task-handle",
            ghostClass: "sortable-ghost",
            chosenClass: "sortable-chosen",
            dragClass: "sortable-drag",
            onEnd: function (evt) {
                const itemEl = evt.item; // Elemento arrastado
                const taskId = itemEl.dataset.taskId;
                const oldSubject = itemEl.dataset.subject;
                const newSubjectContainer = evt.to; // Container de destino
                const newSubject = newSubjectContainer.querySelector("h3 span").textContent;

                // Se a tarefa foi movida para uma nova categoria
                if (oldSubject !== newSubject) {
                    // Encontra a tarefa nos dados
                    const taskIndex = tasks[oldSubject].findIndex(t => t.id === taskId);
                    if (taskIndex > -1) {
                        const [movedTask] = tasks[oldSubject].splice(taskIndex, 1);
                        // Adiciona à nova categoria
                        if (!tasks[newSubject]) {
                            tasks[newSubject] = [];
                        }
                        // Determina a nova posição
                        const targetIndex = Array.from(newSubjectContainer.children).indexOf(itemEl) -1; // -1 por causa do h3
                        tasks[newSubject].splice(targetIndex, 0, movedTask);
                        
                        // Remove a categoria antiga se vazia
                        if (tasks[oldSubject].length === 0) {
                            delete tasks[oldSubject];
                        }
                        saveTasks();
                        // Não precisa renderizar tudo, apenas atualizar o dataset do item movido
                        itemEl.dataset.subject = newSubject;
                        showToast(`Tarefa movida para "${newSubject}".`);
                    } else {
                        console.error("Erro ao mover tarefa: não encontrada na categoria original.");
                        renderTasks(); // Renderiza para corrigir estado inconsistente
                    }
                } else {
                    // Se foi reordenada dentro da mesma categoria
                    const taskIndex = tasks[oldSubject].findIndex(t => t.id === taskId);
                    if (taskIndex > -1) {
                        const [movedTask] = tasks[oldSubject].splice(taskIndex, 1);
                        const targetIndex = Array.from(newSubjectContainer.children).indexOf(itemEl) -1;
                        tasks[oldSubject].splice(targetIndex, 0, movedTask);
                        saveTasks();
                    }
                }
            },
        });
    });
}

/**
 * Exporta as tarefas atuais para um arquivo JSON
 */
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "estudo_inteligente_tasks.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Tarefas exportadas com sucesso!");
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
                // Merge ou substituição (aqui está substituindo)
                tasks = importedTasks;
                saveTasks();
                renderTasks();
                showToast("Tarefas importadas com sucesso!");
            } else {
                throw new Error("Formato de arquivo inválido.");
            }
        } catch (error) {
            console.error("Erro ao importar tarefas:", error);
            alert("Erro ao importar tarefas: " + error.message);
        }
        importInput.value = ""; 
    };
    reader.readAsText(file);
}

/**
 * Exibe uma mensagem temporária (toast)
 * @param {string} message - Mensagem a ser exibida
 */
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
        setTimeout(() => document.body.removeChild(toast), 500); // Remove após a animação de saída
    }, 3000); // Duração do toast
}

// --- Inicialização e Event Listeners ---

document.addEventListener("DOMContentLoaded", () => {
    loadTasksFromStorage();
    renderTasks();

    if (newTaskButton) {
        newTaskButton.addEventListener("click", openNewTaskModal);
    }

    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeModal);
    }
    window.addEventListener("click", (event) => {
        if (event.target === taskModal) {
            closeModal();
        }
    });

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

    if (taskSubjectSelect) {
        taskSubjectSelect.addEventListener("change", () => {
            if (taskSubjectSelect.value === "other") {
                customSubjectInput.classList.remove("hidden");
            } else {
                customSubjectInput.classList.add("hidden");
            }
        });
    }
});

