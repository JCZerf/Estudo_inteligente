//RANKING 

// RANKING JS - COM SUPORTE A TEMAS

document.addEventListener('DOMContentLoaded', function() {
    // Configura filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove classe active de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona classe active apenas no botão clicado
            this.classList.add('active');
            
            // Aqui você pode adicionar a lógica para filtrar o ranking
            // Por exemplo: filterRanking(this.textContent.trim());
        });
    });
    
    // Configura eventos do tema
    document.addEventListener('themeChanged', updateRankingTheme);
    
    // Atualiza tema inicial
    updateRankingTheme();
});

function updateRankingTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    
    // Aqui você pode adicionar qualquer lógica específica que precise
    // ser executada quando o tema mudar
    console.log(`Tema do ranking atualizado para: ${theme}`);
    
    // Exemplo: Atualizar cores específicas
    const rankingItems = document.querySelectorAll('.ranking-item');
    rankingItems.forEach(item => {
        item.dataset.theme = theme;
    });
}

// Função para carregar dados do ranking (exemplo)
async function loadRankingData(filter = 'Geral') {
    try {
        // Simulação de requisição
        console.log(`Carregando ranking: ${filter}`);
        
        // Aqui você faria uma requisição real ao servidor
        // const response = await fetch(/api/ranking?filter=${filter});
        // const data = await response.json();
        // renderRanking(data);
        
        return []; // Retorno simulado
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        return [];
    }
}

// Função para renderizar os dados do ranking (exemplo)
function renderRanking(data) {
    const rankingList = document.querySelector('.ranking-list');
    
    // Limpa a lista atual
    rankingList.innerHTML = '';
    
    // Adiciona os itens do ranking
    data.forEach((user, index) => {
        const rankingItem = document.createElement('div');
        rankingItem.className = `ranking-item ${index < 3 ? 'top' + (index + 1) : ''}`;
        
        rankingItem.innerHTML = `
            <div class="position">${index + 1}</div>
            <img src="${user.photo}" alt="${user.name}" class="profile-pic">
            <div class="user-details">
                <div class="user-name">${user.name}</div>
                <div class="user-hours">${user.hours} horas estudadas</div>
            </div>
            ${index === 0 ? '<img src="../img/trofeu.jpg" alt="Troféu" class="trophy">' : ''}
        `;
        
        rankingList.appendChild(rankingItem);
    });
}