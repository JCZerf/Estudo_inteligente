/**
 * Script JavaScript para a página de Login
 * Gerencia a autenticação de usuários, validação de formulários e interações da interface
 */

document.addEventListener("DOMContentLoaded", function() {
  // Elementos do DOM - Referências aos elementos HTML da página
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showRegisterBtn = document.getElementById("showRegisterBtn");
  const showLoginBtn = document.getElementById("showLoginBtn");
  
  // Elementos do formulário de login e cadastro
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-senha");
  const loginError = document.getElementById("login-error-message");
  const rememberMe = document.getElementById("remember-me");
  
  const registerName = document.getElementById("register-name");
  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-senha");
  const registerConfirmPassword = document.getElementById("register-confirm-senha");
  const registerError = document.getElementById("register-error-message");

  // Configuração dos botões para alternar entre formulários de login e cadastro
  showRegisterBtn.addEventListener("click", showRegisterForm);
  showLoginBtn.addEventListener("click", showLoginForm);

  /**
   * Configura os botões de mostrar/ocultar senha
   * Alterna a visibilidade do texto da senha e o ícone do botão
   */
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function() {
      const input = this.parentElement.querySelector("input");
      const type = input.type === "password" ? "text" : "password";
      input.type = type;
      this.textContent = type === "password" ? "👁" : "👁‍🗨";
    });
  });

  /**
   * Recupera o email salvo no localStorage (funcionalidade "Lembrar de mim")
   * Preenche automaticamente o campo de email se o usuário salvou anteriormente
   */
  if (localStorage.getItem("rememberedEmail")) {
    loginEmail.value = localStorage.getItem("rememberedEmail");
    rememberMe.checked = true;
  }

  // Atualiza o ano no rodapé para o ano atual
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  // Configura os eventos de submissão dos formulários
  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);

  /**
   * Funções auxiliares para gerenciar a interface e validação
   */
  
  /**
   * Exibe o formulário de login e oculta o de cadastro
   */
  function showLoginForm() {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  }

  /**
   * Exibe o formulário de cadastro e oculta o de login
   */
  function showRegisterForm() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }

  /**
   * Exibe uma mensagem de erro em um elemento específico
   * @param {HTMLElement} element - Elemento onde a mensagem será exibida
   * @param {string} message - Texto da mensagem de erro
   */
  function displayError(element, message) {
    element.textContent = message;
    element.style.display = "block";
  }

  /**
   * Oculta a mensagem de erro
   * @param {HTMLElement} element - Elemento que contém a mensagem de erro
   */
  function hideError(element) {
    element.style.display = "none";
  }

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
   * Manipula o envio do formulário de login
   * Valida os campos e simula o processo de autenticação
   * @param {Event} e - Evento de submissão do formulário
   */
  async function handleLogin(e) {
    e.preventDefault();
    hideError(loginError);

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    // Validação de campos obrigatórios
    if (!email || !password) {
      return displayError(loginError, "Preencha todos os campos");
    }

    // Validação de formato de email
    if (!validateEmail(email)) {
      return displayError(loginError, "E-mail inválido");
    }

    // Simula o tempo de processamento do login (para demonstração)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Salva o email no localStorage se a opção "Lembrar de mim" estiver marcada
    if (rememberMe.checked) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    // Redireciona para a página inicial após login bem-sucedido
    window.location.href = "../dashboard/inicio.html";
  }

  /**
   * Manipula o envio do formulário de cadastro
   * Valida os campos e simula o processo de criação de conta
   * @param {Event} e - Evento de submissão do formulário
   */
  async function handleRegister(e) {
    e.preventDefault();
    hideError(registerError);

    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirmPassword = registerConfirmPassword.value.trim();

    // Validação de campos obrigatórios
    if (!name || !email || !password || !confirmPassword) {
      return displayError(registerError, "Preencha todos os campos");
    }

    // Validação de formato de email
    if (!validateEmail(email)) {
      return displayError(registerError, "E-mail inválido");
    }

    // Validação de comprimento mínimo da senha
    if (password.length < 8) {
      return displayError(registerError, "A senha deve ter no mínimo 8 caracteres");
    }

    // Validação de confirmação de senha
    if (password !== confirmPassword) {
      return displayError(registerError, "As senhas não coincidem");
    }

    // Simula o tempo de processamento do cadastro (para demonstração)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Exibe mensagem de sucesso e retorna ao formulário de login
    alert("Conta criada com sucesso!");
    showLoginForm();
  }
});
