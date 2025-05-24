/**
 * Script JavaScript para a Landing Page do Estudo Inteligente
 * 
 * Este arquivo implementa todas as funcionalidades interativas da landing page,
 * incluindo acordeões de FAQ, rolagem suave, animações e processamento de formulários.
 */

document.addEventListener('DOMContentLoaded', function() {
    /**
     * Sistema de acordeão para perguntas frequentes (FAQ)
     * Permite expandir e recolher as respostas ao clicar nas perguntas
     * Fecha automaticamente outros itens quando um novo é aberto
     */
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-pergunta');
      const answer = item.querySelector('.faq-resposta');
      
      question.addEventListener('click', () => {
        // Fecha todos os outros itens
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.querySelector('.faq-resposta').classList.remove('show');
            otherItem.querySelector('.faq-pergunta').classList.remove('active');
          }
        });
        
        // Alterna o estado do item atual
        answer.classList.toggle('show');
        question.classList.toggle('active');
      });
    });
  
    /**
     * Rolagem suave para links internos
     * Melhora a experiência do usuário ao navegar entre seções da página
     * Aplica-se a todos os links que apontam para âncoras (#) na mesma página
     */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          // Rola até o elemento com um pequeno offset para o cabeçalho fixo
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });
  
    /**
     * Processamento do formulário de captura de leads
     * Simula o envio do formulário com feedback visual
     * Redireciona para a página de login após o envio bem-sucedido
     */
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
      leadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Altera o botão para estado de carregamento
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        submitButton.disabled = true;
        
        // Simula uma chamada de API (em produção, seria uma requisição real)
        setTimeout(() => {
          // Estado de sucesso
          this.classList.add('form-sucesso');
          this.innerHTML = `
            <div class="mensagem-sucesso">
              <i class="fas fa-check-circle" style="color: var(--cor-sucesso); font-size: 2rem;"></i>
              <h3 style="margin: 15px 0 10px;">Pronto! Verifique seu e-mail</h3>
              <p>Enviamos o link de acesso para seu e-mail</p>
            </div>
          `;
          
          // Redireciona após 3 segundos
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 3000);
        }, 1500);
      });
    }
  
    /**
     * Tooltips para a linha do tempo
     * Adiciona dicas informativas aos elementos da timeline
     * Exibe detalhes adicionais ao passar o mouse sobre cada etapa
     */
    const etapas = document.querySelectorAll('.etapa');
    const tooltips = [
      "Configuração guiada + teste gratuito do Pomodoro adaptativo",
      "Relatório personalizado mostra suas primeiras otimizações",
      "Relatório comparativo: antes/depois + recomendações finais"
    ];
    
    etapas.forEach((etapa, index) => {
      etapa.setAttribute('data-tooltip', tooltips[index]);
    });
  
    /**
     * Animações ao rolar a página
     * Aplica efeitos de fade-in e slide-up aos elementos quando ficam visíveis
     * Melhora a experiência visual e o engajamento do usuário
     */
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.func-card, .depoimento-card, .faq-item');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        // Anima o elemento quando ele entra na área visível da tela
        if (elementPosition < screenPosition) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      });
    };
    
    // Define o estado inicial dos elementos para animação
    document.querySelectorAll('.func-card, .depoimento-card, .faq-item').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Adiciona o listener de scroll e executa a animação inicial
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
});
