/* =======================
   Skeine Kids Learning (Premium PWA UI)
   app.js — full script (colorful tiles + high contrast)
   ======================= */

const MODES = ["Shapes","Colors","Numbers","Letters","Phonics","Memory","Math","Story"];

const SHAPES = ["Circle","Square","Triangle","Star","Heart","Diamond"];
const COLORS = ["Red","Blue","Green","Yellow","Purple","Orange","Pink","Teal"];
const NUMBERS = [1,2,3,4,5,6,7,8,9];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const COLOR_MAP = {
  Red:"#ef4444",
  Blue:"#3b82f6",
  Green:"#22c55e",
  Yellow:"#facc15",
  Purple:"#a855f7",
  Orange:"#fb923c",
  Pink:"#fb7185",
  Teal:"#14b8a6"
};

// Bright “kid” palette for shapes and number tiles
const SHAPE_COLOR = {
  Circle:"#22c55e",
  Square:"#3b82f6",
  Triangle:"#f97316",
  Star:"#facc15",
  Heart:"#fb7185",
  Diamond:"#a855f7"
};
const NUMBER_GRADIENTS = [
  ["#60a5fa","#a78bfa"],
  ["#34d399","#60a5fa"],
  ["#fbbf24","#fb7185"],
  ["#fb7185","#a78bfa"],
  ["#22c55e","#facc15"],
  ["#f97316","#fb7185"],
  ["#14b8a6","#60a5fa"],
  ["#a78bfa","#f472b6"],
  ["#facc15","#60a5fa"]
];

const PHONICS = [
  {letter:"A",sound:"ah"},{letter:"B",sound:"buh"},{letter:"C",sound:"kuh"},{letter:"D",sound:"duh"},
  {letter:"E",sound:"eh"},{letter:"F",sound:"fuh"},{letter:"G",sound:"guh"},{letter:"H",sound:"huh"},
  {letter:"I",sound:"ih"},{letter:"J",sound:"juh"},{letter:"K",sound:"kuh"},{letter:"L",sound:"luh"},
  {letter:"M",sound:"muh"},{letter:"N",sound:"nuh"},{letter:"O",sound:"oh"},{letter:"P",sound:"puh"},
  {letter:"R",sound:"ruh"},{letter:"S",sound:"sss"},{letter:"T",sound:"tuh"}
];

const STORY = [
  { title:"Sunny Park", text:"Jayce and Jayde go to the park. They see a red ball!", q:{type:"color",prompt:"Tap the RED thing",answer:"Red"} },
  { title:"Shape Picnic", text:"A friendly puppy brings snacks on a STAR plate.", q:{type:"shape",prompt:"Tap the STAR",answer:"Star"} },
  { title:"Counting Ducks", text:"They see ducks in the pond. Let’s count!", q:{type:"number",prompt:"Tap the number 3",answer:3} },
];

const AVATARS = {
  Jayce: { img:"jayce.png", fallback:"👦" },
  Jayde: { img:"jayde.png", fallback:"👧" }
};

const LS_KEY = "skeine_kids_pwa_premium_v4";
const app = document.getElementById("app");

const state = {
  screen: "welcome", // welcome|player|mode|game|winner
  player: null,
  mode: "Shapes",
  round: 1,
  score: 0,
  stars: 0,
  difficulty: 1,
  streak: 0,
  storyIndex: 0,
  voiceOn: true,
  feedback: null,
  progress: loadProgress()
};

function loadProgress(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) throw 0;
    return JSON.parse(raw);
  }catch{
    return {
      totalGames: 0,
      bestStreak: 0,
      totalStars: 0,
      difficulty: 1,
      modeWins: Object.fromEntries(MODES.map(m=>[m,0]))
    };
  }
}
function saveProgress(){
  localStorage.setItem(LS_KEY, JSON.stringify(state.progress));
}

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
function rand(n){ return Math.floor(Math.random()*n); }
function pick(arr){ return arr[rand(arr.length)]; }
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* ---- Audio (no files) ---- */
let audioCtx = null;
function ensureAudio(){
  if(!audioCtx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(AC) audioCtx = new AC();
  }
}
function beep(freq=440, dur=.09, gain=.05){
  ensureAudio();
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type="sine";
  o.frequency.value=freq;
  g.gain.value=gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
const SFX = {
  pop(){beep(520,.06,.04)},
  success(){beep(660,.07,.05); setTimeout(()=>beep(880,.08,.05),80)},
  fail(){beep(220,.12,.05)}
};

/* ---- Voice ---- */
function speak(text){
  if(!state.voiceOn) return;
  if(!window.speechSynthesis) return;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = .95; u.pitch = 1.1; u.volume = 1;
    window.speechSynthesis.speak(u);
  }catch{}
}

