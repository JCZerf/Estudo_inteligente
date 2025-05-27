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
      this.themeToggle = document.getElementById("themeToggle");
      this.themeIcon = this.themeToggle?.querySelector("i");
      
      this.userPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      this.currentTheme = localStorage.getItem("theme") || (this.userPrefersDark ? "dark" : "light");
      this.currentFontSize = localStorage.getItem("fontSize") || "medium";
      
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
      if (withTransition) {
          document.body.classList.add("theme-transition");
      }
      
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      
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
      
      document.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
      
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
      document.body.classList.remove("font-small", "font-medium", "font-large");
      document.body.classList.add(`font-${size}`);
      
      localStorage.setItem("fontSize", size);
      
      document.dispatchEvent(new CustomEvent("fontSizeChanged", { detail: { size } }));
  }
  
  /**
   * Alterna entre os temas claro e escuro
   * Chamado quando o usuário clica no botão de alternar tema
   */
  toggleTheme() {
      this.currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      this.applyTheme(this.currentTheme);
      
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
   */
  setupEventListeners() {
      if (this.themeToggle) {
        this.themeToggle.addEventListener("click", () => this.toggleTheme());
        
        this.themeToggle.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this.toggleTheme();
            }
        });
      }
      
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
