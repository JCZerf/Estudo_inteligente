//Cronograma JS
document.addEventListener('DOMContentLoaded', function() {
  // Navegação entre semanas
  const weekNav = {
    currentDate: new Date(),
    elements: {
      prevBtn: document.getElementById('prevWeek'),
      nextBtn: document.getElementById('nextWeek'),
      weekDisplay: document.getElementById('currentWeek')
    },
    
    init() {
      this.updateWeekDisplay();
      this.elements.prevBtn.addEventListener('click', () => this.changeWeek(-1));
      this.elements.nextBtn.addEventListener('click', () => this.changeWeek(1));
      this.loadSchedule();
    },
    
    changeWeek(weeks) {
      this.currentDate.setDate(this.currentDate.getDate() + (weeks * 7));
      this.updateWeekDisplay();
      this.loadSchedule();
    },
    
    updateWeekDisplay() {
      const startOfWeek = new Date(this.currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      const options = { day: 'numeric', month: 'long' };
      const startStr = startOfWeek.toLocaleDateString('pt-BR', options);
      const endStr = endOfWeek.toLocaleDateString('pt-BR', options);
      
      this.elements.weekDisplay.textContent = `Semana ${startStr} - ${endStr} ${endOfWeek.getFullYear()}`;
    },
    
    loadSchedule() {
      // Carrega eventos do localStorage ou API
      const savedSchedule = localStorage.getItem('studySchedule') || '[]';
      const events = JSON.parse(savedSchedule);
      
      // Limpa eventos existentes
      document.querySelectorAll('.event').forEach(event => event.remove());
      
      // Adiciona eventos ao calendário
      events.forEach(event => {
        if (this.isEventInCurrentWeek(event.date)) {
          this.addEventToCalendar(event);
        }
      });
    },
    
    isEventInCurrentWeek(eventDate) {
      // Implemente a lógica para verificar se o evento está na semana atual
      return true;
    },
    
    addEventToCalendar(event) {
      const cell = document.querySelector(`.cell[data-day="${event.day}"][data-time="${event.time}"]`);
      if (cell) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event';
        eventElement.dataset.subject = event.subject;
        eventElement.dataset.type = event.type;
        
        eventElement.innerHTML = `
          <span class="event-title">${event.subject}</span>
          <span class="event-time">${event.time}-${event.endTime}</span>
        `;
        
        eventElement.addEventListener('click', () => this.editEvent(event.id));
        cell.appendChild(eventElement);
      }
    },
    
    editEvent(eventId) {
      // Implemente a edição de eventos
      console.log('Editar evento:', eventId);
    }
  };
  
  // Modal para adicionar eventos
  const eventModal = {
    elements: {
      modal: document.getElementById('eventModal'),
      openBtn: document.getElementById('addEvent'),
      closeBtn: document.querySelector('.close-modal'),
      form: document.getElementById('eventForm')
    },
    
    init() {
      this.elements.openBtn.addEventListener('click', () => this.open());
      this.elements.closeBtn.addEventListener('click', () => this.close());
      this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
      window.addEventListener('click', (e) => {
        if (e.target === this.elements.modal) this.close();
      });
    },
    
    open() {
      this.elements.modal.style.display = 'block';
    },
    
    close() {
      this.elements.modal.style.display = 'none';
      this.elements.form.reset();
    },
    
    handleSubmit(e) {
      e.preventDefault();
      
      const newEvent = {
        id: Date.now(),
        subject: document.getElementById('eventSubject').value,
        type: document.getElementById('eventType').value,
        day: document.getElementById('eventDay').value,
        time: document.getElementById('eventTime').value,
        duration: document.getElementById('eventDuration').value,
        date: new Date() // Adaptar para a data correta
      };
      
      // Calcula horário de término
      const [hours, minutes] = newEvent.time.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(hours);
      endTime.setMinutes(minutes + parseInt(newEvent.duration));
      newEvent.endTime = endTime.toTimeString().substring(0, 5);
      
      // Salva no localStorage
      const savedSchedule = localStorage.getItem('studySchedule') || '[]';
      const events = JSON.parse(savedSchedule);
      events.push(newEvent);
      localStorage.setItem('studySchedule', JSON.stringify(events));
      
      // Adiciona ao calendário
      weekNav.addEventToCalendar(newEvent);
      
      this.close();
    }
  };
  
  // Botão de impressão
  document.getElementById('printSchedule').addEventListener('click', function() {
    window.print();
  });
  
  // Inicializa tudo
  weekNav.init();
  eventModal.init();
  
  // Interação com eventos existentes
  document.querySelectorAll('.event').forEach(event => {
    event.addEventListener('click', function() {
      console.log('Editar evento:', this.dataset.subject);
    });
  });
});