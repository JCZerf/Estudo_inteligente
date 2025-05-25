document.addEventListener("DOMContentLoaded", () => {
    // Elementos do DOM
    const rankingList = document.getElementById("rankingList");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const rankingTitleElement = document.getElementById("rankingTitle");
    const achievementsGrid = document.getElementById("achievementsGrid");
    const userNameElement = document.getElementById("userName");
    const achievementsSection = document.getElementById("achievementsSection");

    // Dados do usuário (do localStorage)
    const userTotalPoints = parseInt(localStorage.getItem("userTotalPoints")) || 0;
    const userTotalHours = parseFloat(localStorage.getItem("userTotalFocusHours")) || 0;
    // ALTERADO: Busca sessões de foco concluídas em vez de tarefas
    const userCompletedFocusSessions = parseInt(localStorage.getItem("completedFocusSessionsCount")) || 0;
    let userAvatarPath = "../../shared/assets/avatars/lion.png"; // valor padrão

    const userDataString = localStorage.getItem("usuarioLogado");
            if (userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                if (userData.avatar) {
                userAvatarPath = userData.avatar;
                }
            } catch (e) {
                console.error("Erro ao carregar avatar do ranking:", e);
            }
        }

    function getLoggedInUserName() {
    try {
        const userData = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (userData && userData.username) {
            return userData.username;
        }
        return localStorage.getItem("userName") || "Usuário";
    } catch (e) {
        return localStorage.getItem("userName") || "Usuário";
    }
}

let loggedInUserName = getLoggedInUserName(); // Mantenha esta linha

    // Escada da Inteligência
    const intelligenceLadder = [
        { threshold: 5000, title: "Lenda Suprema" },
        { threshold: 3000, title: "Gênio" },
        { threshold: 1500, title: "Sábio" },
        { threshold: 700, title: "Mestre" },
        { threshold: 300, title: "Inteligente" },
        { threshold: 100, title: "Aplicado" },
        { threshold: 0, title: "Iniciante" }
    ];

    // Gerar pelo menos 10 usuários fictícios por faixa
    function generateDummyUsers() {
        const users = [];
        const firstNames = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Fábio", "Gabriela", "Hugo", 
                          "Isabela", "Jorge", "Larissa", "Marcos", "Natália", "Otávio", "Patrícia",
                          "Quésia", "Rafael", "Sandra", "Tiago", "Úrsula", "Vinícius", "Wanessa"];
        const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", 
                          "Pereira", "Lima", "Costa", "Martins", "Gomes", "Ribeiro", "Carvalho"];
        const animalAvatarPaths = [
            "../../shared/assets/avatars/lion.png",
            "../../shared/assets/avatars/bear.png",
            "../../shared/assets/avatars/tiger.png",
            "../../shared/assets/avatars/duck.png",
            "../../shared/assets/avatars/turtle.png",
            "../../shared/assets/avatars/hare.png",
            "../../shared/assets/avatars/fox.png",
            "../../shared/assets/avatars/owl.png",
            "../../shared/assets/avatars/wolf.png",
            "../../shared/assets/avatars/frog.png"
        ];

        // Gerar exatamente 10 usuários para cada faixa
        intelligenceLadder.forEach(level => {
            const usersInLevel = 9; // Fixo em 9 usuários por faixa
            
            for (let i = 0; i < usersInLevel; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                
                // Gera pontos dentro da faixa atual
                const minPoints = level.threshold;
                const nextLevel = intelligenceLadder.find(l => l.threshold > minPoints);
                const maxPoints = nextLevel ? nextLevel.threshold - 1 : minPoints * 2;
                
                // Garante que o último nível (Iniciante) tenha pontos entre 0 e 100
                const points = level.threshold === 0 ? 
                    Math.floor(Math.random() * 100) :
                    Math.floor(minPoints + Math.random() * (maxPoints - minPoints));
                
                // Gera horas e SESSÕES DE FOCO proporcionalmente aos pontos
                const hours = parseFloat((points / 50 + Math.random() * 5).toFixed(1));
                const focusSessions = Math.floor(points / 15 + Math.random() * 15); // Ajuste na proporção

                users.push({
                    name: `${firstName} ${lastName}`,
                    points: points,
                    hours: hours,
                    focusSessions: focusSessions, // ALTERADO: tasks -> focusSessions
                    avatar: animalAvatarPaths[Math.floor(Math.random() * animalAvatarPaths.length)]
                });
            }
        });
        
        return users;
    }

    // Dados dos usuários (70 fictícios + usuário logado)
    const dummyUsers = generateDummyUsers();
    let allUsersData = [
        ...dummyUsers,
        {
            name: loggedInUserName,
            points: userTotalPoints,
            hours: userTotalHours,
            focusSessions: userCompletedFocusSessions, // ALTERADO: tasks -> focusSessions
            avatar: userAvatarPath,
            isCurrentUser: true
        }
    ];

    // Sincroniza o nome do usuário em todos os lugares
