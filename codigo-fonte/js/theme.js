/** THEME JS - Gerenciador de Tema melhorado */
class ThemeManager {
  constructor() {
      this.themeToggle = document.getElementById('themeToggle');
      this.themeIcon = this.themeToggle?.querySelector('i');
      this.userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = localStorage.getItem('theme') || 
                         (this.userPrefersDark ? 'dark' : 'light');
      
      if (!this.themeToggle || !this.themeIcon) {
          console.error('Elementos do tema não encontrados!');
          return;
      }
      
      this.init();
  }
  
  init() {
      this.setTheme(this.currentTheme, false);
      this.setupEventListeners();
      this.addTransitionClass();
  }
  
  setTheme(theme, withTransition = true) {
      if (withTransition) {
          document.body.classList.add('theme-transition');
      }
      
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // Atualiza ícone
      if (theme === 'dark') {
          this.themeIcon.classList.replace('fa-moon', 'fa-sun');
          this.themeToggle.setAttribute('aria-label', 'Alternar para tema claro');
      } else {
          this.themeIcon.classList.replace('fa-sun', 'fa-moon');
          this.themeToggle.setAttribute('aria-label', 'Alternar para tema escuro');
      }
      
      // Dispara evento para outros componentes
      document.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme } 
      }));
      
      if (withTransition) {
          setTimeout(() => {
              document.body.classList.remove('theme-transition');
          }, 300);
      }
      
      // Força atualização de componentes específicos
      this.updateComponents();
  }
  
  updateComponents() {
      // Atualiza tarefas se a função existir
      if (typeof renderTasks === 'function') {
          renderTasks();
      }
      
      // Atualiza outros componentes que precisam de reload
      const reloaders = document.querySelectorAll('[data-theme-reload]');
      reloaders.forEach(el => {
          el.innerHTML = el.innerHTML; // Força re-render
      });
  }
  
  toggleTheme() {
      this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(this.currentTheme);
      
      // Feedback visual
      this.themeToggle.classList.add('theme-toggle-active');
      setTimeout(() => {
          this.themeToggle.classList.remove('theme-toggle-active');
      }, 300);
  }
  
  addTransitionClass() {
      if (!document.getElementById('theme-transition-style')) {
          const style = document.createElement('style');
          style.id = 'theme-transition-style';
          style.textContent = `
              .theme-transition,
              .theme-transition *,
              .theme-transition *::before,
              .theme-transition *::after {
                  transition: all 0.3s ease !important;
                  transition-delay: 0s !important;
              }
          `;
          document.head.appendChild(style);
      }
  }
  
  setupEventListeners() {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
      
      // Teclado acessível
      this.themeToggle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.toggleTheme();
          }
      });
      
      // Monitora mudanças no sistema
      window.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', (e) => {
              if (!localStorage.getItem('theme')) {
                  this.setTheme(e.matches ? 'dark' : 'light');
              }
          });
  }
}

// Inicialização otimizada
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});