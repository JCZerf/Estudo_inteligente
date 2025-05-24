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
    const banner = document.querySelector(".banner");
    if (banner) {
        const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
        banner.textContent = motivationalPhrases[randomIndex];
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
    initProgressoSemanaChart(); // Inicializa o gráfico de progresso semanal
    loadTempoMedioEstudoSemana(); // Calcula e exibe o tempo médio de estudo na semana
    loadProximosEventos();    // Carrega os próximos eventos do calendário
    loadMotivationalPhrase(); // Carrega a frase motivacional
    document.getElementById("currentYear").textContent = new Date().getFullYear(); // Atualiza o ano no rodapé
    checkNotificationPermission(); // Verifica permissão para notificações
});

/**
 * Carrega e exibe o nome do usuário logado
 * Recupera o nome do localStorage e atualiza o elemento na interface
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
 * Filtra as tarefas não concluídas com prazo a partir de hoje e ordena por data e prioridade
 */
function loadTarefasAgendadas() {
    const tarefasSection = document.getElementById("tarefasSection");
    if (!tarefasSection) return;

    const loadingDiv = tarefasSection.querySelector(".skeleton-loading");
    
    if (loadingDiv || !document.getElementById("listaTarefasAgendadasInicio")) {
        if (loadingDiv) loadingDiv.remove();
        tarefasSection.innerHTML = "<h3>Tarefas Agendadas</h3><ul id=\"listaTarefasAgendadasInicio\"></ul>";
    }
    const listaTarefasUl = document.getElementById("listaTarefasAgendadasInicio");
    if (!listaTarefasUl) return;
    listaTarefasUl.innerHTML = ''; // Limpa a lista antes de adicionar novos itens

    try {
        const studyTasks = JSON.parse(localStorage.getItem("studyTasks")) || {};
        let tarefasFiltradas = [];
        const hoje = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };

        // Filtra tarefas relevantes
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

            // Se as datas forem iguais, ordena por prioridade (maior primeiro)
            const priorityA = priorityOrder[a.priority || 'medium'] || 0;
            const priorityB = priorityOrder[b.priority || 'medium'] || 0;
            return priorityB - priorityA; // Descendente
        });

        // Renderiza as tarefas ordenadas
        if (tarefasFiltradas.length > 0) {
            tarefasFiltradas.forEach(task => {
                const li = document.createElement("li");
                const priority = task.priority || 'medium';
                const priorityText = priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa';
                // Adiciona título, bolinha de prioridade (à direita) e prazo
                li.innerHTML = `
                    <span class="task-title-inline">${task.title}</span> 
                    <span class="priority-dot priority-${priority}" title="Prioridade: ${priorityText}"></span>
                    <span class="task-due-inline">(Prazo: ${new Date(task.due).toLocaleDateString("pt-BR", {timeZone: "UTC"})})</span>
                `;
                listaTarefasUl.appendChild(li);
            });
        } else {
            listaTarefasUl.innerHTML = "<li>Nenhuma tarefa agendada encontrada.</li>";
        }

    } catch (e) {
        console.error("Erro ao carregar e ordenar tarefas agendadas:", e);
        if (listaTarefasUl) listaTarefasUl.innerHTML = "<li>Erro ao carregar tarefas.</li>";
    }
}

/**
 * Carrega e exibe o tempo total de foco do dia atual
 * Calcula a soma de todas as sessões de foco registradas hoje
 */
function loadTempoFocoHoje() {
    const tempoFocoHighlight = document.querySelector("section[aria-labelledby='tempo-foco-heading'] .highlight"); 
    if (!tempoFocoHighlight) return;

    let totalMinutosFocoHoje = 0;
    const hoje = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD

    try {
        // Recupera as sessões de foco do localStorage
        const focusSessionsData = JSON.parse(localStorage.getItem("focusSessions")) || []; 
        
        // Soma os minutos de todas as sessões de hoje
        focusSessionsData.forEach(session => {
            if (session.date === hoje && session.durationMinutes) {
                totalMinutosFocoHoje += session.durationMinutes;
            }
        });

        // Converte minutos para formato horas e minutos
        const horas = Math.floor(totalMinutosFocoHoje / 60);
        const minutos = totalMinutosFocoHoje % 60;
        tempoFocoHighlight.textContent = `${horas}h ${minutos}min`;

    } catch (e) {
        console.error("Erro ao carregar tempo de foco:", e);
        tempoFocoHighlight.textContent = "Erro";
    }
}

