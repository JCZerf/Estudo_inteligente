/**
 * Script JavaScript para a página de Cronograma
 * Gerencia a exibição, criação e manipulação de eventos e tarefas no calendário
 */

// Função auxiliar para obter o nome de exibição da matéria a partir do valor do select
function getTaskSubjectNameForCron(value) {
    // Tenta obter o nome da matéria diretamente do elemento select
    const selectElement = document.getElementById("taskSubjectCron");
    if (selectElement) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === value) {
                return selectElement.options[i].text;
            }
        }
    }
    
    // Mapeamento de fallback caso o select não esteja disponível
    const subjects = {
        "math": "Matemática", "physics": "Física", "chemistry": "Química",
        "biology": "Biologia", "history": "História", "geography": "Geografia",
        "philosophy": "Filosofia", "sociology": "Sociologia", "portuguese": "Português",
        "literature": "Literatura", "english": "Inglês", "spanish": "Espanhol",
        "art": "Artes", "physical_education": "Educação Física",
        "geral_cronograma": "Geral (Cronograma)",
        "other_task_cron": "Outra Tarefa (Cronograma)"
    };
    return subjects[value] || value; 
}

// Função auxiliar para mapear o nome de exibição da categoria para o valor do select
function mapTaskCategoryDisplayNameToSelectValue(displayName, selectElement) {
    // Tenta encontrar a opção correspondente no select
    if (selectElement) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].text === displayName) {
                return selectElement.options[i].value;
            }
        }
        // Se não encontrar, tenta usar a opção "Outra Tarefa"
        const otherOption = Array.from(selectElement.options).find(opt => opt.value === "other_task_cron");
        if (otherOption) return otherOption.value;
    }
    // Valor padrão se nada for encontrado
    return "geral_cronograma";
}

// Função auxiliar para obter o nome de exibição da categoria de evento a partir do valor do select
function getEventCategoryNameForCron(value) {
    // Tenta obter o nome da categoria diretamente do elemento select
    const selectElement = document.getElementById("cronEventCategory");
    if (selectElement) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === value) {
                return selectElement.options[i].text;
            }
        }
    }
    
    // Mapeamento de fallback caso o select não esteja disponível
    const categories = {
        "aula": "Aula", "palestra": "Palestra", "oficina": "Oficina",
        "reuniao": "Reunião", "estudo_dirigido": "Estudo Dirigido", 
        "exercicio_fisico": "Exercício Físico", "refeicao": "Refeição",
        "pessoal": "Pessoal", "outro_evento": "Outro Evento"
    };
    return categories[value] || value; 
}

// Função auxiliar para mapear a categoria de evento para o tipo de visualização
function mapEventCategoryToDisplayType(category) {
    // Mapeamento de categorias para tipos de visualização
    const typeMapping = {
        "aula": "study", "palestra": "study", "oficina": "study",
        "estudo_dirigido": "study", "exercicio_fisico": "exercise",
        "refeicao": "meal", "reuniao": "study", "pessoal": "study",
        "outro_evento": "study"
    };
    return typeMapping[category] || "study";
}

