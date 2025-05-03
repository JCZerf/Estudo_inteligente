//JS INICIO
document.addEventListener('DOMContentLoaded', function() {
    // Carrega as tarefas após 1 segundo (simulando async)
    setTimeout(loadTarefas, 1000);
    
    // Inicializa o gráfico
    initChart();
    
    // Atualiza o ano no footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Verifica permissão para notificações
    checkNotificationPermission();
});

function loadTarefas() {
    const tarefasSection = document.getElementById('tarefasSection');
    
    if (tarefasSection) {
        // Remove o efeito de loading
        const loading = tarefasSection.querySelector('.skeleton-loading');
        if (loading) loading.remove();
        
        // Adiciona o conteúdo real
        tarefasSection.innerHTML = `
            <h3>Tarefas agendadas</h3>
            <ul>
                <li>Estudar matemática</li>
                <li>Estudar Programação</li>
            </ul>
        `;
    }
}

function initChart() {
    const ctx = document.getElementById('graficoHoras');
    
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Horas de estudo',
                    data: [1, 1.2, 1.5, 1.8, 1.2, 1.5, 2.3],
                    backgroundColor: [
                        '#4682B4', '#4682B4', '#4682B4', '#4682B4', '#4682B4', '#32CD32', '#FF6347'
                    ],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 0.5 },
                        grid: { display: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutBounce'
                }
            }
        });
    }
}

function checkNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            console.log('Permissão para notificações:', permission);
        });
    }
}