document.addEventListener("DOMContentLoaded", function() {
  // Elementos do DOM
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showRegisterBtn = document.getElementById("showRegisterBtn");
  const showLoginBtn = document.getElementById("showLoginBtn");
  
  // Elementos do formulário
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-senha");
  const loginError = document.getElementById("login-error-message");
  const rememberMe = document.getElementById("remember-me");
  
  const registerName = document.getElementById("register-name");
  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-senha");
  const registerConfirmPassword = document.getElementById("register-confirm-senha");
  const registerError = document.getElementById("register-error-message");

  // Toggle entre formulários
  showRegisterBtn.addEventListener("click", showRegisterForm);
  showLoginBtn.addEventListener("click", showLoginForm);

  // Toggle de visibilidade de senha
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function() {
      const input = this.parentElement.querySelector("input");
      const type = input.type === "password" ? "text" : "password";
      input.type = type;
      this.textContent = type === "password" ? "👁" : "👁‍🗨";
    });
  });

  // Lembrar e-mail
  if (localStorage.getItem("rememberedEmail")) {
    loginEmail.value = localStorage.getItem("rememberedEmail");
    rememberMe.checked = true;
  }

  // Atualizar ano no footer
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  // Eventos de submit
  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);

  // Funções
  function showLoginForm() {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  }

  function showRegisterForm() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }

  function displayError(element, message) {
    element.textContent = message;
    element.style.display = "block";
  }

  function hideError(element) {
    element.style.display = "none";
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async function handleLogin(e) {
    e.preventDefault();
    hideError(loginError);

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      return displayError(loginError, "Preencha todos os campos");
    }

    if (!validateEmail(email)) {
      return displayError(loginError, "E-mail inválido");
    }

    // Simular verificação (substituir por chamada real)
    await new Promise(resolve => setTimeout(resolve, 800));

    if (rememberMe.checked) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    // Redirecionar (simulado)
    window.location.href = "../dashboard/inicio.html";
  }

  async function handleRegister(e) {
    e.preventDefault();
    hideError(registerError);

    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirmPassword = registerConfirmPassword.value.trim();

    if (!name || !email || !password || !confirmPassword) {
      return displayError(registerError, "Preencha todos os campos");
    }

    if (!validateEmail(email)) {
      return displayError(registerError, "E-mail inválido");
    }

    if (password.length < 8) {
      return displayError(registerError, "A senha deve ter no mínimo 8 caracteres");
    }

    if (password !== confirmPassword) {
      return displayError(registerError, "As senhas não coincidem");
    }

    // Simular cadastro (substituir por chamada real)
    await new Promise(resolve => setTimeout(resolve, 800));

    alert("Conta criada com sucesso!");
    showLoginForm();
  }
});