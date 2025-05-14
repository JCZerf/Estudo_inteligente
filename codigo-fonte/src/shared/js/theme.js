/** THEME JS - Gerenciador de Tema e Tamanho de Fonte Global */
class GlobalStyleManager {
  constructor() {
      this.themeToggle = document.getElementById("themeToggle");
      this.themeIcon = this.themeToggle?.querySelector("i");
      this.userPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      this.currentTheme = localStorage.getItem("theme") || (this.userPrefersDark ? "dark" : "light");
      this.currentFontSize = localStorage.getItem("fontSize") || "medium";
      
      this.init();
  }
  
  init() {
      this.applyTheme(this.currentTheme, false);
      this.applyFontSize(this.currentFontSize);
      this.setupEventListeners();
      this.addTransitionStyle(); // Para transições suaves de tema
  }
  
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
          }, 300);
      }
  }

  applyFontSize(size) {
      document.body.classList.remove("font-small", "font-medium", "font-large");
      document.body.classList.add(`font-${size}`);
      localStorage.setItem("fontSize", size);
      document.dispatchEvent(new CustomEvent("fontSizeChanged", { detail: { size } }));
  }
  
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

// Singleton instance for global access if needed, or just instantiate
let globalStyleManager;
document.addEventListener("DOMContentLoaded", () => {
  globalStyleManager = new GlobalStyleManager();
});

