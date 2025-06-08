// Array com 30 frases motivacionais
const motivationalPhrases = [
    "Acredite em você mesmo e tudo será possível.",
    "O sucesso nasce do querer, da determinação e persistência.",
    "Não espere por oportunidades, crie-as.",
    "Cada dia é uma nova chance para ser melhor.",
    "A jornada de mil milhas começa com um único passo.",
    "Seu maior obstáculo é você mesmo. Supere-se!",
    "A persistência realiza o impossível.",
    "O conhecimento é a chave para abrir qualquer porta.",
    "Estudar é iluminar a mente para um futuro brilhante.",
    "Não tenha medo de falhar, tenha medo de não tentar.",
    "A disciplina é a ponte entre metas e realizações.",
    "Concentre-se onde você quer chegar, não onde você está.",
    "O aprendizado é um tesouro que segue seu dono em todo lugar.",
    "Transforme seus sonhos em planos e seus planos em realidade.",
    "A força não vem da capacidade física, mas de uma vontade indomável.",
    "Pequenos progressos diários somam grandes resultados.",
    "O futuro pertence àqueles que acreditam na beleza de seus sonhos.",
    "Desafie seus limites e surpreenda a si mesmo.",
    "A educação é a arma mais poderosa que você pode usar para mudar o mundo.",
    "Mantenha o foco nos seus objetivos, a distração é inimiga do sucesso.",
    "Você é mais forte do que pensa e será mais feliz do que imagina.",
    "Nunca é tarde demais para ser aquilo que você poderia ter sido.",
    "O esforço de hoje é o sucesso de amanhã.",
    "Acredite no poder dos seus estudos.",
    "Sua dedicação abrirá caminhos incríveis.",
    "Continue firme, cada página virada é uma vitória.",
    "Lembre-se por que começou e não desista.",
    "O estudo transforma vidas. Transforme a sua!",
    "Foco, força e fé nos estudos!",
    "Você está construindo um futuro brilhante. Continue!"
];

/**
 * Carrega e exibe uma frase motivacional aleatória no banner
 */
function loadMotivationalPhrase() {
    console.log("Tentando carregar frase motivacional..."); // Log para depuração
    const banner = document.getElementById("motivationalBanner");
    if (banner) {
        console.log("Elemento #motivationalBanner encontrado."); // Log para depuração
        const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
        banner.textContent = motivationalPhrases[randomIndex];
        banner.style.display = "block"; // Garante que está visível
        console.log("Frase carregada:", banner.textContent); // Log para depuração
    } else {
        console.error("Elemento #motivationalBanner NÃO encontrado!"); // Log de erro
    }
}

/**
 * Script JavaScript para a página de Início (Dashboard)
 * Gerencia a exibição de dados, carregamento de informações e interações da interface
 */

document.addEventListener("DOMContentLoaded", function() {
    loadUserName();           // Carrega o nome do usuário
    loadTarefasAgendadas();   // Carrega as tarefas agendadas do usuário
    loadTempoFocoHoje();      // Carrega o tempo de foco do dia atual
    loadCompletedFocusSessionsCounter(); // CORREÇÃO: Carrega o contador de SESSÕES DE FOCO concluídas
    loadTotalPointsDisplay(); // Carrega a exibição de pontos totais
    initProgressoSemanaChart(); // Inicializa o gráfico de progresso semanal
    loadProximosEventos();    // Carrega os próximos eventos do calendário
    document.getElementById("currentYear").textContent = new Date().getFullYear(); // Atualiza o ano no rodapé
    checkNotificationPermission(); // Verifica permissão para notificações

    window.addEventListener("completedFocusSessionsChanged", (event) => { // CORREÇÃO: Ouvir evento correto
        updateCompletedFocusSessionsCounter(event.detail.count);
    });
    window.addEventListener("userPointsChanged", (event) => {
        updateTotalPointsDisplay(event.detail.newTotalPoints);
    });

    // Chama a frase motivacional após um pequeno atraso para garantir que o DOM esteja pronto
    // e outras manipulações possam ter ocorrido.
    setTimeout(loadMotivationalPhrase, 100); 
});

/**
 * Carrega e exibe o nome do usuário logado
 */
function loadUserName() {
    const userNameSpan = document.getElementById("userName");
    if (userNameSpan) {
        let userName = localStorage.getItem("loggedInUserName");
        if (userName) {
            userNameSpan.textContent = `Usuário: ${userName}`;
        } 
    }
}

/**
 * Carrega e exibe as tarefas agendadas do usuário
 */
