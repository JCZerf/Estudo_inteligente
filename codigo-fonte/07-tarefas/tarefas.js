// tarefas.js - Versão Completa com Deleção de Tarefas

// Carrega tarefas do localStorage ou usa as padrão
let tasks = JSON.parse(localStorage.getItem('studyTasks')) || {
    "Matemática": [
        { id: 1, title: "Lista de exercícios", due: "23 de abril", done: false, priority: "medium" },
        { id: 2, title: "Estudar capítulo 5", due: "25 de abril", done: false, priority: "high" }
    ],
    "História": [
        { id: 3, title: "Trabalho de pesquisa", due: "26 de abril", done: false, priority: "medium" }
    ],
    "Biologia": [
        { id: 4, title: "Leitura do capítulo 3", due: "80% concluído", done: true, priority: "low" },
        { id: 5, title: "Revisar notas", due: "27 de abril", done: false, priority: "medium" },
        { id: 6, title: "Projeto de química", due: "2 de maio", done: false, priority: "high" }
    ]
};

const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const newTaskButton = document.getElementById('newTaskButton');
const taskModal = document.getElementById('taskModal');
const closeModal = document.querySelector('.close-modal');
const searchInput = document.querySelector('.search-input');
const filterSelect = document.getElementById('filterSelect');
const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');

// Mapeia valores do select para nomes de matérias
function getSubjectName(value) {
    const subjects = {
        'math': 'Matemática',
        'history': 'História',
        'biology': 'Biologia',
        'other': 'Outra'
    };
    return subjects[value] || value;
}

