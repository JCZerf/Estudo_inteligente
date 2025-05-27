/**
 * GLOBAL USER DISPLAY SCRIPT - MOSTRAR APENAS USERNAME E LINK PARA PERFIL
 * Adicione este script em todas as páginas para exibir o username logado
 */

document.addEventListener("DOMContentLoaded", function() {
  // Elemento onde o username será exibido
  const userDisplayElement = document.getElementById("userName");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");

  // Função para atualizar a exibição do usuário
  function updateUserDisplay() {
    const userData = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (userData && userDisplayElement) {
      // Cria um link para a página de perfil
      const profileLink = document.createElement("a");
      // Ajusta o caminho dependendo de onde o script está sendo chamado
      // Assume que está em /features/*/*.html ou /dashboard/dashboard.html
      // Se estiver na raiz (landing page), o caminho seria diferente.
      // Verifica se a página atual está dentro de 'features'
      if (window.location.pathname.includes("/features/")) {
          profileLink.href = "../../features/profile/profile.html"; // Caminho relativo de features/* para features/perfil
      } else if (window.location.pathname.includes("/dashboard/")) {
          profileLink.href = "../features/profile/profile.html"; // Caminho relativo de dashboard para features/perfil
      } else {
          // Fallback para um caminho absoluto ou relativo da raiz (ajustar se necessário)
          profileLink.href = "src/features/profile/profile.html"; // Ajuste conforme a estrutura real
      }

      profileLink.textContent = userData.username || "Usuário"; // Prioriza username
      profileLink.style.color = "inherit"; // Mantém a cor do texto do header
      profileLink.style.textDecoration = "none"; // Remove sublinhado padrão

      // Limpa o conteúdo anterior e adiciona o link
      userDisplayElement.innerHTML = "";
      userDisplayElement.appendChild(profileLink);

      // Mostra o elemento
      userDisplayElement.style.display = "inline";

      // Atualiza botões
      if (loginButton) loginButton.style.display = "none";
      if (logoutButton) logoutButton.style.display = "inline";
    } else {
      // Usuário não logado
      if (userDisplayElement) {
          userDisplayElement.innerHTML = ""; // Limpa qualquer conteúdo anterior
          userDisplayElement.style.display = "none";
      }
      if (loginButton) loginButton.style.display = "inline";
      if (logoutButton) logoutButton.style.display = "none";
    }
  }

  // Função para logout
  function handleLogout() {
    localStorage.removeItem("usuarioLogado");
    updateUserDisplay(); // Atualiza o header para o estado deslogado
    // Tenta determinar o caminho correto para a landing page
    let indexPath = "index.html";
    if (window.location.pathname.includes("/features/") || window.location.pathname.includes("/dashboard/")) {
        indexPath = "../../landing/index.html"; // Caminho relativo das subpastas para landing
    }
    window.location.href = indexPath; // Redireciona para a landing page
  }

  // Atualiza a exibição quando a página carrega
  updateUserDisplay();

  // Adiciona evento de logout
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }

  window.addEventListener("storage", function(event) {
    if (event.key === "usuarioLogado") {
      updateUserDisplay();
    }
  });

  // Ouve o evento personalizado disparado pela página de perfil
  window.addEventListener("userUpdated", function() {
      console.log("userUpdated event received in global-user.js. Updating display.");
      updateUserDisplay();
  });

});

