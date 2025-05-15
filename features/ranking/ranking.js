// RANKING JS - COM SUPORTE A TEMAS E HORAS DINÂMICAS

document.addEventListener("DOMContentLoaded", function () {
    // Configura filtros
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => {
        button.addEventListener("click", function () {
            filterButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            // Lógica de filtragem do ranking (se os dados fossem de API)
            // loadRankingData(this.textContent.trim()); 
            // Como os dados são estáticos exceto o do usuário, não há muito o que filtrar aqui ainda.
        });
    });

    // Atualiza horas do usuário Joaquim Silva
    updateJoaquimSilvaHours();

    // Configura eventos do tema
    document.addEventListener("themeChanged", updateRankingTheme);
    updateRankingTheme(); // Atualiza tema inicial
});

function updateJoaquimSilvaHours() {
    const joaquimHoursElement = document.querySelector(".your-ranking .user-hours");
    if (!joaquimHoursElement) return;

    let totalMinutesFocused = 0;
    try {
        const focusSessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
        focusSessions.forEach(session => {
            if (session.durationMinutes) { // Considera todas as sessões de foco para o total
                totalMinutesFocused += session.durationMinutes;
            }
        });
    } catch (e) {
        console.error("Erro ao carregar sessões de foco para o ranking:", e);
    }

    const totalHoursFocused = Math.floor(totalMinutesFocused / 60);
    const remainingMinutes = totalMinutesFocused % 60;
    
    // Formata para exibir horas e minutos, ou apenas horas se minutos for 0.
    let hoursDisplay = `${totalHoursFocused} hora(s)`;
    if (remainingMinutes > 0) {
        hoursDisplay += ` e ${remainingMinutes} min`;
    }
    joaquimHoursElement.textContent = `${hoursDisplay} estudadas`;
}

function updateRankingTheme() {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    const rankingItems = document.querySelectorAll(".ranking-item");
    rankingItems.forEach(item => {
        item.dataset.theme = theme;
    });
    // console.log(`Tema do ranking atualizado para: ${theme}`);
}

// As funções loadRankingData e renderRanking são mantidas caso o ranking se torne totalmente dinâmico no futuro.
// Por ora, apenas as horas do usuário logado (Joaquim Silva) são dinâmicas.
async function loadRankingData(filter = "Geral") {
    // Simulação de requisição
    // console.log(`Carregando ranking: ${filter}`);
    // Aqui você faria uma requisição real ao servidor
    // const response = await fetch(/api/ranking?filter=${filter});
    // const data = await response.json();
    // renderRanking(data);
    return []; // Retorno simulado
}

function renderRanking(data) {
    const rankingList = document.querySelector(".ranking-list");
    if (!rankingList) return;
    rankingList.innerHTML = ""; // Limpa a lista atual

    data.forEach((user, index) => {
        const rankingItem = document.createElement("div");
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

// Chamada inicial para carregar o ranking (se fosse dinâmico)
// loadRankingData();

