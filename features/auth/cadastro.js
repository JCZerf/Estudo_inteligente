document.addEventListener("DOMContentLoaded", function() {
  // Elementos do DOM
  const registerForm = document.getElementById("registerForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const errorMessage = document.getElementById("error-message");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  const submitBtn = registerForm.querySelector(".btn-primary");
  
  // Atualizar ano no footer
  document.getElementById("currentYear").textContent = new Date().getFullYear();
  
  // Toggle de visibilidade de senha
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function() {
      const input = this.closest(".password-wrapper").querySelector("input");
      const icon = this.querySelector("i");
      
      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  });
  
  // Verificador de força da senha
  passwordInput.addEventListener("input", function() {
    const password = this.value;
    let strength = 0;
    
    // Verifica o comprimento
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Verifica caracteres diversos
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Atualiza a barra de força
    const width = (strength / 5) * 100;
    strengthBar.style.width = `${width}%`;
    
    // Atualiza a cor e texto
    if (strength <= 1) {
      strengthBar.style.backgroundColor = "#ef233c"; // Vermelho
      strengthText.textContent = "Fraca";
      strengthText.style.color = "#ef233c";
    } else if (strength <= 3) {
      strengthBar.style.backgroundColor = "#f8961e"; // Laranja
      strengthText.textContent = "Média";
      strengthText.style.color = "#f8961e";
    } else {
      strengthBar.style.backgroundColor = "#4cc9f0"; // Azul
      strengthText.textContent = "Forte";
      strengthText.style.color = "#4cc9f0";
    }
  });
  
  // Validação em tempo real
  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener("input", function() {
      if (this.value.trim()) {
        this.classList.remove("input-error");
      }
      
      // Esconde mensagem de erro quando o usuário começa a digitar
      if (errorMessage.style.display === "block") {
        errorMessage.style.display = "none";
      }
    });
  });
  
  // Validação de e-mail em tempo real
  emailInput.addEventListener("blur", function() {
    if (this.value.trim() && !validateEmail(this.value)) {
      showError(this, "Por favor, insira um e-mail válido");
    }
  });
  
  // Validação do formulário
  registerForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    resetErrors();
    
    // Validação dos campos
    const errors = [];
    
    if (!nameInput.value.trim()) {
      errors.push("Nome completo é obrigatório");
      nameInput.classList.add("input-error");
    }
    
    if (!emailInput.value.trim()) {
      errors.push("E-mail é obrigatório");
      emailInput.classList.add("input-error");
    } else if (!validateEmail(emailInput.value)) {
      errors.push("Por favor, insira um e-mail válido");
      emailInput.classList.add("input-error");
    }
    
    if (!passwordInput.value.trim()) {
      errors.push("Senha é obrigatória");
      passwordInput.classList.add("input-error");
    } else if (passwordInput.value.length < 8) {
      errors.push("A senha deve ter no mínimo 8 caracteres");
      passwordInput.classList.add("input-error");
    }
    
    if (!confirmPasswordInput.value.trim()) {
      errors.push("Confirmação de senha é obrigatória");
      confirmPasswordInput.classList.add("input-error");
    } else if (passwordInput.value !== confirmPasswordInput.value) {
      errors.push("As senhas não coincidem");
      passwordInput.classList.add("input-error");
      confirmPasswordInput.classList.add("input-error");
    }
    
    // Exibir erros ou enviar formulário
    if (errors.length > 0) {
      showError(null, errors.join(". "));
    } else {
      await submitForm();
    }
  });
  
  // Funções auxiliares
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function showError(input, message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    
    if (input) {
      input.classList.add("input-error");
      input.focus();
    }
  }
  
  function resetErrors() {
    errorMessage.style.display = "none";
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
      input.classList.remove("input-error");
    });
  }
  
  async function submitForm() {
    try {
      // Mostrar estado de carregamento
      submitBtn.classList.add("loading");
      
      // Simular envio assíncrono (substituir por chamada real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular sucesso no cadastro
      alert("Cadastro realizado com sucesso! Redirecionando para login...");
      window.location.href = "login.html";
      
    } catch (error) {
      showError(null, "Ocorreu um erro ao processar seu cadastro. Tente novamente.");
    } finally {
      submitBtn.classList.remove("loading");
    }
  }
  
  // Social login (simulação)
  document.querySelectorAll(".social-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const provider = this.classList.contains("google") ? "Google" : "Facebook";
      alert(`Redirecionando para login com ${provider}...`);
      // Implementar lógica real de autenticação social aqui
    });
  });
});