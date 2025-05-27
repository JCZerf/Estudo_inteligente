/**
 * Configurações do Usuário - Estudo Inteligente
 * Gerencia todas as preferências do usuário na página de configurações
 * 
 * Este script controla as funcionalidades da página de configurações,
 * incluindo preferências de notificações, personalização visual,
 * sincronização e ações da zona de risco.
 */

document.addEventListener("DOMContentLoaded", function() {
    // Referências aos elementos com verificação de existência
    const elements = {
        // Configurações Gerais
        darkModeToggle: document.getElementById("darkModeToggle"),
        fontSizeSelect: document.getElementById("fontSizeSelect"),
        languageSelect: document.getElementById("languageSelect"),
        notificationToggle: document.getElementById("notificationToggle"),
        notificationFrequency: document.getElementById("notificationFrequency"),
        notificationTime: document.getElementById("notificationTime"),
        syncToggle: document.getElementById("syncToggle"),
        toastNotification: document.getElementById("toastNotification"),

        // Botões da Zona de Risco
        changeEmailBtn: document.getElementById("changeEmailBtn"),
        changePasswordBtn: document.getElementById("changePasswordBtn"),
        resetProgressBtn: document.getElementById("resetProgressBtn"),
        resetSettingsBtn: document.getElementById("resetSettingsBtn"),
        deleteAccountBtn: document.getElementById("deleteAccountBtn"),

        // Modal de Confirmação Genérico (se ainda usado)
        confirmModal: document.getElementById("confirmModal"),
        modalTitle: document.getElementById("modalTitle"),
        modalMessage: document.getElementById("modalMessage"),
        modalConfirm: document.getElementById("modalConfirm"),
        modalCancel: document.getElementById("modalCancel"),

        // Modal Alterar E-mail
        changeEmailModal: document.getElementById("changeEmailModal"),
        currentEmailInput: document.getElementById("currentEmail"),
        newEmailInput: document.getElementById("newEmail"),
        emailPasswordInput: document.getElementById("emailPassword"),
        saveEmailBtn: document.getElementById("saveEmailBtn"),
        cancelEmailBtn: document.getElementById("cancelEmailBtn"),

        // Modal Alterar Senha
        changePasswordModal: document.getElementById("changePasswordModal"),
        currentPasswordInput: document.getElementById("currentPassword"),
        newPasswordInput: document.getElementById("newPassword"),
        confirmPasswordInput: document.getElementById("confirmPassword"),
        savePasswordBtn: document.getElementById("savePasswordBtn"),
        cancelPasswordBtn: document.getElementById("cancelPasswordBtn"),

        // Modal Redefinir Progresso
        resetProgressModal: document.getElementById("resetProgressModal"),
        resetProgressPasswordInput: document.getElementById("resetProgressPassword"),
        confirmResetProgressBtn: document.getElementById("confirmResetProgressBtn"),
        cancelResetProgressBtn: document.getElementById("cancelResetProgressBtn"),

        // Modal Excluir Conta
        deleteAccountModal: document.getElementById("deleteAccountModal"),
        deleteAccountPasswordInput: document.getElementById("deleteAccountPassword"),
        confirmDeleteAccountBtn: document.getElementById("confirmDeleteAccountBtn"),
        cancelDeleteAccountBtn: document.getElementById("cancelDeleteAccountBtn"),
    };

    // --- Constantes ---
    const USER_DATA_KEY = "usuarioLogado";

    // --- Estado ---
    let currentUserData = {};

    // --- Funções Auxiliares --- 

    /**
     * Carrega os dados do usuário do localStorage
     */
    function loadUserData() {
        const storedData = localStorage.getItem(USER_DATA_KEY);
        if (storedData) {
            try {
                currentUserData = JSON.parse(storedData);
            } catch (e) {
                console.error("Erro ao carregar dados do usuário:", e);
                currentUserData = {};
            }
        } else {
            currentUserData = {};
        }
    }

    /**
     * Salva os dados COMPLETOS do usuário no localStorage
     */
    function saveUserData() {
        try {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUserData));
            console.log("Dados do usuário salvos:", currentUserData);
            // Dispara evento para outras partes da aplicação saberem da atualização
            window.dispatchEvent(new CustomEvent("userUpdated", { detail: { userData: currentUserData } }));
        } catch (error) {
            console.error("Erro ao salvar dados do usuário:", error);
            showToast("Erro ao salvar dados.", "error");
        }
    }

    /**
     * Verifica se a senha fornecida corresponde à senha armazenada
     * @param {string} passwordToCheck - Senha fornecida pelo usuário
     * @returns {boolean} - True se a senha for válida, false caso contrário
     */
    function validatePassword(passwordToCheck) {
        loadUserData(); // Garante que temos os dados mais recentes
        if (!currentUserData || !currentUserData.senha) {
            showToast("Erro: Não foi possível verificar a senha. Faça login novamente.", "error");
            return false;
        }
        // IMPORTANTE: Em um app real, a senha NUNCA seria armazenada em plain text.
        // Aqui, comparamos diretamente por simplicidade, assumindo que está em plain text.
        // Em produção, isso exigiria uma chamada de API para validação no backend.
        const isValid = currentUserData.senha === passwordToCheck;
        if (!isValid) {
            showToast("Senha incorreta.", "error");
        }
        return isValid;
    }

    /**
     * Exibe uma notificação toast temporária
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo do toast (success, error, info)
     */
    function showToast(message, type = "info") {
        if (!elements.toastNotification) return;
        elements.toastNotification.textContent = message;
        elements.toastNotification.className = `toast show ${type}`;
        setTimeout(() => {
            elements.toastNotification.classList.remove("show");
        }, 3000);
    }

    /**
     * Abre um modal específico
     * @param {HTMLElement} modalElement - O elemento do modal a ser aberto
     */
    function openModal(modalElement) {
        if (!modalElement) return;
        // Limpa campos de senha antes de abrir
        const passwordFields = modalElement.querySelectorAll("input[type=\"password\"]");
        passwordFields.forEach(input => input.value = "");
        modalElement.style.display = "block";
        // Adiciona classe para animação (se houver)
        setTimeout(() => modalElement.classList.add("show"), 10); 
    }

    /**
     * Fecha um modal específico
     * @param {HTMLElement} modalElement - O elemento do modal a ser fechado
     */
    function closeModal(modalElement) {
        if (!modalElement) return;
        modalElement.classList.remove("show");
        // Espera a animação terminar antes de esconder
        setTimeout(() => modalElement.style.display = "none", 300); 
    }

    // --- Inicialização e Configurações Gerais ---
    loadUserData(); // Carrega dados do usuário ao iniciar

    // Garante que o gerenciador de estilos global esteja disponível
    if (!window.globalStyleManager) {
        console.error("GlobalStyleManager não foi carregado corretamente");
        // return; // Poderia parar aqui, mas tentaremos continuar
    }

    // Configurações de Notificações (como antes)
    if (elements.notificationToggle) {
        elements.notificationToggle.checked = JSON.parse(localStorage.getItem("notificationsEnabled")) !== false;
        elements.notificationFrequency.value = localStorage.getItem("notificationFrequency") || "daily";
        elements.notificationTime.value = localStorage.getItem("notificationTime") || "18:00";
        elements.notificationToggle.addEventListener("change", function() {
            localStorage.setItem("notificationsEnabled", this.checked);
            showToast(`Notificações ${this.checked ? "ativadas" : "desativadas"}`);
        });
        elements.notificationFrequency.addEventListener("change", function() {
            localStorage.setItem("notificationFrequency", this.value);
            showToast(`Frequência de notificações alterada para ${this.options[this.selectedIndex].text}`);
        });
        elements.notificationTime.addEventListener("change", function() {
            localStorage.setItem("notificationTime", this.value);
            showToast(`Horário de notificações alterado para ${this.value}`);
        });
    }

    // --- Personalização: Modo Escuro ---
    // Gerencia a alternância entre temas claro e escuro
    if (elements.darkModeToggle) {
        // Sincroniza o estado inicial do toggle com o tema atual
        elements.darkModeToggle.checked = globalStyleManager.currentTheme === "dark";

        // Listener para alterações do usuário no toggle
        elements.darkModeToggle.addEventListener("change", function() {
            globalStyleManager.toggleTheme();
        });

        // Atualiza o toggle quando o tema mudar em outro lugar do sistema
        document.addEventListener("themeChanged", function(e) {
            if (elements.darkModeToggle) {
                elements.darkModeToggle.checked = e.detail.theme === "dark";
            }
        });
    }
  // --- Personalização: Tamanho do Texto ---
    // Gerencia as configurações de tamanho de fonte
    if (elements.fontSizeSelect) {
        // Define o valor inicial baseado na configuração atual
        elements.fontSizeSelect.value = globalStyleManager.currentFontSize;
        
        // Listener para alterações no tamanho da fonte
        elements.fontSizeSelect.addEventListener("change", function() {
            globalStyleManager.applyFontSize(this.value);
            showToast(`Tamanho da fonte alterado para ${this.options[this.selectedIndex].text}`);
        });
    }

    // Personalização: Idioma (como antes, com integração i18n.js)
    if (elements.languageSelect) {
        elements.languageSelect.value = localStorage.getItem("language") || "pt";
        elements.languageSelect.addEventListener("change", function() {
            const newLang = this.value;
            localStorage.setItem("language", newLang);
            showToast(`Idioma alterado para ${this.options[this.selectedIndex].text}. Aplicando traduções...`);
            if (typeof applyTranslations === "function") {
                applyTranslations(newLang);
            } else {
                console.error("Função applyTranslations não encontrada. Recarregando a página como fallback.");
                setTimeout(() => location.reload(), 1500);
            }
        });
    }

    // Sincronização (como antes)
    if (elements.syncToggle) {
        elements.syncToggle.checked = JSON.parse(localStorage.getItem("autoSync")) !== false;
        elements.syncToggle.addEventListener("change", function() {
            localStorage.setItem("autoSync", this.checked);
            showToast(`Sincronização automática ${this.checked ? "ativada" : "desativada"}`);
        });
    }

    // --- Lógica da Zona de Risco --- 

    // 1. Alterar E-mail
    if (elements.changeEmailBtn && elements.changeEmailModal) {
        elements.changeEmailBtn.addEventListener("click", () => {
            loadUserData();
            if (elements.currentEmailInput) {
                elements.currentEmailInput.value = currentUserData.email || "";
            }
            if (elements.newEmailInput) elements.newEmailInput.value = "";
            if (elements.emailPasswordInput) elements.emailPasswordInput.value = "";
            openModal(elements.changeEmailModal);
        });

        elements.saveEmailBtn?.addEventListener("click", () => {
            const newEmail = elements.newEmailInput?.value.trim();
            const password = elements.emailPasswordInput?.value;

            if (!newEmail || !password) {
                showToast("Preencha o novo e-mail e a senha.", "error");
                return;
            }
            if (!/\S+@\S+\.\S+/.test(newEmail)) { // Validação simples de e-mail
                showToast("Formato de e-mail inválido.", "error");
                return;
            }

            if (validatePassword(password)) {
                currentUserData.email = newEmail;
                saveUserData();
                showToast("E-mail alterado com sucesso!", "success");
                closeModal(elements.changeEmailModal);
            }
        });

        elements.cancelEmailBtn?.addEventListener("click", () => closeModal(elements.changeEmailModal));
        elements.changeEmailModal.querySelector(".close-modal")?.addEventListener("click", () => closeModal(elements.changeEmailModal));
    }

    // 2. Alterar Senha
    if (elements.changePasswordBtn && elements.changePasswordModal) {
        elements.changePasswordBtn.addEventListener("click", () => {
            if (elements.currentPasswordInput) elements.currentPasswordInput.value = "";
            if (elements.newPasswordInput) elements.newPasswordInput.value = "";
            if (elements.confirmPasswordInput) elements.confirmPasswordInput.value = "";
            openModal(elements.changePasswordModal);
        });

        elements.savePasswordBtn?.addEventListener("click", () => {
            const currentPassword = elements.currentPasswordInput?.value;
            const newPassword = elements.newPasswordInput?.value;
            const confirmPassword = elements.confirmPasswordInput?.value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showToast("Preencha todos os campos de senha.", "error");
                return;
            }
            if (newPassword !== confirmPassword) {
                showToast("As novas senhas não coincidem.", "error");
                return;
            }
            if (newPassword.length < 6) { // Exemplo de validação mínima
                 showToast("A nova senha deve ter pelo menos 6 caracteres.", "error");
                 return;
            }

            if (validatePassword(currentPassword)) {
                currentUserData.senha = newPassword; // ATENÇÃO: Plain text!
                saveUserData();
                showToast("Senha alterada com sucesso!", "success");
                closeModal(elements.changePasswordModal);
            }
        });

        elements.cancelPasswordBtn?.addEventListener("click", () => closeModal(elements.changePasswordModal));
        elements.changePasswordModal.querySelector(".close-modal")?.addEventListener("click", () => closeModal(elements.changePasswordModal));
    }

    // 3. Redefinir Progresso
    if (elements.resetProgressBtn && elements.resetProgressModal) {
        elements.resetProgressBtn.addEventListener("click", () => {
            if (elements.resetProgressPasswordInput) elements.resetProgressPasswordInput.value = "";
            openModal(elements.resetProgressModal);
        });

        elements.confirmResetProgressBtn?.addEventListener("click", () => {
            const password = elements.resetProgressPasswordInput?.value;
            if (!password) {
                showToast("Digite sua senha para confirmar.", "error");
                return;
            }

            if (validatePassword(password)) {
                loadUserData();
                // Zera campos relacionados ao progresso (ajuste as chaves conforme necessário)
                currentUserData.userPoints = 0;
                currentUserData.totalFocusHours = 0;
                currentUserData.completedFocusSessions = 0;
                currentUserData.tasks = []; // Ou outra forma de resetar tarefas
                currentUserData.ranking = "Iniciante"; // Resetar ranking?
                // Adicione outras chaves de progresso aqui
                saveUserData();
                showToast("Progresso redefinido com sucesso!", "success");
                closeModal(elements.resetProgressModal);
            }
        });

        elements.cancelResetProgressBtn?.addEventListener("click", () => closeModal(elements.resetProgressModal));
        elements.resetProgressModal.querySelector(".close-modal")?.addEventListener("click", () => closeModal(elements.resetProgressModal));
    }

    // 4. Restaurar Configurações
    if (elements.resetSettingsBtn) {
        elements.resetSettingsBtn.addEventListener("click", () => {
            // Usa o modal de confirmação genérico (ou um específico se preferir)
            if (elements.confirmModal) {
                if (elements.modalTitle) elements.modalTitle.textContent = "Confirmar Restauração";
                if (elements.modalMessage) elements.modalMessage.textContent = "Tem certeza que deseja restaurar todas as configurações para os padrões?";
                
                const newConfirm = elements.modalConfirm.cloneNode(true);
                elements.modalConfirm.parentNode.replaceChild(newConfirm, elements.modalConfirm);
                
                newConfirm.onclick = () => {
                    resetToDefaultSettings();
                    closeModal(elements.confirmModal);
                };
                elements.modalCancel.onclick = () => closeModal(elements.confirmModal);
                elements.confirmModal.querySelector(".close-modal").onclick = () => closeModal(elements.confirmModal);
                openModal(elements.confirmModal);
            } else {
                 // Fallback se o modal genérico não existir
                 if(confirm("Tem certeza que deseja restaurar todas as configurações para os padrões?")){
                     resetToDefaultSettings();
                 }
            }
        });
    }

    /**
     * Restaura configurações para os valores padrão
     */
    function resetToDefaultSettings() {
        // Remove preferências do localStorage
        localStorage.removeItem("notificationsEnabled");
        localStorage.removeItem("notificationFrequency");
        localStorage.removeItem("notificationTime");
        localStorage.removeItem("autoSync");
        localStorage.removeItem("language");
        localStorage.removeItem("theme"); // Assumindo que o tema é salvo aqui
        localStorage.removeItem("fontSize"); // Assumindo que a fonte é salva aqui

        // Reseta elementos da UI
        if (elements.notificationToggle) elements.notificationToggle.checked = true;
        if (elements.notificationFrequency) elements.notificationFrequency.value = "daily";
        if (elements.notificationTime) elements.notificationTime.value = "18:00";
        if (elements.syncToggle) elements.syncToggle.checked = true;
        if (elements.languageSelect) elements.languageSelect.value = "pt";
        if (elements.darkModeToggle) elements.darkModeToggle.checked = false; // Padrão é claro
        if (elements.fontSizeSelect) elements.fontSizeSelect.value = "medium";

        // Aplica estilos padrão (se o manager existir)
        if (window.globalStyleManager) {
            globalStyleManager.applyTheme("light");
            globalStyleManager.applyFontSize("medium");
        }
        // Aplica traduções padrão (se a função existir)
        if (typeof applyTranslations === "function") {
            applyTranslations("pt");
        }

        showToast("Configurações restauradas para os valores padrão", "success");
    }

    // 5. Excluir Conta
    if (elements.deleteAccountBtn && elements.deleteAccountModal) {
        elements.deleteAccountBtn.addEventListener("click", () => {
            if (elements.deleteAccountPasswordInput) elements.deleteAccountPasswordInput.value = "";
            openModal(elements.deleteAccountModal);
        });

        elements.confirmDeleteAccountBtn?.addEventListener("click", () => {
            const password = elements.deleteAccountPasswordInput?.value;
            if (!password) {
                showToast("Digite sua senha para confirmar a exclusão.", "error");
                return;
            }

            if (validatePassword(password)) {
                // Ação drástica: remove todos os dados do usuário
                localStorage.removeItem(USER_DATA_KEY);
                // Poderia remover outras chaves relacionadas ao usuário também
                localStorage.removeItem("language");
                localStorage.removeItem("theme");
                localStorage.removeItem("fontSize");
                // ... outras chaves ...
                
                showToast("Conta excluída com sucesso. Você será redirecionado.", "success");
                
                // Redireciona para a página de login/inicial após um delay
                setTimeout(() => {
                    window.location.href = "../auth/login.html"; // Ou página inicial
                }, 2000);
            }
        });

        elements.cancelDeleteAccountBtn?.addEventListener("click", () => closeModal(elements.deleteAccountModal));
        elements.deleteAccountModal.querySelector(".close-modal")?.addEventListener("click", () => closeModal(elements.deleteAccountModal));
    }

    // Fechar modais genéricos (se ainda usados) e específicos clicando fora
    window.addEventListener("click", (e) => {
        if (e.target === elements.confirmModal) closeModal(elements.confirmModal);
        if (e.target === elements.changeEmailModal) closeModal(elements.changeEmailModal);
        if (e.target === elements.changePasswordModal) closeModal(elements.changePasswordModal);
        if (e.target === elements.resetProgressModal) closeModal(elements.resetProgressModal);
        if (e.target === elements.deleteAccountModal) closeModal(elements.deleteAccountModal);
    });

});