/* ---- Background per mode ---- */
function setBackgroundByMode(){
  const b = document.body;
  b.className = "";
  const map = {
    Shapes:"bg-shapes",
    Colors:"bg-colors",
    Numbers:"bg-numbers",
    Letters:"bg-letters",
    Phonics:"bg-phonics",
    Memory:"bg-memory",
    Math:"bg-math",
    Story:"bg-story"
  };
  b.classList.add(map[state.mode] || "bg-default");
}

/* ---- Shapes SVG ---- */
function shapeSVG(name, fill){
  fill = fill || "#111827";
  if(name==="Circle")   return `<svg class="shapeIcon" viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="${fill}"/></svg>`;
  if(name==="Square")   return `<svg class="shapeIcon" viewBox="0 0 64 64"><rect x="14" y="14" width="36" height="36" rx="8" fill="${fill}"/></svg>`;
  if(name==="Triangle") return `<svg class="shapeIcon" viewBox="0 0 64 64"><path d="M32 12 L54 52 H10 Z" fill="${fill}"/></svg>`;
  if(name==="Star")     return `<svg class="shapeIcon" viewBox="0 0 64 64"><path d="M32 10l7 14 15 2-11 11 3 16-14-8-14 8 3-16L10 26l15-2z" fill="${fill}"/></svg>`;
  if(name==="Heart")    return `<svg class="shapeIcon" viewBox="0 0 64 64"><path d="M32 54S10 40 10 24c0-7 6-12 13-12 4 0 8 2 9 5 1-3 5-5 9-5 7 0 13 5 13 12 0 16-22 30-22 30z" fill="${fill}"/></svg>`;
  if(name==="Diamond")  return `<svg class="shapeIcon" viewBox="0 0 64 64"><path d="M32 8 L54 32 L32 56 L10 32 Z" fill="${fill}"/></svg>`;
  return "";
}

function starsHTML(n){
  return [0,1,2].map(i=>`<span style="opacity:${i<n?1:.30}">⭐</span>`).join("");
}

/* ---- Options builder ---- */
function buildOptions(type, answer, difficulty){
  const optionCount = (difficulty===1)?4:(difficulty===2)?6:8;

  const pool =
    type==="shape"?SHAPES:
    type==="color"?COLORS:
    type==="number"?NUMBERS:
    type==="letter"?LETTERS:
    type==="phonics"?PHONICS.map(p=>p.letter):[];

  const set = new Set([answer]);
  while(set.size < Math.min(optionCount, pool.length)){
    set.add(pick(pool));
  }
  return shuffle([...set]);
}

let currentQ = null;
let mem = null;

function buildQuestion(){
  const d = state.difficulty;
  const m = state.mode;

  if(m==="Story"){
    const page = STORY[state.storyIndex % STORY.length];
    const q = page.q;
    return {mode:m, type:q.type, prompt:q.prompt, answer:q.answer, meta:{story:page}, options: buildOptions(q.type, q.answer, d)};
  }
  if(m==="Memory"){
    return {mode:m, type:"memory", prompt:"Find all the matching pairs!", answer:null, options:[], meta:{}};
  }
  if(m==="Math"){
    const max = (d===1)?5:(d===2)?7:9;
    const count = rand(max)+1;
    return {mode:m, type:"math", prompt:"Count the dots and tap the number", answer:count, options: buildOptions("number", count, d), meta:{count}};
  }
  if(m==="Phonics"){
    const item = pick(PHONICS);
    return {mode:m, type:"phonics", prompt:`Tap the letter that makes the '${item.sound}' sound`, answer:item.letter, options: buildOptions("phonics", item.letter, d), meta:{sound:item.sound}};
  }
  if(m==="Letters"){
    const pool = LETTERS.slice(0, d===1?8:d===2?14:26);
    const ans = pick(pool);
    return {mode:m, type:"letter", prompt:"Tap the letter", answer:ans, options: buildOptions("letter", ans, d), meta:{}};
  }
  if(m==="Numbers"){
    const max = d===1?5:d===2?7:9;
    const ans = rand(max)+1;
    return {mode:m, type:"number", prompt:"Tap the number", answer:ans, options: buildOptions("number", ans, d), meta:{}};
  }
  if(m==="Colors"){
    const pool = COLORS.slice(0, d===1?5:d===2?7:8);
    const ans = pick(pool);
    return {mode:m, type:"color", prompt:"Tap the color", answer:ans, options: buildOptions("color", ans, d), meta:{}};
  }

  const pool = SHAPES.slice(0, d===1?4:d===2?5:6);
  const ans = pick(pool);
  return {mode:m, type:"shape", prompt:"Tap the shape", answer:ans, options: buildOptions("shape", ans, d), meta:{}};
}

