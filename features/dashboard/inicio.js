document.addEventListener("DOMContentLoaded", function() {
    loadUserName(); // Carrega o nome do usuário
    loadTarefasAgendadas();
    loadTempoFocoHoje();
    initProgressoSemanaChart();
    loadTempoMedioEstudoSemana();
    loadProximosEventos(); // Alterado de loadRecomendacoesRapidas para loadProximosEventos
    document.getElementById("currentYear").textContent = new Date().getFullYear();
    checkNotificationPermission();
});

function loadUserName() {
    const userNameSpan = document.getElementById("userName");
    if (userNameSpan) {
        let userName = localStorage.getItem("loggedInUserName");
        if (userName) {
            userNameSpan.textContent = `Usuário: ${userName}`;
        } 
    }
}

function loadTarefasAgendadas() {
    const tarefasSection = document.getElementById("tarefasSection");
    if (!tarefasSection) return;

    const loadingDiv = tarefasSection.querySelector(".skeleton-loading");
    
    // Garante que o HTML da seção de tarefas seja recriado apenas se necessário
    // ou se o loadingDiv ainda existir.
    if (loadingDiv || !document.getElementById("listaTarefasAgendadasInicio")) {
        if (loadingDiv) loadingDiv.remove();
        tarefasSection.innerHTML = "<h3>Tarefas Agendadas</h3><ul id=\"listaTarefasAgendadasInicio\"></ul>";
    }
    const listaTarefasUl = document.getElementById("listaTarefasAgendadasInicio");
    if (!listaTarefasUl) return; // Sai se o UL não pode ser encontrado
    listaTarefasUl.innerHTML = ''; // Limpa a lista antes de adicionar novos itens

    try {
        const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
        let temTarefas = false;
        const hoje = new Date().toISOString().split("T")[0];

        Object.values(studyTasks).flat().forEach(task => {
            if (!task.done && task.due >= hoje) { 
                const li = document.createElement("li");
                li.textContent = `${task.title} (Prazo: ${new Date(task.due).toLocaleDateString("pt-BR", {timeZone: "UTC"})})`;
                listaTarefasUl.appendChild(li);
                temTarefas = true;
            }
        });

        if (!temTarefas) {
            listaTarefasUl.innerHTML = "<li>Nenhuma tarefa agendada.</li>";
        }
    } catch (e) {
        console.error("Erro ao carregar tarefas agendadas:", e);
        if (listaTarefasUl) listaTarefasUl.innerHTML = "<li>Erro ao carregar tarefas.</li>";
    }
}

function loadTempoFocoHoje() {
    const tempoFocoHighlight = document.querySelector("section[aria-labelledby='tempo-foco-heading'] .highlight"); 
    if (!tempoFocoHighlight) return;

    let totalMinutosFocoHoje = 0;
    const hoje = new Date().toISOString().split("T")[0];

    try {
        const focusSessionsData = JSON.parse(localStorage.getItem("focusSessions")) || []; 
        
        focusSessionsData.forEach(session => {
            if (session.date === hoje && session.durationMinutes) {
                totalMinutosFocoHoje += session.durationMinutes;
            }
        });

        const horas = Math.floor(totalMinutosFocoHoje / 60);
        const minutos = totalMinutosFocoHoje % 60;
        tempoFocoHighlight.textContent = `${horas}h ${minutos}min`;

    } catch (e) {
        console.error("Erro ao carregar tempo de foco:", e);
        tempoFocoHighlight.textContent = "Erro";
    }
}

function initProgressoSemanaChart() {
    const ctx = document.getElementById("graficoHoras");
    if (!ctx) return;

    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const horasEstudoSemana = Array(7).fill(0);
    const hoje = new Date();
    const primeiroDiaSemana = new Date(hoje);
    primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay()); 
    primeiroDiaSemana.setHours(0,0,0,0);

    try {
        const focusSessionsData = JSON.parse(localStorage.getItem("focusSessions")) || [];

        for (let i = 0; i < 7; i++) {
            const diaAtualLoop = new Date(primeiroDiaSemana);
            diaAtualLoop.setDate(primeiroDiaSemana.getDate() + i);
            const diaFormatado = diaAtualLoop.toISOString().split("T")[0];
            
            let minutosNoDia = 0;
            focusSessionsData.forEach(session => {
                if (session.date === diaFormatado && session.durationMinutes) {
                    minutosNoDia += session.durationMinutes;
                }
            });
            horasEstudoSemana[i] = parseFloat((minutosNoDia / 60).toFixed(1));
        }

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: diasDaSemana,
                datasets: [{
                    label: "Horas de foco",
                    data: horasEstudoSemana,
                    backgroundColor: "#4682B4",
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 0.5 },
                        grid: { display: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: "easeOutBounce"
                }
            }
        });
    } catch (e) {
        console.error("Erro ao inicializar gráfico de progresso da semana:", e);
    }
}

