// CONFIGURAÇÕES.JS - GERENCIAMENTO DE CONFIGURAÇÕES COM TEMAS

document.addEventListener('DOMContentLoaded', function() {
    // Configura o toggle do modo escuro
    const darkModeToggle = document.getElementById('darkModeToggle');
    const themeToggle = document.getElementById('themeToggle');
    
    // Sincroniza os toggles
    if (darkModeToggle && themeToggle) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        darkModeToggle.checked = currentTheme === 'dark';
        
        darkModeToggle.addEventListener('change', function() {
            themeToggle.click(); // Dispara o evento do tema principal
        });
    }
    
    // Configura modais de confirmação
    const dangerButtons = document.querySelectorAll('.btn-danger, .btn-warning');
    const confirmModal = document.getElementById('confirmModal');
    
    dangerButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.textContent.trim();
            document.getElementById('modalTitle').textContent = `Confirmar ${action}`;
            document.getElementById('modalMessage').textContent = 
                `Tem certeza que deseja ${action.toLowerCase()}? Esta ação pode ser irreversível.`;
            
            confirmModal.style.display = 'block';
            
            // Configura ação do botão confirmar
            document.getElementById('modalConfirm').onclick = function() {
                // Aqui você pode adicionar a lógica para a ação
                alert(`${action} confirmado!`);
                confirmModal.style.display = 'none';
            };
        });
    });
    
    // Fechar modal
    document.querySelector('.close-modal').addEventListener('click', function() {
        confirmModal.style.display = 'none';
    });
    
    // Fechar ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
    
    // Atualiza tema quando mudar
    document.addEventListener('themeChanged', function(e) {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = e.detail.theme === 'dark';
        }
    });
});