/* ---- Adaptive difficulty ---- */
function adapt(isCorrect){
  if(isCorrect){
    state.streak += 1;
    state.progress.bestStreak = Math.max(state.progress.bestStreak, state.streak);
    if(state.streak >= 3){
      state.difficulty = clamp(state.difficulty+1,1,3);
      state.streak = 0;
    }
  }else{
    state.streak = 0;
    state.difficulty = clamp(state.difficulty-1,1,3);
  }
  state.progress.difficulty = state.difficulty;
  saveProgress();
}

/* ---- Memory game ---- */
function memoryDeck(difficulty){
  const pairCount = difficulty===1?3:difficulty===2?4:5;
  const pool = ["🐶","🐱","🐻","🦊","🐼","🐸","🦁","🐰","🐵","🐯"];
  const picks = shuffle(pool).slice(0,pairCount);
  return shuffle([...picks,...picks]).map((v,i)=>({id:i,v}));
}

/* ---- Confetti ---- */
function confetti(){
  const el = document.getElementById("confetti");
  el.style.display = "block";
  el.innerHTML = "";
  for(let i=0;i<28;i++){
    const p = document.createElement("i");
    p.style.setProperty("--x", ((Math.random()-0.5)*560).toFixed(0)+"px");
    p.style.setProperty("--y", ((Math.random()-0.5)*560).toFixed(0)+"px");
    el.appendChild(p);
  }
  setTimeout(()=>{ el.style.display="none"; }, 900);
}

/* ---- Avatar HTML ---- */
function playerAvatarHTML(){
  if(!state.player) return `<div class="mascot">🐶</div>`;
  const a = AVATARS[state.player];
  return `
    <img class="avatarImg" src="${a.img}" alt="${state.player}"
      onerror="this.outerHTML='<div class=\\'mascot\\'>${a.fallback}</div>'"
    />
  `;
}

