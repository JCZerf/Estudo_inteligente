document.addEventListener("DOMContentLoaded", () => {
    // --- Elementos DOM ---
    const DOM = {
        profileFullname: document.getElementById("profile-fullname"),
        profileEmail: document.getElementById("profile-email"),
        profileUsernameDisplay: document.getElementById("profile-username-display"),
        profileUsernameInput: document.getElementById("profile-username-input"),
        profileRanking: document.getElementById("profile-ranking"),
        profileAvatarImg: document.getElementById("profile-avatar-img"),
        profileJoinDate: document.getElementById("profile-joindate"),
        editUsernameBtn: document.getElementById("edit-username-btn"),
        saveUsernameBtn: document.getElementById("save-username-btn"),
        cancelUsernameBtn: document.getElementById("cancel-username-btn"),
        changeAvatarBtn: document.getElementById("change-avatar-btn"),
        avatarSelectionModal: document.getElementById("avatar-selection-modal"),
        closeAvatarModalBtn: document.getElementById("close-avatar-modal"),
        avatarOptionsContainer: document.getElementById("avatar-options"),
        confirmAvatarBtn: document.getElementById("confirm-avatar-btn")
    };

    // --- Constantes ---
    const CONSTANTS = {
        AVAILABLE_AVATARS: [
            "bear.png", "duck.png", "fox.png", "frog.png", "hare.png",
            "hippo.png", "lion.png", "owl.png", "tiger.png", "turtle.png", "wolf.png"
        ],
        AVATAR_BASE_PATH: "../../shared/assets/avatars/",
        USER_DATA_KEY: "usuarioLogado",
        RANKING_DATA_KEY: "rankingData",
        DEFAULT_AVATAR: "../../shared/assets/avatars/frog.png",
        DEFAULT_RANKING: "Iniciante"
    };

    // --- Estado ---
    const state = {
        currentUserData: {},
        selectedAvatarPath: null,
        originalUsername: ""
    };

    // --- Funções Principais ---

    /**
     * Carrega os dados do usuário e atualiza a UI
     */
    function loadUserProfile() {
        const storedData = localStorage.getItem(CONSTANTS.USER_DATA_KEY);
        
        if (storedData) {
            state.currentUserData = JSON.parse(storedData);
            
            // Garante que os campos essenciais existam
            if (!state.currentUserData.avatar) {
                state.currentUserData.avatar = CONSTANTS.DEFAULT_AVATAR;
            }
            if (!state.currentUserData.ranking) {
                state.currentUserData.ranking = CONSTANTS.DEFAULT_RANKING;
            }
            if (!state.currentUserData.joinDate) {
                state.currentUserData.joinDate = new Date().toISOString();
                saveUserData();
            }
            
            // Formata a data de cadastro
            const joinDate = new Date(state.currentUserData.joinDate);
            const formattedDate = joinDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Atualiza a UI
            DOM.profileFullname.textContent = state.currentUserData.nome || "Não informado";
            DOM.profileEmail.textContent = state.currentUserData.email || "Não informado";
            DOM.profileUsernameDisplay.textContent = state.currentUserData.username || "Não definido";
            DOM.profileRanking.textContent = state.currentUserData.ranking || CONSTANTS.DEFAULT_RANKING;
            DOM.profileJoinDate.textContent = formattedDate;
            DOM.profileAvatarImg.src = state.currentUserData.avatar || CONSTANTS.DEFAULT_AVATAR;
            
            // Fallback se o avatar não carregar
            DOM.profileAvatarImg.onerror = () => {
                DOM.profileAvatarImg.src = CONSTANTS.DEFAULT_AVATAR;
            };

            state.originalUsername = state.currentUserData.username || "";
        } else {
            console.warn("Dados do usuário não encontrados no localStorage");
            setupPlaceholderData();
        }

        switchToDisplayMode();
    }

    /**
     * Configura dados placeholder quando não há usuário logado
     */
    function setupPlaceholderData() {
        const placeholderDate = new Date().toLocaleDateString('pt-BR');
        
        state.currentUserData = {
            nome: "Usuário Não Logado",
            email: "email@exemplo.com",
            username: "naologado",
            avatar: CONSTANTS.DEFAULT_AVATAR,
            ranking: CONSTANTS.DEFAULT_RANKING,
            joinDate: new Date().toISOString()
        };
        
        DOM.profileFullname.textContent = state.currentUserData.nome;
        DOM.profileEmail.textContent = state.currentUserData.email;
        DOM.profileUsernameDisplay.textContent = state.currentUserData.username;
        DOM.profileRanking.textContent = state.currentUserData.ranking;
        DOM.profileJoinDate.textContent = placeholderDate;
        DOM.profileAvatarImg.src = CONSTANTS.DEFAULT_AVATAR;
        
        DOM.editUsernameBtn.disabled = true;
        DOM.changeAvatarBtn.disabled = true;
    }

    /**
     * Salva os dados do usuário no localStorage
     */
    function saveUserData() {
        localStorage.setItem(
            CONSTANTS.USER_DATA_KEY, 
            JSON.stringify(state.currentUserData)
        );
    }

    /**
     * Alterna para o modo de visualização do username
     */
    function switchToDisplayMode() {
        DOM.profileUsernameDisplay.classList.remove("hidden");
        DOM.editUsernameBtn.classList.remove("hidden");
        DOM.profileUsernameInput.classList.add("hidden");
        DOM.saveUsernameBtn.classList.add("hidden");
        DOM.cancelUsernameBtn.classList.add("hidden");
        DOM.profileUsernameInput.value = state.originalUsername;
    }

    /**
     * Alterna para o modo de edição do username
     */
    function switchToEditMode() {
        DOM.profileUsernameDisplay.classList.add("hidden");
        DOM.editUsernameBtn.classList.add("hidden");
        DOM.profileUsernameInput.classList.remove("hidden");
        DOM.saveUsernameBtn.classList.remove("hidden");
        DOM.cancelUsernameBtn.classList.remove("hidden");
        DOM.profileUsernameInput.value = state.originalUsername;
        DOM.profileUsernameInput.focus();
    }

    /**
     * Salva o username editado
     */
    function saveUsername() {
        const newUsername = DOM.profileUsernameInput.value.trim();
        
        if (!newUsername) {
            showAlert("Nome de usuário não pode ficar vazio.", "error");
            DOM.profileUsernameInput.focus();
            return;
        }
        
        if (newUsername !== state.originalUsername) {
            state.currentUserData.username = newUsername;
            saveUserData();
            
            DOM.profileUsernameDisplay.textContent = newUsername;
            state.originalUsername = newUsername;
            
            // Atualiza o ranking com o novo username
            updateRankingData(state.currentUserData.username, {
                username: newUsername
            });
            
            showAlert("Nome de usuário atualizado com sucesso!", "success");
            
            // Dispara eventos para atualizar outras partes do sistema
            window.dispatchEvent(new CustomEvent("userUpdated"));
        }
        
        switchToDisplayMode();
    }

    /**
     * Mostra um alerta temporário
     */
    function showAlert(message, type = "error") {
        const alert = document.createElement("div");
        alert.className = `alert ${type}`;
        
        const icon = type === "error" ? "exclamation-circle" : "check-circle";
        alert.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add("fade-out");
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    /**
     * Preenche o modal de seleção de avatar
     */
    function populateAvatarModal() {
        DOM.avatarOptionsContainer.innerHTML = "";
        state.selectedAvatarPath = state.currentUserData.avatar || CONSTANTS.DEFAULT_AVATAR;

        CONSTANTS.AVAILABLE_AVATARS.forEach(avatarFile => {
            const img = document.createElement("img");
            const fullPath = CONSTANTS.AVATAR_BASE_PATH + avatarFile;
            
            img.src = fullPath;
            img.alt = `Avatar ${avatarFile.split(".")[0]}`;
            img.classList.add("avatar-option");
            img.dataset.path = fullPath;

            if (fullPath === state.selectedAvatarPath) {
                img.classList.add("selected");
            }

            img.addEventListener("click", () => {
                document.querySelectorAll(".avatar-option.selected").forEach(el => {
                    el.classList.remove("selected");
                });
                img.classList.add("selected");
                state.selectedAvatarPath = img.dataset.path;
            });

            DOM.avatarOptionsContainer.appendChild(img);
        });
    }

// Função para abrir o modal
function openAvatarModal() {
    // Primeiro remove 'hidden', depois adiciona 'show'
    DOM.avatarSelectionModal.classList.remove("hidden");
    // Força um recálculo do layout
    void DOM.avatarSelectionModal.offsetWidth;
    DOM.avatarSelectionModal.classList.add("show");
    
    document.body.style.overflow = "hidden";
    populateAvatarModal();
}

// Função para fechar o modal
function closeAvatarModal() {
    // Primeiro remove 'show' para iniciar a animação
    DOM.avatarSelectionModal.classList.remove("show");
    
    // Depois de terminar a animação, adiciona 'hidden'
    setTimeout(() => {
        DOM.avatarSelectionModal.classList.add("hidden");
        document.body.style.overflow = "";
    }, 300); // 300ms deve corresponder à duração da transição no CSS
}

    /**
     * Confirma a seleção do avatar e atualiza os dados
     */
    function confirmAvatarSelection() {
        if (state.selectedAvatarPath && state.selectedAvatarPath !== state.currentUserData.avatar) {
            state.currentUserData.avatar = state.selectedAvatarPath;
            saveUserData();
            
            DOM.profileAvatarImg.src = state.selectedAvatarPath;
            
            // Atualiza o avatar no ranking
            updateRankingData(state.currentUserData.username, {
                avatar: state.selectedAvatarPath
            });
            
            showAlert("Avatar atualizado com sucesso!", "success");
            
            // Dispara evento para atualizar outras partes do sistema
            window.dispatchEvent(new CustomEvent("avatarUpdated", {
                detail: {
                    username: state.currentUserData.username,
                    avatar: state.selectedAvatarPath
                }
            }));
        }
        closeAvatarModal();
    }

    /**
     * Atualiza os dados do ranking no localStorage
     */
    function updateRankingData(username, updates) {
        try {
            const rankingData = JSON.parse(
                localStorage.getItem(CONSTANTS.RANKING_DATA_KEY)
            ) || [];
            
            const updatedRanking = rankingData.map(user => {
                if (user.username === username) {
                    return { ...user, ...updates };
                }
                return user;
            });
            
            localStorage.setItem(
                CONSTANTS.RANKING_DATA_KEY, 
                JSON.stringify(updatedRanking)
            );
            
            window.dispatchEvent(new CustomEvent("rankingUpdated"));
            
            console.log("Dados do ranking atualizados com sucesso");
        } catch (error) {
            console.error("Erro ao atualizar ranking:", error);
        }
    }

    // --- Event Listeners ---
    DOM.editUsernameBtn.addEventListener("click", switchToEditMode);
    DOM.saveUsernameBtn.addEventListener("click", saveUsername);
    DOM.cancelUsernameBtn.addEventListener("click", switchToDisplayMode);
    DOM.changeAvatarBtn.addEventListener("click", openAvatarModal);
    DOM.closeAvatarModalBtn.addEventListener("click", closeAvatarModal);
    DOM.confirmAvatarBtn.addEventListener("click", confirmAvatarSelection);

    // Adicione esta linha:
    DOM.profileAvatarImg.addEventListener("click", openAvatarModal);

    DOM.avatarSelectionModal.addEventListener("click", (event) => {
        if (event.target === DOM.avatarSelectionModal) {
            closeAvatarModal();
        }
    });

    DOM.profileUsernameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            saveUsername();
        }
    });

    // --- Eventos Globais ---
    window.addEventListener("storage", (event) => {
        if (event.key === CONSTANTS.USER_DATA_KEY) {
            loadUserProfile();
        }
    });

    window.addEventListener("userUpdated", loadUserProfile);

    // --- Inicialização ---
    loadUserProfile();

    // Debug (opcional)
    function debugStorage() {
        console.log("Dados do usuário:", localStorage.getItem(CONSTANTS.USER_DATA_KEY));
        console.log("Dados do ranking:", localStorage.getItem(CONSTANTS.RANKING_DATA_KEY));
    }
});