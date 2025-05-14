/**
 * Configurações do Usuário - Estudo Inteligente
 * Gerencia todas as preferências do usuário na página de configurações
 */

document.addEventListener("DOMContentLoaded", function() {
    // Referências aos elementos com verificação de existência
    const elements = {
        darkModeToggle: document.getElementById("darkModeToggle"),
        fontSizeSelect: document.getElementById("fontSizeSelect"),
        languageSelect: document.getElementById("languageSelect"),
        notificationToggle: document.getElementById("notificationToggle"),
        notificationFrequency: document.getElementById("notificationFrequency"),
        notificationTime: document.getElementById("notificationTime"),
        syncToggle: document.getElementById("syncToggle"),
        dangerButtons: document.querySelectorAll(".danger-zone .btn-warning, .danger-zone .btn-danger"),
        confirmModal: document.getElementById("confirmModal"),
        toastNotification: document.getElementById("toastNotification")
    };

    // Verificação inicial de elementos
    if (!globalStyleManager) {
        console.error("GlobalStyleManager não foi carregado corretamente");
        return;
    }

    // --- Preferências de Notificações ---
    if (elements.notificationToggle) {
        // Carrega preferências salvas ou usa padrão
        elements.notificationToggle.checked = JSON.parse(localStorage.getItem("notificationsEnabled")) !== false;
        elements.notificationFrequency.value = localStorage.getItem("notificationFrequency") || "daily";
        elements.notificationTime.value = localStorage.getItem("notificationTime") || "18:00";

        // Event listeners
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
    if (elements.darkModeToggle) {
        // Sincroniza o estado inicial do toggle
        elements.darkModeToggle.checked = globalStyleManager.currentTheme === "dark";

        // Listener para alterações do usuário
        elements.darkModeToggle.addEventListener("change", function() {
            globalStyleManager.toggleTheme();
        });

        // Atualiza o toggle quando o tema mudar em outro lugar
        document.addEventListener("themeChanged", function(e) {
            if (elements.darkModeToggle) {
                elements.darkModeToggle.checked = e.detail.theme === "dark";
            }
        });
    }

    // --- Personalização: Tamanho do Texto ---
    if (elements.fontSizeSelect) {
        elements.fontSizeSelect.value = globalStyleManager.currentFontSize;
        
        elements.fontSizeSelect.addEventListener("change", function() {
            globalStyleManager.applyFontSize(this.value);
            showToast(`Tamanho da fonte alterado para ${this.options[this.selectedIndex].text}`);
        });
    }

    // --- Personalização: Idioma ---
    if (elements.languageSelect) {
        elements.languageSelect.value = localStorage.getItem("language") || "pt";
        
        elements.languageSelect.addEventListener("change", function() {
            localStorage.setItem("language", this.value);
            showToast(`Idioma alterado para ${this.options[this.selectedIndex].text}. A página será recarregada.`);
            setTimeout(() => location.reload(), 1500);
        });
    }

    // --- Sincronização ---
    if (elements.syncToggle) {
        elements.syncToggle.checked = JSON.parse(localStorage.getItem("autoSync")) !== false;
        
        elements.syncToggle.addEventListener("change", function() {
            localStorage.setItem("autoSync", this.checked);
            showToast(`Sincronização automática ${this.checked ? "ativada" : "desativada"}`);
        });
    }

    // --- Zona de Risco ---
    elements.dangerButtons.forEach(button => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            showConfirmationModal(this);
        });
    });

    // --- Funções Auxiliares ---
    function showConfirmationModal(button) {
        if (!elements.confirmModal) return;
        
        const actionText = button.textContent.trim();
        const modalTitle = elements.confirmModal.querySelector("#modalTitle");
        const modalMessage = elements.confirmModal.querySelector("#modalMessage");
        const modalConfirm = elements.confirmModal.querySelector("#modalConfirm");

        if (modalTitle) modalTitle.textContent = `Confirmar ${actionText}`;
        if (modalMessage) modalMessage.textContent = `Tem certeza que deseja ${actionText.toLowerCase()}?`;

        elements.confirmModal.style.display = "block";

        // Clone o botão para evitar múltiplos listeners
        const newConfirm = modalConfirm.cloneNode(true);
        modalConfirm.parentNode.replaceChild(newConfirm, modalConfirm);

        newConfirm.addEventListener("click", function() {
            handleDangerAction(button.id);
            elements.confirmModal.style.display = "none";
        });
    }

    function handleDangerAction(actionId) {
        let message = "";
        switch(actionId) {
            case "changeEmailBtn":
                message = "Alteração de e-mail solicitada";
                // Lógica para alterar e-mail aqui
                break;
            case "changePasswordBtn":
                message = "Alteração de senha solicitada";
                // Lógica para alterar senha aqui
                break;
            case "resetProgressBtn":
                message = "Progresso redefinido com sucesso";
                // Lógica para resetar progresso aqui
                break;
            case "resetSettingsBtn":
                resetToDefaultSettings();
                return; // Já mostra toast na função
            case "deleteAccountBtn":
                message = "Conta marcada para exclusão";
                // Lógica para excluir conta aqui
                break;
            default:
                message = "Ação executada com sucesso";
        }
        showToast(message);
    }

    function resetToDefaultSettings() {
        // Remove configurações específicas
        localStorage.removeItem("notificationsEnabled");
        localStorage.removeItem("notificationFrequency");
        localStorage.removeItem("notificationTime");
        localStorage.removeItem("autoSync");
        localStorage.removeItem("language");
        
        // Reseta elementos da UI
        if (elements.notificationToggle) elements.notificationToggle.checked = true;
        if (elements.notificationFrequency) elements.notificationFrequency.value = "daily";
        if (elements.notificationTime) elements.notificationTime.value = "18:00";
        if (elements.syncToggle) elements.syncToggle.checked = true;
        if (elements.languageSelect) elements.languageSelect.value = "pt";
        
        // Aplica o tamanho médio de fonte
        if (elements.fontSizeSelect) {
            elements.fontSizeSelect.value = "medium";
            globalStyleManager.applyFontSize("medium");
        }
        
        showToast("Configurações restauradas para os valores padrão");
    }

    function showToast(message) {
        if (!elements.toastNotification) return;
        
        elements.toastNotification.textContent = message;
        elements.toastNotification.classList.add("show");
        
        setTimeout(() => {
            elements.toastNotification.classList.remove("show");
        }, 3000);
    }

    // Fechar modal ao clicar fora ou no X
    const closeModal = elements.confirmModal?.querySelector(".close-modal");
    const modalCancel = elements.confirmModal?.querySelector("#modalCancel");

    if (closeModal) closeModal.addEventListener("click", () => {
        elements.confirmModal.style.display = "none";
    });
    
    if (modalCancel) modalCancel.addEventListener("click", () => {
        elements.confirmModal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target === elements.confirmModal) {
            elements.confirmModal.style.display = "none";
        }
    });
});