/* ---- Choice buttons: BRIGHT + HIGH-CONTRAST ---- */
function choiceButtonHTML(opt){
  const val = String(opt);

  // COLORS: whole tile uses the color so it's obvious
  if(currentQ?.type === "color"){
    const hex = COLOR_MAP[val] || "#111827";
    const text = (val === "Yellow") ? "#111827" : "#ffffff";
    return `
      <button class="choice" data-choice="${val}"
        style="background:${hex}; color:${text}; border:3px solid rgba(255,255,255,.9)">
        <div class="swatch" style="background:rgba(255,255,255,.88)"></div>
        <div style="font-weight:1000">${val}</div>
      </button>
    `;
  }

  // SHAPES: tile light + colored shape icon
  if(currentQ?.type === "shape"){
    const fill = SHAPE_COLOR[val] || "#22c55e";
    return `
      <button class="choice" data-choice="${val}"
        style="background:rgba(255,255,255,.85); color:#111827; border:3px solid rgba(255,255,255,.9)">
        ${shapeSVG(val, fill)}
        <div style="font-weight:1000">${val}</div>
      </button>
    `;
  }

  // NUMBERS + MATH: gradient tile so it's fun and visible
  if(currentQ?.type === "number" || currentQ?.type === "math"){
    const n = Number(val);
    const idx = (Number.isFinite(n) ? (n-1) : 0) % NUMBER_GRADIENTS.length;
    const [a,b] = NUMBER_GRADIENTS[idx];
    const dots = Number.isFinite(n) ? Math.min(n, 9) : 0;

    return `
      <button class="choice" data-choice="${val}"
        style="background: linear-gradient(135deg, ${a}, ${b}); color:#fff; border:3px solid rgba(255,255,255,.9)">
        <div style="font-size:32px;font-weight:1000;line-height:1">${val}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:90px;opacity:.95">
          ${Array.from({length:dots}).map(()=>`<div style="width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,.92)"></div>`).join("")}
        </div>
      </button>
    `;
  }

  // LETTERS: bright tile, big letter
  if(currentQ?.type === "letter"){
    const [a,b] = pick(NUMBER_GRADIENTS);
    return `
      <button class="choice" data-choice="${val}"
        style="background: linear-gradient(135deg, ${a}, ${b}); color:#fff; border:3px solid rgba(255,255,255,.9)">
        <div style="font-size:32px;font-weight:1000;line-height:1">${val}</div>
        <div style="opacity:.95;font-weight:900">${val.toLowerCase()}</div>
      </button>
    `;
  }

  // PHONICS: bright tile, show letter
  if(currentQ?.type === "phonics"){
    const [a,b] = pick(NUMBER_GRADIENTS);
    return `
      <button class="choice" data-choice="${val}"
        style="background: linear-gradient(135deg, ${a}, ${b}); color:#fff; border:3px solid rgba(255,255,255,.9)">
        <div style="font-size:32px;font-weight:1000;line-height:1">${val}</div>
        <div style="opacity:.95;font-weight:900">sound</div>
      </button>
    `;
  }

  return `<button class="choice" data-choice="${val}">${val}</button>`;
}

/* =======================
   UI RENDER
   ======================= */
function topBar(){
  const v = state.voiceOn ? "On" : "Off";
  return `
    <div class="row" style="margin-bottom:12px">
      <div class="bar">
        ${playerAvatarHTML()}
        <div>
          <div class="tiny">Player</div>
          <div style="font-weight:1000;font-size:18px">${state.player || "—"}</div>
        </div>
      </div>
      <div class="bar">
        <button class="secondary" id="parent">Parent</button>
        <button class="secondary" id="voice">Voice: ${v}</button>
      </div>
    </div>
  `;
}

