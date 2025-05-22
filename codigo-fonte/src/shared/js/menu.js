/**
 * MENU GLOBAL
 * Este arquivo contém as funções para gerenciar o menu de navegação lateral presente em todas as páginas
 * Responsável por destacar o item de menu ativo e adicionar comportamentos de acessibilidade
 */

/**
 * Ativa o link correspondente à página atual no menu lateral
 * @param {NodeListOf<HTMLAnchorElement>} links - Lista de links do menu
 */
function setActiveLink(links) {
  // Remove todas as classes 'active' primeiro para garantir que apenas um item fique destacado
  links.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });
  
  // Obtém o caminho atual da URL para comparação
  const currentPath = window.location.pathname;
  
  // Encontra o link correspondente à página atual
  // Usa Array.from para converter NodeList em Array e poder usar o método find()
  const activeLink = Array.from(links).find(link => {
    const linkPath = new URL(link.href, window.location.href).pathname;
    return currentPath.includes(linkPath);
  });
  
  // Adiciona a classe 'active' e atributo de acessibilidade se encontrou correspondência
  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page'); // Atributo para acessibilidade
  }
}

/**
 * Evento executado quando o DOM é completamente carregado
 * Configura o menu lateral e adiciona comportamentos de acessibilidade
 */
document.addEventListener('DOMContentLoaded', function() {
  // Seleciona todos os links do menu lateral
  const links = document.querySelectorAll('.sidebar nav a');
  
  // Configura o item de navegação ativo com base na URL atual
  setActiveLink(links);
  
  // Adiciona listeners para acessibilidade (navegação por teclado)
  // Permite ativar links usando tecla Enter ou Espaço
  links.forEach(link => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
  });
});

/**
 * Evento adicional para garantir que o item de menu correto seja destacado
 * Este é um método alternativo que usa uma abordagem diferente para identificar a página atual
 * Mantido para compatibilidade com diferentes cenários de navegação
 */
document.addEventListener('DOMContentLoaded', function() {
  // Extrai o nome do arquivo da URL atual
  const currentPage = window.location.pathname.split('/').pop();
  
  // Percorre todos os links do menu e destaca o que corresponde à página atual
  document.querySelectorAll('.sidebar nav a').forEach(link => {
      if (link.getAttribute('href').includes(currentPage)) {
          link.classList.add('active');
      }
  });
});
