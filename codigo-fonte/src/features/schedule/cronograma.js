// cronograma.js

// Helper function to get task subject display name from select value
function getTaskSubjectNameForCron(value) {
    const selectElement = document.getElementById("taskSubjectCron");
    if (selectElement) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === value) {
                return selectElement.options[i].text;
            }
        }
    }
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

function mapTaskCategoryDisplayNameToSelectValue(displayName, selectElement) {
    if (selectElement) {
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].text === displayName) {
                return selectElement.options[i].value;
            }
        }
        const otherOption = Array.from(selectElement.options).find(opt => opt.value === "other_task_cron");
        if (otherOption) return otherOption.value;
    }
    return "geral_cronograma";
}


document.addEventListener("DOMContentLoaded", function () {
    const weekNav = {
        currentDate: new Date(),
        elements: {
            prevBtn: document.getElementById("prevWeek"),
            nextBtn: document.getElementById("nextWeek"),
            weekDisplay: document.getElementById("currentWeek"),
            scheduleTable: document.querySelector(".schedule-table")
        },
        init() {
            this.generateScheduleGrid();
            this.updateWeekDisplay();
            if (this.elements.prevBtn) this.elements.prevBtn.addEventListener("click", () => this.changeWeek(-1));
            if (this.elements.nextBtn) this.elements.nextBtn.addEventListener("click", () => this.changeWeek(1));
            window.addEventListener("studyItemsChanged", (event) => {
                if (event.detail && (event.detail.storageKey === "studyTasks" || event.detail.storageKey === "studySchedule")) {
                    this.loadScheduleAndTasks();
                }
            });
            this.loadScheduleAndTasks(); // Load tasks first
            this.initSortableGrid(); // Then initialize sortable
        },
        generateScheduleGrid() {
            if (!this.elements.scheduleTable) return;
            const existingRows = this.elements.scheduleTable.querySelectorAll(".row:not(.header-row)");
            existingRows.forEach(row => row.remove());
            const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
            const dayClasses = { sat: "weekend", sun: "weekend" };
            for (let hour = 0; hour < 24; hour += 2) {
                const row = document.createElement("div");
                row.classList.add("row");
                const timeCell = document.createElement("div");
                timeCell.classList.add("cell", "time-cell");
                const startTime = `${String(hour).padStart(2, "0")}:00`;
                const endTimeHour = (hour + 2) % 24;
                const endTime = `${String(endTimeHour).padStart(2, "0")}:00`;
                timeCell.textContent = `${startTime} - ${endTime}`;
                row.appendChild(timeCell);
                days.forEach(day => {
                    const dayCell = document.createElement("div");
                    dayCell.classList.add("cell", "schedule-cell"); // Added class for sortable target
                    if (dayClasses[day]) dayCell.classList.add(dayClasses[day]);
                    dayCell.dataset.day = day;
                    dayCell.dataset.time = startTime;
                    row.appendChild(dayCell);
                });
                this.elements.scheduleTable.appendChild(row);
            }
        },
        initSortableGrid() {
            const cells = document.querySelectorAll(".schedule-cell");
            cells.forEach(cell => {
                new Sortable(cell, {
                    group: "schedule-items", // Allow moving items between cells
                    animation: 150,
                    ghostClass: "sortable-ghost-event", // Custom class for ghost element
                    chosenClass: "sortable-chosen-event", // Custom class for chosen element
                    dragClass: "sortable-drag-event", // Custom class for dragging element
                    onEnd: (evt) => {
                        const itemEl = evt.item; // The dragged element (.event)
                        const toCell = evt.to;   // The target cell element
                        const fromCell = evt.from; // The source cell element

                        const itemId = itemEl.dataset.id;
                        const itemType = itemEl.dataset.itemType;
                        let fullData = JSON.parse(itemEl.dataset.fullData);

                        const newDayAbbrev = toCell.dataset.day;
                        const newTime = toCell.dataset.time; // This is the start time of the slot

                        const weekDaysMapping = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
                        const dayIndex = weekDaysMapping[newDayAbbrev];
                        const currentWeekDaysISO = this.getWeekDays();
                        const newDateISO = currentWeekDaysISO[dayIndex];

                        const confirmModal = document.getElementById("confirmModal");
                        const confirmTitle = document.getElementById("confirmModalTitle");
                        const confirmMessage = document.getElementById("confirmModalMessage");
                        const confirmBtn = document.getElementById("confirmModalConfirm");
                        const cancelBtn = document.getElementById("confirmModalCancel");

                        confirmTitle.textContent = "Confirmar Mudança";
                        const newDateFormatted = new Date(newDateISO + "T00:00:00").toLocaleDateString("pt-BR");
                        confirmMessage.innerHTML = `Mover "<strong>${fullData.title}</strong>" para <br><strong>${newDateFormatted}</strong> às <strong>${newTime}</strong>?`;

                        confirmModal.style.display = "block";

                        const handleConfirm = () => {
                            if (itemType === "tarefa") {
                                let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                                const originalCategory = fullData.originalCategoryName;
                                if (studyTasks[originalCategory]) {
                                    const taskIndex = studyTasks[originalCategory].findIndex(t => t.id === itemId);
                                    if (taskIndex !== -1) {
                                        studyTasks[originalCategory][taskIndex].due = newDateISO;
                                        studyTasks[originalCategory][taskIndex].time = newTime;
                                        // Recalculate endTime if duration exists
                                        if (studyTasks[originalCategory][taskIndex].duration) {
                                            const durationMinutes = parseInt(studyTasks[originalCategory][taskIndex].duration);
                                            const startTimeObj = new Date(`${newDateISO}T${newTime}:00`);
                                            const endTimeObj = new Date(startTimeObj.getTime() + durationMinutes * 60000);
                                            studyTasks[originalCategory][taskIndex].endTime = endTimeObj.toTimeString().substring(0, 5);
                                        }
                                        localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
                                        window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
                                    } else { console.error("Tarefa não encontrada para mover."); }
                                } else { console.error("Categoria original da tarefa não encontrada."); }
                            } else if (itemType === "evento") {
                                // Logic for moving non-task events if they are stored and handled similarly
                                console.warn("Movimentação de eventos gerais ainda não implementada.");
                            }
                            this.loadScheduleAndTasks(); // Reload to reflect changes and correct placement
                            cleanUp();
                        };

                        const handleCancel = () => {
                            // Revert the move visually by moving the item back to the original cell
                            // SortableJS might do this if the list isn't 'saved', but to be sure:
                            fromCell.insertBefore(itemEl, fromCell.children[evt.oldDraggableIndex]);
                            // If the above doesn't work perfectly due to re-rendering, a full reload is a fallback
                            // this.loadScheduleAndTasks(); // This will redraw based on localStorage
                            cleanUp();
                        };

                        const cleanUp = () => {
                            confirmBtn.removeEventListener("click", handleConfirm);
                            cancelBtn.removeEventListener("click", handleCancel);
                            confirmModal.style.display = "none";
                        };

                        confirmBtn.addEventListener("click", handleConfirm, { once: true });
                        cancelBtn.addEventListener("click", handleCancel, { once: true });
                    }
                });
            });
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
            document.querySelectorAll(".schedule-table .event").forEach(eventEl => eventEl.remove());
            const weekDaysISO = this.getWeekDays();
            try {
                const studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};
                const taskSubjectCronSelect = document.getElementById("taskSubjectCron");

                Object.entries(studyTasksData).forEach(([categoryName, tasksInCategory]) => {
                    tasksInCategory.forEach(task => {
                        if (task.due && weekDaysISO.includes(task.due)) {
                            let taskOriginalCategorySelectValue = mapTaskCategoryDisplayNameToSelectValue(categoryName, taskSubjectCronSelect);
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
                            this.addEventToCalendar(taskDisplayData, true);
                        }
                    });
                });
            } catch (e) {
                console.error("Erro ao carregar tarefas para o cronograma:", e);
            }
        },
        addEventToCalendar(eventData, isTask) {
            const dayAbbrev = eventData.day.substring(0,3);
            let targetCell = null;
            if (isTask && eventData.time && eventData.time !== "-") {
                const eventStartTime = eventData.time.substring(0,5);
                const dayCellsWithTime = Array.from(
                    document.querySelectorAll(`.cell[data-day="${dayAbbrev}"][data-time]`)
                ).sort((a, b) => (a.dataset.time || "").localeCompare(b.dataset.time || ""));
                if (dayCellsWithTime.length > 0) {
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
            if (!targetCell) {
                const dayCells = document.querySelectorAll(`.cell[data-day="${dayAbbrev}"][data-time]`);
                if (dayCells.length > 0) targetCell = dayCells[0];
                else {
                    const anyDayCell = document.querySelector(`.cell[data-day="${dayAbbrev}"]`);
                    if (anyDayCell) targetCell = anyDayCell;
                }
            }

            if (targetCell) {
                const existingElement = targetCell.querySelector(`.event[data-id="${eventData.id}"]`);
                if (existingElement) {
                    existingElement.className = `event event-task ${eventData.done ? "event-done" : ""}`;
                    existingElement.dataset.fullData = JSON.stringify(eventData); // Update fullData on re-render
                    const toggleBtn = existingElement.querySelector("button[data-action=\"toggle-done\"] i");
                    if (toggleBtn) toggleBtn.className = `fas fa-${eventData.done ? "undo" : "check"}`;
                    return; 
                }

                const eventElement = document.createElement("div");
                eventElement.className = `event event-task ${eventData.done ? "event-done" : ""}`;
                eventElement.dataset.id = eventData.id;
                eventElement.dataset.itemType = eventData.itemType;
                eventElement.dataset.date = eventData.date;
                eventElement.dataset.time = eventData.time;
                eventElement.dataset.fullData = JSON.stringify(eventData); 
                eventElement.draggable = true; // Make the event element draggable

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
                        <button class="event-action-btn" data-action="toggle-done" title="${eventData.done ? "Marcar como pendente" : "Marcar como concluída"}">
                            <i class="fas fa-${eventData.done ? "undo" : "check"}"></i>
                        </button>
                    </div>
                `;
                eventElement.innerHTML = `
                    <span class="event-title">[T] ${eventData.title}</span>
                    ${eventTimeDisplay}
                    ${actionsHtml}
                `;
                
                eventElement.addEventListener("click", (e) => {
                    if (e.target.closest(".event-action-btn")) return;
                    const fullData = JSON.parse(eventElement.dataset.fullData);
                    eventModal.open(fullData);
                });

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
                targetCell.appendChild(eventElement);
            } else {
                console.warn("Célula não encontrada para a tarefa no cronograma:", eventData, `dayAbbrev: ${dayAbbrev}`);
            }
        },
        confirmDeleteEvent(itemId, isTask, itemTitle, itemCategoryName) { 
            const modal = document.getElementById("confirmModal");
            const titleEl = document.getElementById("confirmModalTitle");
            const messageEl = document.getElementById("confirmModalMessage");
            const confirmBtn = document.getElementById("confirmModalConfirm");
            const cancelBtn = document.getElementById("confirmModalCancel");
            
            titleEl.textContent = isTask ? "Excluir Tarefa do Cronograma" : "Excluir Evento";
            messageEl.innerHTML = `Tem certeza que deseja excluir "<strong>${itemTitle}</strong>"? Esta ação não pode ser desfeita.`;
            
            modal.style.display = "block";
            const cleanUp = () => {
                confirmBtn.removeEventListener("click", handleConfirmClick); // Use named function for removal
                cancelBtn.removeEventListener("click", handleCancelClick);
                modal.style.display = "none";
            };

            const handleConfirmClick = () => {
                if (isTask) {
                    this.deleteTask(itemId, itemCategoryName);
                } 
                cleanUp();
            };
            const handleCancelClick = () => {
                cleanUp();
            };

            confirmBtn.addEventListener("click", handleConfirmClick, { once: true });
            cancelBtn.addEventListener("click", handleCancelClick, { once: true });
        },
        deleteTask(taskId, taskCategoryName) { 
            try {
                let currentTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                if (currentTasks[taskCategoryName]) {
                    const originalLength = currentTasks[taskCategoryName].length;
                    currentTasks[taskCategoryName] = currentTasks[taskCategoryName].filter(t => t.id !== taskId);
                    if (currentTasks[taskCategoryName].length < originalLength) {
                        if (currentTasks[taskCategoryName].length === 0) {
                            delete currentTasks[taskCategoryName];
                        }
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
        toggleTaskDone(taskId, taskCategoryName) { 
            try {
                let currentTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                if (currentTasks[taskCategoryName]){
                    const taskIndex = currentTasks[taskCategoryName].findIndex(t => t.id === taskId);
                    if (taskIndex !== -1) {
                        currentTasks[taskCategoryName][taskIndex].done = !currentTasks[taskCategoryName][taskIndex].done;
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

    const eventModal = {
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
        currentEditId: null, 
        currentEditItemType: null,
        currentEditOriginalCategoryName: null, 

        init() {
            if (this.elements.openBtn) this.elements.openBtn.addEventListener("click", () => this.open());
            if (this.elements.closeBtn) this.elements.closeBtn.addEventListener("click", () => this.close());
            if (this.elements.form) this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
            window.addEventListener("click", (e) => {
                if (e.target === this.elements.modal) this.close();
            });
            if (this.elements.itemCreationType) {
                this.elements.itemCreationType.addEventListener("change", (e) => {
                    this.toggleFormFields(e.target.value);
                });
            }
            this.toggleFormFields(this.elements.itemCreationType ? this.elements.itemCreationType.value : "evento");
        },
        toggleFormFields(selectedType) {
            if (selectedType === "evento") {
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.remove("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.add("hidden");
            } else if (selectedType === "tarefa") {
                if (this.elements.cronEventCategoryGroup) this.elements.cronEventCategoryGroup.classList.add("hidden");
                if (this.elements.taskSubjectCronGroup) this.elements.taskSubjectCronGroup.classList.remove("hidden");
            }
        },
        open(itemData = null) { 
            if (this.elements.form) this.elements.form.reset();
            this.currentEditId = null;
            this.currentEditItemType = null;
            this.currentEditOriginalCategoryName = null;
            if(this.elements.eventIdField) this.elements.eventIdField.value = "";
            
            if (itemData) { 
                this.currentEditId = itemData.id;
                this.currentEditItemType = itemData.itemType;
                if(this.elements.eventIdField) this.elements.eventIdField.value = itemData.id;
                if(this.elements.title) this.elements.title.textContent = itemData.itemType === "tarefa" ? "Editar Tarefa" : "Editar Evento";
                if(this.elements.saveButton) this.elements.saveButton.textContent = "Salvar Alterações";
                if(this.elements.eventTitle) this.elements.eventTitle.value = itemData.title || "";
                if(this.elements.itemCreationType) {
                    this.elements.itemCreationType.value = itemData.itemType; 
                    this.elements.itemCreationType.disabled = true; 
                }
                this.toggleFormFields(itemData.itemType);

                if (itemData.itemType === "tarefa") {
                    this.currentEditOriginalCategoryName = itemData.originalCategoryName;
                    if(this.elements.taskSubjectCron && itemData.originalCategoryKeyForSelect) { 
                        this.elements.taskSubjectCron.value = itemData.originalCategoryKeyForSelect;
                    } else if (this.elements.taskSubjectCron) {
                        // Fallback if originalCategoryKeyForSelect is missing (e.g. older data)
                        this.elements.taskSubjectCron.value = mapTaskCategoryDisplayNameToSelectValue(itemData.originalCategoryName, this.elements.taskSubjectCron);
                    }
                    if(this.elements.eventDate) this.elements.eventDate.value = itemData.date || "";
                    if(this.elements.eventTime) this.elements.eventTime.value = itemData.time && itemData.time !== "-" ? itemData.time.substring(0,5) : "";
                    if(this.elements.eventDuration) this.elements.eventDuration.value = itemData.duration || "30";
                    if(this.elements.eventNotes) this.elements.eventNotes.value = itemData.description || ""; 
                }
            } else { 
                if(this.elements.title) this.elements.title.textContent = "Adicionar Atividade";
                if(this.elements.saveButton) this.elements.saveButton.textContent = "Salvar Atividade";
                if(this.elements.itemCreationType) {
                    this.elements.itemCreationType.value = "tarefa"; // Default to task for new from cronograma
                    this.elements.itemCreationType.disabled = false;
                }
                this.toggleFormFields("tarefa");
                if (this.elements.eventDate) { 
                    this.elements.eventDate.value = new Date().toISOString().split("T")[0];
                }
                 if(this.elements.taskSubjectCron) this.elements.taskSubjectCron.value = "geral_cronograma"; // Default subject
            }
            if (this.elements.modal) this.elements.modal.style.display = "block";
        },
        close() {
            if (this.elements.modal) this.elements.modal.style.display = "none";
            if (this.elements.form) this.elements.form.reset();
            this.currentEditId = null;
            this.currentEditItemType = null;
            this.currentEditOriginalCategoryName = null;
            if(this.elements.eventIdField) this.elements.eventIdField.value = "";
            if(this.elements.itemCreationType) this.elements.itemCreationType.disabled = false;
        },
        handleSubmit(e) {
            e.preventDefault();
            const creationType = this.currentEditId ? this.currentEditItemType : this.elements.itemCreationType.value;
            const title = this.elements.eventTitle.value.trim();
            const itemDateISO = this.elements.eventDate.value; 
            const time = this.elements.eventTime.value;
            const duration = parseInt(this.elements.eventDuration.value);
            const notes = this.elements.eventNotes.value.trim();

            if (!title || !itemDateISO || !time || isNaN(duration) || duration <= 0) {
                 alert("Por favor, preencha todos os campos obrigatórios corretamente (Título, Data, Horário, Duração)."); return; 
            }
            
            const startTimeObj = new Date(`${itemDateISO}T${time}:00`);
            const endTimeObj = new Date(startTimeObj.getTime() + duration * 60000);
            const endTimeString = endTimeObj.toTimeString().substring(0, 5);

            if (creationType === "tarefa") {
                const taskSubjectValue = this.elements.taskSubjectCron.value;
                const newTaskCategoryName = getTaskSubjectNameForCron(taskSubjectValue); 
                let studyTasksData = JSON.parse(localStorage.getItem("studyTasks")) || {};

                if (this.currentEditId) { 
                    const originalCategoryName = this.currentEditOriginalCategoryName;
                    if (!originalCategoryName || !studyTasksData[originalCategoryName]) {
                        alert("Erro: Categoria original da tarefa não encontrada para edição."); return;
                    }
                    const taskIndex = studyTasksData[originalCategoryName].findIndex(t => t.id === this.currentEditId);
                    if (taskIndex === -1) {
                        alert("Erro: Tarefa não encontrada para edição."); return;
                    }
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
                        studyTasksData[originalCategoryName].splice(taskIndex, 1);
                        if (studyTasksData[originalCategoryName].length === 0) delete studyTasksData[originalCategoryName];
                        if (!studyTasksData[newTaskCategoryName]) studyTasksData[newTaskCategoryName] = [];
                        studyTasksData[newTaskCategoryName].push(updatedTaskData);
                    } else {
                        studyTasksData[originalCategoryName][taskIndex] = updatedTaskData;
                    }
                } else { 
                    const taskId = `task-cron-${Date.now()}`;
                    const taskData = {
                        id: taskId, title: title, itemType: "tarefa", due: itemDateISO, time: time, 
                        endTime: endTimeString, duration: duration, description: notes, 
                        priority: "medium", done: false, 
                    };
                    if (!studyTasksData[newTaskCategoryName]) studyTasksData[newTaskCategoryName] = [];
                    studyTasksData[newTaskCategoryName].push(taskData);
                }
                localStorage.setItem("studyTasks", JSON.stringify(studyTasksData));
                window.dispatchEvent(new CustomEvent("studyItemsChanged", { detail: { storageKey: "studyTasks" } }));
            } else if (creationType === "evento") {
                alert("Funcionalidade de adicionar/editar eventos gerais ainda em desenvolvimento a partir do cronograma.");
            }
            weekNav.loadScheduleAndTasks(); 
            this.close();
        }
    };

    const printBtn = document.getElementById("printSchedule");
    if (printBtn) printBtn.addEventListener("click", () => window.print());

    weekNav.init();
    eventModal.init();

    window.addEventListener("storage", function(event) {
        if (event.key === "studyTasks" || event.key === "studySchedule") {
            if (weekNav && typeof weekNav.loadScheduleAndTasks === "function") {
                weekNav.loadScheduleAndTasks();
            }
        }
    });
});

