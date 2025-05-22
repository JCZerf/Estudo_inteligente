/**
 * GERENCIADOR DE TEMA E TAMANHO DE FONTE
 * Este arquivo implementa a funcionalidade de alternar entre tema claro/escuro e ajustar o tamanho da fonte
 * Utiliza localStorage para persistir as preferências do usuário entre sessões
 */

/** 
 * Classe GlobalStyleManager
 * Responsável por gerenciar as preferências visuais globais do aplicativo (tema e tamanho de fonte)
 */
class GlobalStyleManager {
  /**
   * Construtor da classe
   * Inicializa as propriedades e recupera as preferências salvas do usuário
   */
  constructor() {
      // Referências aos elementos DOM
      this.themeToggle = document.getElementById("themeToggle");
      this.themeIcon = this.themeToggle?.querySelector("i");
      
      // Detecta se o sistema do usuário está configurado para tema escuro
      this.userPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      // Recupera as preferências salvas ou usa os padrões baseados nas configurações do sistema
      this.currentTheme = localStorage.getItem("theme") || (this.userPrefersDark ? "dark" : "light");
      this.currentFontSize = localStorage.getItem("fontSize") || "medium";
      
      // Inicializa o gerenciador
      this.init();
  }
  
  /**
   * Inicializa o gerenciador de estilos
   * Aplica o tema e tamanho de fonte salvos e configura os event listeners
   */
  init() {
      this.applyTheme(this.currentTheme, false); // Aplica o tema sem transição na inicialização
      this.applyFontSize(this.currentFontSize);  // Aplica o tamanho de fonte salvo
      this.setupEventListeners();                // Configura os listeners de eventos
      this.addTransitionStyle();                 // Adiciona estilos para transições suaves
  }
  
  /**
   * Aplica o tema selecionado (claro ou escuro)
   * @param {string} theme - O tema a ser aplicado ('light' ou 'dark')
   * @param {boolean} withTransition - Se deve aplicar transição visual (true por padrão)
   */
  applyTheme(theme, withTransition = true) {
      // Adiciona classe de transição se necessário
      if (withTransition) {
          document.body.classList.add("theme-transition");
      }
      
      // Aplica o tema ao documento e salva no localStorage
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      
      // Atualiza o ícone do botão de alternar tema
      if (this.themeIcon && this.themeToggle) {
          if (theme === "dark") {
              this.themeIcon.classList.remove("fa-moon");
              this.themeIcon.classList.add("fa-sun");
              this.themeToggle.setAttribute("aria-label", "Alternar para tema claro");
          } else {
              this.themeIcon.classList.remove("fa-sun");
              this.themeIcon.classList.add("fa-moon");
              this.themeToggle.setAttribute("aria-label", "Alternar para tema escuro");
          }
      }
      
      // Dispara evento personalizado para notificar outros componentes da mudança de tema
      document.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
      
      // Remove a classe de transição após o término da animação
      if (withTransition) {
          setTimeout(() => {
              document.body.classList.remove("theme-transition");
          }, 300); // 300ms corresponde à duração da transição CSS
      }
  }

  /**
   * Aplica o tamanho de fonte selecionado
   * @param {string} size - O tamanho a ser aplicado ('small', 'medium' ou 'large')
   */
  applyFontSize(size) {
      // Remove todas as classes de tamanho de fonte e aplica a nova
      document.body.classList.remove("font-small", "font-medium", "font-large");
      document.body.classList.add(`font-${size}`);
      
      // Salva a preferência no localStorage
      localStorage.setItem("fontSize", size);
      
      // Dispara evento personalizado para notificar outros componentes da mudança de tamanho
      document.dispatchEvent(new CustomEvent("fontSizeChanged", { detail: { size } }));
  }
  
  /**
   * Alterna entre os temas claro e escuro
   * Chamado quando o usuário clica no botão de alternar tema
   */
  toggleTheme() {
      // Determina o tema oposto ao atual
      this.currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      this.applyTheme(this.currentTheme);
      
      // Adiciona efeito visual de clique no botão
      if (this.themeToggle) {
        this.themeToggle.classList.add("theme-toggle-active");
        setTimeout(() => {
            this.themeToggle.classList.remove("theme-toggle-active");
        }, 300);
      }
  }
  
  /**
   * Adiciona estilos CSS para transições suaves entre temas
   * Cria um elemento <style> dinamicamente se ainda não existir
   */
  addTransitionStyle() {
      if (!document.getElementById("theme-transition-style")) {
          const style = document.createElement("style");
          style.id = "theme-transition-style";
          style.textContent = `
              body, body * {
                  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
              }
          `;
          document.head.appendChild(style);
      }
  }
  
  /**
   * Configura os event listeners para interações do usuário e mudanças do sistema
   */
  setupEventListeners() {
      // Listener para clique no botão de tema
      if (this.themeToggle) {
        this.themeToggle.addEventListener("click", () => this.toggleTheme());
        
        // Suporte a acessibilidade para navegação por teclado
        this.themeToggle.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this.toggleTheme();
            }
        });
      }
      
      // Listener para mudanças na preferência de tema do sistema operacional
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
          // Somente altera se o usuário não tiver definido uma preferência explícita
          if (localStorage.getItem("theme") === null) {
            this.currentTheme = e.matches ? "dark" : "light";
            this.applyTheme(this.currentTheme);
          }
      });
  }
}

// Instância singleton para acesso global se necessário
let globalStyleManager;

// Inicializa o gerenciador quando o DOM estiver completamente carregado
document.addEventListener("DOMContentLoaded", () => {
  globalStyleManager = new GlobalStyleManager();
});
