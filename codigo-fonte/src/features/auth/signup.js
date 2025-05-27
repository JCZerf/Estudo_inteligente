/**
 * Script JavaScript para a página de Cadastro
 * Gerencia a criação de contas de usuários, validação de formulários e interações da interface
 */

document.addEventListener("DOMContentLoaded", function() {
  const registerForm = document.getElementById("registerForm");
  const nameInput = document.getElementById("name");
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const errorMessage = document.getElementById("error-message");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  const submitBtn = registerForm.querySelector(".btn-primary");

  document.getElementById("currentYear").textContent = new Date().getFullYear();

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

  // Verificador de força da senha
  passwordInput.addEventListener("input", function() {
    const password = this.value;
    let strength = 0;

    // Critérios de avaliação da força da senha
    // Verifica o comprimento
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Atualiza a largura da barra de força (0-100%)
    const width = (strength / 5) * 100;
    strengthBar.style.width = `${width}%`;

    // Alterar visualmente a barra de força da senha 
    if (strength <= 1) {
      strengthBar.style.backgroundColor = "#ef233c";
      strengthText.textContent = "Fraca";
      strengthText.style.color = "#ef233c";
    } else if (strength <= 3) {
      strengthBar.style.backgroundColor = "#f8961e";
      strengthText.textContent = "Média";
      strengthText.style.color = "#f8961e";
    } else {
      strengthBar.style.backgroundColor = "#4cc9f0";
      strengthText.textContent = "Forte";
      strengthText.style.color = "#4cc9f0";
    }
  });

  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener("input", function() {
      if (this.value.trim()) {
        this.classList.remove("input-error");
      }
      if (errorMessage.style.display === "block") {
        errorMessage.style.display = "none";
      }
    });
  });

  emailInput.addEventListener("blur", function() {
    if (this.value.trim() && !validateEmail(this.value)) {
      showError(this, "Por favor, insira um e-mail válido");
    }
    
  });

  registerForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    resetErrors();

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

    if (errors.length > 0) {
      showError(null, errors.join(". "));
    } else {
      await submitForm();
    }
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showEmailError(message) {
    const emailError = document.getElementById('email-error');
    emailError.textContent = message;
    emailError.style.display = 'block';
    document.getElementById('email').classList.add('input-error');
}

function hideEmailError() {
    const emailError = document.getElementById('email-error');
    emailError.style.display = 'none';
    document.getElementById('email').classList.remove('input-error');
}

async function validarCadastro(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    hideEmailError(); // Esconde erros anteriores

    // Validação de e-mail duplicado
    if (emailJaCadastrado(email)) {
        showEmailError('Este e-mail já está cadastrado! Use outro e-mail ou faça login.');
        return false;
    }
    
    return true;
}

// Validação em tempo real ao sair do campo
document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    if (email && emailJaCadastrado(email)) {
        showEmailError('Este e-mail já está cadastrado!');
    } else {
        hideEmailError();
    }
});

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

  // Função para verificar se e-mail já existe
function emailJaCadastrado(email) {
  const usuariosCadastrados = JSON.parse(localStorage.getItem('usuarios')) || [];
  return usuariosCadastrados.some(usuario => 
    usuario.email.toLowerCase() === email.toLowerCase()
  );
}

// Função principal de validação do formulário
async function validarCadastro(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  
  // Validação de e-mail duplicado
  if (emailJaCadastrado(email)) {
    alert('Este e-mail já está cadastrado! Por favor, use outro e-mail ou faça login.');
    document.getElementById('email').focus();
    return false;
  }
  
  // Se passar na validação, continua com o cadastro
  const novoUsuario = {
    nome: document.getElementById('name').value.trim(),
    username: document.getElementById('username').value.trim(),
    email: email,
    senha: document.getElementById('password').value,
    dataCadastro: new Date().toISOString()
  };

  // Atualiza a lista de usuários
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  usuarios.push(novoUsuario);
  localStorage.setItem('usuarios', JSON.stringify(usuarios));

  alert('Cadastro realizado com sucesso!');
  window.location.href = 'login.html';
  return true;
}

// Adiciona o event listener ao formulário
document.getElementById('registerForm').addEventListener('submit', validarCadastro);

  async function submitForm() {
    try {
      submitBtn.classList.add("loading");

      // Simula tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      const usuario = {
        nome: nameInput.value.trim(),
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        senha: passwordInput.value
      };

      localStorage.setItem("usuarioCadastrado", JSON.stringify(usuario));

      alert("Cadastro realizado com sucesso! Redirecionando para login...");
      window.location.href = "login.html";

    } catch (error) {
      showError(null, "Ocorreu um erro ao processar seu cadastro. Tente novamente.");
    } finally {
      submitBtn.classList.remove("loading");
    }
  }

  // Simulação de login social
  document.querySelectorAll(".social-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const provider = this.classList.contains("google") ? "Google" : "Facebook";
      alert(`Redirecionando para login com ${provider}...`);
    });
  });
});