function render(){
  setBackgroundByMode();
  const s = state.screen;

  if(s==="welcome"){
    app.innerHTML = `
      <div class="center">
        <div class="mascot" style="margin:0 auto 10px;">🐶</div>
        <div class="title">Skeine Kids Learning</div>
        <div class="sub">A bright learning game for ages <b>3–5</b></div>
      </div>

      <div style="height:14px"></div>

      <div class="grid grid2">
        <div class="panel">
          <div class="sub">Quick Rounds</div>
          <div style="font-weight:1000;font-size:22px">3 per game</div>
        </div>
        <div class="panel">
          <div class="sub">Adaptive</div>
          <div style="font-weight:1000;font-size:22px">Level ${state.difficulty}</div>
        </div>
      </div>

      <div style="height:12px"></div>

      <div class="grid">
        <button id="start">Start</button>
        <button class="secondary" id="parent">Parent Dashboard</button>
      </div>

      <div class="tiny center" style="margin-top:10px">
        Tip: Tap once anywhere to enable sound on some phones.
      </div>
    `;
    bindWelcome();
    return;
  }

  if(s==="player"){
    app.innerHTML = topBar() + `
      <div class="title">Choose your player</div>
      <div class="sub">Tap to begin.</div>

      <div style="height:12px"></div>

      <div class="grid grid2">
        <button class="big" id="jayce">
          <img class="avatarImg" src="jayce.png" alt="Jayce"
            onerror="this.outerHTML='<div class=\\'mascot\\'>👦</div>'"
          />
          Jayce
        </button>
        <button class="big" id="jayde">
          <img class="avatarImg" src="jayde.png" alt="Jayde"
            onerror="this.outerHTML='<div class=\\'mascot\\'>👧</div>'"
          />
          Jayde
        </button>
      </div>

      <div style="height:12px"></div>
      <button class="secondary" id="back">Back</button>
    `;
    bindPlayer();
    return;
  }

  if(s==="mode"){
    app.innerHTML = topBar() + `
      <div class="title">Choose a game</div>
      <div class="sub">Each game is 3 quick rounds.</div>

      <div style="height:12px"></div>

      <div class="grid grid4">
        ${MODES.map(m=>`<button class="${m===state.mode?'':'secondary'}" data-mode="${m}">${m}</button>`).join("")}
      </div>

      <div style="height:12px"></div>

      <div class="grid">
        <button id="play">Play ${state.mode}</button>
        <button class="secondary" id="change">Change Player</button>
      </div>
    `;
    bindMode();
    return;
  }

  if(s==="game"){
    if(!currentQ) currentQ = buildQuestion();

    const header = `
      ${topBar()}
      <div class="row">
        <div class="badge"><b>Mode:</b> ${state.mode}</div>
        <div class="badge"><b>Round:</b> ${state.round}/3</div>
        <div class="badge"><b>Level:</b> ${state.difficulty}</div>
      </div>
      <div style="height:12px"></div>
    `;

    let promptBlock = "";
    if(state.mode==="Story"){
      const p = currentQ.meta.story;
      promptBlock = `
        <div class="panel">
          <div class="sub">Story</div>
          <div style="font-weight:1000;font-size:20px">${p.title}</div>
          <div class="sub" style="margin-top:6px">${p.text}</div>
          <div style="margin-top:10px" class="prompt">${currentQ.prompt}</div>
        </div>
      `;
    } else {
      promptBlock = `
        <div class="panel">
          <div class="sub">Buddy says:</div>
          <div class="prompt">${currentQ.prompt}</div>
          ${state.mode==="Phonics" ? `<div class="tiny">Sound: “${currentQ.meta.sound}”</div>` : ``}
        </div>
      `;
    }

    let extra = "";
    if(state.mode==="Math"){
      extra = `
        <div style="height:12px"></div>
        <div class="panel">
          <div class="sub">Count the dots</div>
          <div class="dots" style="margin-top:10px">
            ${Array.from({length: currentQ.meta.count}).map(()=>`<div class="dot"></div>`).join("")}
          </div>
        </div>
      `;
    }

    let body = "";
    if(state.mode==="Memory"){
      if(!mem) mem = { deck: memoryDeck(state.difficulty), flipped: [], matched: new Set(), lock:false };
      body = renderMemory();
    } else {
      body = `
        <div style="height:12px"></div>
        <div class="grid grid4">
          ${currentQ.options.map(o=>choiceButtonHTML(o)).join("")}
        </div>
      `;
    }

    const toast = state.feedback ? `<div class="toast ${state.feedback.ok?'':'bad'}">${state.feedback.msg}</div>` : "";
    const footer = `
      ${toast}
      <div class="row" style="margin-top:12px">
        <div class="sub">Score: <b>${state.score}</b> / 3</div>
        <div class="stars">${starsHTML(state.stars)}</div>
      </div>
    `;

    app.innerHTML = header + promptBlock + extra + body + footer;
    bindGame();
    return;
  }

  if(s==="winner"){
    const perfect = state.score===3;
    app.innerHTML = topBar() + `
      <div class="center">
        <div class="title">${perfect ? "🎉 PERFECT GAME! 🎉" : "🎉 Great Job! 🎉"}</div>
        <div style="height:10px"></div>
        <div class="mascot" style="margin:0 auto 10px">${perfect ? "🏆" : "⭐"}</div>
        <div style="font-size:18px">${state.player} scored <b>${state.score}</b> out of <b>3</b></div>
        <div style="height:8px"></div>
        <div class="stars">${starsHTML(state.stars)}</div>
      </div>

      <div style="height:12px"></div>

      <div class="panel center">
        <div class="sub">Today’s Reward</div>
        <div style="font-weight:1000;font-size:20px;margin-top:6px">
          ${perfect ? "Golden Star Sticker ✨" : (state.stars>=2 ? "Super Star Sticker ⭐" : "Brave Try Sticker 💛")}
        </div>
      </div>

      <div style="height:12px"></div>

      <div class="grid">
        <button id="again">Play Again</button>
        <button class="secondary" id="parent">Parent Dashboard</button>
      </div>
    `;
    bindWinner();
    return;
  }
}

/* =======================
   Binds / actions
   ======================= */