// Inicialização quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", function () {
    // Objeto principal para gerenciar a navegação e exibição do cronograma
    const weekNav = {
        // Data atual para referência da semana em exibição
        currentDate: new Date(),
        
        // Elementos do DOM utilizados pelo objeto
        elements: {
            prevBtn: document.getElementById("prevWeek"),
            nextBtn: document.getElementById("nextWeek"),
            weekDisplay: document.getElementById("currentWeek"),
            scheduleTable: document.querySelector(".schedule-table")
        },
        
        // Inicializa o cronograma
        init() {
            this.generateScheduleGrid();
            this.updateWeekDisplay();
            
            // Configura eventos para navegação entre semanas
            if (this.elements.prevBtn) this.elements.prevBtn.addEventListener("click", () => this.changeWeek(-1));
            if (this.elements.nextBtn) this.elements.nextBtn.addEventListener("click", () => this.changeWeek(1));
            
            // Escuta eventos de mudança nas tarefas para atualizar o cronograma
            window.addEventListener("studyItemsChanged", (event) => {
                if (event.detail && (event.detail.storageKey === "studyTasks" || event.detail.storageKey === "studySchedule")) {
                    this.loadScheduleAndTasks();
                }
            });
            
            // Carrega tarefas e inicializa funcionalidade de arrastar e soltar
            this.loadScheduleAndTasks(); // Carrega tarefas primeiro
            this.initSortableGrid(); // Depois inicializa o sortable
        },
        
        // Gera a grade do cronograma com células para cada dia e horário
        generateScheduleGrid() {
            if (!this.elements.scheduleTable) return;
            
            // Remove linhas existentes (exceto o cabeçalho)
            const existingRows = this.elements.scheduleTable.querySelectorAll(".row:not(.header-row)");
            existingRows.forEach(row => row.remove());
            
            // Define os dias da semana e classes especiais
            const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
            const dayClasses = { sat: "weekend", sun: "weekend" };
            
            // Cria linhas para cada intervalo de 2 horas (0h às 24h)
            for (let hour = 0; hour < 24; hour += 2) {
                const row = document.createElement("div");
                row.classList.add("row");
                
                // Cria célula de horário
                const timeCell = document.createElement("div");
                timeCell.classList.add("cell", "time-cell");
                const startTime = `${String(hour).padStart(2, "0")}:00`;
                const endTimeHour = (hour + 2) % 24;
                const endTime = `${String(endTimeHour).padStart(2, "0")}:00`;
                timeCell.textContent = `${startTime} - ${endTime}`;
                row.appendChild(timeCell);
                
                // Cria células para cada dia da semana
                days.forEach(day => {
                    const dayCell = document.createElement("div");
                    dayCell.classList.add("cell", "schedule-cell"); // Classe para alvo do sortable
                    if (dayClasses[day]) dayCell.classList.add(dayClasses[day]);
                    dayCell.dataset.day = day;
                    dayCell.dataset.time = startTime;
                    row.appendChild(dayCell);
                });
                
                this.elements.scheduleTable.appendChild(row);
            }
        },
        
        // Inicializa a funcionalidade de arrastar e soltar nas células
        initSortableGrid() {
            const cells = document.querySelectorAll(".schedule-cell");
            cells.forEach(cell => {
                new Sortable(cell, {
                    group: "schedule-items", // Permite mover itens entre células
                    animation: 150,
                    ghostClass: "sortable-ghost-event", // Classe para o elemento fantasma
                    chosenClass: "sortable-chosen-event", // Classe para o elemento escolhido
                    dragClass: "sortable-drag-event", // Classe para o elemento sendo arrastado
                    
                    // Função chamada quando um item é solto
                    onEnd: (evt) => {
                        const itemEl = evt.item; // O elemento arrastado (.event)
                        const toCell = evt.to;   // A célula de destino
                        const fromCell = evt.from; // A célula de origem

                        // Obtém dados do item arrastado
                        const itemId = itemEl.dataset.id;
                        const itemType = itemEl.dataset.itemType;
                        let fullData = JSON.parse(itemEl.dataset.fullData);

                        // Obtém informações da nova posição
                        const newDayAbbrev = toCell.dataset.day;
                        const newTime = toCell.dataset.time; // Horário de início do slot

                        // Mapeia abreviação do dia para índice da semana
                        const weekDaysMapping = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
                        const dayIndex = weekDaysMapping[newDayAbbrev];
                        const currentWeekDaysISO = this.getWeekDays();
                        const newDateISO = currentWeekDaysISO[dayIndex];

                        // Prepara o modal de confirmação
                        const confirmModal = document.getElementById("confirmModal");
                        const confirmTitle = document.getElementById("confirmModalTitle");
                        const confirmMessage = document.getElementById("confirmModalMessage");
                        const confirmBtn = document.getElementById("confirmModalConfirm");
                        const cancelBtn = document.getElementById("confirmModalCancel");

                        // Configura o modal de confirmação
                        confirmTitle.textContent = "Confirmar Mudança";
                        const newDateFormatted = new Date(newDateISO + "T00:00:00").toLocaleDateString("pt-BR");
                        confirmMessage.innerHTML = `Mover "<strong>${fullData.title}</strong>" para <br><strong>${newDateFormatted}</strong> às <strong>${newTime}</strong>?`;

                        confirmModal.style.display = "block";

                        // Função para confirmar a mudança
                        const handleConfirm = () => {
                            if (itemType === "tarefa") {
                                let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                                const originalCategory = fullData.originalCategoryName;
                                
                                if (studyTasks[originalCategory]) {
                                    const taskIndex = studyTasks[originalCategory].findIndex(t => t.id === itemId);
                                    
                                    if (taskIndex !== -1) {
                                        // Atualiza data e hora da tarefa
                                        studyTasks[originalCategory][taskIndex].due = newDateISO;
                                        studyTasks[originalCategory][taskIndex].time = newTime;
                                        
                                        // Recalcula horário de término se houver duração
                                        if (studyTasks[originalCategory][taskIndex].duration) {
                                            const durationMinutes = parseInt(studyTasks[originalCategory][taskIndex].duration);
                                            const startTimeObj = new Date(`${newDateISO}T${newTime}:00`);
                                            const endTimeObj = new Date(startTimeObj.getTime() + durationMinutes * 60000);
                                            studyTasks[originalCategory][taskIndex].endTime = endTimeObj.toTimeString().substring(0, 5);
                                        }
                                        
                                        // Salva alterações e dispara evento de atualização
                                        localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
                                        window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
                                    } else { 
                                        console.error("Tarefa não encontrada para mover."); 
                                    }
                                } else { 
                                    console.error("Categoria original da tarefa não encontrada."); 
                                }
                            } else if (itemType === "evento") {
                                // Lógica para mover eventos
                                let studySchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                                const eventIndex = studySchedule.findIndex(e => e.id === itemId);
                                
                                if (eventIndex !== -1) {
                                    // Atualiza data e hora do evento
                                    studySchedule[eventIndex].date = newDateISO;
                                    studySchedule[eventIndex].time = newTime;
                                    
                                    // Recalcula horário de término se houver duração
                                    if (studySchedule[eventIndex].duration) {
                                        const durationMinutes = parseInt(studySchedule[eventIndex].duration);
                                        const startTimeObj = new Date(`${newDateISO}T${newTime}:00`);
                                        const endTimeObj = new Date(startTimeObj.getTime() + durationMinutes * 60000);
                                        studySchedule[eventIndex].endTime = endTimeObj.toTimeString().substring(0, 5);
                                    }
                                    
                                    // Salva alterações e dispara evento de atualização
                                    localStorage.setItem("studySchedule", JSON.stringify(studySchedule));
                                    window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studySchedule" } }));
                                } else {
                                    console.error("Evento não encontrado para mover.");
                                }
                            }
                            
                            this.loadScheduleAndTasks();
                            cleanUp();
                        };

                        // Função para cancelar a mudança
                        const handleCancel = () => {
                            // Reverte a movimentação visualmente
                            fromCell.insertBefore(itemEl, fromCell.children[evt.oldDraggableIndex]);
                            cleanUp();
                        };

                        // Função para limpar os event listeners
                        const cleanUp = () => {
                            confirmBtn.removeEventListener("click", handleConfirm);
                            cancelBtn.removeEventListener("click", handleCancel);
                            confirmModal.style.display = "none";
                        };

                        // Adiciona event listeners aos botões
                        confirmBtn.addEventListener("click", handleConfirm, { once: true });
                        cancelBtn.addEventListener("click", handleCancel, { once: true });
                    }
                });
            });
        },
        
        // Muda a semana exibida (anterior ou próxima)
        changeWeek(weeks) {
            this.currentDate.setDate(this.currentDate.getDate() + weeks * 7);
            this.updateWeekDisplay();
            this.loadScheduleAndTasks();
        },
        
        // Atualiza o texto de exibição da semana atual
        updateWeekDisplay() {
            const startOfWeek = new Date(this.currentDate);
            const dayOfWeek = startOfWeek.getDay();
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            
            // Calcula o fim da semana (domingo)
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            
            // Formata as datas para exibição
            const options = { day: "numeric", month: "long" };
            const startStr = startOfWeek.toLocaleDateString("pt-BR", options);
            const endStr = endOfWeek.toLocaleDateString("pt-BR", options);
            
            // Atualiza o texto de exibição
            if (this.elements.weekDisplay) {
                this.elements.weekDisplay.textContent = `Semana ${startStr} - ${endStr} ${endOfWeek.getFullYear()}`;
            }
        },
        
        // Obtém um array com as datas ISO da semana atual
        getWeekDays() {
            const weekDays = [];
            const startOfWeek = new Date(this.currentDate);
            const dayOfWeek = startOfWeek.getDay();
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            
            // Gera um array com as datas ISO de cada dia da semana
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                weekDays.push(day.toISOString().split("T")[0]);
            }
            return weekDays;
        },
        
        // Carrega e exibe tarefas e eventos no cronograma
        loadScheduleAndTasks() {
            // Remove eventos existentes
            document.querySelectorAll(".schedule-table .event").forEach(eventEl => eventEl.remove());
            
            // Obtém as datas da semana atual
            const weekDaysISO = this.getWeekDays();
            
            try {
                // Carrega tarefas do localStorage
                const studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};
                const taskSubjectCronSelect = document.getElementById("taskSubjectCron");

                // Processa cada categoria de tarefas
                Object.entries(studyTasksData).forEach(([categoryName, tasksInCategory]) => {
                    // Filtra tarefas para a semana atual
                    tasksInCategory.forEach(task => {
                        if (task.due && weekDaysISO.includes(task.due)) {
                            // Mapeia o nome da categoria para o valor do select
                            let taskOriginalCategorySelectValue = mapTaskCategoryDisplayNameToSelectValue(categoryName, taskSubjectCronSelect);
                            
                            // Prepara dados para exibição
                            const taskDisplayData = {
                                ...task, // Inclui todos os dados da tarefa original
                                itemType: "tarefa",
                                originalCategoryName: categoryName,
                                originalCategoryKeyForSelect: taskOriginalCategorySelectValue
                            };
                            
                            // Adiciona a tarefa à grade
                            this.addItemToGrid(taskDisplayData);
                        }
                    });
                });
                
                // Carrega eventos do localStorage
                const studySchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                
                // Filtra eventos para a semana atual
                studySchedule.forEach(event => {
                    if (event.date && weekDaysISO.includes(event.date)) {
                        // Adiciona o evento à grade
                        this.addItemToGrid(event);
                    }
                });
            } catch (e) {
                console.error("Erro ao carregar tarefas e eventos:", e);
            }
        },
        
        // Adiciona um item (tarefa ou evento) à grade do cronograma
        addItemToGrid(itemData) {
            // Mapeia a data ISO para o dia da semana
            const itemDate = new Date(itemData.date || itemData.due + "T00:00:00"); // Usa 'due' para tarefas
            const dayOfWeek = itemDate.getDay(); // 0 = Domingo, 1 = Segunda, ...
            const dayAbbrev = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayOfWeek];
            
            // Encontra a célula correspondente ao dia e horário
            const timeStr = itemData.time && itemData.time !== "-" ? itemData.time.substring(0, 5) : "08:00";
            const hour = parseInt(timeStr.split(":")[0]);
            const roundedHour = Math.floor(hour / 2) * 2; // Arredonda para o intervalo de 2 horas
            const formattedHour = String(roundedHour).padStart(2, "0") + ":00";
            
            const targetCell = document.querySelector(`.schedule-cell[data-day="${dayAbbrev}"][data-time="${formattedHour}"]`);
            if (!targetCell) return;
            
            // Cria o elemento do evento
            const eventEl = document.createElement("div");
            eventEl.classList.add("event");
            
            // Define atributos e classes com base no tipo de item
            if (itemData.itemType === "tarefa") {
                eventEl.classList.add("event-task");
                if (itemData.done) eventEl.classList.add("event-done");
                // Define classe específica para a borda e cor de prioridade
                const priority = itemData.priority || 'medium'; // Assume 'medium' se não definida
                eventEl.classList.add(`priority-border-${priority}`); // Adiciona classe da borda
                eventEl.classList.add(`priority-${priority}`); // Adiciona classe da cor (para CSS depender)
            } else {
                // Define classe para a borda padrão de evento (azul)
                eventEl.classList.add('event-border-default');
                // Define o tipo de visualização com base na categoria do evento (para background)
                const displayType = mapEventCategoryToDisplayType(itemData.category);
                eventEl.dataset.type = displayType;
            }
            
            // Define atributos comuns
            eventEl.dataset.id = itemData.id;
            eventEl.dataset.itemType = itemData.itemType;
            eventEl.dataset.fullData = JSON.stringify(itemData);
            
            // Cria o conteúdo do evento
            const titleSpan = document.createElement("span");
            titleSpan.classList.add("event-title");
            titleSpan.textContent = itemData.title;
            
            const timeSpan = document.createElement("span");
            timeSpan.classList.add("event-time");
            if (itemData.time && itemData.time !== "-") {
                timeSpan.textContent = `${itemData.time.substring(0, 5)}${itemData.endTime && itemData.endTime !== "-" ? ` - ${itemData.endTime.substring(0, 5)}` : ""}`;
            }
            
            // Adiciona os elementos ao evento
            eventEl.appendChild(titleSpan);
            eventEl.appendChild(timeSpan);
            
            // Adiciona tooltip para observações se existirem
            if (itemData.description && itemData.description.trim()) {
                eventEl.classList.add("tooltip-container");
                const tooltipText = document.createElement("span");
                tooltipText.classList.add("tooltip-text");
                tooltipText.textContent = "Observações: " + itemData.description;
                eventEl.appendChild(tooltipText);
            }
            
            // Adiciona botões de ação
            const actionsDiv = document.createElement("div");
            actionsDiv.classList.add("event-actions");
            
            // Botão de editar
            const editBtn = document.createElement("button");
            editBtn.classList.add("event-action-btn");
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.editItem(itemData);
            });
            
            // Botão de excluir
            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("event-action-btn");
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.deleteItem(itemData.id, itemData.itemType, itemData.originalCategoryName);
            });
            
            // Adiciona botões ao container de ações
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            // Adiciona botão de marcar como concluído apenas para tarefas
            if (itemData.itemType === "tarefa") {
                const doneBtn = document.createElement("button");
                doneBtn.classList.add("event-action-btn");
                doneBtn.innerHTML = itemData.done ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>';
                doneBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.toggleTaskDone(itemData.id, itemData.originalCategoryName);
                });
                actionsDiv.appendChild(doneBtn);
            }
            
            eventEl.appendChild(actionsDiv);
            
            // Adiciona evento de clique para editar
            eventEl.addEventListener("click", () => {
                this.editItem(itemData);
            });
            
            // Adiciona o evento à célula
            targetCell.appendChild(eventEl);
        },
        
        // Abre o modal para editar um item
        editItem(itemData) {
            // Obtém o objeto do modal de eventos
            const eventModalObj = window.eventModal;
            if (eventModalObj) {
                eventModalObj.open(itemData);
            }
        },
        
        // Exclui um item (tarefa ou evento)
        deleteItem(itemId, itemType, taskCategoryName) {
            // Prepara o modal de confirmação
            const confirmModal = document.getElementById("confirmModal");
            const confirmTitle = document.getElementById("confirmModalTitle");
            const confirmMessage = document.getElementById("confirmModalMessage");
            const confirmBtn = document.getElementById("confirmModalConfirm");
            const cancelBtn = document.getElementById("confirmModalCancel");
            
            // Configura o modal de confirmação
            confirmTitle.textContent = "Confirmar Exclusão";
            confirmMessage.textContent = `Tem certeza que deseja excluir este item?`;
            
            confirmModal.style.display = "block";
            
            // Função para confirmar a exclusão
            const handleConfirm = () => {
                if (itemType === "tarefa") {
                    try {
                        let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                        if (studyTasks[taskCategoryName]) {
                            // Filtra a tarefa a ser excluída
                            studyTasks[taskCategoryName] = studyTasks[taskCategoryName].filter(t => t.id !== itemId);
                            
                            // Remove a categoria se estiver vazia
                            if (studyTasks[taskCategoryName].length === 0) {
                                delete studyTasks[taskCategoryName];
                            }
                            
                            // Salva alterações e dispara evento de atualização
                            localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
                            window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
                        }
                    } catch (e) {
                        console.error("Erro ao excluir tarefa:", e);
                    }
                } else if (itemType === "evento") {
                    try {
                        let studySchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                        
                        // Filtra o evento a ser excluído
                        studySchedule = studySchedule.filter(e => e.id !== itemId);
                        
                        // Salva alterações e dispara evento de atualização
                        localStorage.setItem("studySchedule", JSON.stringify(studySchedule));
                        window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studySchedule" } }));
                    } catch (e) {
                        console.error("Erro ao excluir evento:", e);
                    }
                }
                
                this.loadScheduleAndTasks();
                cleanUp();
            };
            
            // Função para cancelar a exclusão
            const handleCancel = () => {
                cleanUp();
            };
            
            // Função para limpar os event listeners
            const cleanUp = () => {
                confirmBtn.removeEventListener("click", handleConfirm);
                cancelBtn.removeEventListener("click", handleCancel);
                confirmModal.style.display = "none";
            };
            
            // Adiciona event listeners aos botões
            confirmBtn.addEventListener("click", handleConfirm, { once: true });
            cancelBtn.addEventListener("click", handleCancel, { once: true });
        },
        
        // Alterna o estado de conclusão de uma tarefa
        toggleTaskDone(taskId, taskCategoryName) { 
            try {
                let currentTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                if (currentTasks[taskCategoryName]){
                    const taskIndex = currentTasks[taskCategoryName].findIndex(t => t.id === taskId);
                    if (taskIndex !== -1) {
                        // Inverte o estado de conclusão
                        currentTasks[taskCategoryName][taskIndex].done = !currentTasks[taskCategoryName][taskIndex].done;
                        
                        // Salva alterações e dispara evento de atualização
                        localStorage.setItem("studyTasks", JSON.stringify(currentTasks));
                        this.loadScheduleAndTasks(); 
                        window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
                    } else {
                        console.warn("Tarefa não encontrada para marcar como concluída/pendente:", taskId, taskCategoryName);
                    }
                } else {
                    console.warn("Categoria da tarefa não encontrada para toggle done:", taskCategoryName);
                }
            } catch (e) {
                console.error("Erro ao alternar estado da tarefa via cronograma:", e);
            }
        }
    };

    // Objeto para gerenciar o modal de eventos/tarefas
    const eventModal = {
        // Elementos do DOM utilizados pelo modal
        elements: {
            modal: document.getElementById("eventModal"),
            title: document.getElementById("eventModalTitle"),
            openBtn: document.getElementById("addEvent"),
            closeBtn: document.querySelector("#eventModal .close-modal"),
            form: document.getElementById("eventForm"),
            itemCreationType: document.getElementById("itemCreationType"),
            eventTitle: document.getElementById("eventTitle"),
            cronEventCategoryGroup: document.getElementById("cronEventCategoryGroup"),
            cronEventCategory: document.getElementById("cronEventCategory"),
            taskSubjectCronGroup: document.getElementById("taskSubjectCronGroup"),
            taskSubjectCron: document.getElementById("taskSubjectCron"),
            taskPriorityCronGroup: document.getElementById("taskPriorityCronGroup"), // Novo
            eventDate: document.getElementById("eventDate"), 
            eventTime: document.getElementById("eventTime"),

            eventNotes: document.getElementById("eventNotes"),
            eventIdField: document.getElementById("eventIdField"),
            saveButton: document.getElementById("saveActivityButton")
        },
        
        // Variáveis para controle de edição
        currentEditId: null, 
        currentEditItemType: null,
        currentEditOriginalCategoryName: null, 

        // Inicializa o modal
        init() {
            // Configura eventos para abrir/fechar o modal
            if (this.elements.openBtn) this.elements.openBtn.addEventListener("click", () => this.open());
            if (this.elements.closeBtn) this.elements.closeBtn.addEventListener("click", () => this.close());
            
            // Configura evento de submissão do formulário
            if (this.elements.form) this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
            
            // Fecha o modal ao clicar fora dele
            window.addEventListener("click", (e) => {
                if (e.target === this.elements.modal) this.close();
            });
            
            // Configura evento para alternar campos conforme o tipo de item
            if (this.elements.itemCreationType) {
                this.elements.itemCreationType.addEventListener("change", (e) => {
                    this.toggleFormFields(e.target.value);
                });
            }
            
            // Configura campos iniciais - Chamado no open() agora
            // this.toggleFormFields(this.elements.itemCreationType ? this.elements.itemCreationType.value : "evento");
        },
        
        // Alterna a visibilidade dos campos conforme o tipo de item
        toggleFormFields(selectedType) {
            if (selectedType === "evento") {
                // Mostra campos de evento, oculta campos de tarefa
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.remove("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.add("hidden");
                if (this.elements.taskPriorityCronGroup) this.elements.taskPriorityCronGroup.classList.add("hidden"); // Oculta prioridade para eventos
            } else if (selectedType === "tarefa") {
                // Mostra campos de tarefa, oculta campos de evento
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.add("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.remove("hidden");
                if (this.elements.taskPriorityCronGroup) this.elements.taskPriorityCronGroup.classList.remove("hidden"); // Mostra prioridade para tarefas
            }
        },
        
        // Abre o modal (para adicionar novo item ou editar existente)
        open(itemData = null) { 
            // Reseta o formulário
            if (this.elements.form) this.elements.form.reset();
            this.currentEditId = null;
            this.currentEditItemType = null;
            this.currentEditOriginalCategoryName = null;
            if(this.elements.eventIdField) this.elements.eventIdField.value = "";
            
            if (itemData) { 
                // Modo de edição: preenche o formulário com dados existentes
                this.currentEditId = itemData.id;
                this.currentEditItemType = itemData.itemType;
                if(this.elements.eventIdField) this.elements.eventIdField.value = itemData.id;
                if(this.elements.title) this.elements.title.textContent = itemData.itemType === "tarefa" ? "Editar Tarefa" : "Editar Evento";
                if(this.elements.saveButton) this.elements.saveButton.textContent = "Salvar Alterações";
                if(this.elements.eventTitle) this.elements.eventTitle.value = itemData.title || "";
                if(this.elements.itemCreationType) {
                    this.elements.itemCreationType.value = itemData.itemType; 
                    this.elements.itemCreationType.disabled = true; // Não permite mudar o tipo durante edição
                }
                this.toggleFormFields(itemData.itemType); // Garante que os campos corretos sejam exibidos para edição

                if (itemData.itemType === "tarefa") {
                    // Preenche campos específicos de tarefa
                    this.currentEditOriginalCategoryName = itemData.originalCategoryName;
                    if(this.elements.taskSubjectCron && itemData.originalCategoryKeyForSelect) { 
                        this.elements.taskSubjectCron.value = itemData.originalCategoryKeyForSelect;
                    } else if (this.elements.taskSubjectCron) {
                        // Fallback se originalCategoryKeyForSelect estiver ausente
                        this.elements.taskSubjectCron.value = mapTaskCategoryDisplayNameToSelectValue(itemData.originalCategoryName, this.elements.taskSubjectCron);
                    }
                    // Define a prioridade selecionada
                    const priority = itemData.priority || 'medium';
                    const priorityInput = document.querySelector(`input[name="priorityCron"][value="${priority}"]`);
                    if (priorityInput) priorityInput.checked = true;

                } else if (itemData.itemType === "evento") {
                    // Preenche campos específicos de evento
                    if(this.elements.cronEventCategory && itemData.category) {
                        this.elements.cronEventCategory.value = itemData.category;
                    }
                }
                
                // Preenche campos comuns
                if(this.elements.eventDate) this.elements.eventDate.value = itemData.date || itemData.due || ""; // Usa due para tarefas
                if(this.elements.eventTime) this.elements.eventTime.value = itemData.time && itemData.time !== "-" ? itemData.time.substring(0,5) : "";
                // if(this.elements.eventDuration) this.elements.eventDuration.value = itemData.duration || "30"; // Removido
                if(this.elements.eventNotes) this.elements.eventNotes.value = itemData.description || ""; 
            } else { 
                // Modo de adição: configura valores padrão
                if(this.elements.title) this.elements.title.textContent = "Adicionar Atividade";
                if(this.elements.saveButton) this.elements.saveButton.textContent = "Salvar Atividade";
                if(this.elements.itemCreationType) {
                    this.elements.itemCreationType.value = "tarefa"; // CORREÇÃO: Define Tarefa como padrão
                    this.elements.itemCreationType.disabled = false;
                }
                this.toggleFormFields("tarefa"); // CORREÇÃO: Garante que os campos de tarefa sejam exibidos por padrão
                if (this.elements.eventDate) { 
                    this.elements.eventDate.value = new Date().toISOString().split("T")[0];
                }
                if(this.elements.cronEventCategory) this.elements.cronEventCategory.value = "aula"; // Categoria padrão para evento (se mudar)
                if(this.elements.taskSubjectCron) this.elements.taskSubjectCron.value = "geral_cronograma"; // Matéria padrão para tarefa
                // Define prioridade média como padrão para novas tarefas
                const mediumPriorityInput = document.querySelector('input[name="priorityCron"][value="medium"]');
                if (mediumPriorityInput) mediumPriorityInput.checked = true;
            }
            
            if (this.elements.modal) this.elements.modal.style.display = "block";
        },
        
        // Fecha o modal
        close() {
            if (this.elements.modal) this.elements.modal.style.display = "none";
            if (this.elements.form) this.elements.form.reset();
            this.currentEditId = null;
            this.currentEditItemType = null;
            this.currentEditOriginalCategoryName = null;
            if(this.elements.eventIdField) this.elements.eventIdField.value = "";
            if(this.elements.itemCreationType) this.elements.itemCreationType.disabled = false;
        },
        
        // Processa o envio do formulário
        handleSubmit(e) {
            e.preventDefault();
            
            // Obtém valores do formulário
            const creationType = this.currentEditId ? this.currentEditItemType : this.elements.itemCreationType.value;
            const title = this.elements.eventTitle.value.trim();
            const itemDateISO = this.elements.eventDate.value; 
            const time = this.elements.eventTime.value;
            // const duration = parseInt(this.elements.eventDuration.value); // Removido
            const notes = this.elements.eventNotes.value.trim();
            const priority = creationType === 'tarefa' ? document.querySelector('input[name="priorityCron"]:checked').value : null; // Obtém prioridade selecionada

            // Validação básica (removida validação de duração)
            if (!title || !itemDateISO || !time) {
                 alert("Por favor, preencha todos os campos obrigatórios corretamente (Título, Data, Horário)."); 
                 return; 
            }
            
            // Calcula o horário de término - Removido, pois não há mais duração
            // const startTimeObj = new Date(`${itemDateISO}T${time}:00`);
            // const endTimeObj = new Date(startTimeObj.getTime() + duration * 60000);
            // const endTimeString = endTimeObj.toTimeString().substring(0, 5);
            const endTimeString = "-"; // Define endTime como indefinido ou vazio

            if (creationType === "tarefa") {
                // Processa tarefa (adição ou edição)
                const taskSubjectValue = this.elements.taskSubjectCron.value;
                const newTaskCategoryName = getTaskSubjectNameForCron(taskSubjectValue); 
                let studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};

                if (this.currentEditId) { 
                    // Modo de edição
                    const originalCategoryName = this.currentEditOriginalCategoryName;
                    if (!originalCategoryName || !studyTasksData[originalCategoryName]) {
                        alert("Erro: Categoria original da tarefa não encontrada para edição."); 
                        return;
                    }
                    
                    const taskIndex = studyTasksData[originalCategoryName].findIndex(t => t.id === this.currentEditId);
                    if (taskIndex === -1) {
                        alert("Erro: Tarefa não encontrada para edição."); 
                        return;
                    }
                    
                    // Atualiza os dados da tarefa (sem duration e endTime)
                    const originalTask = studyTasksData[originalCategoryName][taskIndex];
                    const updatedTaskData = {
                        ...originalTask, 
                        title: title,
                        due: itemDateISO,
                        time: time,
                        endTime: endTimeString, // Atualizado
                        // duration: duration, // Removido
                        description: notes,
                        priority: priority // Salva a prioridade atualizada
                    };

                    if (originalCategoryName !== newTaskCategoryName) {
                        // Se a categoria mudou, move a tarefa para a nova categoria
                        studyTasksData[originalCategoryName].splice(taskIndex, 1);
                        if (studyTasksData[originalCategoryName].length === 0) delete studyTasksData[originalCategoryName];
                        if (!studyTasksData[newTaskCategoryName]) studyTasksData[newTaskCategoryName] = [];
                        studyTasksData[newTaskCategoryName].push(updatedTaskData);
                    } else {
                        // Atualiza a tarefa na mesma categoria
                        studyTasksData[originalCategoryName][taskIndex] = updatedTaskData;
                    }
                } else { 
                    // Modo de adição (sem duration e endTime)
                    const taskId = `task-cron-${Date.now()}`;
                    const taskData = {
                        id: taskId, 
                        title: title, 
                        itemType: "tarefa", 
                        due: itemDateISO, 
                        time: time, 
                        endTime: endTimeString, // Atualizado
                        // duration: duration, // Removido
                        description: notes, 
                        priority: priority, // Salva a prioridade atualizada
                        done: false, 
                    };
                    
                    // Cria a categoria se não existir
                    if (!studyTasksData[newTaskCategoryName]) studyTasksData[newTaskCategoryName] = [];
                    studyTasksData[newTaskCategoryName].push(taskData);
                }
                
                // Salva alterações e dispara evento de atualização
                localStorage.setItem("studyTasks", JSON.stringify(studyTasksData));
                window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
            } else if (creationType === "evento") {
                // Processa evento (adição ou edição)
                const eventCategoryValue = this.elements.cronEventCategory.value;
                const eventCategoryName = getEventCategoryNameForCron(eventCategoryValue);
                let studySchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                
                if (this.currentEditId) {
                    // Modo de edição (sem duration e endTime)
                    const eventIndex = studySchedule.findIndex(e => e.id === this.currentEditId);
                    if (eventIndex === -1) {
                        alert("Erro: Evento não encontrado para edição.");
                        return;
                    }
                    
                    // Atualiza os dados do evento
                    studySchedule[eventIndex] = {
                        ...studySchedule[eventIndex],
                        title: title,
                        date: itemDateISO,
                        time: time,
                        endTime: endTimeString, // Atualizado
                        // duration: duration, // Removido
                        category: eventCategoryValue,
                        description: notes
                    };
                } else {
                    // Modo de adição (sem duration e endTime)
                    const eventId = `event-cron-${Date.now()}`;
                    const eventData = {
                        id: eventId,
                        title: title,
                        itemType: "evento",
                        date: itemDateISO,
                        time: time,
                        endTime: endTimeString, // Atualizado
                        // duration: duration, // Removido
                        category: eventCategoryValue,
                        description: notes
                    };
                    studySchedule.push(eventData);
                }
                
                // Salva alterações e dispara evento de atualização
                localStorage.setItem("studySchedule", JSON.stringify(studySchedule));
                window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studySchedule" } }));
            }
            
            // Fecha o modal e recarrega a grade
            this.close();
            weekNav.loadScheduleAndTasks();
        }
    };

    // Inicializa a navegação da semana e o modal
    weekNav.init();
    eventModal.init();
    
    // Expõe o objeto do modal globalmente para edição via clique no evento
    window.eventModal = eventModal;
    
    // Adiciona funcionalidade de impressão
    const printButton = document.getElementById("printSchedule");
    if (printButton) {
        printButton.addEventListener("click", () => {
            window.print();
        });
    }
});

// Estilos de impressão (opcional, mas recomendado)
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  .schedule-container, .schedule-container * {
    visibility: visible;
  }
  .schedule-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    box-shadow: none;
  }
  .sidebar, .main > .header, .schedule-header, .schedule-footer, footer, .modal {
      display: none !important;
  }
  .main {
      margin-left: 0 !important;
      padding: 0 !important;
  }
  .schedule-table {
      min-width: auto !important;
  }
  .event {
      box-shadow: none !important;
      border-width: 2px !important; /* Torna a borda mais visível na impressão */
  }
}
`;

// Adiciona estilos de impressão à página
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = printStyles;
document.head.appendChild(styleSheet);

