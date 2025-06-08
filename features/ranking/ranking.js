document.addEventListener("DOMContentLoaded", () => {
    const rankingList = document.getElementById("rankingList");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const rankingTitleElement = document.getElementById("rankingTitle");
    const achievementsGrid = document.getElementById("achievementsGrid");
    const achievementsSection = document.getElementById("achievementsSection");
    const totalUsersElement = document.getElementById("totalUsers");
    const topScoreElement = document.getElementById("topScore");
    const yourPositionElement = document.getElementById("yourPosition");

    // --- Constantes ---
    const CONSTANTS = {
        USER_DATA_KEY: "usuarioLogado",
        FOCUS_STATS_KEY: "userFocusStats",
        ACHIEVEMENTS_KEY: "userAchievements",
        DEFAULT_AVATAR: "../../shared/assets/avatars/frog.png",
        ANIMAL_AVATARS: [
            "../../shared/assets/avatars/lion.png", "../../shared/assets/avatars/bear.png",
            "../../shared/assets/avatars/tiger.png", "../../shared/assets/avatars/duck.png",
            "../../shared/assets/avatars/turtle.png", "../../shared/assets/avatars/hare.png",
            "../../shared/assets/avatars/fox.png", "../../shared/assets/avatars/owl.png",
            "../../shared/assets/avatars/wolf.png", "../../shared/assets/avatars/frog.png"
        ],
        INTELLIGENCE_LADDER: [
            { threshold: 5000, title: "Lenda Suprema" }, { threshold: 3000, title: "Gênio" },
            { threshold: 1500, title: "Sábio" }, { threshold: 700, title: "Mestre" },
            { threshold: 300, title: "Inteligente" }, { threshold: 100, title: "Aplicado" },
            { threshold: 0, title: "Iniciante" }
        ]
    };

    // --- Definição das Conquistas ---
    const achievementsDefinition = {
        first_focus_session: {
            title: "Foco Inicial",
            description: "Conclua sua primeira sessão de foco.",
            icon: "fa-bullseye",
            condition: (stats) => stats.totalFocusSessions >= 1
        },
        ten_focus_sessions: {
            title: "Dez Sessões",
            description: "Conclua 10 sessões de foco.",
            icon: "fa-hourglass-half",
            condition: (stats) => stats.totalFocusSessions >= 10
        },
        fifty_focus_sessions: {
            title: "Mestre do Foco",
            description: "Conclua 50 sessões de foco.",
            icon: "fa-hourglass-end",
            condition: (stats) => stats.totalFocusSessions >= 50
        },
        hundred_focus_sessions: {
            title: "Centurião do Foco",
            description: "Conclua 100 sessões de foco.",
            icon: "fa-hourglass",
            condition: (stats) => stats.totalFocusSessions >= 100
        },
        points_milestone_100: {
            title: "Centena de Pontos",
            description: "Acumule 100 pontos.",
            icon: "fa-star",
            condition: (stats) => stats.totalPoints >= 100
        },
        points_milestone_500: {
            title: "Meio Milhar",
            description: "Acumule 500 pontos.",
            icon: "fa-star-half-alt",
            condition: (stats) => stats.totalPoints >= 500
        },
        points_milestone_1000: {
            title: "Mil Pontos",
            description: "Acumule 1000 pontos.",
            icon: "fa-trophy",
            condition: (stats) => stats.totalPoints >= 1000
        },
        first_hour_focused: {
            title: "Hora Concentrada",
            description: "Acumule 1 hora de foco total.",
            icon: "fa-clock",
            condition: (stats) => stats.totalFocusTimeMinutes >= 60
        },
        ten_hours_focused: {
            title: "Dez Horas de Dedicação",
            description: "Acumule 10 horas de foco total.",
            icon: "fa-business-time",
            condition: (stats) => stats.totalFocusTimeMinutes >= 600
        }
    };

    // --- Estado ---
    const state = {
        allUsersData: [],
        loggedInUserData: null,
        currentFilter: "points",
        userAchievements: {}
    };

    // --- Funções de Carregamento e Inicialização ---
    function loadLoggedInUserData() {
        console.log("[Ranking] Carregando dados do usuário logado...");
        const userDataString = localStorage.getItem(CONSTANTS.USER_DATA_KEY);
        const focusStatsString = localStorage.getItem(CONSTANTS.FOCUS_STATS_KEY);
        let userData = null;
        let focusStats = { totalPoints: 0, totalFocusTimeMinutes: 0, totalFocusSessions: 0 };

        if (userDataString) {
            try {
                userData = JSON.parse(userDataString);
                userData.avatar = userData.avatar || CONSTANTS.DEFAULT_AVATAR;
            } catch (e) { console.error("[Ranking] Erro ao parsear usuarioLogado:", e); userData = null; }
        }
        if (focusStatsString) {
            try {
                const parsedStats = JSON.parse(focusStatsString);
                focusStats.totalPoints = parsedStats.totalPoints || 0;
                focusStats.totalFocusTimeMinutes = parsedStats.totalFocusTimeMinutes || 0;
                focusStats.totalFocusSessions = parsedStats.totalFocusSessions || 0;
            } catch (e) { console.error("[Ranking] Erro ao parsear userFocusStats:", e); }
        }

        if (userData) {
            state.loggedInUserData = {
                name: userData.username || "Usuário",
                points: focusStats.totalPoints,
                hours: parseFloat((focusStats.totalFocusTimeMinutes / 60).toFixed(1)),
                focusSessions: focusStats.totalFocusSessions,
                avatar: userData.avatar,
                isCurrentUser: true
            };
            console.log("[Ranking] Dados combinados do usuário logado:", state.loggedInUserData);
            return state.loggedInUserData;
        } else {
            console.warn("[Ranking] Nenhum usuário logado encontrado.");
            state.loggedInUserData = null;
            return null;
        }
    }

    function generateDummyUsers() {
        const users = [];
        const firstNames = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Fábio", "Gabriela", "Hugo", "Isabela", "Jorge", "Larissa", "Marcos", "Natália", "Otávio", "Patrícia", "Quésia", "Rafael", "Sandra", "Tiago", "Úrsula", "Vinícius", "Wanessa"];
        const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Costa", "Martins", "Gomes", "Ribeiro", "Carvalho"];
        CONSTANTS.INTELLIGENCE_LADDER.forEach(level => {
            for (let i = 0; i < 9; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const minPoints = level.threshold;
                const nextLevel = CONSTANTS.INTELLIGENCE_LADDER.find(l => l.threshold > minPoints);
                const maxPoints = nextLevel ? nextLevel.threshold - 1 : minPoints + 500;
                const points = level.threshold === 0 ? Math.floor(Math.random() * (CONSTANTS.INTELLIGENCE_LADDER[CONSTANTS.INTELLIGENCE_LADDER.length - 2].threshold -1)) : Math.floor(minPoints + Math.random() * (maxPoints - minPoints + 1));
                const hours = parseFloat((points / 50 + Math.random() * 5).toFixed(1));
                const focusSessions = Math.floor(points / 15 + Math.random() * 15);
                users.push({ name: `${firstName} ${lastName}`, points, hours, focusSessions, avatar: CONSTANTS.ANIMAL_AVATARS[Math.floor(Math.random() * CONSTANTS.ANIMAL_AVATARS.length)], isCurrentUser: false });
            }
        });
        return users;
    }

    function combineUsers() {
        const dummyUsers = generateDummyUsers();
        const loggedInUser = state.loggedInUserData;
        if (loggedInUser) {
            const filteredDummies = dummyUsers.filter(u => u.name !== loggedInUser.name);
            state.allUsersData = [...filteredDummies, loggedInUser];
        } else {
            state.allUsersData = dummyUsers;
        }
    }

    function initializeRankingPage() {
        console.log("[Ranking] Inicializando página...");
        // Garante que os elementos do DOM existem antes de prosseguir
        if (!rankingList || !achievementsGrid || !achievementsSection || !totalUsersElement || !topScoreElement || !yourPositionElement) {
            console.error("[Ranking] Erro crítico: Elementos essenciais do DOM não encontrados. Abortando inicialização.");
            if(rankingList) rankingList.innerHTML = "<p>Erro ao carregar o ranking. Elementos da página não encontrados.</p>";
            if(achievementsGrid) achievementsGrid.innerHTML = "<p>Erro ao carregar conquistas.</p>";
            return; // Impede a execução se elementos cruciais faltarem
        }

        try {
            loadLoggedInUserData();
            loadAchievementsFromStorage();
            combineUsers();
            setupFilterButtons();
            if (state.loggedInUserData) {
                checkAndUnlockAchievements(state.loggedInUserData);
            }
            updateFilter(state.currentFilter);
            displayAchievements();
            console.log("[Ranking] Página inicializada com sucesso.");
        } catch (error) {
            console.error("[Ranking] Erro durante a inicialização:", error);
            if(rankingList) rankingList.innerHTML = `<p>Ocorreu um erro ao carregar o ranking: ${error.message}. Tente recarregar a página.</p>`;
            if(achievementsGrid) achievementsGrid.innerHTML = "<p>Erro ao carregar conquistas.</p>";
        }
    }

    // --- Funções de Conquistas ---
    function loadAchievementsFromStorage() {
        console.log("[Ranking] Carregando conquistas do localStorage...");
        try {
            const storedAchievements = localStorage.getItem(CONSTANTS.ACHIEVEMENTS_KEY);
            state.userAchievements = storedAchievements ? JSON.parse(storedAchievements) : {};
            console.log("[Ranking] Conquistas carregadas:", state.userAchievements);
        } catch (e) {
            console.error("[Ranking] Erro ao carregar conquistas do localStorage:", e);
            state.userAchievements = {};
        }
    }

    function saveAchievementsToStorage() {
        try {
            localStorage.setItem(CONSTANTS.ACHIEVEMENTS_KEY, JSON.stringify(state.userAchievements));
            console.log("[Ranking] Conquistas salvas no localStorage:", state.userAchievements);
        } catch (e) {
            console.error("[Ranking] Erro ao salvar conquistas no localStorage:", e);
        }
    }

    function checkAndUnlockAchievements(currentStats) {
        if (!currentStats) return;
        console.log("[Ranking] Verificando conquistas com stats:", currentStats);
        let newAchievementUnlocked = false;
        Object.keys(achievementsDefinition).forEach(id => {
            if (achievementsDefinition[id] && achievementsDefinition[id].condition && !state.userAchievements[id]) {
                if (achievementsDefinition[id].condition(currentStats)) {
                    console.log(`[Ranking] Desbloqueando conquista: ${id}`);
                    state.userAchievements[id] = { achievedDate: new Date().toISOString() };
                    newAchievementUnlocked = true;
                    showAchievementNotification(achievementsDefinition[id].title);
                }
            }
        });
        if (newAchievementUnlocked) {
            console.log("[Ranking] Novas conquistas desbloqueadas. Salvando...");
            saveAchievementsToStorage();
            displayAchievements();
        }
    }

    function displayAchievements() {
        console.log("[Ranking] Exibindo conquistas...");
        if (!achievementsGrid || !achievementsSection) return;
        achievementsGrid.innerHTML = "";
        achievementsSection.style.display = "block";
        if (Object.keys(achievementsDefinition).length === 0) {
             achievementsGrid.innerHTML = "<p>Nenhuma definição de conquista encontrada.</p>";
             return;
        }
        Object.keys(achievementsDefinition).forEach(id => {
            const achievement = achievementsDefinition[id];
            const unlockedData = state.userAchievements[id];
            const isUnlocked = !!unlockedData;
            const item = document.createElement("div");
            item.className = `achievement-item ${isUnlocked ? "unlocked" : "locked"}`;
            item.setAttribute("data-achievement-id", id);
            const description = achievement.description + (isUnlocked ? ` (Concluído em: ${new Date(unlockedData.achievedDate).toLocaleDateString("pt-BR")})` : " (Bloqueado)");
            item.setAttribute("title", description);
            item.innerHTML = `
                <i class="fas ${achievement.icon} icon"></i>
                <span class="title">${achievement.title}</span>
            `;
            achievementsGrid.appendChild(item);
        });
        console.log("[Ranking] Conquistas exibidas.");
    }

    function showAchievementNotification(achievementTitle) {
        const notification = document.createElement("div");
        notification.className = "achievement-notification";
        notification.innerHTML = `<i class="fas fa-award"></i> Conquista Desbloqueada: <strong>${achievementTitle}</strong>`;
        document.body.appendChild(notification);
        setTimeout(() => { notification.classList.add("show"); }, 100);
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    // --- Funções de Renderização e UI (Ranking) ---
    function getUserIntelligenceTitle(points) {
        for (let i = 0; i < CONSTANTS.INTELLIGENCE_LADDER.length; i++) {
            if (points >= CONSTANTS.INTELLIGENCE_LADDER[i].threshold) {
                return CONSTANTS.INTELLIGENCE_LADDER[i].title;
            }
        }
        return CONSTANTS.INTELLIGENCE_LADDER[CONSTANTS.INTELLIGENCE_LADDER.length - 1].title;
    }

    function formatRankingValue(value, type) {
        switch (type) {
            case "points": return `${value} Ponto${value !== 1 ? "s" : ""}`;
            case "hours":
                const hours = Math.floor(value);
                const minutes = Math.round((value - hours) * 60);
                return `${hours}h ${minutes > 0 ? minutes + "min" : ""}`.trim();
            case "focusSessions": return `${value} Sess${value !== 1 ? "ões" : "ão"} de Foco`;
            default: return value;
        }
    }

    function updateRankingStatsDisplay(usersInCurrentLevel, sortBy) {
        if (!totalUsersElement || !topScoreElement || !yourPositionElement) return;
        if (!state.loggedInUserData) {
            totalUsersElement.textContent = "0"; topScoreElement.textContent = "-"; yourPositionElement.textContent = "-";
            return;
        }
        const currentUserIndex = usersInCurrentLevel.findIndex(user => user.isCurrentUser);
        const totalUsers = usersInCurrentLevel.length;
        const topScore = totalUsers > 0 ? usersInCurrentLevel[0][sortBy] : 0;
        const userPosition = currentUserIndex !== -1 ? currentUserIndex + 1 : null;
        totalUsersElement.textContent = totalUsers;
        topScoreElement.textContent = formatRankingValue(topScore, sortBy);
        yourPositionElement.textContent = userPosition ? `#${userPosition}` : "-";
    }

    function renderGroupedRanking(sortBy) {
        console.log(`[Ranking] Renderizando ranking por ${sortBy}...`);
        if (!rankingList) return;
        rankingList.innerHTML = ""; // Limpa antes de renderizar

        if (!state.loggedInUserData) {
            rankingList.innerHTML = "<p>Faça login para ver seu ranking.</p>";
            updateRankingStatsDisplay([], sortBy);
            return;
        }

        try {
            const currentUserTitle = getUserIntelligenceTitle(state.loggedInUserData.points);
            console.log(`[Ranking] Faixa do usuário logado: ${currentUserTitle}`);

            const usersInSameLevel = state.allUsersData
                .filter(user => getUserIntelligenceTitle(user.points) === currentUserTitle)
                .sort((a, b) => b[sortBy] - a[sortBy]);

            console.log(`[Ranking] Usuários na faixa ${currentUserTitle} (${sortBy}): ${usersInSameLevel.length}`);

            const groupTitleElement = document.createElement("h3");
            groupTitleElement.className = "ranking-group-title";
            groupTitleElement.textContent = `Ranking ${currentUserTitle}`;
            rankingList.appendChild(groupTitleElement);

            if (usersInSameLevel.length > 0) {
                usersInSameLevel.forEach((user, index) => {
                    const position = index + 1;
                    const card = document.createElement("div");
                    card.className = `ranking-card ${position <= 3 ? `top${position}` : ""} ${user.isCurrentUser ? "your-ranking" : ""}`;
                    let medalIcon = "";
                    if (position === 1) medalIcon = `<i class="fas fa-medal medal-gold" aria-hidden="true"></i>`;
                    if (position === 2) medalIcon = `<i class="fas fa-medal medal-silver" aria-hidden="true"></i>`;
                    if (position === 3) medalIcon = `<i class="fas fa-medal medal-bronze" aria-hidden="true"></i>`;
                    const avatarPath = user.avatar || CONSTANTS.DEFAULT_AVATAR;

                    // CORREÇÃO: Removidos os escapes desnecessários dentro do template literal
                    card.innerHTML = `
                        <div class="position">${medalIcon} ${position}</div>
                        <div class="profile-avatar-container">
                            <img src="${avatarPath}" alt="Avatar de ${user.name}" class="profile-avatar" onerror="this.onerror=null; this.src='${CONSTANTS.DEFAULT_AVATAR}'">
                        </div>
                        <div class="user-details">
                            <div class="user-name">${user.name}${user.isCurrentUser ? ' <span class="you-indicator">(Você)</span>' : ''}</div>
                            <div class="user-score">${formatRankingValue(user[sortBy], sortBy)}</div>
                        </div>`;
                    rankingList.appendChild(card);
                });
            } else {
                rankingList.innerHTML += "<p>Nenhum usuário nesta faixa de ranking ainda.</p>";
            }

            const nextLevel = CONSTANTS.INTELLIGENCE_LADDER.find(level => state.loggedInUserData.points < level.threshold);
            if (nextLevel) {
                const pointsNeeded = nextLevel.threshold - state.loggedInUserData.points;
                const message = document.createElement("div");
                message.className = "ranking-message";
                message.innerHTML = `<p>Você precisa de mais <strong>${pointsNeeded} pontos</strong> para avançar para o ranking <strong>${nextLevel.title}</strong>!</p>`;
                rankingList.appendChild(message);
            }
            updateRankingStatsDisplay(usersInSameLevel, sortBy);
            console.log(`[Ranking] Ranking por ${sortBy} renderizado com sucesso.`);

        } catch (error) {
            console.error(`[Ranking] Erro ao renderizar ranking por ${sortBy}:`, error);
            rankingList.innerHTML = `<p>Ocorreu um erro ao renderizar o ranking: ${error.message}.</p>`;
            updateRankingStatsDisplay([], sortBy); // Limpa stats em caso de erro
        }
    }

    function updateFilter(filterType) {
        console.log(`[Ranking] Atualizando filtro para: ${filterType}`);
        state.currentFilter = filterType;
        filterBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.filter === filterType));
        const titles = { points: "Ranking por Pontos", hours: "Ranking por Horas de Foco", focusSessions: "Ranking por Sessões de Foco" };
        if (rankingTitleElement) rankingTitleElement.textContent = titles[filterType] || "Ranking Geral";
        renderGroupedRanking(filterType);
    }

    function setupFilterButtons() {
        filterBtns.forEach(btn => btn.addEventListener("click", () => updateFilter(btn.dataset.filter)));
    }

    // --- Event Listeners Globais --- //
    function handleUserUpdate(event) {
        console.log("[Ranking] Evento userUpdated recebido:", event.detail);
        const updatedUserData = event.detail?.userData;
        if (updatedUserData && state.loggedInUserData) {
            state.loggedInUserData.name = updatedUserData.username || state.loggedInUserData.name;
            state.loggedInUserData.avatar = updatedUserData.avatar || state.loggedInUserData.avatar;
            combineUsers();
            renderGroupedRanking(state.currentFilter);
        } else if (updatedUserData && !state.loggedInUserData) {
             initializeRankingPage();
        }
    }

    function handleFocusDataUpdate(event) {
        console.log("[Ranking] Evento focusDataUpdated recebido:", event.detail);
        const stats = event.detail?.stats;
        if (stats && state.loggedInUserData) {
            state.loggedInUserData.points = stats.totalPoints || 0;
            state.loggedInUserData.hours = parseFloat((stats.totalFocusTimeMinutes / 60).toFixed(1)) || 0;
            state.loggedInUserData.focusSessions = stats.totalFocusSessions || 0;
            console.log("[Ranking] Estado do usuário logado atualizado (foco/pontos):", state.loggedInUserData);
            checkAndUnlockAchievements(stats);
            combineUsers();
            renderGroupedRanking(state.currentFilter);
        } else if (stats && !state.loggedInUserData) {
            initializeRankingPage();
        }
    }

    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("focusDataUpdated", handleFocusDataUpdate);
    window.addEventListener("storage", (event) => {
        if ([CONSTANTS.USER_DATA_KEY, CONSTANTS.FOCUS_STATS_KEY, CONSTANTS.ACHIEVEMENTS_KEY].includes(event.key)) {
            console.log(`[Ranking] Detectada mudança externa no localStorage (${event.key}). Recarregando...`);
            initializeRankingPage();
        }
    });

    // --- Inicialização --- //
    initializeRankingPage();
});

