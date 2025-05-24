/**
 * GLOBAL USER DISPLAY SCRIPT - MOSTRAR APENAS USERNAME
 * Adicione este script em todas as páginas para exibir o username logado
 */

document.addEventListener("DOMContentLoaded", function() {
  // Elemento onde o username será exibido
  const userDisplayElement = document.getElementById('userName');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  
  // Função para atualizar a exibição do usuário
  function updateUserDisplay() {
    const userData = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    if (userData && userDisplayElement) {
      // Exibe APENAS o username (como especificado)
      const displayName = userData.username || 'userName'; // Prioriza username
      userDisplayElement.textContent = displayName;
      
      // Mostra o elemento
      userDisplayElement.style.display = 'inline';
      
      // Atualiza botões
      if (loginButton) loginButton.style.display = 'none';
      if (logoutButton) logoutButton.style.display = 'inline';
    } else {
      // Usuário não logado
      if (userDisplayElement) userDisplayElement.style.display = 'none';
      if (loginButton) loginButton.style.display = 'inline';
      if (logoutButton) logoutButton.style.display = 'none';
    }
  }
  
  // Função para logout
  function handleLogout() {
    localStorage.removeItem('usuarioLogado');
    updateUserDisplay();
    window.location.href = 'index.html'; // Ajuste conforme necessário
  }
  
  // Atualiza a exibição quando a página carrega
  updateUserDisplay();
  
  // Adiciona evento de logout
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
  
  // Observa mudanças no localStorage
  window.addEventListener('storage', function(event) {
    if (event.key === 'usuarioLogado') {
      updateUserDisplay();
    }
  });
});

// Dispara evento para outros sistemas saberem que o nome mudou
window.dispatchEvent(new CustomEvent("userNameChanged", {
    detail: { newName: userData.username }
}));