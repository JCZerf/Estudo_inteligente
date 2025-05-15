// cronograma.js
document.addEventListener("DOMContentLoaded", function () {
    const weekNav = {
        currentDate: new Date(),
        elements: {
            prevBtn: document.getElementById("prevWeek"),
            nextBtn: document.getElementById("nextWeek"),
            weekDisplay: document.getElementById("currentWeek"),
        },
        init() {
            this.updateWeekDisplay();
            if (this.elements.prevBtn) this.elements.prevBtn.addEventListener("click", () => this.changeWeek(-1));
            if (this.elements.nextBtn) this.elements.nextBtn.addEventListener("click", () => this.changeWeek(1));
            this.loadScheduleAndTasks(); // Initial load
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
            console.log("cronograma.js: Loading schedule and tasks"); // Debug
            document.querySelectorAll(".schedule-table .event").forEach(eventEl => eventEl.remove());
            const weekDaysISO = this.getWeekDays();

            // Carregar eventos do cronograma (studySchedule)
            try {
                const savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                savedSchedule.forEach(event => {
                    if (event.date && weekDaysISO.includes(event.date)) {
                        this.addEventToCalendar(event, false);
                    }
                });
            } catch (e) {
                console.error("Erro ao carregar eventos do cronograma:", e);
            }

            // Carregar tarefas (studyTasks)
            try {
                const studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};
                Object.values(studyTasksData).flat().forEach(task => {
                    // Display task if it has a due date within the current week
                    if (task.due && weekDaysISO.includes(task.due)) { 
                        const taskAsEvent = {
                            id: task.id, // Use original task.id for consistency
                            subject: task.title,
                            type: "task",
                            date: task.due,
                            day: new Date(task.due + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toLowerCase().substring(0,3),
                            time: task.time || "-", // Assuming tasks might have a specific time
                            endTime: task.endTime || "-", // Assuming tasks might have an end time
                            done: task.done // Reflect completion status
                        };
                        this.addEventToCalendar(taskAsEvent, true);
                    }
                });
            } catch (e) {
                console.error("Erro ao carregar tarefas para o cronograma:", e);
            }
        },
        addEventToCalendar(event, isTask) {
            const dayAbbrev = event.day.substring(0,3);
            let cellSelector = `.cell[data-day="${dayAbbrev}"]`;
            
            // If event has a specific time, try to place it in that time slot
            // Otherwise, place it in the first available general slot for the day
            if (event.time && event.time !== "-") {
                cellSelector += `[data-time="${event.time.substring(0,5)}"]`;
            } else {
                // Fallback for tasks without specific time: find the day column header or first cell
                cellSelector += `[data-time]`; // General time slot or find first available
            }

            let cell = document.querySelector(cellSelector);
            
            // If specific time slot not found, or task has no time, find the general day column to append
            if (!cell) {
                const dayCells = document.querySelectorAll(`.cell[data-day="${dayAbbrev}"]`);
                if (dayCells.length > 0) cell = dayCells[0]; // Append to the first cell of the day as a fallback
            }

            if (cell) {
                // Prevent adding duplicate task elements if re-rendering
                const existingElement = cell.querySelector(`.event[data-id="${event.id}"]`);
                if (existingElement) {
                    // Update existing element if needed (e.g., done status)
                    existingElement.className = `event ${isTask ? "event-task" : "event-schedule"} ${event.done ? "event-done" : ""}`;
                    const toggleBtn = existingElement.querySelector("button[data-action=\"toggle-done\"] i");
                    if (toggleBtn) {
                        toggleBtn.className = `fas fa-${event.done ? 'undo' : 'check'}`;
                    }
                    return; // Don't add a new one
                }

                const eventElement = document.createElement("div");
                eventElement.className = `event ${isTask ? "event-task" : "event-schedule"}`;
                if (event.done) eventElement.classList.add("event-done");
                eventElement.dataset.id = event.id;
                eventElement.dataset.subject = event.subject; // Store original subject for tasks
                eventElement.dataset.type = event.type;
                
                let eventTimeDisplay = "";
                if (event.time && event.time !== "-" && event.endTime && event.endTime !== "-") {
                    eventTimeDisplay = `<span class="event-time">${event.time.substring(0,5)}-${event.endTime.substring(0,5)}</span>`;
                }

                const actionsHtml = `
                    <div class="event-actions">
                        <button class="event-action-btn" data-action="delete" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        ${isTask ? `
                        <button class="event-action-btn" data-action="toggle-done" title="${event.done ? 'Marcar como pendente' : 'Marcar como concluída'}">
                            <i class="fas fa-${event.done ? 'undo' : 'check'} "></i>
                        </button>` : ''}
                    </div>
                `;

                eventElement.innerHTML = `
                    <span class="event-title">${isTask ? "[T] " : ""}${event.subject}</span>
                    ${eventTimeDisplay}
                    ${actionsHtml}
                `;
                
                eventElement.querySelectorAll('.event-action-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = btn.dataset.action;
                        if (action === 'delete') {
                            this.confirmDeleteEvent(event.id, isTask, event.subject); // Pass subject for tasks
                        } else if (action === 'toggle-done') {
                            this.toggleTaskDone(event.id, event.subject); // Pass subject for tasks
                        }
                    });
                });

                if (!isTask) { // Only allow editing for non-task events from cronograma
                    eventElement.addEventListener("click", () => this.editEvent(event.id));
                }

                cell.appendChild(eventElement);
            } else {
                console.warn("Célula não encontrada para o evento:", event, cellSelector);
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
            eventSubject: document.getElementById("eventSubject"),
            eventType: document.getElementById("eventType"),
            eventDay: document.getElementById("eventDay"),
            eventTime: document.getElementById("eventTime"),
            eventDuration: document.getElementById("eventDuration"),
            eventNotes: document.getElementById("eventNotes"), // Added
            eventIdField: document.getElementById("eventId") // Hidden field for editing
        },
        currentEditId: null, // To store ID of event being edited
        init() {
            if (this.elements.openBtn) this.elements.openBtn.addEventListener("click", () => this.open()); // Open for new event
            if (this.elements.closeBtn) this.elements.closeBtn.addEventListener("click", () => this.close());
            if (this.elements.form) this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
            window.addEventListener("click", (e) => {
                if (e.target === this.elements.modal) this.close();
            });
        },
        open(eventData = null) { // eventData is for editing
            if (this.elements.form) this.elements.form.reset();
            this.currentEditId = null;
            if (eventData) { // Populate form for editing
                this.currentEditId = eventData.id;
                if(this.elements.eventIdField) this.elements.eventIdField.value = eventData.id;
                if(this.elements.eventSubject) this.elements.eventSubject.value = eventData.subject;
                if(this.elements.eventType) this.elements.eventType.value = eventData.type;
                if(this.elements.eventDay) this.elements.eventDay.value = eventData.day;
                if(this.elements.eventTime) this.elements.eventTime.value = eventData.time;
                if(this.elements.eventDuration) this.elements.eventDuration.value = eventData.duration;
                if(this.elements.eventNotes) this.elements.eventNotes.value = eventData.notes || "";
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
            const subject = this.elements.eventSubject.value;
            const type = this.elements.eventType.value;
            const dayAbbrev = this.elements.eventDay.value;
            const time = this.elements.eventTime.value;
            const duration = parseInt(this.elements.eventDuration.value);
            const notes = this.elements.eventNotes.value;
            const eventId = this.currentEditId || `event-${Date.now()}`;

            const weekDays = weekNav.getWeekDays();
            const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
            let eventDateISO = null;
            for (const dateStr of weekDays) {
                const d = new Date(dateStr + "T00:00:00"); // Ensure correct date parsing
                if (d.getDay() === dayMap[dayAbbrev]) {
                    eventDateISO = dateStr;
                    break;
                }
            }

            if (!eventDateISO) {
                alert("Não foi possível determinar a data para o evento.");
                return;
            }

            const eventData = {
                id: eventId,
                subject: subject,
                type: type,
                day: dayAbbrev, 
                time: time,
                duration: duration,
                date: eventDateISO,
                notes: notes
            };

            const [hours, minutes] = time.split(":").map(Number);
            const endTimeObj = new Date(eventDateISO + "T" + time);
            endTimeObj.setMinutes(endTimeObj.getMinutes() + duration);
            eventData.endTime = endTimeObj.toTimeString().substring(0, 5);

            try {
                let savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                if (this.currentEditId) { // Editing existing event
                    savedSchedule = savedSchedule.map(ev => ev.id === this.currentEditId ? eventData : ev);
                } else { // Adding new event
                    savedSchedule.push(eventData);
                }
                localStorage.setItem("studySchedule", JSON.stringify(savedSchedule));
            } catch (er) {
                console.error("Erro ao salvar evento do cronograma:", er);
            }

            // If the event type is 'study', create/update a corresponding task in studyTasks
            if (type === "study") {
                try {
                    let studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};
                    const taskCategory = "Estudos Agendados"; // Or derive from subject
                    if (!studyTasksData[taskCategory]) {
                        studyTasksData[taskCategory] = [];
                    }
                    
                    // Check if a task linked to this cronograma event already exists
                    // We need a way to link cronograma event ID to task ID if editing
                    // For simplicity, new cronograma 'study' events create new tasks.
                    // If editing a cronograma event that was a 'study' event, it should update the linked task.
                    // This part needs a more robust linking mechanism if tasks are to be edited via cronograma events.
                    // For now, we'll focus on creation and ensuring sync for deletion/completion.

                    // For new 'study' events from cronograma, add to studyTasks
                    if (!this.currentEditId) { // Only add as new task if it's a new cronograma event
                        const newTaskId = `task-cron-${Date.now()}`;
                        studyTasksData[taskCategory].push({
                            id: newTaskId, // Ensure unique ID
                            title: `Estudar: ${subject} (do cronograma)`,
                            due: eventDateISO,
                            done: false,
                            priority: "medium", // Default priority
                            description: `Agendado via cronograma para ${time} - ${eventData.endTime}. Observações: ${notes || "Nenhuma"}`,
                            time: time,
                            endTime: eventData.endTime,
                            // linkToCronEventId: eventId // Optional: to link back
                        });
                        localStorage.setItem("studyTasks", JSON.stringify(studyTasksData));
                    }
                    // If editing a 'study' event, the corresponding task in 'studyTasks' should ideally be updated.
                    // This requires a stable link between the cronograma event and the task.
                    // For now, the user request was primarily about tasks added/deleted in Tarefas reflecting in Cronograma
                    // and vice-versa for basic operations.

                } catch (er) {
                    console.error("Erro ao criar/atualizar tarefa a partir do cronograma:", er);
                }
            }
            weekNav.loadScheduleAndTasks(); // Reload to show changes
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

