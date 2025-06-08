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
        DEFAULT_AVATAR: "../../shared/assets/avatars/frog.png", // Usar um default consistente
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
     * Carrega os dados do usuário do localStorage e atualiza a UI
     */
    function loadUserProfile() {
        console.log("[Perfil] Carregando perfil do usuário...");
        const storedData = localStorage.getItem(CONSTANTS.USER_DATA_KEY);

        if (storedData) {
            try {
                state.currentUserData = JSON.parse(storedData);
                console.log("[Perfil] Dados carregados:", state.currentUserData);

                // Garante que os campos essenciais existam com fallbacks
                state.currentUserData.avatar = state.currentUserData.avatar || CONSTANTS.DEFAULT_AVATAR;
                state.currentUserData.ranking = state.currentUserData.ranking || CONSTANTS.DEFAULT_RANKING;
                if (!state.currentUserData.joinDate) {
                    state.currentUserData.joinDate = new Date().toISOString();
                    // Salva imediatamente se a data de entrada foi criada
                    saveUserData("joinDate added");
                }

                // Formata a data de cadastro
                const joinDate = new Date(state.currentUserData.joinDate);
                const formattedDate = joinDate.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });

                DOM.profileFullname.textContent = state.currentUserData.nome || "Nome não informado";
                DOM.profileEmail.textContent = state.currentUserData.email || "Email não informado";
                DOM.profileUsernameDisplay.textContent = state.currentUserData.username || "Username não definido";
                DOM.profileRanking.textContent = state.currentUserData.ranking; // Ranking deve vir dos dados
                DOM.profileJoinDate.textContent = formattedDate;
                DOM.profileAvatarImg.src = state.currentUserData.avatar;

                // Fallback visual se o avatar não carregar
                DOM.profileAvatarImg.onerror = () => {
                    console.warn(`[Perfil] Falha ao carregar avatar: ${state.currentUserData.avatar}. Usando default.`);
                    DOM.profileAvatarImg.src = CONSTANTS.DEFAULT_AVATAR;
                };

                state.originalUsername = state.currentUserData.username || "";
                DOM.editUsernameBtn.disabled = false;
                DOM.changeAvatarBtn.disabled = false;

            } catch (e) {
                console.error("[Perfil] Erro ao parsear dados do usuário:", e);
                localStorage.removeItem(CONSTANTS.USER_DATA_KEY); // Remove dados inválidos
                setupPlaceholderData();
            }
        } else {
            console.warn("[Perfil] Dados do usuário não encontrados no localStorage. Configurando placeholders.");
            setupPlaceholderData();
        }

        switchToDisplayMode();
    }

    /**
     * Configura dados placeholder quando não há usuário logado ou dados inválidos
     */
    function setupPlaceholderData() {
        const placeholderDate = new Date().toLocaleDateString("pt-BR");

        state.currentUserData = {
            nome: "Usuário Não Logado",
            email: "-",
            username: "-",
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
     * Salva os dados COMPLETOS do usuário no localStorage
     * @param {string} source - Opcional, para debug, indica o que causou o save.
     */
    function saveUserData(source = "unknown") {
        try {
            // Garante que estamos salvando o objeto completo do estado
            localStorage.setItem(
                CONSTANTS.USER_DATA_KEY,
                JSON.stringify(state.currentUserData)
            );
            console.log(`[Perfil] Dados do usuário salvos no localStorage. Fonte: ${source}`, state.currentUserData);
            // Dispara um evento genérico de atualização do usuário
            window.dispatchEvent(new CustomEvent("userUpdated", { detail: { userData: state.currentUserData } }));
        } catch (error) {
            console.error("[Perfil] Erro ao salvar dados do usuário:", error);
            showAlert("Erro ao salvar dados do perfil.", "error");
        }
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
        DOM.profileUsernameInput.value = state.originalUsername; // Reseta input ao cancelar
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
        DOM.profileUsernameInput.value = state.originalUsername; // Preenche com valor atual
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
            console.log(`[Perfil] Atualizando username de '${state.originalUsername}' para '${newUsername}'`);
            state.currentUserData.username = newUsername;
            saveUserData("username change"); // Salva o objeto completo

            DOM.profileUsernameDisplay.textContent = newUsername;
            state.originalUsername = newUsername;

            showAlert("Nome de usuário atualizado com sucesso!", "success");
            // O evento userUpdated já foi disparado por saveUserData
        }

        switchToDisplayMode();
    }

    /**
     * Mostra um alerta temporário
     */
    function showAlert(message, type = "info") {
        const alertContainer = document.getElementById("alert-container") || document.body;
        const alert = document.createElement("div");
        alert.className = `alert alert-${type}`;

        const icon = type === "error" ? "exclamation-circle" : (type === "success" ? "check-circle" : "info-circle");
        alert.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;

        alertContainer.appendChild(alert);

        // Remover automaticamente após um atraso
        setTimeout(() => {
            alert.classList.add("fade-out");
            setTimeout(() => alert.remove(), 500); // Match animation duration
        }, 3000);
    }

    /**
     * Preenche o modal de seleção de avatar
     */
    function populateAvatarModal() {
        DOM.avatarOptionsContainer.innerHTML = "";
        // Garante que temos um avatar selecionado inicial, mesmo que seja o default
        state.selectedAvatarPath = state.currentUserData.avatar || CONSTANTS.DEFAULT_AVATAR;
        console.log("[Perfil] Populando modal. Avatar atual/selecionado:", state.selectedAvatarPath);

        CONSTANTS.AVAILABLE_AVATARS.forEach(avatarFile => {
            const img = document.createElement("img");
            const fullPath = CONSTANTS.AVATAR_BASE_PATH + avatarFile;

            img.src = fullPath;
            img.alt = `Avatar ${avatarFile.split(".")[0]}`;
            img.classList.add("avatar-option");
            img.dataset.path = fullPath;

            // Marca como selecionado se for o avatar atualmente no estado
            if (fullPath === state.selectedAvatarPath) {
                img.classList.add("selected");
            }

            img.addEventListener("click", () => {
                // Desmarca o anterior
                const previouslySelected = DOM.avatarOptionsContainer.querySelector(".avatar-option.selected");
                if (previouslySelected) {
                    previouslySelected.classList.remove("selected");
                }
                // Marca o novo e atualiza o estado temporário
                img.classList.add("selected");
                state.selectedAvatarPath = img.dataset.path;
                console.log("[Perfil] Avatar selecionado no modal:", state.selectedAvatarPath);
            });

            DOM.avatarOptionsContainer.appendChild(img);
        });
    }

    /**
     * Abre o modal de seleção de avatar
     */
    function openAvatarModal() {
        console.log("[Perfil] Abrindo modal de avatar...");
        populateAvatarModal(); // Popula antes de mostrar
        DOM.avatarSelectionModal.classList.remove("hidden");
        // Força reflow para garantir que a transição funcione
        void DOM.avatarSelectionModal.offsetWidth;
        DOM.avatarSelectionModal.classList.add("show");
        document.body.style.overflow = "hidden"; // Impede scroll do fundo
    }

    /**
     * Fecha o modal de seleção de avatar
     */
    function closeAvatarModal() {
        console.log("[Perfil] Fechando modal de avatar...");
        DOM.avatarSelectionModal.classList.remove("show");
        // Espera a transição terminar antes de esconder completamente
        setTimeout(() => {
            DOM.avatarSelectionModal.classList.add("hidden");
            document.body.style.overflow = ""; // Restaura scroll
        }, 300); // Deve corresponder à duração da transição CSS
    }

    /**
     * Confirma a seleção do avatar e atualiza os dados
     */
    function confirmAvatarSelection() {
        console.log("[Perfil] Confirmando seleção de avatar:", state.selectedAvatarPath);
        // Verifica se um avatar foi selecionado E se é diferente do atual
        if (state.selectedAvatarPath && state.selectedAvatarPath !== state.currentUserData.avatar) {
            console.log(`[Perfil] Atualizando avatar de '${state.currentUserData.avatar}' para '${state.selectedAvatarPath}'`);
            state.currentUserData.avatar = state.selectedAvatarPath;
            saveUserData("avatar change"); // Salva o objeto completo

            // Atualiza a imagem na página de perfil imediatamente
            DOM.profileAvatarImg.src = state.selectedAvatarPath;

            showAlert("Avatar atualizado com sucesso!", "success");
            // O evento userUpdated já foi disparado por saveUserData, que deve ser suficiente
            // para global-user.js e ranking.js atualizarem.
        } else {
            console.log("[Perfil] Avatar não alterado ou nenhum selecionado.");
        }
        closeAvatarModal();
    }

    // --- Event Listeners ---
    if (DOM.editUsernameBtn) DOM.editUsernameBtn.addEventListener("click", switchToEditMode);
    if (DOM.saveUsernameBtn) DOM.saveUsernameBtn.addEventListener("click", saveUsername);
    if (DOM.cancelUsernameBtn) DOM.cancelUsernameBtn.addEventListener("click", switchToDisplayMode);
    if (DOM.changeAvatarBtn) DOM.changeAvatarBtn.addEventListener("click", openAvatarModal);
    if (DOM.closeAvatarModalBtn) DOM.closeAvatarModalBtn.addEventListener("click", closeAvatarModal);
    if (DOM.confirmAvatarBtn) DOM.confirmAvatarBtn.addEventListener("click", confirmAvatarSelection);
    if (DOM.profileAvatarImg) DOM.profileAvatarImg.addEventListener("click", openAvatarModal); // Permite clicar na imagem para mudar

    // Fechar modal clicando fora
    if (DOM.avatarSelectionModal) {
        DOM.avatarSelectionModal.addEventListener("click", (event) => {
            if (event.target === DOM.avatarSelectionModal) {
                closeAvatarModal();
            }
        });
    }

    // Salvar username com Enter
    if (DOM.profileUsernameInput) {
        DOM.profileUsernameInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                saveUsername();
            }
        });
    }

    // --- Eventos Globais ---
    window.addEventListener("storage", (event) => {
        if (event.key === CONSTANTS.USER_DATA_KEY) {
            console.log("[Perfil] Detectada mudança externa no localStorage. Recarregando perfil...");
            loadUserProfile();
        }
    });

    // Ouve o evento userUpdated (disparado por este próprio script ou outros)
    // Isso garante que se outra parte do app atualizar o usuário, o perfil reflita.
    //     console.log("[Perfil] Evento userUpdated recebido. Recarregando perfil...");
    // A atualização da UI já é feita nas funções saveUsername e confirmAvatarSelection.

    // --- Inicialização ---
    loadUserProfile();

});

