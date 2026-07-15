const STORAGE_KEY='kayfit-state-v02';
const body=document.body;
const themeBtn=document.querySelector('#themeBtn');
const simulateBtn=document.querySelector('#simulateBtn');
const startBtn=document.querySelector('#startBtn');
const finishBtn=document.querySelector('#finishBtn');
const readiness=document.querySelector('#readiness');
const load=document.querySelector('#load');
const streak=document.querySelector('#streak');
const stateLabel=document.querySelector('#stateLabel');
const sessionTag=document.querySelector('#sessionTag');
const sessionTitle=document.querySelector('#sessionTitle');
const sessionDescription=document.querySelector('#sessionDescription');
const sessionMinutes=document.querySelector('#sessionMinutes');
const exerciseCount=document.querySelector('#exerciseCount');
const targetRpe=document.querySelector('#targetRpe');
const exerciseList=document.querySelector('#exerciseList');
const sessionClock=document.querySelector('#sessionClock');
const weeklyOutput=document.querySelector('#weeklyOutput');
const progressCaption=document.querySelector('#progressCaption');
const progressBars=document.querySelector('#progressBars');

const signals={
  recovery:{label:document.querySelector('#recoveryValue'),meter:document.querySelector('#recoveryMeter')},
  energy:{label:document.querySelector('#energyValue'),meter:document.querySelector('#energyMeter')},
  performance:{label:document.querySelector('#performanceValue'),meter:document.querySelector('#performanceMeter')}
};

const routines={
  ready:{tag:'PUSH / CORE',title:'Signal 48',description:'Intensidad alta, volumen medio y descansos controlados. La sesión cambia con tu estado, no con el ego.',minutes:48,rpe:'8.1',exercises:[['Incline press','4 × 8'],['Landmine press','3 × 10'],['Ring push-up','3 × AMRAP'],['Cable fly','3 × 12'],['Pallof press','4 × 12'],['Dead bug','3 × 16'],['Bike finisher','6 × 30s']]},
  balanced:{tag:'FULL BODY',title:'Balance 42',description:'Carga moderada y técnica limpia. Hoy importa sumar calidad sin vaciar el depósito.',minutes:42,rpe:'7.2',exercises:[['Goblet squat','4 × 10'],['DB bench press','3 × 10'],['Chest-supported row','4 × 10'],['Romanian deadlift','3 × 8'],['Farmer carry','4 × 30m'],['Side plank','3 × 40s']]},
  recover:{tag:'RECOVERY / FLOW',title:'Reset 30',description:'Baja fatiga, recupera rango y mantén el hábito. El progreso también sabe cuándo aflojar.',minutes:30,rpe:'5.5',exercises:[['Incline walk','8 min'],['Hip mobility flow','3 rounds'],['Tempo squat','3 × 8'],['Band row','3 × 15'],['Bird dog','3 × 12'],['Breathing reset','5 min']]}
};

const defaultState={theme:'dark',signals:{recovery:81,energy:87,performance:84},completed:[],elapsed:0,running:false,sessionStartedAt:null,history:[]};
let state=loadState();
let timerId=null;

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {...defaultState,...saved,signals:{...defaultState.signals,...saved?.signals},history:Array.isArray(saved?.history)?saved.history:[]};
  }catch{return {...defaultState,signals:{...defaultState.signals},history:[]};}
}

function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function pad(value){return String(value).padStart(2,'0');}
function formatTime(seconds){const h=Math.floor(seconds/3600);const m=Math.floor((seconds%3600)/60);const s=seconds%60;return `${pad(h)}:${pad(m)}:${pad(s)}`;}
function score(){return Math.round(Object.values(state.signals).reduce((sum,value)=>sum+value,0)/3);}
function stateKey(){const value=score();return value>=82?'ready':value>=70?'balanced':'recover';}
function routine(){return routines[stateKey()];}

function renderSignals(){
  Object.entries(state.signals).forEach(([key,value])=>{signals[key].label.textContent=value;signals[key].meter.style.setProperty('--value',`${value}%`);});
  const currentScore=score();
  readiness.textContent=currentScore;
  load.textContent=`${Math.max(48,Math.min(92,currentScore-8))}%`;
  stateLabel.textContent=stateKey().toUpperCase();
}

