// Cronograma JS
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
            this.loadScheduleAndTasks(); // Carrega tanto eventos do cronograma quanto tarefas
        },
        changeWeek(weeks) {
            this.currentDate.setDate(this.currentDate.getDate() + weeks * 7);
            this.updateWeekDisplay();
            this.loadScheduleAndTasks();
        },
        updateWeekDisplay() {
            const startOfWeek = new Date(this.currentDate);
            // Ajusta para o início da semana (Domingo = 0, Segunda = 1, etc. Queremos Segunda)
            const dayOfWeek = startOfWeek.getDay(); // 0 (Dom) a 6 (Sáb)
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Se Dom, volta 6 dias, senão, dia - getDay() + 1

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
            const weekDaysISO = this.getWeekDays(); // Array de YYYY-MM-DD para a semana atual

            // Carregar eventos do cronograma (studySchedule)
            try {
                const savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                savedSchedule.forEach(event => {
                    // Um evento do cronograma precisa ter uma data associada para ser exibido
                    // A lógica original associava ao 'day' (mon, tue) e 'time'. 
                    // Para integração, vamos assumir que 'event.date' (YYYY-MM-DD) é a chave principal.
                    if (event.date && weekDaysISO.includes(event.date)) {
                        this.addEventToCalendar(event, false);
                    }
                });
            } catch (e) {
                console.error("Erro ao carregar eventos do cronograma:", e);
            }

            // Carregar tarefas (studyTasks)
            try {
                const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                Object.values(studyTasks).flat().forEach(task => {
                    if (task.due && weekDaysISO.includes(task.due) && !task.done) {
                        // Convertendo uma tarefa para um formato de evento para exibição
                        const taskAsEvent = {
                            id: `task-${task.id}`,
                            subject: task.title,
                            type: "task", // Tipo específico para tarefas
                            date: task.due, // YYYY-MM-DD
                            // As tarefas não têm hora específica no cronograma, então colocamos em um slot genérico ou no dia todo
                            // Para simplificar, vamos apenas exibir no dia, sem hora específica, ou adaptar para um slot padrão.
                            // Aqui, vamos apenas marcar o dia.
                            // Se quisermos colocar em um slot de hora, precisaremos de mais lógica.
                            day: new Date(task.due + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toLowerCase().substring(0,3), // mon, tue...
                            time: "-", // Sem hora específica
                            endTime: "-"
                        };
                        this.addEventToCalendar(taskAsEvent, true);
                    }
                });
            } catch (e) {
                console.error("Erro ao carregar tarefas para o cronograma:", e);
            }
        },
        addEventToCalendar(event, isTask) {
            // Tenta encontrar a célula pelo dia da semana e hora. 
            // Para tarefas sem hora, pode ser necessário um tratamento diferente.
            let cellSelector;
            if (event.time && event.time !== "-") {
                 cellSelector = `.cell[data-day="${event.day.substring(0,3)}"][data-time="${event.time.substring(0,5)}"]`;
            } else {
                // Se for tarefa sem hora, tentamos colocar no primeiro slot do dia ou criar uma área geral para o dia.
                // Por ora, vamos tentar o primeiro slot de 08:00 como fallback se não houver data-time específico.
                // Ou melhor, encontrar a coluna do dia e adicionar o evento nela.
                const dayColumnCells = document.querySelectorAll(`.cell[data-day="${event.day.substring(0,3)}"]`);
                if (dayColumnCells.length > 0) {
                    // Adiciona ao primeiro slot de tempo disponível ou cria um novo se necessário.
                    // Esta parte precisa de um design mais robusto para exibir tarefas que duram o dia todo ou não tem hora.
                    // Para este exemplo, vamos pegar a primeira célula da coluna do dia que não seja header.
                     for(let i=0; i < dayColumnCells.length; i++){
                        if(dayColumnCells[i].dataset.time){
                            cellSelector = `.cell[data-day="${event.day.substring(0,3)}"][data-time="${dayColumnCells[i].dataset.time}"]`;
                            break;
                        }
                     }
                     // Se ainda não encontrou, usa a primeira célula da coluna do dia
                     if(!cellSelector && dayColumnCells.length > 0) cell = dayColumnCells[0];
                }
            }
            
            let cell = cellSelector ? document.querySelector(cellSelector) : null;
            
            // Se a célula específica não for encontrada (ex: tarefa sem hora definida), 
            // tentamos adicionar a um container geral do dia.
            if (!cell) {
                const dayHeaderCell = document.querySelector(`.day-cell[data-day-header="${event.day.substring(0,3)}"]`); // Supondo que headers tenham data-day-header
                // Se não tiver header específico, busca pela classe e texto.
                // Esta parte é complexa sem saber a estrutura exata do HTML para colunas de dia.
                // Simplificando: se não achar slot de hora, adiciona ao primeiro slot de 08:00 do dia.
                const fallbackCellSelector = `.cell[data-day="${event.day.substring(0,3)}"][data-time="08:00"]`;
                cell = document.querySelector(fallbackCellSelector);
            }

            if (cell) {
                const eventElement = document.createElement("div");
                eventElement.className = `event ${isTask ? "event-task" : "event-schedule"}`;
                eventElement.dataset.id = event.id;
                eventElement.dataset.subject = event.subject;
                eventElement.dataset.type = event.type;
                
                let eventTimeDisplay = "";
                if (event.time && event.time !== "-" && event.endTime && event.endTime !== "-") {
                    eventTimeDisplay = `<span class=\"event-time\">${event.time.substring(0,5)}-${event.endTime.substring(0,5)}</span>`;
                }

                eventElement.innerHTML = `
                    <span class=\"event-title\">${isTask ? "[T] " : ""}${event.subject}</span>
                    ${eventTimeDisplay}
                `;
                
                if (!isTask) {
                    eventElement.addEventListener("click", () => this.editEvent(event.id));
                } else {
                    // Clicar em uma tarefa no cronograma pode levar à página de tarefas ou abrir um mini-modal
                    eventElement.title = "Tarefa: " + event.subject;
                }
                cell.appendChild(eventElement);
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
            closeBtn: document.querySelector("#eventModal .close-modal"), // Específico para o modal de evento
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
            const dayAbbrev = this.elements.eventDay.value; // mon, tue...
            const time = this.elements.eventTime.value;
            const duration = parseInt(this.elements.eventDuration.value);

            // Determinar a data exata com base na semana atual e no dia da semana selecionado
            const weekDays = weekNav.getWeekDays(); // YYYY-MM-DD
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
                date: eventDateISO, // YYYY-MM-DD
                notes: document.getElementById("eventNotes").value
            };

            const [hours, minutes] = time.split(":").map(Number);
            const endTime = new Date(eventDateISO + "T" + time);
            endTime.setMinutes(endTime.getMinutes() + duration);
            newEvent.endTime = endTime.toTimeString().substring(0, 5);

            // Salvar evento no localStorage ("studySchedule")
            try {
                let savedSchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
                savedSchedule.push(newEvent);
                localStorage.setItem("studySchedule", JSON.stringify(savedSchedule));
            } catch (er) {
                console.error("Erro ao salvar evento do cronograma:", er);
            }

            // Se o tipo for "study", criar uma tarefa correspondente
            if (type === "study") {
                try {
                    let studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
                    const taskSubject = "Estudos Agendados"; // Ou usar uma matéria específica
                    if (!studyTasks[taskSubject]) {
                        studyTasks[taskSubject] = [];
                    }
                    const newTaskId = `task-cron-${Date.now()}`;
                    studyTasks[taskSubject].push({
                        id: newTaskId,
                        title: `Estudar: ${subject} (do cronograma)`, 
                        due: eventDateISO, // Data da tarefa é a data do evento
                        done: false,
                        priority: "medium", // Prioridade padrão
                        description: `Agendado via cronograma para ${time} - ${newEvent.endTime}. Observações: ${newEvent.notes || "Nenhuma"}`
                    });
                    localStorage.setItem("studyTasks", JSON.stringify(studyTasks));
                } catch (er) {
                    console.error("Erro ao criar tarefa a partir do cronograma:", er);
                }
            }
            weekNav.loadScheduleAndTasks(); // Recarrega para mostrar o novo evento e/ou tarefa
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