function syncUserName() {
    const currentName = getLoggedInUserName(); // Usa a nova função
    const currentUser = allUsersData.find(u => u.isCurrentUser);
    
    if (currentUser) {
        currentUser.name = currentName;
        loggedInUserName = currentName;
        
        if (userNameElement) {
            userNameElement.textContent = currentName;
        }
        
        const activeFilter = document.querySelector(".filter-btn.active")?.dataset.filter || "points";
        renderGroupedRanking(allUsersData, activeFilter);
}
}



    // Atualiza o nome do usuário no header
    function updateUserName() {
        syncUserName();
    }

    // Funções auxiliares
    function getUserIntelligenceTitle(points) {
        for (let i = 0; i < intelligenceLadder.length; i++) {
            if (points >= intelligenceLadder[i].threshold) {
                return intelligenceLadder[i].title;
            }
        }
        return intelligenceLadder[intelligenceLadder.length - 1].title;
    }

    function formatRankingValue(value, type) {
        switch (type) {
            case "points": return `${value} Ponto${value !== 1 ? "s" : ""}`;
            case "hours":
                const hours = Math.floor(value);
                const minutes = Math.round((value - hours) * 60);
                return `${hours}h ${minutes > 0 ? minutes + "min" : ""}`.trim();
            // ALTERADO: tasks -> focusSessions
            case "focusSessions": return `${value} Sess${value !== 1 ? "ões" : "ão"} de Foco`;
            default: return value;
        }
    }

    // Atualiza as estatísticas do ranking
    function updateRankingStats(usersData, sortBy) {
        const currentUser = usersData.find(user => user.isCurrentUser);
        if (!currentUser) return;

        const currentTitle = getUserIntelligenceTitle(currentUser.points);
        const usersInSameLevel = usersData.filter(user => 
            getUserIntelligenceTitle(user.points) === currentTitle
        );

        const totalUsers = usersInSameLevel.length;
        const topScore = Math.max(...usersInSameLevel.map(user => user[sortBy]));
        const sortedUsers = [...usersInSameLevel].sort((a, b) => b[sortBy] - a[sortBy]);
        const userPosition = sortedUsers.findIndex(user => user.isCurrentUser) + 1;
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('topScore').textContent = formatRankingValue(topScore, sortBy);
        document.getElementById('yourPosition').textContent = userPosition > 0 ? `#${userPosition}` : '-';
    }

    // Renderiza o ranking por faixa
    function renderGroupedRanking(usersData, sortBy) {
        if (!rankingList) return;
        
        rankingList.innerHTML = "";
        
        const currentUser = usersData.find(u => u.isCurrentUser);
        if (!currentUser) {
            rankingList.innerHTML = "<p>Nenhum dado de usuário disponível.</p>";
            return;
        }

        // Encontra a faixa atual do usuário
        const currentTitle = getUserIntelligenceTitle(currentUser.points);
        
        // Filtra apenas usuários na mesma faixa
        const usersInSameLevel = usersData.filter(user => 
            getUserIntelligenceTitle(user.points) === currentTitle
        ).sort((a, b) => b[sortBy] - a[sortBy]);

        // Cria título do grupo
        const groupTitleElement = document.createElement("h3");
        groupTitleElement.className = "ranking-group-title";
        groupTitleElement.textContent = `Ranking ${currentTitle}`;
        rankingList.appendChild(groupTitleElement);

        // Renderiza os usuários
        usersInSameLevel.forEach((user, index) => {
            const position = index + 1;
            const card = document.createElement("div");
            card.className = "ranking-card";
            if (position === 1) card.classList.add("top1");
            if (position === 2) card.classList.add("top2");
            if (position === 3) card.classList.add("top3");
            if (user.isCurrentUser) card.classList.add("your-ranking");

            let medalIcon = "";
            if (position === 1) medalIcon = '<i class="fas fa-medal medal-gold" aria-hidden="true"></i>';
            if (position === 2) medalIcon = '<i class="fas fa-medal medal-silver" aria-hidden="true"></i>';
            if (position === 3) medalIcon = '<i class="fas fa-medal medal-bronze" aria-hidden="true"></i>';

            const avatarPath = user.avatar || "../../shared/assets/avatars/owl.png";

            card.innerHTML = `
                <div class="position">
                    ${medalIcon} ${position}
                </div>
                <div class="profile-avatar-container">
                    <img src="${avatarPath}" alt="Avatar de ${user.name}" class="profile-avatar">
                </div>
                <div class="user-details">
                    <div class="user-name">${user.name}${user.isCurrentUser ? ' <span class="you-indicator">(Você)</span>' : ''}</div>
                    <div class="user-score">${formatRankingValue(user[sortBy], sortBy)}</div>
                </div>
            `;
            rankingList.appendChild(card);
        });

        // Adiciona mensagem sobre próximas faixas
        if (usersInSameLevel.length > 0) {
            const nextLevel = intelligenceLadder.find(level => 
                currentUser.points < level.threshold
            );
            
            if (nextLevel) {
                const pointsNeeded = nextLevel.threshold - currentUser.points;
                const message = document.createElement("div");
                message.className = "ranking-message";
                message.innerHTML = `
                    <p>Você precisa de mais <strong>${pointsNeeded} pontos</strong> 
                    para avançar para o ranking <strong>${nextLevel.title}</strong>!</p>
                `;
                rankingList.appendChild(message);
            }
        }
    }

    // Atualiza o filtro ativo
    function updateFilter(filterType) {
        filterBtns.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.filter === filterType);
        });
        
        const titles = {
            points: "Ranking por Pontos",
            hours: "Ranking por Horas de Foco", 
            // ALTERADO: tasks -> focusSessions
            focusSessions: "Ranking por Sessões de Foco"
        };
        
        if (rankingTitleElement) {
            rankingTitleElement.textContent = titles[filterType] || "Ranking Geral";
        }
        renderGroupedRanking(allUsersData, filterType);
        updateRankingStats(allUsersData, filterType);
    }

    // Conquistas
    const achievementsDefinition = {
        first_focus_task: { title: "Foco Inicial", description: "Conclua sua primeira tarefa usando uma sessão de foco.", icon: "fa-bullseye" },
        task_master_1: { title: "Primeira Conclusão", description: "Conclua sua primeira tarefa.", icon: "fa-check" },
        task_master_10: { title: "Dez Tarefas", description: "Conclua 10 tarefas.", icon: "fa-tasks" },
        task_master_50: { title: "Mestre das Tarefas", description: "Conclua 50 tarefas.", icon: "fa-clipboard-check" },
        points_milestone_100: { title: "Centena de Pontos", description: "Acumule 100 pontos de estudo.", icon: "fa-star" },
        points_milestone_500: { title: "Meio Milhar", description: "Acumule 500 pontos de estudo.", icon: "fa-star-half-alt" },
        points_milestone_1000: { title: "Gênio dos Pontos", description: "Acumule 1000 pontos de estudo.", icon: "fa-trophy" },
        perfect_week: { title: "Semana Perfeita", description: "Estude com foco todos os dias por uma semana.", icon: "fa-calendar-check" },
        marathon_runner: { title: "Maratonista", description: "Complete uma sessão de foco de 2 horas ou mais.", icon: "fa-running" },
    };

    function loadAndDisplayAchievements() {
        if (!achievementsGrid || !achievementsSection) return;
        achievementsGrid.innerHTML = ""; 
        achievementsSection.style.display = "block";
        const userAchievements = JSON.parse(localStorage.getItem("userAchievements")) || {};

        Object.keys(achievementsDefinition).forEach(id => {
            const achievement = achievementsDefinition[id];
            const isUnlocked = userAchievements[id];
            const item = document.createElement("div");
            item.className = `achievement-item ${isUnlocked ? "unlocked" : "locked"}`;
            item.setAttribute("data-achievement-id", id);
            item.setAttribute("data-description", achievement.description + (isUnlocked ? ` (Concluído em: ${new Date(userAchievements[id].achievedDate).toLocaleDateString()})` : " (Bloqueado)"));
            item.innerHTML = `
                <i class="fas ${achievement.icon} icon"></i>
                <span class="title">${achievement.title}</span>
            `;
            achievementsGrid.appendChild(item);
        });
    }
        // Função para sincronizar o nome em todos os lugares
