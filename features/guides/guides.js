/**
 * Script JavaScript para a página de Guias de Estudo
 * Gerencia a filtragem, busca e interações da interface dos guias educacionais
 */

document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const guideCards = document.querySelectorAll('.guide-card');
  const searchInput = document.querySelector('.search-box input');
  
  /**
   * Mapeamento de categorias para cada guia
   * Associa cada título de guia à sua categoria correspondente
   * Pode ser substituído por data-attributes no HTML para maior escalabilidade
   */
  const guideTypes = {
      "Método Pomodoro": "Técnicas",
      "Técnica Feynman": "Técnicas",
      "Mapas Mentais": "Técnicas",
      "Flashcards": "Técnicas",
      "Curva do Esquecimento": "Técnicas",
      "Leitura Ativa": "Técnicas"
  };
  
  /**
   * Filtra os cards de guias com base no filtro ativo e termo de busca
   * Exibe apenas os cards que correspondem aos critérios de filtro e busca
   */
  function filterGuides() {
      // Obtém o filtro de categoria ativo
      const activeFilter = document.querySelector('.filter-btn.active').textContent.trim();
      // Obtém o termo de busca (convertido para minúsculas para comparação case-insensitive)
      const searchTerm = searchInput.value.toLowerCase();
      
      // Percorre todos os cards de guias
      guideCards.forEach(card => {
          const title = card.querySelector('h3').textContent;
          const description = card.querySelector('p').textContent.toLowerCase();
          
          // Verifica se o card corresponde ao filtro de categoria
          const matchesFilter = activeFilter === 'Todos' || guideTypes[title] === activeFilter;
          // Verifica se o card corresponde ao termo de busca
          const matchesSearch = title.toLowerCase().includes(searchTerm) || description.includes(searchTerm);
          
          // Exibe ou oculta o card com base nos critérios
          card.style.display = matchesFilter && matchesSearch ? 'block' : 'none';
      });
  }
  
  /**
   * Configura os eventos de clique para os botões de filtro
   * Atualiza o estado ativo e filtra os guias quando um botão é clicado
   */
  filterButtons.forEach(button => {
      button.addEventListener('click', () => {
          // Remove a classe 'active' de todos os botões
          filterButtons.forEach(btn => btn.classList.remove('active'));
          // Adiciona a classe 'active' ao botão clicado
          button.classList.add('active');
          filterGuides();
      });
  });
  
  /**
   * Configura o evento de digitação no campo de busca
   * Filtra os guias em tempo real conforme o usuário digita
   */
  searchInput.addEventListener('input', filterGuides);
  
  /**
   * Listener para eventos de mudança de tema
   * Permite ajustes específicos quando o tema é alterado
   */
  document.addEventListener('themeChanged', function(e) {
      console.log('Tema alterado para:', e.detail.theme);
  });
});
