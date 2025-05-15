document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-pergunta');
      const answer = item.querySelector('.faq-resposta');
      
      question.addEventListener('click', () => {
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.querySelector('.faq-resposta').classList.remove('show');
            otherItem.querySelector('.faq-pergunta').classList.remove('active');
          }
        });
        
        // Toggle current item
        answer.classList.toggle('show');
        question.classList.toggle('active');
      });
    });
  
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });
  
    // Form submission
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
      leadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        submitButton.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
          // Success state
          this.classList.add('form-sucesso');
          this.innerHTML = `
            <div class="mensagem-sucesso">
              <i class="fas fa-check-circle" style="color: var(--cor-sucesso); font-size: 2rem;"></i>
              <h3 style="margin: 15px 0 10px;">Pronto! Verifique seu e-mail</h3>
              <p>Enviamos o link de acesso para seu e-mail</p>
            </div>
          `;
          
          // Redirect after 3 seconds
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 3000);
        }, 1500);
      });
    }
  
    // Tooltips para Timeline
    const etapas = document.querySelectorAll('.etapa');
    const tooltips = [
      "Configuração guiada + teste gratuito do Pomodoro adaptativo",
      "Relatório personalizado mostra suas primeiras otimizações",
      "Relatório comparativo: antes/depois + recomendações finais"
    ];
    
    etapas.forEach((etapa, index) => {
      etapa.setAttribute('data-tooltip', tooltips[index]);
    });
  
    // Animation on scroll
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.func-card, .depoimento-card, .faq-item');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      });
    };
    
    // Set initial state
    document.querySelectorAll('.func-card, .depoimento-card, .faq-item').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
  });