// Renderiza todas as tarefas com filtros
function renderTasks() {
    taskList.innerHTML = '';
    
    const searchTerm = searchInput.value.toLowerCase();
    const filter = filterSelect.value;
    const today = new Date().toISOString().split('T')[0];
    
    Object.entries(tasks).forEach(([subject, taskItems]) => {
        const filteredTasks = taskItems.filter(task => {
            // Aplica filtro de busca
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                                task.due.toLowerCase().includes(searchTerm);
            
            // Aplica filtro selecionado
            let matchesFilter = true;
            if (filter === 'completed') matchesFilter = task.done;
            if (filter === 'pending') matchesFilter = !task.done;
            if (filter === 'expired') {
                matchesFilter = !task.done && task.due < today && !isNaN(Date.parse(task.due));
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

// Cria elemento de categoria
function createCategoryElement(subject) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'task-category';
    
    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = subject;
    categoryTitle.style.setProperty('--subject-color', getSubjectColor(subject));
    
    categoryDiv.appendChild(categoryTitle);
    return categoryDiv;
}

// Cria elemento de tarefa individual
function createTaskElement(task, subject) {
    const taskDiv = document.createElement('div');
    taskDiv.className =`task ${task.done ? 'task-done' : ''} ${isTaskExpired(task.due) ? 'task-expired' : ''}`;
    taskDiv.dataset.taskId = task.id;
    taskDiv.dataset.subject = subject;
    taskDiv.dataset.priority = task.priority;

    // Parte esquerda (checkbox, prioridade, título)
    const leftDiv = document.createElement('div');
    leftDiv.className = 'task-left';
    
    leftDiv.innerHTML = `
        <i class="fas fa-grip-lines task-handle"></i>
        <input type="checkbox" ${task.done ? 'checked' : ''}>
        <span class="priority-${task.priority}"></span>
        <span>${task.title}</span>
    `;

    // Parte direita (ações)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    actionsDiv.innerHTML = `
        <span class="task-due">${task.due}</span>
        <button class="btn-focus" title="Iniciar sessão de foco">
            <i class="fas fa-clock"></i>
        </button>
        <button class="btn-delete" title="Excluir tarefa">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    // Event listeners
    leftDiv.querySelector('input').addEventListener('change', () => toggleTaskDone(task.id));
    
    actionsDiv.querySelector('.btn-focus').addEventListener('click', (e) => {
        e.stopPropagation();
        setFocusTask(task, subject);
    });
    
    actionsDiv.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        showDeleteConfirmation(task.id, subject, task.title);
    });

    taskDiv.appendChild(leftDiv);
    taskDiv.appendChild(actionsDiv);

    return taskDiv;
}

// Define tarefa para focar
function setFocusTask(task, subject) {
    const focusTask = {
        ...task,
        subject: subject
    };
    localStorage.setItem('focusTask', JSON.stringify(focusTask));
    window.location.href = '../09-sessão_de_foco/sessao_de_foco.html';
}

// Verifica se tarefa está atrasada
function isTaskExpired(dueDate) {
    if (!dueDate || isNaN(Date.parse(dueDate))) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
}

// Retorna cor da matéria baseada no tema
function getSubjectColor(subject) {
    const theme = document.documentElement.getAttribute('data-theme');
    const colors = {
        "Matemática": theme === 'dark' ? '#ff6b6b' : '#e74c3c',
        "História": theme === 'dark' ? '#5dade2' : '#3498db',
        "Biologia": theme === 'dark' ? '#58d68d' : '#2ecc71',
        "Outra": theme === 'dark' ? '#9f7aea' : '#8a2be2'
    };
    return colors[subject] || '#4682B4';
}

// Alterna status da tarefa
function toggleTaskDone(taskId) {
    for (const subject in tasks) {
        const task = tasks[subject].find(t => t.id === taskId);
        if (task) {
            task.done = !task.done;
            saveTasks();
            break;
        }
    }
    renderTasks();
}

// Adiciona nova tarefa
function addNewTask(title, subject, dueDate, priority, description = '') {
    const subjectName = getSubjectName(subject);
    const newId = Date.now(); // ID único baseado no timestamp
    
    const newTask = {
        id: newId,
        title: title,
        due: dueDate || "Sem prazo",
        description: description,
        priority: priority || 'medium',
        done: false,
        new: true // Flag para animação
    };

    if (!tasks[subjectName]) {
        tasks[subjectName] = [];
    }
    
    tasks[subjectName].push(newTask);
    saveTasks();
    renderTasks();
}

// Salva tarefas no localStorage
function saveTasks() {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
    updateTaskCount();
    checkDueTasksNotifications();
}

// Atualiza contador de tarefas
function updateTaskCount() {
    const allTasks = Object.values(tasks).flat();
    const completedTasks = allTasks.filter(task => task.done).length;
    const pendingTasks = allTasks.length - completedTasks;
    
    document.querySelector('.task-counter').textContent = 
        `Total: ${allTasks.length} tarefas | Concluídas: ${completedTasks} | Pendentes: ${pendingTasks}`;
}

// Inicializa SortableJS para drag and drop
function initSortable() {
    new Sortable(taskList, {
        animation: 150,
        handle: '.task-handle',
        ghostClass: 'sortable-ghost',
        onEnd: function() {
            // Podemos implementar reordenação persistente se necessário
        }
    });
}

// Verifica tarefas atrasadas para notificação
function checkDueTasksNotifications() {
    if (!window.Notification || Notification.permission !== 'granted') return;
    
    const today = new Date().toISOString().split('T')[0];
    Object.values(tasks).flat().forEach(task => {
        if (!task.done && task.due === today) {
            new Notification(`Tarefa pendente para hoje: ${task.title}`, {
                body: `Matéria: ${task.subject || 'Geral'}`,
                icon: '../img/notification-icon.png'
            });
        }
    });
}

// Exporta tarefas para arquivo JSON
function exportTasks() {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarefas-estudo-inteligente-${new Date().toISOString().split('T')[0]}`.json;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Importa tarefas de arquivo JSON
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
                showToast('Tarefas importadas com sucesso!');
            }
        } catch (error) {
            alert('Erro ao importar tarefas. O arquivo pode estar corrompido.');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// Modal de confirmação de exclusão
function showDeleteConfirmation(taskId, subject, taskTitle) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-content">
            <h3><i class="fas fa-exclamation-triangle"></i> Confirmar Exclusão</h3>
            <p>Você está prestes a excluir a tarefa: <strong>"${taskTitle}"</strong></p>
            <p>Esta ação não pode ser desfeita.</p>
            <div class="confirm-buttons">
                <button class="btn btn-secondary confirm-cancel">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn btn-danger confirm-delete">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const cancelBtn = modal.querySelector('.confirm-cancel');
    const deleteBtn = modal.querySelector('.confirm-delete');
    
    cancelBtn.addEventListener('click', () => modal.remove());
    
    deleteBtn.addEventListener('click', () => {
        // Animação de fade out antes de remover
        const taskElement = document.querySelector(`.task[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('fade-out');
            setTimeout(() => {
                deleteTask(taskId, subject);
                modal.remove();
            }, 300);
        } else {
            deleteTask(taskId, subject);
            modal.remove();
        }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Focar no botão de cancelar por padrão
    cancelBtn.focus();
}

// Deleta uma tarefa
function deleteTask(taskId, subject) {
    if (tasks[subject]) {
        tasks[subject] = tasks[subject].filter(task => task.id !== taskId);
        
        // Remove a categoria se ficar vazia
        if (tasks[subject].length === 0) {
            delete tasks[subject];
        }
        
        saveTasks();
        showToast('Tarefa excluída com sucesso!');
        
        // Atualiza a lista após um pequeno delay para a animação
        setTimeout(() => {
            renderTasks();
        }, 50);
    }
}

// Mostra notificação toast
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
    `;
    document.body.appendChild(toast);
    
    // Mostra o toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Configura eventos
function setupEventListeners() {
    // Modal
    newTaskButton.addEventListener('click', () => {
        taskModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
        }
    });

    // Formulário
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value.trim();
        const subject = document.getElementById('taskSubject').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.querySelector('input[name="priority"]:checked').value;
        const description = document.getElementById('taskDescription').value;
        
        if (title.length < 3) {
            alert('O título deve ter pelo menos 3 caracteres');
            return;
        }
        
        addNewTask(title, subject, dueDate, priority, description);
        this.reset();
        taskModal.style.display = 'none';
    });

    // Busca e filtros
    searchInput.addEventListener('input', renderTasks);
    filterSelect.addEventListener('change', renderTasks);

    // Exportar/Importar
    exportBtn.addEventListener('click', exportTasks);
    importInput.addEventListener('change', importTasks);

    // Notificações
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Notification && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    });

    // Atualiza quando o tema muda
    document.addEventListener('themeChanged', renderTasks);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    renderTasks();
    
    // Verifica se veio de redirecionamento da sessão de foco
    if (localStorage.getItem('focusTaskCompleted')) {
        alert('Sessão de foco concluída com sucesso!');
        localStorage.removeItem('focusTaskCompleted');
    }
});

