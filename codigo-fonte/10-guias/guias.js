// GUIAS.JS - COM FILTROS MELHORADOS E SUPORTE A TEMAS

document.addEventListener('DOMContentLoaded', function() {
  // Filtragem de guias
  const filterButtons = document.querySelectorAll('.filter-btn');
  const guideCards = document.querySelectorAll('.guide-card');
  const searchInput = document.querySelector('.search-box input');
  
  // Tipos de guias (pode ser substituído por data-attributes)
  const guideTypes = {
      "Método Pomodoro": "Técnicas",
      "Técnica Feynman": "Técnicas",
      "Mapas Mentais": "Técnicas",
      "Flashcards": "Técnicas",
      "Curva do Esquecimento": "Técnicas",
      "Leitura Ativa": "Técnicas"
  };
  
  // Filtra os guias
  function filterGuides() {
      const activeFilter = document.querySelector('.filter-btn.active').textContent.trim();
      const searchTerm = searchInput.value.toLowerCase();
      
      guideCards.forEach(card => {
          const title = card.querySelector('h3').textContent;
          const description = card.querySelector('p').textContent.toLowerCase();
          const matchesFilter = activeFilter === 'Todos' || guideTypes[title] === activeFilter;
          const matchesSearch = title.toLowerCase().includes(searchTerm) || description.includes(searchTerm);
          
          card.style.display = matchesFilter && matchesSearch ? 'block' : 'none';
      });
  }
  
  // Configura eventos dos botões de filtro
  filterButtons.forEach(button => {
      button.addEventListener('click', () => {
          filterButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          filterGuides();
      });
  });
  
  // Configura evento de busca
  searchInput.addEventListener('input', filterGuides);
  
  // Atualiza tema quando mudar
  document.addEventListener('themeChanged', function(e) {
      console.log('Tema alterado para:', e.detail.theme);
      // Pode adicionar lógica específica se necessário
  });
});