function syncUserName() {
    // Atualiza no array de dados
    const currentUser = allUsersData.find(u => u.isCurrentUser);
    if (currentUser) {
        currentUser.name = loggedInUserName;
    }
    
    // Atualiza no header
    if (userNameElement) {
        userNameElement.textContent = loggedInUserName;
    }
    
    // Atualiza no localStorage
    localStorage.setItem("userName", loggedInUserName);
    
    // Força atualização do ranking
    const activeFilter = document.querySelector(".filter-btn.active")?.dataset.filter || "points";
    renderGroupedRanking(allUsersData, activeFilter);
}


    // Event Listeners
    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            updateFilter(btn.dataset.filter);
        });
    });

    // Listeners para atualizações
    window.addEventListener("userPointsChanged", (event) => {
        const currentUser = allUsersData.find(u => u.isCurrentUser);
        if (currentUser) {
            currentUser.points = event.detail.newTotalPoints;
            localStorage.setItem("userTotalPoints", event.detail.newTotalPoints);
        }
        const activeFilter = document.querySelector(".filter-btn.active")?.dataset.filter || "points";
        renderGroupedRanking(allUsersData, activeFilter);
        updateRankingStats(allUsersData, activeFilter);
        updateUserName();
    });

    window.addEventListener("userFocusHoursChanged", (event) => {
        const currentUser = allUsersData.find(u => u.isCurrentUser);
        if (currentUser) {
            currentUser.hours = event.detail.newTotalHours;
            localStorage.setItem("userTotalFocusHours", event.detail.newTotalHours);
        }
        const activeFilter = document.querySelector(".filter-btn.active")?.dataset.filter || "points";
        renderGroupedRanking(allUsersData, activeFilter);
        updateRankingStats(allUsersData, activeFilter);
    });

    window.addEventListener("completedTasksChanged", (event) => {
        const currentUser = allUsersData.find(u => u.isCurrentUser);
        if (currentUser) {
            currentUser.tasks = event.detail.count;
            localStorage.setItem("completedTasksCount", event.detail.count);
        }
        const activeFilter = document.querySelector(".filter-btn.active")?.dataset.filter || "points";
        renderGroupedRanking(allUsersData, activeFilter);
        updateRankingStats(allUsersData, activeFilter);
    });

        // Atualização do event listener
window.addEventListener("userNameChanged", (event) => {
    // Atualiza ambos os sistemas de armazenamento
    localStorage.setItem("userName", event.detail.newName);
    
    try {
        const userData = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
        userData.username = event.detail.newName;
        localStorage.setItem('usuarioLogado', JSON.stringify(userData));
    } catch (e) {
        console.error("Erro ao atualizar usuarioLogado", e);
    }
    
    syncUserName();
});

    window.addEventListener("achievementUnlocked", () => {
        loadAndDisplayAchievements();
    });

    // Inicialização
    updateUserName();
    updateFilter("points");
    loadAndDisplayAchievements();
});

syncUserName();