function toggleVoice(){
  state.voiceOn = !state.voiceOn;
  SFX.pop();
  render();
}

function bindWelcome(){
  document.getElementById("start").onclick = ()=>{
    SFX.pop(); speak("Welcome! Let's choose a player.");
    state.screen="player"; render();
  };
  document.getElementById("parent").onclick = ()=> openParent();
}

function bindPlayer(){
  document.getElementById("jayce").onclick = ()=>{
    SFX.pop(); state.player="Jayce";
    speak("Hi Jayce! Let's choose a learning game.");
    state.screen="mode"; render();
  };
  document.getElementById("jayde").onclick = ()=>{
    SFX.pop(); state.player="Jayde";
    speak("Hi Jayde! Let's choose a learning game.");
    state.screen="mode"; render();
  };
  document.getElementById("back").onclick = ()=>{ state.screen="welcome"; render(); };
  document.getElementById("parent").onclick = ()=> openParent();
  document.getElementById("voice").onclick = toggleVoice;
}

function bindMode(){
  [...app.querySelectorAll("[data-mode]")].forEach(btn=>{
    btn.onclick = ()=>{
      SFX.pop(); state.mode = btn.dataset.mode;
      speak(state.mode + " mode.");
      render();
    };
  });
  document.getElementById("play").onclick = ()=>{
    SFX.pop(); speak("Let's play!");
    startGame();
  };
  document.getElementById("change").onclick = ()=>{ state.screen="player"; render(); };
  document.getElementById("parent").onclick = ()=> openParent();
  document.getElementById("voice").onclick = toggleVoice;
}

function startGame(){
  state.round=1; state.score=0; state.stars=0; state.feedback=null; state.storyIndex=0; state.streak=0;
  currentQ = null; mem = null;
  state.screen="game";
  render();

  setTimeout(()=>{
    if(state.mode==="Memory") speak("Find the matching pairs!");
    else if(state.mode==="Story"){
      const p = STORY[state.storyIndex % STORY.length];
      speak(`${state.player}, story time! ${p.title}. ${p.text}. ${currentQ.prompt}.`);
    } else {
      speak(`${state.player}, ${currentQ.prompt}`);
    }
  }, 30);
}

function bindGame(){
  document.getElementById("parent").onclick = ()=> openParent();
  document.getElementById("voice").onclick = toggleVoice;

  if(state.mode==="Memory"){
    bindMemory();
    return;
  }

  [...app.querySelectorAll("[data-choice]")].forEach(btn=>{
    btn.onclick = ()=> handleChoice(btn.dataset.choice);
  });
}

function handleChoice(raw){
  if(!currentQ) return;
  const choice = (typeof currentQ.answer==="number") ? Number(raw) : raw;
  const ok = (choice === currentQ.answer);

  state.feedback = ok ? {ok:true,msg:"Yes! Great job!"} : {ok:false,msg:"Almost! Next one!"};
  if(ok){ SFX.success(); speak("Great job!"); }
  else { SFX.fail(); speak("Good try! Let's keep going."); }

  render();

  setTimeout(()=>{
    state.feedback = null;
    completeRound(ok);
  }, 520);
}

function completeRound(ok){
  if(ok){ state.score += 1; state.stars = clamp(state.stars+1,0,3); }
  adapt(ok);

  if(state.round >= 3){
    finishGame();
    return;
  }
  state.round += 1;
  if(state.mode==="Story") state.storyIndex += 1;

  currentQ = null; mem = null;
  render();
}

function finishGame(){
  const perfect = state.score===3;

  state.progress.totalGames += 1;
  state.progress.totalStars += state.stars;
  if(perfect) state.progress.modeWins[state.mode] = (state.progress.modeWins[state.mode]||0) + 1;
  saveProgress();

  if(perfect){ confetti(); SFX.success(); speak("Perfect game! Amazing!"); }
  else { speak("Great playing!"); }

  state.screen="winner";
  render();
}

function bindWinner(){
  document.getElementById("again").onclick = ()=>{
    SFX.pop();
    state.screen="mode";
    render();
  };
  document.getElementById("parent").onclick = ()=> openParent();
  document.getElementById("voice").onclick = toggleVoice;
}

/* =======================
   Parent Dashboard
   ======================= */
