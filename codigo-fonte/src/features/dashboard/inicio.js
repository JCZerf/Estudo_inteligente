document.addEventListener("DOMContentLoaded", function() {
    loadUserName(); // Carrega o nome do usuário
    loadTarefasAgendadas();
    loadTempoFocoHoje();
    initProgressoSemanaChart();
    loadTempoMedioEstudoSemana();
    loadRecomendacoesRapidas();
    document.getElementById("currentYear").textContent = new Date().getFullYear();
    checkNotificationPermission();
});

function loadUserName() {
    const userNameSpan = document.getElementById("userName");
    if (userNameSpan) {
        // Tenta buscar o nome do usuário do localStorage (simulando um login)
        // Em um cenário real, o nome seria salvo no localStorage após o login/cadastro.
        // Para fins de demonstração, vamos permitir setar via console ou usar um padrão.
        let userName = localStorage.getItem("loggedInUserName");
        if (userName) {
            userNameSpan.textContent = `Usuário: ${userName}`;
        } else {
            // Mantém o nome padrão ou define um genérico se não houver usuário logado
            // userNameSpan.textContent = "Usuário: Convidado"; 
            // Para manter o nome original como fallback:
            // userNameSpan.textContent = "Usuário: Joaquim Silva"; // Já está no HTML, então não precisa mudar se não achar
        }
    }
    // Para testar, você pode definir no console do navegador: localStorage.setItem("loggedInUserName", "Seu Nome"); e recarregar a página.
}

function loadTarefasAgendadas() {
    const tarefasSection = document.getElementById("tarefasSection");
    if (!tarefasSection) return;

    const loadingDiv = tarefasSection.querySelector(".skeleton-loading");
    if (loadingDiv) loadingDiv.remove();

    tarefasSection.innerHTML = "<h3>Tarefas Agendadas</h3><ul id=\"listaTarefasAgendadasInicio\"></ul>"; // Adiciona ul para lista
    const listaTarefasUl = document.getElementById("listaTarefasAgendadasInicio");

    try {
        const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
        let temTarefas = false;
        const hoje = new Date().toISOString().split("T")[0];

        Object.values(studyTasks).flat().forEach(task => {
            if (!task.done && task.due >= hoje) { // Exibe tarefas não concluídas e com prazo de hoje em diante
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
        listaTarefasUl.innerHTML = "<li>Erro ao carregar tarefas.</li>";
    }
}

function loadTempoFocoHoje() {
    const tempoFocoHighlight = document.querySelector(".section:nth-child(3) .highlight"); // Ajustar seletor se necessário
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
    primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo como primeiro dia

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
    const tempoMedioHighlight = document.querySelector(".section:nth-child(5) .highlight"); // Ajustar seletor
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
            const sessionDate = new Date(session.date + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso
            if (sessionDate >= primeiroDiaSemana && sessionDate <= ultimoDiaSemana && session.durationMinutes) {
                totalMinutosSemana += session.durationMinutes;
                diasComEstudo.add(session.date);
            }
        });
        
        const numeroDiasComEstudo = diasComEstudo.size > 0 ? diasComEstudo.size : 1; // Evita divisão por zero
        const mediaMinutosPorDia = totalMinutosSemana / numeroDiasComEstudo;

        const horas = Math.floor(mediaMinutosPorDia / 60);
        const minutos = Math.round(mediaMinutosPorDia % 60); // Arredonda os minutos
        tempoMedioHighlight.textContent = `${horas}h ${minutos}min / dia`;

    } catch (e) {
        console.error("Erro ao carregar tempo médio de estudo:", e);
        tempoMedioHighlight.textContent = "Erro";
    }
}

function loadRecomendacoesRapidas() {
    const recomendacoesSection = document.querySelector(".section:nth-child(6) ul"); // Ajustar seletor
    if (!recomendacoesSection) return;

    recomendacoesSection.innerHTML = ""; // Limpa recomendações antigas

    try {
        const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
        let recomendacoesAdicionadas = 0;
        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        const tarefasPendentes = Object.values(studyTasks).flat().filter(task => !task.done && task.due);
        tarefasPendentes.sort((a, b) => new Date(a.due) - new Date(b.due)); // Ordena por prazo

        for (const task of tarefasPendentes) {
            const dueDate = new Date(task.due + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso
            const diffTime = dueDate - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 3) {
                const li = document.createElement("li");
                if (diffDays === 0) {
                    li.textContent = `Hoje: ${task.title}`;
                } else {
                    li.textContent = `Vence em ${diffDays} dia(s): ${task.title}`;
                }
                recomendacoesSection.appendChild(li);
                recomendacoesAdicionadas++;
                if (recomendacoesAdicionadas >= 2) break; // Limita a 2 recomendações por exemplo
            }
        }

        if (recomendacoesAdicionadas === 0) {
            recomendacoesSection.innerHTML = "<li>Nenhuma tarefa com prazo próximo.</li>";
        }
    } catch (e) {
        console.error("Erro ao carregar recomendações rápidas:", e);
        recomendacoesSection.innerHTML = "<li>Erro ao carregar recomendações.</li>";
    }
}

function checkNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            console.log("Permissão para notificações:", permission);
        });
    }
}

