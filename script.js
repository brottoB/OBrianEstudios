const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.16 });
revealItems.forEach((item) => observer.observe(item));

const channels = [...document.querySelectorAll('.channel')];
const coreStatus = document.getElementById('coreStatus');
const statusCount = document.getElementById('statusCount');
const sunMachine = document.getElementById('sunMachine');
const pulseToggle = document.getElementById('pulseToggle');

function updateCore() {
  const activeCount = channels.filter((channel) => channel.classList.contains('active')).length;
  statusCount.textContent = `${activeCount} / 3`;

  if (activeCount === 3) {
    coreStatus.classList.add('online');
    coreStatus.querySelector('p').textContent = 'CORE ONLINE — SOLAR CONVERSION SEQUENCE ACTIVE';
    sunMachine.classList.add('pulse');
    pulseToggle.textContent = 'Pulse: on';
  } else {
    coreStatus.classList.remove('online');
    coreStatus.querySelector('p').textContent = 'CORE DORMANT — ACTIVATE ALL THREE CHANNELS';
    sunMachine.classList.remove('pulse');
    pulseToggle.textContent = 'Pulse: off';
  }
}

channels.forEach((channel) => {
  const button = channel.querySelector('button');
  button.addEventListener('click', () => {
    channel.classList.toggle('active');
    button.textContent = channel.classList.contains('active') ? 'Channel active' : 'Activate channel';
    updateCore();
  });
});

pulseToggle.addEventListener('click', () => {
  sunMachine.classList.toggle('pulse');
  pulseToggle.textContent = sunMachine.classList.contains('pulse') ? 'Pulse: on' : 'Pulse: off';
});

window.addEventListener('pointermove', (event) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 10;
  const y = (event.clientY / window.innerHeight - 0.5) * 10;
  sunMachine.style.transform = `translate(${x}px, ${y}px)`;
});