function openParent(){
  SFX.pop();
  const p = state.progress;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="card" style="width:min(900px,100%);">
      <div class="row">
        <div class="title" style="font-size:22px">Parent Dashboard</div>
        <button class="secondary" id="close">Close</button>
      </div>

      <div style="height:12px"></div>

      <div class="grid grid2">
        <div class="panel"><div class="sub">Total Games</div><div style="font-weight:1000;font-size:24px">${p.totalGames}</div></div>
        <div class="panel"><div class="sub">Best Streak</div><div style="font-weight:1000;font-size:24px">${p.bestStreak}</div></div>
        <div class="panel"><div class="sub">Stars Earned</div><div style="font-weight:1000;font-size:24px">${p.totalStars}</div></div>
        <div class="panel"><div class="sub">Difficulty</div><div style="font-weight:1000;font-size:24px">Level ${state.difficulty}</div></div>
      </div>

      <div class="tiny" style="margin-top:10px">Saved on this device only.</div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#close").onclick = ()=> modal.remove();
  modal.onclick = (e)=>{ if(e.target===modal) modal.remove(); };
}

/* =======================
   Memory mode
   ======================= */
function renderMemory(){
  const m = mem;
  const matches = m.matched.size/2;
  const totalPairs = m.deck.length/2;

  const cards = m.deck.map(c=>{
    const isUp = m.flipped.includes(c.id) || m.matched.has(c.id);
    return `<button class="choice" style="height:74px;font-size:28px;background:rgba(255,255,255,.85);color:#111827;border:3px solid rgba(255,255,255,.9)" data-mem="${c.id}">${isUp ? c.v : "❓"}</button>`;
  }).join("");

  return `
    <div class="panel">
      <div class="sub">Memory</div>
      <div class="prompt">Find the matching pairs!</div>
      <div class="tiny">Matches: ${matches} / ${totalPairs}</div>
    </div>
    <div style="height:12px"></div>
    <div class="grid grid4">${cards}</div>
  `;
}

function bindMemory(){
  [...app.querySelectorAll("[data-mem]")].forEach(btn=>{
    btn.onclick = ()=> flipMemory(Number(btn.dataset.mem));
  });
}

function flipMemory(id){
  const m = mem;
  if(m.lock) return;
  if(m.matched.has(id)) return;
  if(m.flipped.includes(id)) return;

  SFX.pop();
  m.flipped.push(id);
  render();

  if(m.flipped.length===2){
    m.lock = true;
    const [a,b] = m.flipped;
    const ca = m.deck.find(x=>x.id===a);
    const cb = m.deck.find(x=>x.id===b);

    if(ca.v === cb.v){
      SFX.success(); speak("Nice match!");
      m.matched.add(a); m.matched.add(b);

      setTimeout(()=>{
        m.flipped = [];
        m.lock = false;

        if(m.matched.size === m.deck.length){
          speak("You did it!");
          setTimeout(()=> completeRound(true), 250);
        }else{
          render();
        }
      }, 420);

    }else{
      SFX.fail(); speak("Oops! Try again.");
      setTimeout(()=>{
        m.flipped = [];
        m.lock = false;
        render();
      }, 620);
    }
  }
}

/* ---- Memory deck ---- */
function memoryDeck(difficulty){
  const pairCount = difficulty===1?3:difficulty===2?4:5;
  const pool = ["🐶","🐱","🐻","🦊","🐼","🐸","🦁","🐰","🐵","🐯"];
  const picks = shuffle(pool).slice(0,pairCount);
  return shuffle([...picks,...picks]).map((v,i)=>({id:i,v}));
}

/* ---- Confetti ---- */
function confetti(){
  const el = document.getElementById("confetti");
  el.style.display = "block";
  el.innerHTML = "";
  for(let i=0;i<28;i++){
    const p = document.createElement("i");
    p.style.setProperty("--x", ((Math.random()-0.5)*560).toFixed(0)+"px");
    p.style.setProperty("--y", ((Math.random()-0.5)*560).toFixed(0)+"px");
    el.appendChild(p);
  }
  setTimeout(()=>{ el.style.display="none"; }, 900);
}

/* =======================
   Boot
   ======================= */
window.addEventListener("click", ()=>{ ensureAudio(); }, {once:true});
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
render();
