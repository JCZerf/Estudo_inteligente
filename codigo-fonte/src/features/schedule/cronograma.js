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
                                // Lógica para mover eventos não-tarefa (se implementada futuramente)
                                console.warn("Movimentação de eventos gerais ainda não implementada.");
                            }
                            
                            // Recarrega para refletir as mudanças
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
            // Calcula o início da semana (segunda-feira)
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
        
        // Carrega e exibe tarefas no cronograma
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
                                id: task.id,
                                title: task.title,
                                itemType: "tarefa",
                                date: task.due,
                                day: new Date(task.due + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toLowerCase().substring(0,3),
                                time: task.time || "-",
                                endTime: task.endTime || "-", 
                                duration: task.duration, 
                                description: task.description || "",
                                priority: task.priority || "medium",
                                done: task.done || false,
                                originalCategoryName: categoryName, 
                                originalCategoryKeyForSelect: taskOriginalCategorySelectValue 
                            };
                            
                            // Adiciona a tarefa ao calendário
                            this.addEventToCalendar(taskDisplayData, true);
                        }
                    });
                });
            } catch (e) {
                console.error("Erro ao carregar tarefas para o cronograma:", e);
            }
        },
        
        // Adiciona um evento/tarefa ao calendário
        addEventToCalendar(eventData, isTask) {
            // Obtém a abreviação do dia (mon, tue, etc.)
            const dayAbbrev = eventData.day.substring(0,3);
            let targetCell = null;
            
            // Encontra a célula correta para o horário da tarefa
            if (isTask && eventData.time && eventData.time !== "-") {
                const eventStartTime = eventData.time.substring(0,5);
                const dayCellsWithTime = Array.from(
                    document.querySelectorAll(`.cell[data-day="${dayAbbrev}"][data-time]`)
                ).sort((a, b) => (a.dataset.time || "").localeCompare(b.dataset.time || ""));
                
                if (dayCellsWithTime.length > 0) {
                    // Encontra a célula mais próxima do horário da tarefa
                    for (let i = dayCellsWithTime.length - 1; i >= 0; i--) {
                        const cell = dayCellsWithTime[i];
                        const cellStartTime = cell.dataset.time;
                        if (eventStartTime >= cellStartTime) {
                            targetCell = cell; break;
                        }
                    }
                    if (!targetCell) targetCell = dayCellsWithTime[0];
                }
            }
            
            // Se não encontrou célula específica, usa a primeira do dia
            if (!targetCell) {
                const dayCells = document.querySelectorAll(`.cell[data-day="${dayAbbrev}"][data-time]`);
                if (dayCells.length > 0) targetCell = dayCells[0];
                else {
                    const anyDayCell = document.querySelector(`.cell[data-day="${dayAbbrev}"]`);
                    if (anyDayCell) targetCell = anyDayCell;
                }
            }

            // Se encontrou uma célula alvo, cria ou atualiza o elemento do evento
            if (targetCell) {
                // Verifica se o evento já existe
                const existingElement = targetCell.querySelector(`.event[data-id="${eventData.id}"]`);
                if (existingElement) {
                    // Atualiza o elemento existente
                    existingElement.className = `event event-task ${eventData.done ? "event-done" : ""}`;
                    existingElement.dataset.fullData = JSON.stringify(eventData); // Atualiza dados completos
                    const toggleBtn = existingElement.querySelector("button[data-action=\"toggle-done\"] i");
                    if (toggleBtn) toggleBtn.className = `fas fa-${eventData.done ? "undo" : "check"}`;
                    return; 
                }

                // Cria um novo elemento para o evento
                const eventElement = document.createElement("div");
                eventElement.className = `event event-task ${eventData.done ? "event-done" : ""}`;
                eventElement.dataset.id = eventData.id;
                eventElement.dataset.itemType = eventData.itemType;
                eventElement.dataset.fullData = JSON.stringify(eventData);

                // Prepara a exibição do horário
                let eventTimeDisplay = "";
                if (eventData.time && eventData.time !== "-") {
                    eventTimeDisplay = `<span class="event-time">${eventData.time}`;
                    if (eventData.endTime && eventData.endTime !== "-") {
                        eventTimeDisplay += ` - ${eventData.endTime}`;
                    }
                    eventTimeDisplay += `</span>`;
                }

                // Prepara os botões de ação
                const actionsHtml = `
                    <div class="event-actions">
                        <button class="event-action-btn" data-action="toggle-done" title="${eventData.done ? 'Marcar como pendente' : 'Marcar como concluída'}">
                            <i class="fas fa-${eventData.done ? 'undo' : 'check'}"></i>
                        </button>
                        <button class="event-action-btn" data-action="delete" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                
                // Define o conteúdo HTML do evento
                eventElement.innerHTML = `
                    <span class="event-title">[T] ${eventData.title}</span>
                    ${eventTimeDisplay}
                    ${actionsHtml}
                `;
                
                // Adiciona evento de clique para abrir o modal de edição
                eventElement.addEventListener("click", (e) => {
                    if (e.target.closest(".event-action-btn")) return;
                    const fullData = JSON.parse(eventElement.dataset.fullData);
                    eventModal.open(fullData);
                });

                // Adiciona eventos de clique para os botões de ação
                eventElement.querySelectorAll(".event-action-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const action = btn.dataset.action;
                        if (action === "delete") {
                            this.confirmDeleteEvent(eventData.id, true, eventData.title, eventData.originalCategoryName);
                        } else if (action === "toggle-done") {
                            this.toggleTaskDone(eventData.id, eventData.originalCategoryName);
                        }
                    });
                });
                
                // Adiciona o evento à célula
                targetCell.appendChild(eventElement);
            } else {
                console.warn("Célula não encontrada para a tarefa no cronograma:", eventData, `dayAbbrev: ${dayAbbrev}`);
            }
        },
        
        // Exibe confirmação para excluir um evento
        confirmDeleteEvent(itemId, isTask, itemTitle, itemCategoryName) { 
            const modal = document.getElementById("confirmModal");
            const titleEl = document.getElementById("confirmModalTitle");
            const messageEl = document.getElementById("confirmModalMessage");
            const confirmBtn = document.getElementById("confirmModalConfirm");
            const cancelBtn = document.getElementById("confirmModalCancel");
            
            // Configura o modal de confirmação
            titleEl.textContent = isTask ? "Excluir Tarefa do Cronograma" : "Excluir Evento";
            messageEl.innerHTML = `Tem certeza que deseja excluir "<strong>${itemTitle}</strong>"? Esta ação não pode ser desfeita.`;
            
            modal.style.display = "block";
            
            // Função para limpar os event listeners
            const cleanUp = () => {
                confirmBtn.removeEventListener("click", handleConfirmClick);
                cancelBtn.removeEventListener("click", handleCancelClick);
                modal.style.display = "none";
            };

            // Função para confirmar a exclusão
            const handleConfirmClick = () => {
                if (isTask) {
                    this.deleteTask(itemId, itemCategoryName);
                } 
                cleanUp();
            };
            
            // Função para cancelar a exclusão
            const handleCancelClick = () => {
                cleanUp();
            };

            // Adiciona event listeners aos botões
            confirmBtn.addEventListener("click", handleConfirmClick, { once: true });
            cancelBtn.addEventListener("click", handleCancelClick, { once: true });
        },
        
        // Exclui uma tarefa do localStorage
        deleteTask(taskId, taskCategoryName) { 
            try {
                let currentTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                if (currentTasks[taskCategoryName]) {
                    const originalLength = currentTasks[taskCategoryName].length;
                    currentTasks[taskCategoryName] = currentTasks[taskCategoryName].filter(t => t.id !== taskId);
                    
                    if (currentTasks[taskCategoryName].length < originalLength) {
                        // Remove a categoria se ficar vazia
                        if (currentTasks[taskCategoryName].length === 0) {
                            delete currentTasks[taskCategoryName];
                        }
                        
                        // Salva alterações e dispara evento de atualização
                        localStorage.setItem("studyTasks", JSON.stringify(currentTasks));
                        this.loadScheduleAndTasks(); 
                        window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
                    } else {
                        console.warn("Tarefa não encontrada para exclusão no cronograma:", taskId, taskCategoryName);
                    }
                } else {
                     console.warn("Categoria da tarefa não encontrada para exclusão:", taskCategoryName);
                }
            } catch (e) {
                console.error("Erro ao excluir tarefa via cronograma:", e);
            }
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
            eventDate: document.getElementById("eventDate"), 
            eventTime: document.getElementById("eventTime"),
            eventDuration: document.getElementById("eventDuration"),
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
            
            // Configura campos iniciais
            this.toggleFormFields(this.elements.itemCreationType ? this.elements.itemCreationType.value : "evento");
        },
        
        // Alterna a visibilidade dos campos conforme o tipo de item
        toggleFormFields(selectedType) {
            if (selectedType === "evento") {
                // Mostra campos de evento, oculta campos de tarefa
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.remove("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.add("hidden");
            } else if (selectedType === "tarefa") {
                // Mostra campos de tarefa, oculta campos de evento
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.add("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.remove("hidden");
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
                this.toggleFormFields(itemData.itemType);

                if (itemData.itemType === "tarefa") {
                    // Preenche campos específicos de tarefa
                    this.currentEditOriginalCategoryName = itemData.originalCategoryName;
                    if(this.elements.taskSubjectCron && itemData.originalCategoryKeyForSelect) { 
                        this.elements.taskSubjectCron.value = itemData.originalCategoryKeyForSelect;
                    } else if (this.elements.taskSubjectCron) {
                        // Fallback se originalCategoryKeyForSelect estiver ausente
                        this.elements.taskSubjectCron.value = mapTaskCategoryDisplayNameToSelectValue(itemData.originalCategoryName, this.elements.taskSubjectCron);
                    }
                    if(this.elements.eventDate) this.elements.eventDate.value = itemData.date || "";
                    if(this.elements.eventTime) this.elements.eventTime.value = itemData.time && itemData.time !== "-" ? itemData.time.substring(0,5) : "";
                    if(this.elements.eventDuration) this.elements.eventDuration.value = itemData.duration || "30";
                    if(this.elements.eventNotes) this.elements.eventNotes.value = itemData.description || ""; 
                }
            } else { 
                // Modo de adição: configura valores padrão
                if(this.elements.title) this.elements.title.textContent = "Adicionar Atividade";
                if(this.elements.saveButton) this.elements.saveButton.textContent = "Salvar Atividade";
                if(this.elements.itemCreationType) {
                    this.elements.itemCreationType.value = "tarefa"; // Padrão para novo item
                    this.elements.itemCreationType.disabled = false;
                }
                this.toggleFormFields("tarefa");
                if (this.elements.eventDate) { 
                    this.elements.eventDate.value = new Date().toISOString().split("T")[0];
                }
                if(this.elements.taskSubjectCron) this.elements.taskSubjectCron.value = "geral_cronograma"; // Matéria padrão
            }
            
            // Exibe o modal
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
            const duration = parseInt(this.elements.eventDuration.value);
            const notes = this.elements.eventNotes.value.trim();

            // Validação básica
            if (!title || !itemDateISO || !time || isNaN(duration) || duration <= 0) {
                 alert("Por favor, preencha todos os campos obrigatórios corretamente (Título, Data, Horário, Duração)."); 
                 return; 
            }
            
            // Calcula o horário de término
            const startTimeObj = new Date(`${itemDateISO}T${time}:00`);
            const endTimeObj = new Date(startTimeObj.getTime() + duration * 60000);
            const endTimeString = endTimeObj.toTimeString().substring(0, 5);

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
                    
                    // Atualiza os dados da tarefa
                    const originalTask = studyTasksData[originalCategoryName][taskIndex];
                    const updatedTaskData = {
                        ...originalTask, 
                        title: title,
                        due: itemDateISO,
                        time: time,
                        endTime: endTimeString,
                        duration: duration,
                        description: notes,
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
                    // Modo de adição
                    const taskId = `task-cron-${Date.now()}`;
                    const taskData = {
                        id: taskId, 
                        title: title, 
                        itemType: "tarefa", 
                        due: itemDateISO, 
                        time: time, 
                        endTime: endTimeString, 
                        duration: duration, 
                        description: notes, 
                        priority: "medium", 
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
                // Funcionalidade de eventos ainda não implementada
                alert("Funcionalidade de adicionar/editar eventos gerais ainda não implementada.");
            }
            
            // Fecha o modal após salvar
            this.close();
        }
    };

    // Inicializa o botão de impressão
    const printBtn = document.getElementById("printSchedule");
    if (printBtn) {
        printBtn.addEventListener("click", function() {
            window.print();
        });
    }

    // Inicializa os componentes principais
    weekNav.init();
    eventModal.init();
});
