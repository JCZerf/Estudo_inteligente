/**
 * Script JavaScript para a página de Cadastro
 * Gerencia a criação de contas de usuários, validação de formulários e interações da interface
 */

document.addEventListener("DOMContentLoaded", function() {
  // Elementos do DOM - Referências aos elementos HTML da página
  const registerForm = document.getElementById("registerForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const errorMessage = document.getElementById("error-message");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  const submitBtn = registerForm.querySelector(".btn-primary");
  
  // Atualiza o ano no rodapé para o ano atual
  document.getElementById("currentYear").textContent = new Date().getFullYear();
  
  /**
   * Configura os botões de mostrar/ocultar senha
   * Alterna a visibilidade do texto da senha e o ícone do botão
   */
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function() {
      const input = this.closest(".password-wrapper").querySelector("input");
      const icon = this.querySelector("i");
      
      // Alterna entre mostrar e ocultar a senha
      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  });
  
  /**
   * Verificador de força da senha em tempo real
   * Avalia a complexidade da senha enquanto o usuário digita
   */
  passwordInput.addEventListener("input", function() {
    const password = this.value;
    let strength = 0;
    
    // Critérios de avaliação da força da senha
    // Verifica o comprimento
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Verifica a presença de diferentes tipos de caracteres
    if (/[A-Z]/.test(password)) strength += 1; // Letras maiúsculas
    if (/[0-9]/.test(password)) strength += 1; // Números
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Caracteres especiais
    
    // Atualiza a largura da barra de força (0-100%)
    const width = (strength / 5) * 100;
    strengthBar.style.width = `${width}%`;
    
    // Atualiza a cor e o texto conforme a força da senha
    if (strength <= 1) {
      strengthBar.style.backgroundColor = "#ef233c"; // Vermelho para senha fraca
      strengthText.textContent = "Fraca";
      strengthText.style.color = "#ef233c";
    } else if (strength <= 3) {
      strengthBar.style.backgroundColor = "#f8961e"; // Laranja para senha média
      strengthText.textContent = "Média";
      strengthText.style.color = "#f8961e";
    } else {
      strengthBar.style.backgroundColor = "#4cc9f0"; // Azul para senha forte
      strengthText.textContent = "Forte";
      strengthText.style.color = "#4cc9f0";
    }
  });
  
  /**
   * Validação em tempo real dos campos do formulário
   * Remove indicadores de erro quando o usuário começa a corrigir os campos
   */
  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener("input", function() {
      // Remove classe de erro se o campo não estiver vazio
      if (this.value.trim()) {
        this.classList.remove("input-error");
      }
      
      // Esconde mensagem de erro quando o usuário começa a digitar
      if (errorMessage.style.display === "block") {
        errorMessage.style.display = "none";
      }
    });
  });
  
  /**
   * Validação específica para o campo de email
   * Verifica o formato do email quando o usuário sai do campo
   */
  emailInput.addEventListener("blur", function() {
    if (this.value.trim() && !validateEmail(this.value)) {
      showError(this, "Por favor, insira um e-mail válido");
    }
  });
  
  /**
   * Validação completa do formulário no momento do envio
   * Verifica todos os campos antes de processar o cadastro
   */
  registerForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    resetErrors();
    
    // Validação dos campos com coleta de erros
    const errors = [];
    
    // Validação do nome
    if (!nameInput.value.trim()) {
      errors.push("Nome completo é obrigatório");
      nameInput.classList.add("input-error");
    }
    
    // Validação do email
    if (!emailInput.value.trim()) {
      errors.push("E-mail é obrigatório");
      emailInput.classList.add("input-error");
    } else if (!validateEmail(emailInput.value)) {
      errors.push("Por favor, insira um e-mail válido");
      emailInput.classList.add("input-error");
    }
    
    // Validação da senha
    if (!passwordInput.value.trim()) {
      errors.push("Senha é obrigatória");
      passwordInput.classList.add("input-error");
    } else if (passwordInput.value.length < 8) {
      errors.push("A senha deve ter no mínimo 8 caracteres");
      passwordInput.classList.add("input-error");
    }
    
    // Validação da confirmação de senha
    if (!confirmPasswordInput.value.trim()) {
      errors.push("Confirmação de senha é obrigatória");
      confirmPasswordInput.classList.add("input-error");
    } else if (passwordInput.value !== confirmPasswordInput.value) {
      errors.push("As senhas não coincidem");
      passwordInput.classList.add("input-error");
      confirmPasswordInput.classList.add("input-error");
    }
    
    // Exibe erros ou envia o formulário
    if (errors.length > 0) {
      showError(null, errors.join(". "));
    } else {
      await submitForm();
    }
  });
  
  /**
   * Funções auxiliares para validação e manipulação do formulário
   */
  
  /**
   * Valida o formato do email usando expressão regular
   * @param {string} email - Email a ser validado
   * @returns {boolean} - Verdadeiro se o email for válido
   */
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  /**
   * Exibe mensagem de erro no formulário
   * @param {HTMLElement|null} input - Campo com erro (ou null para erro geral)
   * @param {string} message - Texto da mensagem de erro
   */
  function showError(input, message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    
    if (input) {
      input.classList.add("input-error");
      input.focus();
    }
  }
  
  /**
   * Limpa todos os erros do formulário
   * Remove classes de erro e oculta mensagens
   */
  function resetErrors() {
    errorMessage.style.display = "none";
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
      input.classList.remove("input-error");
    });
  }
  
  /**
   * Processa o envio do formulário
   * Simula o processo de cadastro com feedback visual
   */
  async function submitForm() {
    try {
      // Mostra o estado de carregamento no botão
      submitBtn.classList.add("loading");
      
      // Simula o tempo de processamento do cadastro (para demonstração)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simula sucesso no cadastro e redireciona para login
      alert("Cadastro realizado com sucesso! Redirecionando para login...");
      window.location.href = "login.html";
      
    } catch (error) {
      // Tratamento de erro no cadastro
      showError(null, "Ocorreu um erro ao processar seu cadastro. Tente novamente.");
    } finally {
      // Sempre remove o estado de carregamento ao finalizar
      submitBtn.classList.remove("loading");
    }
  }
  
  /**
   * Configuração dos botões de login social
   * Simula o processo de autenticação com Google e Facebook
   */
  document.querySelectorAll(".social-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const provider = this.classList.contains("google") ? "Google" : "Facebook";
      alert(`Redirecionando para login com ${provider}...`);
      // Implementar lógica real de autenticação social aqui
    });
  });
});
