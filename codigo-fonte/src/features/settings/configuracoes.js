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
    // Centraliza o acesso a todos os elementos DOM relevantes
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
    // Garante que o gerenciador de estilos global esteja disponível
    if (!globalStyleManager) {
        console.error("GlobalStyleManager não foi carregado corretamente");
        return;
    }

    // --- Preferências de Notificações ---
    // Gerencia as configurações relacionadas às notificações do sistema
    if (elements.notificationToggle) {
        // Carrega preferências salvas ou usa padrão
        // Recupera as configurações do localStorage ou define valores padrão
        elements.notificationToggle.checked = JSON.parse(localStorage.getItem("notificationsEnabled")) !== false;
        elements.notificationFrequency.value = localStorage.getItem("notificationFrequency") || "daily";
        elements.notificationTime.value = localStorage.getItem("notificationTime") || "18:00";

        // Event listeners para alterações nas configurações de notificações
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

    // --- Personalização: Idioma ---
    // Gerencia as configurações de idioma do sistema
    if (elements.languageSelect) {
        // Carrega a configuração de idioma salva ou usa o padrão (português)
        elements.languageSelect.value = localStorage.getItem("language") || "pt";
        
        // Listener para alterações no idioma
        elements.languageSelect.addEventListener("change", function() {
            localStorage.setItem("language", this.value);
            showToast(`Idioma alterado para ${this.options[this.selectedIndex].text}. A página será recarregada.`);
            // Recarrega a página após um breve delay para aplicar o novo idioma
            setTimeout(() => location.reload(), 1500);
        });
    }

    // --- Sincronização ---
    // Gerencia as configurações de sincronização automática
    if (elements.syncToggle) {
        // Carrega a configuração de sincronização salva ou usa o padrão (ativada)
        elements.syncToggle.checked = JSON.parse(localStorage.getItem("autoSync")) !== false;
        
        // Listener para alterações na sincronização
        elements.syncToggle.addEventListener("change", function() {
            localStorage.setItem("autoSync", this.checked);
            showToast(`Sincronização automática ${this.checked ? "ativada" : "desativada"}`);
        });
    }

    // --- Zona de Risco ---
    // Configura os botões de ações perigosas para exibir confirmação
    elements.dangerButtons.forEach(button => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            showConfirmationModal(this);
        });
    });

    // --- Funções Auxiliares ---
    
    /**
     * Exibe o modal de confirmação para ações perigosas
     * @param {HTMLElement} button - O botão que foi clicado
     */
    function showConfirmationModal(button) {
        if (!elements.confirmModal) return;
        
        // Obtém o texto do botão para personalizar a mensagem
        const actionText = button.textContent.trim();
        const modalTitle = elements.confirmModal.querySelector("#modalTitle");
        const modalMessage = elements.confirmModal.querySelector("#modalMessage");
        const modalConfirm = elements.confirmModal.querySelector("#modalConfirm");

        // Personaliza o modal com base na ação
        if (modalTitle) modalTitle.textContent = `Confirmar ${actionText}`;
        if (modalMessage) modalMessage.textContent = `Tem certeza que deseja ${actionText.toLowerCase()}?`;

        // Exibe o modal
        elements.confirmModal.style.display = "block";

        // Clone o botão para evitar múltiplos listeners
        // Técnica para garantir que apenas um listener seja adicionado
        const newConfirm = modalConfirm.cloneNode(true);
        modalConfirm.parentNode.replaceChild(newConfirm, modalConfirm);

        // Adiciona o listener ao botão de confirmação
        newConfirm.addEventListener("click", function() {
            handleDangerAction(button.id);
            elements.confirmModal.style.display = "none";
        });
    }

    /**
     * Processa a ação perigosa confirmada pelo usuário
     * @param {string} actionId - ID do botão que iniciou a ação
     */
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

    /**
     * Restaura todas as configurações para os valores padrão
     * Remove as preferências do localStorage e redefine os controles da UI
     */
    function resetToDefaultSettings() {
        // Remove configurações específicas do localStorage
        localStorage.removeItem("notificationsEnabled");
        localStorage.removeItem("notificationFrequency");
        localStorage.removeItem("notificationTime");
        localStorage.removeItem("autoSync");
        localStorage.removeItem("language");
        
        // Reseta elementos da UI para os valores padrão
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
        
        // Notifica o usuário
        showToast("Configurações restauradas para os valores padrão");
    }

    /**
     * Exibe uma notificação toast temporária
     * @param {string} message - Mensagem a ser exibida
     */
    function showToast(message) {
        if (!elements.toastNotification) return;
        
        // Define o texto e exibe o toast
        elements.toastNotification.textContent = message;
        elements.toastNotification.classList.add("show");
        
        // Oculta o toast após 3 segundos
        setTimeout(() => {
            elements.toastNotification.classList.remove("show");
        }, 3000);
    }

    // Configuração para fechar o modal de confirmação
    
    // Fechar modal ao clicar no X
    const closeModal = elements.confirmModal?.querySelector(".close-modal");
    if (closeModal) closeModal.addEventListener("click", () => {
        elements.confirmModal.style.display = "none";
    });
    
    // Fechar modal ao clicar em Cancelar
    const modalCancel = elements.confirmModal?.querySelector("#modalCancel");
    if (modalCancel) modalCancel.addEventListener("click", () => {
        elements.confirmModal.style.display = "none";
    });
    
    // Fechar modal ao clicar fora dele
    window.addEventListener("click", (e) => {
        if (e.target === elements.confirmModal) {
            elements.confirmModal.style.display = "none";
        }
    });
});
