const ctx = document.getElementById('graficoHoras').getContext('2d');
const graficoHoras = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Horas',
            data: [1, 1, 1.5, 1, 1, 1.5, 1],
            backgroundColor: [
                '#4682B4', '#4682B4', '#4682B4', '#4682B4', '#4682B4', '#32CD32', '#FF6347'
            ],
            borderRadius: 5
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
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