/**
 * Inicializa o gráfico de progresso semanal usando Chart.js
 * Exibe as horas de estudo para cada dia da semana atual
 */
function initProgressoSemanaChart() {
    const ctx = document.getElementById("graficoHoras");
    if (!ctx) return;

    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const horasEstudoSemana = Array(7).fill(0); // Inicializa com zeros
    
    // Calcula o primeiro dia da semana atual (domingo)
    const hoje = new Date();
    const primeiroDiaSemana = new Date(hoje);
    primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay()); 
    primeiroDiaSemana.setHours(0,0,0,0);

    try {
        // Recupera as sessões de foco do localStorage
        const focusSessionsData = JSON.parse(localStorage.getItem("focusSessions")) || [];

        // Calcula as horas de estudo para cada dia da semana
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
            horasEstudoSemana[i] = parseFloat((minutosNoDia / 60).toFixed(1)); // Converte para horas com 1 decimal
        }

        // Cria o gráfico de barras com Chart.js
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: diasDaSemana,
                datasets: [{
                    label: "Horas de foco",
                    data: horasEstudoSemana,
                    backgroundColor: "#4682B4", // Azul aço
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

/**
 * Calcula e exibe o tempo médio de estudo por dia na semana atual
 * Considera apenas os dias em que houve estudo para calcular a média
 */
function loadTempoMedioEstudoSemana() {
    const tempoMedioHighlight = document.querySelector("section[aria-labelledby='tempo-medio-heading'] .highlight");
    if (!tempoMedioHighlight) return;

    try {
        // Recupera as sessões de foco do localStorage
        const focusSessionsData = JSON.parse(localStorage.getItem("focusSessions")) || [];
        
        // Calcula o período da semana atual (domingo a sábado)
        const hoje = new Date();
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
        primeiroDiaSemana.setHours(0, 0, 0, 0);

        const ultimoDiaSemana = new Date(primeiroDiaSemana);
        ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
        ultimoDiaSemana.setHours(23, 59, 59, 999);

        let totalMinutosSemana = 0;
        let diasComEstudo = new Set(); // Usa Set para contar dias únicos com estudo

        // Soma os minutos de todas as sessões da semana atual
        focusSessionsData.forEach(session => {
            const sessionDate = new Date(session.date + "T00:00:00");
            if (sessionDate >= primeiroDiaSemana && sessionDate <= ultimoDiaSemana && session.durationMinutes) {
                totalMinutosSemana += session.durationMinutes;
                diasComEstudo.add(session.date); // Adiciona a data ao Set
            }
        });
        
        // Calcula a média (evita divisão por zero usando no mínimo 1 dia)
        const numeroDiasComEstudo = diasComEstudo.size > 0 ? diasComEstudo.size : 1; 
        const mediaMinutosPorDia = totalMinutosSemana / numeroDiasComEstudo;

        // Converte para formato horas e minutos
        const horas = Math.floor(mediaMinutosPorDia / 60);
        const minutos = Math.round(mediaMinutosPorDia % 60); 
        tempoMedioHighlight.textContent = `${horas}h ${minutos}min / dia`;

    } catch (e) {
        console.error("Erro ao carregar tempo médio de estudo:", e);
        tempoMedioHighlight.textContent = "Erro";
    }
}

/**
 * Carrega e exibe os próximos eventos do calendário
 * Filtra eventos da semana atual (Domingo a Sábado) e exibe os 5 mais próximos
 */
function loadProximosEventos() {
    const proximosEventosUl = document.getElementById("listaProximosEventos");
    if (!proximosEventosUl) return;

    proximosEventosUl.innerHTML = ""; // Limpa eventos antigos

    try {
        // Recupera os eventos do calendário do localStorage
        const studySchedule = JSON.parse(localStorage.getItem("studySchedule")) || [];
        
        // Define o período de filtro (Semana Atual: Domingo a Sábado)
        const hoje = new Date();
        const diaDaSemanaHoje = hoje.getDay(); // 0 = Domingo, 6 = Sábado
        
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - diaDaSemanaHoje);
        primeiroDiaSemana.setHours(0, 0, 0, 0);

        const ultimoDiaSemana = new Date(primeiroDiaSemana);
        ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
        ultimoDiaSemana.setHours(23, 59, 59, 999);

        // Filtra eventos dentro da semana atual e que ainda não passaram (ou são de hoje)
        const hojeInicioDia = new Date(); // Para comparar eventos futuros no mesmo dia
        hojeInicioDia.setHours(0, 0, 0, 0);

        const eventosFiltrados = studySchedule.filter(evento => {
            if (!evento.date) return false;
            const dataEvento = new Date(evento.date + "T00:00:00"); // Normaliza para comparar datas
            // Verifica se está na semana atual E se é de hoje ou futuro
            return dataEvento >= primeiroDiaSemana && dataEvento <= ultimoDiaSemana && dataEvento >= hojeInicioDia;
        });

        // Ordena por data e hora mais próxima (se hora existir)
        eventosFiltrados.sort((a, b) => {
            const dataHoraA = new Date(`${a.date}T${a.time || '00:00'}`);
            const dataHoraB = new Date(`${b.date}T${b.time || '00:00'}`);
            return dataHoraA - dataHoraB;
        });

        // Limita a 5 eventos para exibição
        const eventosParaExibir = eventosFiltrados.slice(0, 5);

        if (eventosParaExibir.length > 0) {
            // Cria elementos de lista para cada evento
            eventosParaExibir.forEach(evento => {
                const li = document.createElement("li");
                // Formata a data para DD/MM
                const dataEventoFormatada = new Date(evento.date + "T00:00:00").toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
                // Monta o texto: Título (Data Hora)
                let textoEvento = `${evento.subject} (${dataEventoFormatada}`;
                // Adiciona a hora se existir e não for "-"
                if (evento.time && evento.time !== "-") {
                    textoEvento += ` ${evento.time.substring(0,5)}`;
                }
                textoEvento += `)`; // Fecha parênteses
                li.textContent = textoEvento;
                proximosEventosUl.appendChild(li);
            });
        } else {
            // Exibe mensagem se não houver eventos na semana atual
            proximosEventosUl.innerHTML = "<li>Nenhum evento próximo nesta semana.</li>";
        }
    } catch (e) {
        console.error("Erro ao carregar próximos eventos:", e);
        proximosEventosUl.innerHTML = "<li>Erro ao carregar eventos.</li>";
    }
}

/**
 * Verifica e solicita permissão para enviar notificações
 * Importante para alertas de sessões de foco e lembretes de tarefas
 */
function checkNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            console.log("Permissão para notificações:", permission);
        });
    }
}