function loadTarefasAgendadas() {
    const tarefasSection = document.getElementById("tarefasSection");
    if (!tarefasSection) return;

    const loadingDiv = tarefasSection.querySelector(".skeleton-loading");
    
    // Garante que o título e a lista UL existam antes de preencher
    if (!document.getElementById("listaTarefasAgendadasInicio")) {
         if (loadingDiv) loadingDiv.remove(); // Remove skeleton se existir
         // Recria a estrutura básica se não existir
         tarefasSection.innerHTML = 	'<h2 id="tarefas-heading">Suas Tarefas para Hoje</h2><ul id="listaTarefasAgendadasInicio"><li>Carregando...</li></ul>';
    } else if (loadingDiv) {
        loadingDiv.remove(); // Remove skeleton se a lista já existe
    }
    
    const listaTarefasUl = document.getElementById("listaTarefasAgendadasInicio");
    if (!listaTarefasUl) return;
    listaTarefasUl.innerHTML = 	''; // Limpa a lista antes de adicionar novos itens

    try {
        const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
        let tarefasFiltradas = [];
        const hoje = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };

        // Filtra tarefas relevantes (não concluídas e com prazo hoje ou futuro)
        Object.values(studyTasks).flat().forEach(task => {
            if (!task.done && task.due && task.due >= hoje) { 
                tarefasFiltradas.push(task);
            }
        });

        // Ordena as tarefas: primeiro por data (ascendente), depois por prioridade (descendente)
        tarefasFiltradas.sort((a, b) => {
            const dateA = new Date(a.due);
            const dateB = new Date(b.due);
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;

            const priorityA = priorityOrder[a.priority || 'medium'] || 0;
            const priorityB = priorityOrder[b.priority || 'medium'] || 0;
            return priorityB - priorityA; // Descendente
        });

        // Renderiza as tarefas ordenadas (limita a 5 para não poluir)
        const tarefasParaExibir = tarefasFiltradas.slice(0, 5);
        if (tarefasParaExibir.length > 0) {
            tarefasParaExibir.forEach(task => {
                const li = document.createElement("li");
                const priority = task.priority || 'medium';
                const priorityText = priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa';
                li.innerHTML = `
                    <span class="task-title-inline">${task.title}</span> 
                    <span class="priority-dot priority-${priority}" title="Prioridade: ${priorityText}"></span>
                    <span class="task-due-inline">(Prazo: ${new Date(task.due).toLocaleDateString("pt-BR", {timeZone: "UTC"})})</span>
                `;
                listaTarefasUl.appendChild(li);
            });
        } else {
            listaTarefasUl.innerHTML = "<li>Nenhuma tarefa pendente para hoje ou futuro.</li>";
        }

    } catch (e) {
        console.error("Erro ao carregar e ordenar tarefas agendadas:", e);
        if (listaTarefasUl) listaTarefasUl.innerHTML = "<li>Erro ao carregar tarefas.</li>";
    }
}

/**
 * Carrega e exibe o tempo total de foco do dia atual
 */
function loadTempoFocoHoje() {
    const tempoFocoHighlight = document.getElementById("focusTimeToday"); 
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

/**
 * Carrega e exibe o contador de sessões de foco concluídas.
 */
function loadCompletedFocusSessionsCounter() {
    const count = parseInt(localStorage.getItem("completedFocusSessionsCount")) || 0;
    updateCompletedFocusSessionsCounter(count);
}

/**
 * Atualiza o elemento do contador de sessões de foco concluídas na interface.
 * @param {number} count - O número de sessões de foco concluídas.
 */
function updateCompletedFocusSessionsCounter(count) {
    const counterElement = document.getElementById("completedFocusSessionsCounter"); // ID ATUALIZADO
    if (counterElement) {
        counterElement.textContent = count;
    }
}

/**
 * Carrega e exibe o total de pontos de estudo.
 */
function loadTotalPointsDisplay() {
    const points = parseInt(localStorage.getItem("userTotalPoints")) || 0;
    updateTotalPointsDisplay(points);
}

/**
 * Atualiza o elemento de exibição de pontos totais na interface.
 * @param {number} points - O total de pontos.
 */
function updateTotalPointsDisplay(points) {
    const pointsElement = document.getElementById("totalPointsDisplay");
    if (pointsElement) {
        pointsElement.textContent = points;
    }
}

/**
 * Inicializa o gráfico de progresso semanal usando Chart.js
 */
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
                        ticks: { stepSize: 1 }, // Ajuste para step 1
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

/**
 * Carrega e exibe os próximos eventos do calendário
 */
function loadProximosEventos() {
    const proximosEventosUl = document.getElementById("listaProximosEventos");
    if (!proximosEventosUl) return;
    proximosEventosUl.innerHTML = "";

    try {
        const studySchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
        const hoje = new Date();
        const diaDaSemanaHoje = hoje.getDay();
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - diaDaSemanaHoje);
        primeiroDiaSemana.setHours(0, 0, 0, 0);
        const ultimoDiaSemana = new Date(primeiroDiaSemana);
        ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
        ultimoDiaSemana.setHours(23, 59, 59, 999);
        const hojeInicioDia = new Date();
        hojeInicioDia.setHours(0, 0, 0, 0);

        const eventosFiltrados = studySchedule.filter(evento => {
            if (!evento.date) return false;
            const dataEvento = new Date(evento.date + "T00:00:00");
            return dataEvento >= primeiroDiaSemana && dataEvento <= ultimoDiaSemana && dataEvento >= hojeInicioDia;
        });

        eventosFiltrados.sort((a, b) => {
            const dataHoraA = new Date(`${a.date}T${a.time || '00:00'}`);
            const dataHoraB = new Date(`${b.date}T${b.time || '00:00'}`);
            return dataHoraA - dataHoraB;
        });

        const eventosParaExibir = eventosFiltrados.slice(0, 5);
        if (eventosParaExibir.length > 0) {
            eventosParaExibir.forEach(evento => {
                const li = document.createElement("li");
                const dataEventoFormatada = new Date(evento.date + "T00:00:00").toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
                let textoEvento = `${evento.title} (${dataEventoFormatada}`;
                if (evento.time && evento.time !== "-") {
                    textoEvento += ` ${evento.time.substring(0,5)}`;
                }
                textoEvento += `)`;
                li.textContent = textoEvento;
                proximosEventosUl.appendChild(li);
            });
        } else {
            proximosEventosUl.innerHTML = "<li>Nenhum evento próximo encontrado para esta semana.</li>";
        }
    } catch (e) {
        console.error("Erro ao carregar próximos eventos:", e);
        if (proximosEventosUl) proximosEventosUl.innerHTML = "<li>Erro ao carregar eventos.</li>";
    }
}

/**
 * Verifica e solicita permissão para notificações
 */
function checkNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Este navegador não suporta notificações desktop.");
    } else if (Notification.permission === "granted") {
        console.log("Permissão para notificações já concedida.");
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                console.log("Permissão para notificações concedida.");
            }
        });
    }
}

