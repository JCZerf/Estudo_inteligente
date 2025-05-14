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
            this.loadScheduleAndTasks();
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

            // Carregar eventos do cronograma
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

            // Carregar tarefas
            try {
                const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                Object.values(studyTasks).flat().forEach(task => {
                    if (task.due && weekDaysISO.includes(task.due) && !task.done) {
                        const taskAsEvent = {
                            id: `task-${task.id}`,
                            subject: task.title,
                            type: "task",
                            date: task.due,
                            day: new Date(task.due + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toLowerCase().substring(0,3),
                            time: task.time || "-",
                            endTime: task.endTime || "-",
                            done: task.done
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
            
            if (event.time && event.time !== "-") {
                cellSelector += `[data-time="${event.time.substring(0,5)}"]`;
            } else {
                cellSelector += `[data-time]`;
            }

            let cell = document.querySelector(cellSelector);
            
            if (!cell) {
                const dayCells = document.querySelectorAll(`.cell[data-day="${dayAbbrev}"]`);
                if (dayCells.length > 0) cell = dayCells[0];
            }

            if (cell) {
                const existingEvents = cell.querySelectorAll('.event');
                if (existingEvents.length > 0 && !isTask) {
                    console.warn('Já existe um evento neste horário');
                    return;
                }

                const eventElement = document.createElement("div");
                eventElement.className = `event ${isTask ? "event-task" : "event-schedule"}`;
                if (event.done) eventElement.classList.add("event-done");
                eventElement.dataset.id = event.id;
                eventElement.dataset.subject = event.subject;
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
                            <i class="fas fa-${event.done ? 'undo' : 'check'}"></i>
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
                            this.confirmDeleteEvent(event.id, isTask);
                        } else if (action === 'toggle-done') {
                            this.toggleTaskDone(event.id);
                        }
                    });
                });

                if (!isTask) {
                    eventElement.addEventListener("click", () => this.editEvent(event.id));
                }

                cell.appendChild(eventElement);
            }
        },
        confirmDeleteEvent(eventId, isTask) {
            const modal = document.getElementById('confirmModal');
            const title = document.getElementById('confirmModalTitle');
            const message = document.getElementById('confirmModalMessage');
            const confirmBtn = document.getElementById('confirmModalConfirm');
            const cancelBtn = document.getElementById('confirmModalCancel');
            
            title.textContent = isTask ? 'Excluir Tarefa' : 'Excluir Evento';
            message.textContent = isTask 
                ? 'Tem certeza que deseja excluir esta tarefa?' 
                : 'Tem certeza que deseja excluir este evento?';
            
            modal.style.display = 'block';
            
            const cleanUp = () => {
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
                modal.style.display = 'none';
            };
            
            confirmBtn.onclick = () => {
                if (isTask) {
                    this.deleteTask(eventId);
                } else {
                    this.deleteEvent(eventId);
                }
                cleanUp();
            };
            
            cancelBtn.onclick = cleanUp;
        },
        deleteEvent(eventId) {
            try {
                let savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                savedSchedule = savedSchedule.filter(e => e.id !== eventId);
                localStorage.setItem("studySchedule", JSON.stringify(savedSchedule));
                this.loadScheduleAndTasks();
            } catch (e) {
                console.error("Erro ao excluir evento:", e);
            }
        },
        deleteTask(taskId) {
            try {
                let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                for (const category in studyTasks) {
                    studyTasks[category] = studyTasks[category].filter(t => t.id !== taskId.replace('task-', ''));
                }
                localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
                this.loadScheduleAndTasks();
            } catch (e) {
                console.error("Erro ao excluir tarefa:", e);
            }
        },
        toggleTaskDone(taskId) {
            try {
                let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                let taskFound = false;
                
                for (const category in studyTasks) {
                    studyTasks[category] = studyTasks[category].map(t => {
                        if (t.id === taskId.replace('task-', '')) {
                            taskFound = true;
                            return { ...t, done: !t.done };
                        }
                        return t;
                    });
                }
                
                if (taskFound) {
                    localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
                    this.loadScheduleAndTasks();
                }
            } catch (e) {
                console.error("Erro ao alternar estado da tarefa:", e);
            }
        },
        editEvent(eventId) {
            console.log("Editar evento do cronograma:", eventId);
            // Implementar edição de eventos do cronograma (não tarefas)
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
        },
        init() {
            if (this.elements.openBtn) this.elements.openBtn.addEventListener("click", () => this.open());
            if (this.elements.closeBtn) this.elements.closeBtn.addEventListener("click", () => this.close());
            if (this.elements.form) this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
            window.addEventListener("click", (e) => {
                if (e.target === this.elements.modal) this.close();
            });
        },
        open() {
            if (this.elements.modal) this.elements.modal.style.display = "block";
        },
        close() {
            if (this.elements.modal) this.elements.modal.style.display = "none";
            if (this.elements.form) this.elements.form.reset();
        },
        handleSubmit(e) {
            e.preventDefault();
            const subject = this.elements.eventSubject.value;
            const type = this.elements.eventType.value;
            const dayAbbrev = this.elements.eventDay.value;
            const time = this.elements.eventTime.value;
            const duration = parseInt(this.elements.eventDuration.value);

            const weekDays = weekNav.getWeekDays();
            const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
            let eventDateISO = null;
            for (const dateStr of weekDays) {
                const d = new Date(dateStr + "T00:00:00");
                if (d.getDay() === dayMap[dayAbbrev]) {
                    eventDateISO = dateStr;
                    break;
                }
            }

            if (!eventDateISO) {
                alert("Não foi possível determinar a data para o evento.");
                return;
            }

            const newEvent = {
                id: `event-${Date.now()}`,
                subject: subject,
                type: type,
                day: dayAbbrev, 
                time: time,
                duration: duration,
                date: eventDateISO,
                notes: document.getElementById("eventNotes").value
            };

            const [hours, minutes] = time.split(":").map(Number);
            const endTime = new Date(eventDateISO + "T" + time);
            endTime.setMinutes(endTime.getMinutes() + duration);
            newEvent.endTime = endTime.toTimeString().substring(0, 5);

            try {
                let savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                savedSchedule.push(newEvent);
                localStorage.setItem("studySchedule", JSON.stringify(savedSchedule));
            } catch (er) {
                console.error("Erro ao salvar evento do cronograma:", er);
            }

            if (type === "study") {
                try {
                    let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                    const taskSubject = "Estudos Agendados";
                    if (!studyTasks[taskSubject]) {
                        studyTasks[taskSubject] = [];
                    }
                    const newTaskId = `task-cron-${Date.now()}`;
                    studyTasks[taskSubject].push({
                        id: newTaskId,
                        title: `Estudar: ${subject} (do cronograma)`, 
                        due: eventDateISO,
                        done: false,
                        priority: "medium",
                        description: `Agendado via cronograma para ${time} - ${newEvent.endTime}. Observações: ${newEvent.notes || "Nenhuma"}`,
                        time: time,
                        endTime: newEvent.endTime
                    });
                    localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
                } catch (er) {
                    console.error("Erro ao criar tarefa a partir do cronograma:", er);
                }
            }
            weekNav.loadScheduleAndTasks();
            this.close();
        }
    };

    const printBtn = document.getElementById("printSchedule");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        window.print();
      });
    }

    weekNav.init();
    eventModal.init();
});
