/**
 * MENU GLOBAL
 * Este arquivo contém as funções para gerenciar o menu de navegação lateral presente em todas as páginas
 * Responsável por carregar o menu dinamicamente, destacar o item de menu ativo e adicionar comportamentos de acessibilidade
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

  // Obtém o caminho atual da URL para comparação (usando caminhos absolutos)
  const currentPath = window.location.pathname;

  // Encontra o link correspondente à página atual
  const activeLink = Array.from(links).find(link => {
    // Assume que os hrefs em menu.html são absolutos (ex: /features/dashboard/inicio.html)
    const linkPath = link.getAttribute('href');
    // Verifica se o caminho atual termina com o caminho do link (para cobrir casos como /features/dashboard/ e /features/dashboard/inicio.html)
    // Ou se são exatamente iguais
    return currentPath === linkPath || (currentPath.endsWith('/') && currentPath + 'inicio.html' === linkPath) || currentPath.endsWith(linkPath);
  });

  // Adiciona a classe 'active' e atributo de acessibilidade se encontrou correspondência
  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page'); // Atributo para acessibilidade
  } else {
    // Fallback: Tenta encontrar pela última parte do path se a correspondência exata falhar
    const currentPageFile = currentPath.split('/').pop();
    if (currentPageFile) {
        const fallbackLink = Array.from(links).find(link => link.getAttribute('href').endsWith(currentPageFile));
        if (fallbackLink) {
            fallbackLink.classList.add('active');
            fallbackLink.setAttribute('aria-current', 'page');
        }
    }
  }
}

/**
 * Adiciona listeners de acessibilidade aos links do menu
 * @param {NodeListOf<HTMLAnchorElement>} links - Lista de links do menu
 */
function addAccessibilityListeners(links) {
  // Permite ativar links usando tecla Enter ou Espaço
  links.forEach(link => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
  });
}

/**
 * Carrega o menu HTML global e inicializa sua funcionalidade
 */
async function loadAndInitializeMenu() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) {
    console.error('Elemento <aside class="sidebar"> não encontrado.');
    return;
  }

  try {
    // Tenta buscar a partir da raiz '/shared/menu.html'
    let menuPath = '/shared/menu.html';
    let response = await fetch(menuPath);

    // Se falhar (ex: rodando localmente via file:// ou estrutura diferente), tenta relativo
    if (!response.ok) {
        console.warn(`Falha ao buscar ${menuPath}, tentando caminho relativo...`);
        // Tenta adivinhar o caminho relativo baseado na localização atual
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        // Ajuste a profundidade conforme a estrutura real. Ex: 'features' está 1 nível abaixo da raiz.
        const depth = pathSegments.includes('features') ? 2 : pathSegments.includes('landing') ? 1 : 0; 
        const relativePrefix = '../'.repeat(depth);
        menuPath = `${relativePrefix}shared/menu.html`;
        if (!menuPath.startsWith('../') && !menuPath.startsWith('/')) { // Garante que não fique algo como 'shared/menu.html' se depth=0
             menuPath = './shared/menu.html'; // Assume que está na raiz
        }
        if (depth === 0 && window.location.pathname.includes('/landing/')) { // Caso especial para landing page na raiz
             menuPath = './shared/menu.html';
        }
        // Correção para garantir que o caminho relativo funcione corretamente
        // Se a página atual está em /features/X/page.html, o caminho para /shared/menu.html é ../../shared/menu.html
        // Se a página atual está em /landing/index.html, o caminho para /shared/menu.html é ../shared/menu.html
        const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        if (currentDir.includes('/features/')) {
            menuPath = '../../shared/menu.html';
        } else if (currentDir.includes('/landing/')) {
            menuPath = '../shared/menu.html';
        } else {
            // Assume raiz ou outra estrutura - ajuste se necessário
            menuPath = './shared/menu.html'; 
        }

        console.log(`Tentando caminho relativo: ${menuPath}`);
        response = await fetch(menuPath);
    }

    if (!response.ok) {
        throw new Error(`Falha ao buscar menu: ${response.statusText} em ${menuPath}`);
    }

    const menuHTML = await response.text();

    // Insere o HTML do menu dentro da sidebar
    // Encontra o logo para inserir o menu depois dele, garantindo a ordem
    const logoLink = sidebar.querySelector('a[href*="inicio.html"]'); // Ajuste o seletor se o link do logo mudar
    if (logoLink) {
        logoLink.insertAdjacentHTML('afterend', menuHTML);
    } else {
        // Se não encontrar logo, adiciona no início ou fim da sidebar (menos ideal)
        console.warn('Logo não encontrado na sidebar, adicionando menu no final.');
        sidebar.insertAdjacentHTML('beforeend', menuHTML);
    }

    // Seleciona os links *depois* que o menu foi carregado
    const links = sidebar.querySelectorAll('nav a');
    if (links.length > 0) {
      setActiveLink(links);
      addAccessibilityListeners(links);
    } else {
      console.error('Nenhum link encontrado no menu carregado.');
    }

  } catch (error) {
    console.error('Erro ao carregar o menu global:', error);
  }
}

/**
 * Evento executado quando o DOM é completamente carregado
 * Carrega o menu global e configura seus comportamentos
 */
document.addEventListener('DOMContentLoaded', loadAndInitializeMenu);

