/**JS MENU GLOBAL
 * Ativa o link correspondente à página atual
 * @param {NodeListOf<HTMLAnchorElement>} links - Lista de links do menu
 */
function setActiveLink(links) {
  // Remove todas as classes 'active' primeiro
  links.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });
  
  // Obtém o caminho atual
  const currentPath = window.location.pathname;
  
  // Encontra o link correspondente
  const activeLink = Array.from(links).find(link => {
    const linkPath = new URL(link.href, window.location.href).pathname;
    return currentPath.includes(linkPath);
  });
  
  // Adiciona a classe 'active' se encontrou correspondência
  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('.sidebar nav a');
  
  // Configura navegação ativa
  setActiveLink(links);
  
  // Adiciona listeners para acessibilidade
  links.forEach(link => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  // Ativa o item do menu atual
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar nav a').forEach(link => {
      if (link.getAttribute('href').includes(currentPage)) {
          link.classList.add('active');
      }
  });
});