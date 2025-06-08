document.addEventListener("DOMContentLoaded", function () {
    // Elementos dos formulários
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const showLoginBtn = document.getElementById("showLoginBtn");

    const loginEmail = document.getElementById("email");
    const loginPassword = document.getElementById("password");
    const loginError = document.getElementById("error-message");
    const rememberMe = document.getElementById("remember-me");

    const registerName = document.getElementById("register-name");
    const registerUsername = document.getElementById("register-username");
    const registerEmail = document.getElementById("register-email");
    const registerPassword = document.getElementById("register-password");
    const registerConfirmPassword = document.getElementById("register-confirm-password");
    const registerError = document.getElementById("register-error-message");

    // Verificar se há e-mail salvo no localStorage e preencher automaticamente
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
        loginEmail.value = rememberedEmail;
        rememberMe.checked = true;
    }

    if (showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener("click", showRegisterForm);
        showLoginBtn.addEventListener("click", showLoginForm);
    }

    function showLoginForm() {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        hideError(registerError); // Esconde erro do registro ao trocar
    }

    function showRegisterForm() {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        hideError(loginError); // Esconde erro do login ao trocar
    }

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

    const currentYear = document.getElementById("currentYear");
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // --- Funções Auxiliares ---
    function displayError(element, message) {
        if (!element) return;
        element.textContent = message;
        element.style.display = "block";
        element.style.color = "#ef233c"; // Cor de erro
    }

    function hideError(element) {
        if (!element) return;
        element.style.display = "none";
        element.textContent = "";
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // --- Lógica de Login ---
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    function handleLogin(e) {
        e.preventDefault();
        hideError(loginError);
        console.log("[Login] Tentativa de login...");

        const credencial = loginEmail.value.trim();
        const senha = loginPassword.value.trim();

        if (!credencial || !senha) {
            return displayError(loginError, "Preencha todos os campos.");
        }

        const usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios")) || [];
        console.log("[Login] Usuários cadastrados:", usuariosCadastrados);

        const usuarioEncontrado = usuariosCadastrados.find(usuario =>
            (usuario.email === credencial || usuario.username === credencial) && usuario.senha === senha
        );

        if (!usuarioEncontrado) {
            console.warn("[Login] Credenciais inválidas para:", credencial);
            return displayError(loginError, "Credenciais inválidas. Verifique e tente novamente.");
        }

        console.log("[Login] Usuário encontrado:", usuarioEncontrado);
        handleLoginSuccess(usuarioEncontrado);
    }

    function handleLoginSuccess(userData) {
        console.log("[Login] Login bem-sucedido para:", userData.username);
        // **IMPORTANTE: Incluir joinDate ao salvar usuarioLogado**
        const usuarioLogadoData = {
            nome: userData.nome,
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar || "../../shared/assets/avatars/frog.png", // Inclui avatar com fallback
            joinDate: userData.joinDate // Pega a data de cadastro original
        };

        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogadoData));
        console.log("[Login] Dados salvos em usuarioLogado:", usuarioLogadoData);

        // Limpa dados de foco e conquistas de usuário anterior (se houver)
        // Nota: Decide-se manter ou limpar dependendo da lógica desejada.
        // Por segurança, é melhor manter, a menos que explicitamente pedido para limpar.

        if (rememberMe.checked) {
            localStorage.setItem("rememberedEmail", userData.email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }

        window.location.href = "../dashboard/dashboard.html";
    }

    // --- Lógica de Cadastro ---
    if (registerForm) registerForm.addEventListener("submit", handleRegister);

    function handleRegister(e) {
        e.preventDefault();
        hideError(registerError);
        console.log("[Registro] Tentativa de registro...");

        const nome = registerName.value.trim();
        const username = registerUsername.value.trim();
        const email = registerEmail.value.trim();
        const senha = registerPassword.value;
        const confirmarSenha = registerConfirmPassword.value;

        if (!nome || !username || !email || !senha || !confirmarSenha) {
            return displayError(registerError, "Todos os campos são obrigatórios.");
        }
        if (!validateEmail(email)) {
            return displayError(registerError, "Formato de e-mail inválido.");
        }
        if (senha.length < 6) {
            return displayError(registerError, "A senha deve ter pelo menos 6 caracteres.");
        }
        if (senha !== confirmarSenha) {
            return displayError(registerError, "As senhas não coincidem.");
        }

        const usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios")) || [];

        // Verificar se email ou username já existem
        if (usuariosCadastrados.some(user => user.email === email)) {
            return displayError(registerError, "Este e-mail já está cadastrado.");
        }
        if (usuariosCadastrados.some(user => user.username === username)) {
            return displayError(registerError, "Este nome de usuário já está em uso.");
        }

        // **Criar novo usuário com joinDate**
        const novoUsuario = {
            nome: nome,
            username: username,
            email: email,
            senha: senha, // Em um sistema real, armazene um hash da senha
            avatar: "../../shared/assets/avatars/frog.png", // Avatar padrão inicial
            joinDate: new Date().toISOString() // **ADICIONADO: Data de criação da conta**
        };

        // Adicionar novo usuário à lista
        usuariosCadastrados.push(novoUsuario);

        // Salvar lista atualizada no localStorage
        localStorage.setItem("usuarios", JSON.stringify(usuariosCadastrados));
        console.log("[Registro] Novo usuário cadastrado:", novoUsuario);
        console.log("[Registro] Lista de usuários atualizada:", usuariosCadastrados);

        // Opcional: Fazer login automaticamente após o registro

        // Ou apenas mostrar mensagem de sucesso e redirecionar para login
        alert("Cadastro realizado com sucesso! Faça login para continuar.");
        showLoginForm(); // Volta para a tela de login
        registerForm.reset(); // Limpa o formulário de registro
    }
});

