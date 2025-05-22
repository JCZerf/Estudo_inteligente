/**
 * Script JavaScript para a página de Ranking
 * Gerencia a interação com os filtros e atualização dinâmica das horas de estudo
 */

document.addEventListener("DOMContentLoaded", function () {
    // Configura os botões de filtro do ranking
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => {
        button.addEventListener("click", function () {
            // Remove a classe 'active' de todos os botões
            filterButtons.forEach(btn => btn.classList.remove("active"));
            // Adiciona a classe 'active' apenas ao botão clicado
            this.classList.add("active");
            
            // Comentário sobre funcionalidade futura:
            // Aqui seria implementada a lógica para filtrar o ranking por período
            // loadRankingData(this.textContent.trim()); 
            // Como os dados são estáticos exceto o do usuário, não há muito o que filtrar nesta versão
        });
    });

    // Atualiza as horas de estudo do usuário atual (Joaquim Silva)
    updateJoaquimSilvaHours();

    // Configura eventos relacionados ao tema (claro/escuro)
    document.addEventListener("themeChanged", updateRankingTheme);
    updateRankingTheme(); // Aplica o tema atual ao carregar a página
});

/**
 * Atualiza as horas de estudo do usuário Joaquim Silva
 * Calcula o tempo total com base nas sessões de foco armazenadas no localStorage
 */
function updateJoaquimSilvaHours() {
    // Encontra o elemento que exibe as horas do usuário
    const joaquimHoursElement = document.querySelector(".your-ranking .user-hours");
    if (!joaquimHoursElement) return;

    let totalMinutesFocused = 0;
    try {
        // Recupera todas as sessões de foco do localStorage
        const focusSessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
        focusSessions.forEach(session => {
            if (session.durationMinutes) { 
                // Soma a duração de todas as sessões de foco
                totalMinutesFocused += session.durationMinutes;
            }
        });
    } catch (e) {
        console.error("Erro ao carregar sessões de foco para o ranking:", e);
    }

    // Converte minutos totais para horas e minutos
    const totalHoursFocused = Math.floor(totalMinutesFocused / 60);
    const remainingMinutes = totalMinutesFocused % 60;
    
    // Formata o texto para exibição
    let hoursDisplay = `${totalHoursFocused} hora(s)`;
    if (remainingMinutes > 0) {
        hoursDisplay += ` e ${remainingMinutes} min`;
    }
    joaquimHoursElement.textContent = `${hoursDisplay} estudadas`;
}

/**
 * Atualiza o tema visual dos itens do ranking
 * Aplica o tema atual (claro/escuro) aos elementos da lista
 */
function updateRankingTheme() {
    // Obtém o tema atual do documento
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    
    // Aplica o tema a todos os itens do ranking
    const rankingItems = document.querySelectorAll(".ranking-item");
    rankingItems.forEach(item => {
        item.dataset.theme = theme;
    });
    // console.log(`Tema do ranking atualizado para: ${theme}`);
}

/**
 * Função para carregar dados do ranking (preparada para implementação futura)
 * Seria usada para buscar dados de uma API quando o ranking se tornar dinâmico
 * @param {string} filter - Filtro a ser aplicado (Geral, Semanal, Mensal)
 * @returns {Array} - Array vazio como simulação
 */
async function loadRankingData(filter = "Geral") {
    // Simulação de requisição a uma API
    // console.log(`Carregando ranking: ${filter}`);
    
    // Código comentado para implementação futura:
    // const response = await fetch(`/api/ranking?filter=${filter}`);
    // const data = await response.json();
    // renderRanking(data);
    
    return []; // Retorno simulado
}

/**
 * Renderiza os dados do ranking na interface
 * Função preparada para quando o ranking se tornar totalmente dinâmico
 * @param {Array} data - Array com dados dos usuários para o ranking
 */
function renderRanking(data) {
    const rankingList = document.querySelector(".ranking-list");
    if (!rankingList) return;
    rankingList.innerHTML = ""; // Limpa a lista atual

    // Cria elementos para cada usuário no ranking
    data.forEach((user, index) => {
        const rankingItem = document.createElement("div");
        // Adiciona classes especiais para os três primeiros colocados
        rankingItem.className = `ranking-item ${index < 3 ? "top" + (index + 1) : ""}`;
        rankingItem.innerHTML = `
            <div class="position">${index + 1}</div>
            <img src="${user.photo}" alt="${user.name}" class="profile-pic">
            <div class="user-details">
                <div class="user-name">${user.name}</div>
                <div class="user-hours">${user.hours} horas estudadas</div>
            </div>
            ${index === 0 ? 
                "<img src=\"../img/trofeu.jpg\" alt=\"Troféu\" class=\"trophy\">" 
                : 
                ""}
        `;
        rankingList.appendChild(rankingItem);
    });

    // Código comentado para implementação futura:
    // Adiciona o ranking do usuário Joaquim Silva manualmente se não vier da API
    // Esta parte seria removida se os dados viessem completos da API
    const joaquimData = {
        name: "Joaquim Silva",
        photo: "../img/joaquim.jpg",
        position: "-" // Posição pode ser calculada ou vir da API
    };
    const joaquimRankingItem = document.createElement("div");
    joaquimRankingItem.className = "ranking-item your-ranking";
    joaquimRankingItem.innerHTML = `
        <div class="position" id="joaquimPosition">${joaquimData.position}</div>
        <img src="${joaquimData.photo}" alt="${joaquimData.name}" class="profile-pic">
        <div class="user-details">
            <div class="user-name">${joaquimData.name}</div>
            <div class="user-hours" id="joaquimHours">0 horas estudadas</div>
        </div>
    `;
    // rankingList.appendChild(joaquimRankingItem);
    // updateJoaquimSilvaHours(); // Chama para atualizar as horas do Joaquim
}

// Chamada inicial para carregar o ranking (comentada, para implementação futura)
// loadRankingData();
