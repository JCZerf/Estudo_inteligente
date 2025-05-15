// cronograma.js

// Helper function to get task subject display name
function getTaskSubjectNameForCron(value) {
    const subjects = {
        "math": "Matemática", "physics": "Física", "chemistry": "Química",
        "biology": "Biologia", "history": "História", "geography": "Geografia",
        "philosophy": "Filosofia", "sociology": "Sociologia", "portuguese": "Português",
        "literature": "Literatura", "english": "Inglês", "spanish": "Espanhol",
        "art": "Artes", "physical_education": "Educação Física",
        "geral_cronograma": "Geral (Cronograma)",
        "other_task_cron": "Outra Tarefa (Cronograma)" // Placeholder, ideally needs custom input
    };
    return subjects[value] || value; // Fallback to value if not in map
}

document.addEventListener("DOMContentLoaded", function () {
    const weekNav = {
        currentDate: new Date(),
        elements: {
            prevBtn: document.getElementById("prevWeek"),
            nextBtn: document.getElementById("nextWeek"),
            weekDisplay: document.getElementById("currentWeek"),
            scheduleTable: document.querySelector(".schedule-table") // Added for grid generation
        },
        init() {
            this.generateScheduleGrid(); // Generate grid first
            this.updateWeekDisplay();
            if (this.elements.prevBtn) this.elements.prevBtn.addEventListener("click", () => this.changeWeek(-1));
            if (this.elements.nextBtn) this.elements.nextBtn.addEventListener("click", () => this.changeWeek(1));
            // Event listener for storage changes from other tabs/windows for studyTasks
            window.addEventListener('studyItemsChanged', (event) => {
                if (event.detail && (event.detail.storageKey === 'studyTasks' || event.detail.storageKey === 'studySchedule')) {
                    console.log(`cronograma.js: studyItemsChanged event detected for ${event.detail.storageKey}, reloading schedule and tasks.`);
                    this.loadScheduleAndTasks();
                }
            });
            this.loadScheduleAndTasks(); // Initial load of tasks into the generated grid
        },
        generateScheduleGrid() {
            if (!this.elements.scheduleTable) return;

            // Clear existing rows except the header
            const existingRows = this.elements.scheduleTable.querySelectorAll(".row:not(.header-row)");
            existingRows.forEach(row => row.remove());

            const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
            const dayClasses = { sat: "weekend", sun: "weekend" };

            for (let hour = 0; hour < 24; hour += 2) {
                const row = document.createElement("div");
                row.classList.add("row");

                const timeCell = document.createElement("div");
                timeCell.classList.add("cell", "time-cell");
                const startTime = `${String(hour).padStart(2, '0')}:00`;
                const endTimeHour = (hour + 2) % 24;
                const endTime = `${String(endTimeHour).padStart(2, '0')}:00`;
                timeCell.textContent = `${startTime} - ${endTime}`;
                row.appendChild(timeCell);

                days.forEach(day => {
                    const dayCell = document.createElement("div");
                    dayCell.classList.add("cell");
                    if (dayClasses[day]) {
                        dayCell.classList.add(dayClasses[day]);
                    }
                    dayCell.dataset.day = day;
                    dayCell.dataset.time = startTime; // Use the start time for the slot
                    row.appendChild(dayCell);
                });
                this.elements.scheduleTable.appendChild(row);
            }
        },
        changeWeek(weeks) {
            this.currentDate.setDate(this.currentDate.getDate() + weeks * 7);
            this.updateWeekDisplay();
            this.loadScheduleAndTasks();
        },
        updateWeekDisplay() {
            const startOfWeek = new Date(this.currentDate);
            const dayOfWeek = startOfWeek.getDay();
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            const options = { day: "numeric", month: "long" };
            const startStr = startOfWeek.toLocaleDateString("pt-BR", options);
            const endStr = endOfWeek.toLocaleDateString("pt-BR", options);
            if (this.elements.weekDisplay) {
                this.elements.weekDisplay.textContent = `Semana ${startStr} - ${endStr} ${endOfWeek.getFullYear()}`;
            }
        },
        getWeekDays() {
            const weekDays = [];
            const startOfWeek = new Date(this.currentDate);
            const dayOfWeek = startOfWeek.getDay();
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                weekDays.push(day.toISOString().split("T")[0]);
            }
            return weekDays;
        },
        loadScheduleAndTasks() {
            console.log("cronograma.js: Loading schedule and tasks for the grid");
            document.querySelectorAll(".schedule-table .event").forEach(eventEl => eventEl.remove());
            const weekDaysISO = this.getWeekDays();

            // CRONOGRAMA GRID NOW ONLY DISPLAYS TASKS FROM studyTasks
            // Eventos from studySchedule are displayed on inicio.html

            // Carregar tarefas (studyTasks)
            try {
                const studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};
                Object.values(studyTasksData).flat().forEach(task => {
                    if (task.due && weekDaysISO.includes(task.due)) {
                        const taskDisplayData = {
                            id: task.id,
                            subject: task.title, // Use task's title as the display subject
                            type: "task",        // For styling or specific logic in addEventToCalendar
                            itemType: "tarefa",  // Actual type of the item
                            date: task.due,
                            day: new Date(task.due + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short" }).toLowerCase().substring(0,3),
                            time: task.time || "-", 
                            endTime: task.endTime || "-",
                            done: task.done
                        };
                        this.addEventToCalendar(taskDisplayData, true); // true because it's a task
                    }
                });
            } catch (e) {
                console.error("Erro ao carregar tarefas para o cronograma:", e);
            }
        },
        addEventToCalendar(eventData, isTask) { // eventData is taskDisplayData for tasks
            const dayAbbrev = eventData.day.substring(0,3);
            let targetCell = null;

            if (isTask && eventData.time && eventData.time !== "-") {
                const eventStartTime = eventData.time.substring(0,5); // HH:MM format

                const dayCellsWithTime = Array.from(
                    document.querySelectorAll(`.cell[data-day="${dayAbbrev}"][data-time]`)
                ).sort((a, b) => (a.dataset.time || "").localeCompare(b.dataset.time || ""));

                if (dayCellsWithTime.length > 0) {
                    for (let i = dayCellsWithTime.length - 1; i >= 0; i--) {
                        const cell = dayCellsWithTime[i];
                        const cellStartTime = cell.dataset.time;
                        if (eventStartTime >= cellStartTime) {
                            targetCell = cell;
                            break;
                        }
                    }
                    if (!targetCell) {
                        targetCell = dayCellsWithTime[0]; // Fallback to the first slot if event is earlier
                    }
                }
            }

            if (!targetCell) {
                const dayCells = document.querySelectorAll(`.cell[data-day="${dayAbbrev}"][data-time]`);
                if (dayCells.length > 0) {
                    targetCell = dayCells[0];
                } else {
                    const anyDayCell = document.querySelector(`.cell[data-day="${dayAbbrev}"]`);
                    if (anyDayCell) targetCell = anyDayCell;
                }
            }

            if (targetCell) {
                const existingElement = targetCell.querySelector(`.event[data-id="${eventData.id}"]`);
                if (existingElement) {
                    existingElement.className = `event event-task ${eventData.done ? "event-done" : ""}`;
                    const toggleBtn = existingElement.querySelector("button[data-action=\"toggle-done\"] i");
                    if (toggleBtn) {
                        toggleBtn.className = `fas fa-${eventData.done ? 'undo' : 'check'}`;
                    }
                    return; 
                }

                const eventElement = document.createElement("div");
                eventElement.className = `event event-task ${eventData.done ? "event-done" : ""}`;
                eventElement.dataset.id = eventData.id;
                eventElement.dataset.itemType = eventData.itemType; 
                eventElement.dataset.date = eventData.date;
                eventElement.dataset.time = eventData.time;

                let eventTimeDisplay = "";
                if (eventData.time && eventData.time !== "-" && eventData.endTime && eventData.endTime !== "-") {
                    eventTimeDisplay = `<span class="event-time">${eventData.time.substring(0,5)}-${eventData.endTime.substring(0,5)}</span>`;
                } else if (eventData.time && eventData.time !== "-") {
                    eventTimeDisplay = `<span class="event-time">${eventData.time.substring(0,5)}</span>`;
                }

                const actionsHtml = `
                    <div class="event-actions">
                        <button class="event-action-btn" data-action="delete" title="Excluir Tarefa">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button class="event-action-btn" data-action="toggle-done" title="${eventData.done ? 'Marcar como pendente' : 'Marcar como concluída'}">
                            <i class="fas fa-${eventData.done ? 'undo' : 'check'}"></i>
                        </button>
                    </div>
                `;

                eventElement.innerHTML = `
                    <span class="event-title">[T] ${eventData.subject}</span>
                    ${eventTimeDisplay}
                    ${actionsHtml}
                `;
                
                eventElement.querySelectorAll('.event-action-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = btn.dataset.action;
                        if (action === 'delete') {
                            this.confirmDeleteEvent(eventData.id, true, eventData.subject); // isTask is true
                        } else if (action === 'toggle-done') {
                            this.toggleTaskDone(eventData.id); // No longer needs category/subject here
                        }
                    });
                });

                targetCell.appendChild(eventElement);
            } else {
                console.warn("Célula não encontrada para a tarefa no cronograma:", eventData, `dayAbbrev: ${dayAbbrev}`);
            }
        },
        confirmDeleteEvent(eventId, isTask, taskSubject) {
            const modal = document.getElementById('confirmModal');
            const title = document.getElementById('confirmModalTitle');
            const message = document.getElementById('confirmModalMessage');
            const confirmBtn = document.getElementById('confirmModalConfirm');
            const cancelBtn = document.getElementById('confirmModalCancel');
            
            title.textContent = isTask ? 'Excluir Tarefa do Cronograma' : 'Excluir Evento';
            message.textContent = isTask 
                ? 'Tem certeza que deseja excluir esta tarefa do cronograma e da lista de tarefas?' 
                : 'Tem certeza que deseja excluir este evento?';
            
            modal.style.display = 'block';
            
            const cleanUp = () => {
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
                modal.style.display = 'none';
            };
            
            confirmBtn.onclick = () => {
                if (isTask) {
                    this.deleteTask(eventId, taskSubject);
                } else {
                    this.deleteEvent(eventId);
                }
                cleanUp();
            };
            
            cancelBtn.onclick = cleanUp;
        },
        deleteEvent(eventId) { // For non-task events from studySchedule
            try {
                let savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                savedSchedule = savedSchedule.filter(e => e.id !== eventId);
                localStorage.setItem("studySchedule", JSON.stringify(savedSchedule));
                this.loadScheduleAndTasks(); // Reload to reflect change
            } catch (e) {
                console.error("Erro ao excluir evento do cronograma:", e);
            }
        },
        deleteTask(taskId, taskSubjectName) { // For tasks from studyTasks, taskSubjectName is the original category
            try {
                let currentTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                let taskFoundAndRemoved = false;
                for (const category in currentTasks) {
                    const originalLength = currentTasks[category].length;
                    currentTasks[category] = currentTasks[category].filter(t => t.id !== taskId);
                    if (currentTasks[category].length < originalLength) {
                        taskFoundAndRemoved = true;
                        if (currentTasks[category].length === 0) {
                            delete currentTasks[category];
                        }
                        break; // Assume task ID is unique across categories
                    }
                }
                if (taskFoundAndRemoved){
                    localStorage.setItem("studyTasks", JSON.stringify(currentTasks));
                    // loadScheduleAndTasks will be called by the storage event listener or if on same page, called directly
                    // To ensure immediate update if on the same page:
                    this.loadScheduleAndTasks(); 
                } else {
                    console.warn("Tarefa não encontrada para exclusão no cronograma:", taskId);
                }
            } catch (e) {
                console.error("Erro ao excluir tarefa via cronograma:", e);
            }
        },
        toggleTaskDone(taskId, taskSubjectName) { // For tasks from studyTasks
            try {
                let currentTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                let taskFound = false;
                
                for (const category in currentTasks) {
                    const taskIndex = currentTasks[category].findIndex(t => t.id === taskId);
                    if (taskIndex !== -1) {
                        currentTasks[category][taskIndex].done = !currentTasks[category][taskIndex].done;
                        taskFound = true;
                        break; // Assume task ID is unique
                    }
                }
                
                if (taskFound) {
                    localStorage.setItem("studyTasks", JSON.stringify(currentTasks));
                    // loadScheduleAndTasks will be called by the storage event listener or if on same page, called directly
                    // To ensure immediate update if on the same page:
                    this.loadScheduleAndTasks(); 
                } else {
                     console.warn("Tarefa não encontrada para marcar como concluída/pendente no cronograma:", taskId);
                }
            } catch (e) {
                console.error("Erro ao alternar estado da tarefa via cronograma:", e);
            }
        },
        editEvent(eventId) {
            // This is for cronograma-specific events, not tasks from studyTasks
            console.log("Editar evento do cronograma (não tarefa):", eventId);
            // Logic to open modal with eventId details and save changes to 'studySchedule'
            // For example, find the event in localStorage.studySchedule, populate modal, save on submit
            const savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
            const eventToEdit = savedSchedule.find(e => e.id === eventId);
            if (eventToEdit && eventModal.elements.modal) {
                eventModal.open(eventToEdit); // Pass event data to modal open function
            } else {
                console.warn("Evento não encontrado para edição ou modal não disponível");
            }
        }
    };

    const eventModal = {
        elements: {
            modal: document.getElementById("eventModal"),
            openBtn: document.getElementById("addEvent"),
            closeBtn: document.querySelector("#eventModal .close-modal"),
            form: document.getElementById("eventForm"),
            itemCreationType: document.getElementById("itemCreationType"), // Novo
            eventTitle: document.getElementById("eventTitle"), // Renomeado de eventSubject
            cronEventCategoryGroup: document.getElementById("cronEventCategoryGroup"), // Novo
            cronEventCategory: document.getElementById("cronEventCategory"), // Novo
            taskSubjectCronGroup: document.getElementById("taskSubjectCronGroup"), // Novo
            taskSubjectCron: document.getElementById("taskSubjectCron"), // Novo
            eventDay: document.getElementById("eventDay"),
            eventTime: document.getElementById("eventTime"),
            eventDuration: document.getElementById("eventDuration"),
            eventNotes: document.getElementById("eventNotes"),
            eventIdField: document.getElementById("eventId") // Hidden field for editing (usado para id de evento)
        },
        currentEditId: null, // To store ID of event being edited (apenas para studySchedule)
        init() {
            if (this.elements.openBtn) this.elements.openBtn.addEventListener("click", () => this.open());
            if (this.elements.closeBtn) this.elements.closeBtn.addEventListener("click", () => this.close());
            if (this.elements.form) this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
            window.addEventListener("click", (e) => {
                if (e.target === this.elements.modal) this.close();
            });

            // Novo: Listener para alternar campos do formulário
            if (this.elements.itemCreationType) {
                this.elements.itemCreationType.addEventListener("change", (e) => {
                    this.toggleFormFields(e.target.value);
                });
            }
            // Inicializa a visibilidade dos campos
            this.toggleFormFields(this.elements.itemCreationType ? this.elements.itemCreationType.value : "evento");
        },
        toggleFormFields(selectedType) {
            if (selectedType === "evento") {
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.remove("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.add("hidden");
                if (this.elements.eventDuration) this.elements.eventDuration.parentElement.classList.remove("hidden"); // Duração é para eventos
            } else if (selectedType === "tarefa") {
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.add("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.remove("hidden");
                // Para tarefas, a duração pode não ser estritamente necessária ou pode ser opcional
                // Por ora, vamos manter o campo de duração visível, mas pode ser ajustado conforme a necessidade
                if (this.elements.eventDuration) this.elements.eventDuration.parentElement.classList.remove("hidden"); 
            }
        },
        open(eventData = null) { // eventData is for editing an existing event from studySchedule
            if (this.elements.form) this.elements.form.reset();
            this.currentEditId = null;
            if(this.elements.eventIdField) this.elements.eventIdField.value = "";

            // Default to "evento" and show relevant fields when opening for a new item
            if(this.elements.itemCreationType) {
                this.elements.itemCreationType.value = "evento"; 
                this.elements.itemCreationType.disabled = false; // Ensure type can be changed for new items
            }
            this.toggleFormFields("evento"); // Show event fields by default

            if (eventData && eventData.itemType === "evento") { // Check if editing an existing EVENT from studySchedule
                this.currentEditId = eventData.id; // Only set for events from studySchedule being edited
                if(this.elements.eventIdField) this.elements.eventIdField.value = eventData.id;
                
                if(this.elements.itemCreationType) {
                    this.elements.itemCreationType.value = "evento";
                    this.elements.itemCreationType.disabled = true; // Disable type change when editing an existing event
                }
                this.toggleFormFields("evento"); // Ensure event fields are shown

                if(this.elements.eventTitle) this.elements.eventTitle.value = eventData.title || (eventData.subject || ""); // Use title, fallback to subject
                if(this.elements.cronEventCategory) this.elements.cronEventCategory.value = eventData.type || "pessoal"; // 'type' in studySchedule is category for event
                if(this.elements.eventDay) this.elements.eventDay.value = eventData.day || "mon";
                if(this.elements.eventTime) this.elements.eventTime.value = eventData.time || "";
                if(this.elements.eventDuration) this.elements.eventDuration.value = eventData.duration || "60";
                if(this.elements.eventNotes) this.elements.eventNotes.value = eventData.notes || "";
            } else { 
                 // This branch is for opening the modal for a NEW item (task or event)
                 // The itemCreationType is already defaulted to "evento" and enabled.
                 // toggleFormFields has already been called to show "evento" fields.
                 // No specific population needed here as it's a new item.
            }
            if (this.elements.modal) this.elements.modal.style.display = "block";
        },
        close() {
            if (this.elements.modal) this.elements.modal.style.display = "none";
            if (this.elements.form) this.elements.form.reset();
            this.currentEditId = null;
            if(this.elements.eventIdField) this.elements.eventIdField.value = "";
        },
        handleSubmit(e) {
            e.preventDefault();

            const creationType = this.elements.itemCreationType.value;
            const title = this.elements.eventTitle.value.trim();
            const dayAbbrev = this.elements.eventDay.value;
            const time = this.elements.eventTime.value;
            const duration = parseInt(this.elements.eventDuration.value);
            const notes = this.elements.eventNotes.value.trim();

            if (!title) {
                alert("O título é obrigatório.");
                return;
            }
            if (!time) {
                alert("O horário é obrigatório.");
                return;
            }
            if (isNaN(duration) || duration <= 0) {
                alert("A duração deve ser um número positivo.");
                return;
            }

            const weekDays = weekNav.getWeekDays(); // weekNav is in the outer scope
            const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 }; // Assuming Sunday is 0
            let itemDateISO = null;
            for (const dateStr of weekDays) {
                const d = new Date(dateStr + "T00:00:00Z"); // Use UTC for date part consistency
                if (d.getUTCDay() === dayMap[dayAbbrev]) {
                    itemDateISO = dateStr;
                    break;
                }
            }

            if (!itemDateISO) {
                alert("Não foi possível determinar a data para o item. Verifique a semana selecionada.");
                return;
            }

            const startTimeObj = new Date(`${itemDateISO}T${time}:00`);
            const endTimeObj = new Date(startTimeObj.getTime() + duration * 60000);
            const endTimeString = endTimeObj.toTimeString().substring(0, 5);

            if (creationType === "evento") {
                const eventCategory = this.elements.cronEventCategory.value;
                const eventId = this.currentEditId || `event-${Date.now()}`; // Use currentEditId if editing an event

                const eventData = {
                    id: eventId,
                    title: title,
                    type: eventCategory, // Category of the event (e.g., "aula", "palestra")
                    itemType: "evento", // Explicitly mark as an event
                    day: dayAbbrev,      // Day abbreviation (mon, tue, etc.)
                    date: itemDateISO,    // YYYY-MM-DD
                    time: time,          // HH:MM
                    endTime: endTimeString,  // HH:MM
                    duration: duration,    // in minutes
                    notes: notes,
                };

                try {
                    let savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                    if (this.currentEditId) { // Editing existing event
                        savedSchedule = savedSchedule.map(ev => ev.id === this.currentEditId ? eventData : ev);
                    } else {
                        savedSchedule.push(eventData);
                    }
                    localStorage.setItem("studySchedule", JSON.stringify(savedSchedule));
                    console.log("Evento salvo:", eventData);
                    // Eventos são para a tela de início, não para o grid do cronograma.
                    // Disparar evento para notificar outras partes da aplicação (ex: tela de início)
                    window.dispatchEvent(new CustomEvent('studyItemsChanged', { detail: { storageKey: 'studySchedule' } }));
                } catch (er) {
                    console.error("Erro ao salvar evento no localStorage:", er);
                    alert("Ocorreu um erro ao salvar o evento.");
                }

            } else if (creationType === "tarefa") {
                const taskSubjectValue = this.elements.taskSubjectCron.value;
                const taskCategoryName = getTaskSubjectNameForCron(taskSubjectValue); // Helper function defined at the top
                const taskId = `task-cron-${Date.now()}`;

                const newTaskData = {
                    id: taskId,
                    title: title,
                    itemType: "tarefa", // Explicitly mark as a task
                    due: itemDateISO,    // YYYY-MM-DD
                    time: time,          // HH:MM
                    endTime: endTimeString,  // HH:MM
                    description: notes,
                    priority: "medium",  // Default priority
                    done: false,
                    // A categoria (taskCategoryName) é a chave no objeto studyTasks, não um campo da tarefa em si.
                };

                try {
                    let studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};
                    if (!studyTasksData[taskCategoryName]) {
                        studyTasksData[taskCategoryName] = [];
                    }
                    studyTasksData[taskCategoryName].push(newTaskData);
                    localStorage.setItem("studyTasks", JSON.stringify(studyTasksData));
                    console.log("Tarefa salva:", newTaskData, "na categoria:", taskCategoryName);
                    // Disparar evento para notificar outras partes da aplicação (ex: tela de tarefas, tela de início)
                    window.dispatchEvent(new CustomEvent('studyItemsChanged', { detail: { storageKey: 'studyTasks' } }));
                } catch (er) {
                    console.error("Erro ao salvar tarefa no localStorage:", er);
                    alert("Ocorreu um erro ao salvar a tarefa.");
                }
            }

            weekNav.loadScheduleAndTasks(); // Recarrega o grid do cronograma (que agora só deve mostrar tarefas)
            this.close();
        }
    };

    const printBtn = document.getElementById("printSchedule");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        window.print();
      });
    }

    // Initialize components
    weekNav.init();
    eventModal.init();

    // Event listener for storage changes from other tabs/windows
    window.addEventListener('storage', function(event) {
        if (event.key === 'studyTasks') {
            console.log("Storage event detected in cronograma.js for studyTasks, reloading schedule."); // Debug
            if (weekNav && typeof weekNav.loadScheduleAndTasks === 'function') {
                weekNav.loadScheduleAndTasks(); // Reload tasks on the schedule
            }
        }
        // Optionally, listen for 'studySchedule' if cronograma events can be modified elsewhere
        // and need to reflect here without page reload.
    });
});

