/**
 * MENU GLOBAL E SIDEBAR RESPONSIVO
 * Este arquivo contém as funções para gerenciar o menu de navegação lateral,
 * destacar o item ativo, adicionar acessibilidade e controlar a abertura/fechamento
 * da sidebar em dispositivos móveis e a minimização em desktops.
 */

/**
 * Ativa o link correspondente à página atual no menu lateral
 * @param {NodeListOf<HTMLAnchorElement>} links - Lista de links do menu
 */
function setActiveLink(links) {
  links.forEach(link => {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  });

  const currentPath = window.location.pathname;
  const activeLink = Array.from(links).find(link => {
    const linkPath = new URL(link.href).pathname; // Usa URL para obter o pathname corretamente
    // Verifica se o caminho atual corresponde exatamente ou se é a página inicial (index.html ou /)
    return currentPath === linkPath || 
           (currentPath.endsWith("/") && linkPath.endsWith("/features/dashboard/dashboard.html")) ||
           (currentPath.endsWith("/index.html") && linkPath.endsWith("/features/dashboard/dashboard.html"));
  });

  if (activeLink) {
    activeLink.classList.add("active");
    activeLink.setAttribute("aria-current", "page");
  } else {
    // Fallback para casos onde o path não bate exatamente (ex: subpáginas não no menu)
    const currentPageFile = currentPath.split("/").pop();
    if (currentPageFile) {
        const fallbackLink = Array.from(links).find(link => link.getAttribute("href").endsWith(currentPageFile));
        if (fallbackLink) {
            fallbackLink.classList.add("active");
            fallbackLink.setAttribute("aria-current", "page");
        }
    }
  }
}

/**
 * Adiciona listeners de acessibilidade aos links do menu
 * @param {NodeListOf<HTMLAnchorElement>} links - Lista de links do menu
 */
function addAccessibilityListeners(links) {
  links.forEach(link => {
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        link.click();
      }
    });
  });
}

/**
 * Controla a abertura e fechamento da sidebar em telas móveis.
 */
function setupMobileSidebarToggle() {
    const sidebar = document.querySelector(".sidebar");
    const menuToggle = document.querySelector(".menu-toggle");
    const overlay = document.querySelector(".overlay");

    if (!sidebar || !menuToggle || !overlay) {
        console.warn("Elementos do toggle da sidebar móvel não encontrados.");
        return;
    }

    menuToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("open");
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
        menuToggle.setAttribute("aria-expanded", !isOpen);
        if (!isOpen) {
            const firstLink = sidebar.querySelector("nav a");
            if (firstLink) firstLink.focus();
        }
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
            overlay.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.focus();
        }
    });
}

/**
 * Controla a minimização/expansão da sidebar em telas grandes.
 */
function setupDesktopSidebarToggle() {
    const sidebar = document.querySelector(".sidebar");
    const toggleButton = document.querySelector(".sidebar-toggle-desktop");
    const body = document.body;

    if (!sidebar || !toggleButton) {
        console.warn("Elementos do toggle da sidebar desktop não encontrados.");
        return;
    }

    // Verifica estado inicial no localStorage
    const isMinimized = localStorage.getItem("sidebarMinimized") === "true";
    if (isMinimized) {
        body.classList.add("sidebar-minimized");
    }

    toggleButton.addEventListener("click", () => {
        body.classList.toggle("sidebar-minimized");
        const minimized = body.classList.contains("sidebar-minimized");
        localStorage.setItem("sidebarMinimized", minimized);
        // Atualiza aria-label para acessibilidade
        toggleButton.setAttribute("aria-label", minimized ? "Expandir menu lateral" : "Minimizar menu lateral");
    });

    // Define aria-label inicial
    toggleButton.setAttribute("aria-label", body.classList.contains("sidebar-minimized") ? "Expandir menu lateral" : "Minimizar menu lateral");
}


/**
 * Cria e insere os elementos HTML necessários para os toggles da sidebar.
 */
function insertToggleElements() {
    // Cria o botão de toggle mobile (hambúrguer)
    const menuToggle = document.createElement("button");
    menuToggle.classList.add("menu-toggle");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.innerHTML = `<i class="fas fa-bars"></i>`;

    // Cria o overlay para mobile
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    // Cria o botão de toggle desktop (minimizar/expandir)
    const sidebarToggleDesktop = document.createElement("button");
    sidebarToggleDesktop.classList.add("sidebar-toggle-desktop");
    // O aria-label será definido em setupDesktopSidebarToggle
    sidebarToggleDesktop.innerHTML = `<i class="fas fa-caret-left"></i>`;

    const header = document.querySelector(".header");
    if (header) {
        const userInfo = header.querySelector(".user-info");
        if (userInfo) {
            header.insertBefore(menuToggle, userInfo);
        } else {
            header.prepend(menuToggle);
        }
    } else {
        console.warn("Elemento .header não encontrado para inserir o botão de menu mobile.");
        // Fallback: Insere no início do body se o header não for encontrado
        document.body.prepend(menuToggle);
    }

    document.body.appendChild(overlay);

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        sidebar.appendChild(sidebarToggleDesktop);
    } else {
        console.warn("Elemento .sidebar não encontrado para inserir o botão de toggle desktop.");
    }
}


/**
 * Carrega o menu HTML global e inicializa sua funcionalidade
 */
async function loadAndInitializeMenu() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) {
    console.error("Elemento <aside class=\"sidebar\"> não encontrado.");
    return;
  }

  let menuPath = "";
  const currentPath = window.location.pathname;

  if (currentPath.includes("/features/")) {
      // Ex: /features/dashboard/dashboard.html -> ../../shared/menu.html
      menuPath = "../../shared/menu.html";
  } else if (currentPath.includes("/landing/")) {
      // Ex: /landing/index.html -> ../shared/menu.html
      menuPath = "../shared/menu.html";
  } else {
      // Assume que está na raiz ou estrutura desconhecida
      // Ex: /index.html ou / -> ./shared/menu.html
      menuPath = "./shared/menu.html";
  }

  console.log(`Tentando carregar menu de: ${menuPath} (baseado em ${currentPath})`);

  try {
    const response = await fetch(menuPath);

    if (!response.ok) {
        // Lança erro mais detalhado
        throw new Error(`Falha ao buscar menu: ${response.status} ${response.statusText} em ${menuPath}`);
    }

    const menuHTML = await response.text();

    // Insere o HTML do menu dentro da sidebar, após o logo se ele existir
    const logoLink = sidebar.querySelector(".logo-sidebar");
    if (logoLink) {
        logoLink.insertAdjacentHTML("afterend", menuHTML);
    } else {
        // Fallback se não houver logo
        sidebar.insertAdjacentHTML("beforeend", menuHTML);
    }

    const links = sidebar.querySelectorAll("nav a");
    if (links.length > 0) {
      setActiveLink(links);
      addAccessibilityListeners(links);
    } else {
      console.error("Nenhum link encontrado no menu carregado.");
    }

    insertToggleElements();
    setupMobileSidebarToggle();
    setupDesktopSidebarToggle();

  } catch (error) {
    console.error("Erro crítico ao carregar ou inicializar o menu global:", error);
    sidebar.innerHTML = '<p style="color: red; padding: 20px;">Erro ao carregar o menu. Verifique o console e tente recarregar a página.</p>';
  }
}

/**
 * Evento executado quando o DOM é completamente carregado
 * Carrega o menu global e configura seus comportamentos
 */
document.addEventListener("DOMContentLoaded", loadAndInitializeMenu);