function renderRoutine(){
  const current=routine();
  sessionTag.textContent=current.tag;
  sessionTitle.textContent=current.title;
  sessionDescription.textContent=current.description;
  sessionMinutes.textContent=current.minutes;
  exerciseCount.textContent=String(current.exercises.length).padStart(2,'0');
  targetRpe.textContent=current.rpe;
  exerciseList.innerHTML=current.exercises.map(([name,reps],index)=>`<button type="button" data-index="${index}" class="${state.completed.includes(index)?'done':''}"><span>${pad(index+1)}</span><b>${name}</b><em>${reps}</em></button>`).join('');
  exerciseList.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>toggleExercise(Number(button.dataset.index))));
  renderClock();
}

function toggleExercise(index){
  state.completed=state.completed.includes(index)?state.completed.filter(item=>item!==index):[...state.completed,index];
  saveState();
  renderRoutine();
}

function renderClock(){
  const total=routine().exercises.length;
  const percent=total?Math.round((state.completed.length/total)*100):0;
  sessionClock.textContent=`${formatTime(state.elapsed)} · ${percent}% complete`;
  startBtn.textContent=state.running?'Pause session':state.elapsed>0?'Resume session':'Start session';
  startBtn.setAttribute('aria-pressed',String(state.running));
  finishBtn.disabled=state.elapsed===0;
}

function tick(){
  if(!state.running)return;
  state.elapsed+=1;
  saveState();
  renderClock();
}

function startTimer(){
  if(timerId)clearInterval(timerId);
  timerId=setInterval(tick,1000);
}

function toggleSession(){
  state.running=!state.running;
  if(state.running){
    state.sessionStartedAt=state.sessionStartedAt||new Date().toISOString();
    startTimer();
  }else if(timerId){clearInterval(timerId);timerId=null;}
  saveState();
  renderClock();
}

function finishSession(){
  if(state.elapsed===0)return;
  const current=routine();
  const completion=Math.round((state.completed.length/current.exercises.length)*100);
  state.history.push({date:new Date().toISOString(),duration:state.elapsed,completion,readiness:score(),routine:current.title});
  state.history=state.history.slice(-30);
  state.running=false;
  state.elapsed=0;
  state.completed=[];
  state.sessionStartedAt=null;
  if(timerId){clearInterval(timerId);timerId=null;}
  saveState();
  renderAll();
  finishBtn.textContent='Session saved ✓';
  setTimeout(()=>finishBtn.textContent='Finish & save',1400);
}

function calculateStreak(){
  const unique=[...new Set(state.history.map(item=>item.date.slice(0,10)))].sort().reverse();
  if(!unique.length)return 0;
  let current=new Date();
  current.setHours(0,0,0,0);
  let count=0;
  for(const day of unique){
    const date=new Date(`${day}T00:00:00`);
    const diff=Math.round((current-date)/86400000);
    if(diff===0||diff===1){count++;current=date;}else break;
  }
  return count;
}

function renderProgress(){
  streak.textContent=pad(calculateStreak());
  const lastSeven=Array.from({length:7},(_,index)=>{const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()-(6-index));return date.toISOString().slice(0,10);});
  const counts=lastSeven.map(day=>state.history.filter(item=>item.date.slice(0,10)===day).length);
  const max=Math.max(1,...counts);
  progressBars.innerHTML=counts.map(count=>`<i style="--h:${count?Math.max(22,Math.round((count/max)*100)):6}%" title="${count} sessions"></i>`).join('');
  const weekSessions=counts.reduce((sum,value)=>sum+value,0);
  weeklyOutput.textContent=`${weekSessions} session${weekSessions===1?'':'s'}`;
  progressCaption.textContent=state.history.length?`${state.history.length} saved sessions · local history on this device`:'Complete a session to build your real history.';
}

function simulateDay(){
  state.signals={recovery:randomSignal(),energy:randomSignal(),performance:randomSignal()};
  state.completed=[];
  state.elapsed=0;
  state.running=false;
  state.sessionStartedAt=null;
  if(timerId){clearInterval(timerId);timerId=null;}
  saveState();
  renderAll();
  simulateBtn.textContent=`Loaded ${stateKey()} day`;
  setTimeout(()=>simulateBtn.textContent='Simulate new day',1300);
}

function randomSignal(){return Math.floor(55+Math.random()*41);}
function renderTheme(){body.classList.toggle('light',state.theme==='light');}
function renderAll(){renderTheme();renderSignals();renderRoutine();renderProgress();}

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.16});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

themeBtn.addEventListener('click',()=>{state.theme=state.theme==='light'?'dark':'light';saveState();renderTheme();});
simulateBtn.addEventListener('click',simulateDay);
startBtn.addEventListener('click',toggleSession);
finishBtn.addEventListener('click',finishSession);
window.addEventListener('beforeunload',saveState);

if(state.running){startTimer();}
renderAll();