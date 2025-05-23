document.addEventListener("DOMContentLoaded", function () {
  // Elementos dos formulários
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showRegisterBtn = document.getElementById("showRegisterBtn");
  const showLoginBtn = document.getElementById("showLoginBtn");    
  
  // Campos de login
  const loginEmail = document.getElementById("email");
  const loginPassword = document.getElementById("password");
  const loginError = document.getElementById("error-message");
  const rememberMe = document.getElementById("remember-me");

  // Verificar se há e-mail salvo no localStorage e preencher automaticamente
  const rememberedEmail = localStorage.getItem("rememberedEmail");
  if (rememberedEmail) {
    loginEmail.value = rememberedEmail;
    rememberMe.checked = true;
  }

  // Alternância entre formulários
  if (showRegisterBtn && showLoginBtn) {
    showRegisterBtn.addEventListener("click", showRegisterForm);
    showLoginBtn.addEventListener("click", showLoginForm);
  }

  function showLoginForm() {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  }

  function showRegisterForm() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }

  // Mostrar/ocultar senha
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function () {
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

  // Atualizar ano no footer
  const currentYear = document.getElementById("currentYear");
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Evento de envio do formulário de login
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  function displayError(element, message) {
    element.textContent = message;
    element.style.display = "block";
    element.style.color = "#ef233c";
  }

  function hideError(element) {
    element.style.display = "none";
    element.textContent = "";
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Função principal de login
  async function handleLogin(e) {
    e.preventDefault();
    hideError(loginError);

    const credencial = loginEmail.value.trim();
    const senha = loginPassword.value.trim();

    // Validações básicas
    if (!credencial || !senha) {
      return displayError(loginError, "Preencha todos os campos");
    }

    // Obter todos os usuários cadastrados
    const usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios")) || [];
    
    // Buscar usuário por email ou username
    const usuarioEncontrado = usuariosCadastrados.find(usuario => {
      return usuario.email === credencial || usuario.username === credencial;
    });

    if (!usuarioEncontrado) {
      return displayError(loginError, "Credenciais inválidas. Verifique e tente novamente.");
    }

    // Verificar senha (em sistema real, comparar hash)
    if (usuarioEncontrado.senha !== senha) {
      return displayError(loginError, "Senha incorreta");
    }

    // Login bem-sucedido
    handleLoginSuccess(usuarioEncontrado);
  }

  // Tratamento de login bem-sucedido
  function handleLoginSuccess(userData) {
    // Salvar dados do usuário logado
    localStorage.setItem('usuarioLogado', JSON.stringify({
      nome: userData.nome,
      username: userData.username,
      email: userData.email
    }));

    // Se "Lembrar de mim" estiver marcado, salvar email
    if (rememberMe.checked) {
      localStorage.setItem('rememberedEmail', userData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    // Redirecionar para a página inicial
    window.location.href = "../dashboard/inicio.html";
  }

  // CADASTRO (mantido para referência, mas deve ser ajustado conforme mostrado anteriormente)
  async function handleRegister(e) {
    e.preventDefault();
    // ... (código de cadastro mantido)
  }
});