/**
 * Listener para eventos de alteração no localStorage
 * Atualiza a interface quando dados são modificados em outras abas
 */
window.addEventListener('storage', function(event) {
    console.log("Storage event detectado em inicio.js: ", event.key); // Debug
    
    // Atualiza as tarefas quando a lista de tarefas é modificada
    if (event.key === 'studyTasks') {
        loadTarefasAgendadas();
    }
    
    // Atualiza informações de tempo de foco quando as sessões são modificadas
    if (event.key === 'focusSessions') {
        loadTempoFocoHoje();
        initProgressoSemanaChart(); // Recalcula o gráfico
        loadTempoMedioEstudoSemana();
    }
    
    // Atualiza os próximos eventos quando o calendário é modificado
    if (event.key === 'studySchedule') {
        loadProximosEventos();
    }
    
    // Atualiza o nome do usuário quando ele é modificado
    if (event.key === 'loggedInUserName') {
        loadUserName();
    }
});

/**
 * Listener para o evento 'pageshow'
 * Garante que a frase motivacional seja atualizada ao navegar de volta para a página de início
 */
window.addEventListener('pageshow', function(event) {
    // Verifica se a página está sendo exibida a partir do cache de navegação (bfcache)
    // ou se é uma navegação normal. Em ambos os casos, atualiza a frase.
    if (event.persisted || performance.navigation.type === performance.navigation.TYPE_NAVIGATE) {
        loadMotivationalPhrase();
    }
});