function loadTempoMedioEstudoSemana() {
    const tempoMedioHighlight = document.querySelector("section[aria-labelledby='tempo-medio-heading'] .highlight");
    if (!tempoMedioHighlight) return;

    try {
        const focusSessionsData = JSON.parse(localStorage.getItem("focusSessions")) || [];
        const hoje = new Date();
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
        primeiroDiaSemana.setHours(0, 0, 0, 0);

        const ultimoDiaSemana = new Date(primeiroDiaSemana);
        ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
        ultimoDiaSemana.setHours(23, 59, 59, 999);

        let totalMinutosSemana = 0;
        let diasComEstudo = new Set();

        focusSessionsData.forEach(session => {
            const sessionDate = new Date(session.date + "T00:00:00");
            if (sessionDate >= primeiroDiaSemana && sessionDate <= ultimoDiaSemana && session.durationMinutes) {
                totalMinutosSemana += session.durationMinutes;
                diasComEstudo.add(session.date);
            }
        });
        
        const numeroDiasComEstudo = diasComEstudo.size > 0 ? diasComEstudo.size : 1; 
        const mediaMinutosPorDia = totalMinutosSemana / numeroDiasComEstudo;

        const horas = Math.floor(mediaMinutosPorDia / 60);
        const minutos = Math.round(mediaMinutosPorDia % 60); 
        tempoMedioHighlight.textContent = `${horas}h ${minutos}min / dia`;

    } catch (e) {
        console.error("Erro ao carregar tempo médio de estudo:", e);
        tempoMedioHighlight.textContent = "Erro";
    }
}

function loadProximosEventos() {
    const proximosEventosUl = document.getElementById("listaProximosEventos");
    if (!proximosEventosUl) return;

    proximosEventosUl.innerHTML = ""; // Limpa eventos antigos

    try {
        const studySchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const dataLimite = new Date(hoje);
        dataLimite.setDate(hoje.getDate() + 7); // Eventos nos próximos 7 dias

        const eventosFiltrados = studySchedule.filter(evento => {
            if (!evento.date) return false;
            const dataEvento = new Date(evento.date + "T00:00:00"); // Normaliza para comparar datas
            return dataEvento >= hoje && dataEvento < dataLimite; // Inclui hoje, até o final do 7º dia
        });

        eventosFiltrados.sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordena por data mais próxima

        const eventosParaExibir = eventosFiltrados.slice(0, 4); // Limita a 4 eventos

        if (eventosParaExibir.length > 0) {
            eventosParaExibir.forEach(evento => {
                const li = document.createElement("li");
                const dataEventoFormatada = new Date(evento.date + "T00:00:00").toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
                let textoEvento = `${dataEventoFormatada} - ${evento.subject}`;
                if (evento.time && evento.time !== "-") {
                    textoEvento += ` (${evento.time.substring(0,5)})`;
                }
                li.textContent = textoEvento;
                proximosEventosUl.appendChild(li);
            });
        } else {
            proximosEventosUl.innerHTML = "<li>Nenhum evento próximo nos próximos 7 dias.</li>";
        }
    } catch (e) {
        console.error("Erro ao carregar próximos eventos:", e);
        proximosEventosUl.innerHTML = "<li>Erro ao carregar eventos.</li>";
    }
}

function checkNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            console.log("Permissão para notificações:", permission);
        });
    }
}

// Listener para storage events, para atualizar dinamicamente se dados mudarem em outra aba
window.addEventListener('storage', function(event) {
    console.log("Storage event detectado em inicio.js: ", event.key); // Debug
    if (event.key === 'studyTasks') {
        loadTarefasAgendadas();
    }
    if (event.key === 'focusSessions') {
        loadTempoFocoHoje();
        initProgressoSemanaChart(); // Recalcula o gráfico
        loadTempoMedioEstudoSemana();
    }
    if (event.key === 'studySchedule') {
        loadProximosEventos();
    }
    if (event.key === 'loggedInUserName') {
        loadUserName();
    }
});

