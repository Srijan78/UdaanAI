// ── Onboarding Data ─────────────────────────────────────────────
const questions = [
  {
    q: "Which <em>state</em> are you voting in?",
    options: [
      { icon: "🌊", label: "Tamil Nadu",      sub: "Southern India" },
      { icon: "🏙️", label: "Maharashtra",     sub: "Western India" },
      { icon: "🌾", label: "Uttar Pradesh",   sub: "Northern India" },
      { icon: "🌿", label: "Kerala",          sub: "Southern India" },
      { icon: "🏔️", label: "Other state",    sub: "Choose your state" },
    ]
  },
  {
    q: "How <em>old</em> are you?",
    options: [
      { icon: "🌱", label: "Under 18",    sub: "Not yet eligible" },
      { icon: "⭐", label: "18–25",        sub: "First-time voter territory" },
      { icon: "🔥", label: "26–40",        sub: "Experienced citizen" },
      { icon: "💫", label: "41 and above", sub: "Seasoned voter" },
    ]
  },
  {
    q: "Have you <em>voted before?</em>",
    options: [
      { icon: "🌟", label: "Never voted",      sub: "I'll guide you completely" },
      { icon: "✅", label: "Yes, I have voted", sub: "Quick refresher for you" },
      { icon: "📦", label: "I moved cities",    sub: "Need to re-register" },
    ]
  },
  {
    q: "Which <em>language</em> do you prefer?",
    options: [
      { icon: "🇮🇳", label: "हिन्दी", sub: "Hindi" },
      { icon: "🌺", label: "தமிழ்",   sub: "Tamil" },
      { icon: "🌻", label: "తెలుగు",  sub: "Telugu" },
      { icon: "🌿", label: "English", sub: "English" },
      { icon: "🌊", label: "Other",   sub: "More languages" },
    ]
  }
];

let currentQ = 0;
const answers = {};

// ── App State (set during launchApp) ────────────────────────────────
let userLanguage = 'en';
let userState = 'India';
let userPhase = 'registration';
let userIsFirstTime = false;
let conversationHistory = [];

// ── Screen Navigation ────────────────────────────────────────────
function goToOnboarding() {
  document.getElementById('landing').classList.add('exit');
  setTimeout(() => {
    document.getElementById('landing').style.display = 'none';
    const ob = document.getElementById('onboarding');
    ob.style.display = 'block';
    ob.classList.add('enter');
    renderQuestion(0);
  }, 400);
}

function goBack() {
  if (currentQ > 0) {
    // Go to previous question
    currentQ -= 1;
    renderQuestion(currentQ);
  } else {
    // Back to landing from first question
    const ob = document.getElementById('onboarding');
    ob.classList.add('exit');
    setTimeout(() => {
      ob.style.display = 'none';
      ob.classList.remove('exit', 'enter');
      const landing = document.getElementById('landing');
      landing.style.display = 'flex';
      landing.classList.remove('exit');
      landing.classList.add('enter');
    }, 400);
  }
}

function goBackToOnboarding() {
  const app = document.getElementById('app');
  app.classList.add('exit');
  setTimeout(() => {
    app.style.display = 'none';
    app.classList.remove('exit', 'enter');
    const ob = document.getElementById('onboarding');
    ob.style.display = 'block';
    ob.classList.remove('exit'); // FIX: remove the exit class so it becomes clickable again
    ob.classList.add('enter');
    // Go back to last onboarding question
    currentQ = questions.length - 1;
    renderQuestion(currentQ);
  }, 400);
}

// ── Onboarding ───────────────────────────────────────────────────
function renderQuestion(idx) {
  const q = questions[idx];
  const content = document.getElementById('onboard-content');

  content.innerHTML = `
    <div class="onboard-q-enter">
      <h2 class="onboard-question">${q.q}</h2>
      <div class="onboard-options" id="options-container">
        ${q.options.map((o, i) => `
          <div class="option-card option-card-enter"
               style="animation-delay: ${i * 0.08}s"
               onclick="selectOption(${idx}, '${o.label}', this)"
               role="button" tabindex="0"
               aria-label="${o.label}">
            <div class="option-icon">${o.icon}</div>
            <div>
              <div class="option-label">${o.label}</div>
              <div class="option-sublabel">${o.sub}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Update progress dots
  document.querySelectorAll('.progress-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i < idx) dot.classList.add('done');
    if (i === idx) dot.classList.add('active');
  });

}

function selectOption(qIdx, value, el) {
  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  answers[qIdx] = value;
  if (qIdx === 3) {
    // Map language label to BCP-47 code
    const langMap = { 'हिन्दी': 'hi', 'தமிழ்': 'ta', 'తెలుగు': 'te', 'English': 'en' };
    userLanguage = langMap[value] || 'en';
  }

  setTimeout(() => {
    if (qIdx < questions.length - 1) {
      currentQ = qIdx + 1;
      renderQuestion(currentQ);
    } else {
      launchApp();
    }
  }, 500);
}

function launchApp() {
  document.getElementById('onboarding').classList.add('exit');
  setTimeout(() => {
    document.getElementById('onboarding').style.display = 'none';
    const app = document.getElementById('app');
    app.style.display = 'block';
    app.classList.add('enter');

    // Set app-level state from onboarding answers
    userState = answers[0] || 'India';
    userIsFirstTime = answers[2] === 'Never voted';

    // Set language badge
    document.getElementById('active-lang-badge').textContent = answers[3] || 'हिन्दी';

    // Send welcome message (hardcoded greeting, then real API for all subsequent)
    setTimeout(() => {
      const greeting = userIsFirstTime
        ? `Namaste! 🙏 I can see you're voting for the first time in ${userState} — that's wonderful! Let me guide you through every step. First, let's make sure you're registered. Do you have a Voter ID card?`
        : `Welcome back! 🎉 Let's make sure everything is ready for you to vote in ${userState}. Would you like a quick status check on your registration?`;

      showTyping();
      setTimeout(() => {
        hideTyping();
        addAIMessage(greeting, ['Check Electoral Roll at voters.eci.gov.in', 'Collect one valid photo ID', 'Find your polling booth'], true);
      }, 1500);
    }, 600);
  }, 400);
}

// ── Phase Navigation ─────────────────────────────────────────────
const phaseData = {
  1: {
    greeting: "You're in Phase 1 — let's make sure you're ready to vote! 🗳️ I can help you check your registration, find your polling booth, or understand what ID you need. What would you like to know?",
    chips: ["Am I registered to vote?", "How do I get a Voter ID?", "Find my polling booth"]
  },
  2: {
    greeting: "You're in Phase 2 — Election Day! 🌟 I'll walk you through everything: what to bring, how the EVM works, what NOTA means, and what to expect at the booth. What do you need help with?",
    chips: ["What ID do I need?", "How does EVM work?", "What is NOTA?"]
  },
  3: {
    greeting: "You're in Phase 3 — After Voting! 🎉 Now let's make your vote count. I can help you track results, learn about your elected representative, and understand how to hold them accountable. What would you like to explore?",
    chips: ["How do I track results?", "Who is my MP?", "How to file a complaint?"]
  }
};

let activePhase = 1;

function switchPhase(phase) {
  if (phase === activePhase) return;
  activePhase = phase;

  // Update sidebar nav active state
  document.querySelectorAll('.phase-item[data-phase]').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.phase) === phase);
  });

  // Update right panel journey phases
  document.querySelectorAll('.journey-phase[id^="journey-phase-"]').forEach(el => {
    const elPhase = parseInt(el.id.split('-').pop());
    el.classList.remove('active', 'inactive');
    el.classList.add(elPhase === phase ? 'active' : 'inactive');
    const title = el.querySelector('.journey-phase-title');
    title.style.color = elPhase === phase ? '' : 'var(--muted)';
  });

  // Clear chat and send phase greeting
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  msgCount = 0;

  // Update quick chips
  const data = phaseData[phase];
  showTyping();
  setTimeout(() => {
    hideTyping();
    addAIMessage(data.greeting, false);
    // Inject phase-specific chips
    const chipsHTML = `
      <div class="quick-chips" style="margin-top: 8px;">
        ${data.chips.map(c => `<button class="chip" onclick="sendChip(this)">${c}</button>`).join('')}
      </div>`;
    container.insertAdjacentHTML('beforeend', chipsHTML);
  }, 800);
}


// (Hardcoded responses removed — all replies come from /api/ask)

let msgCount = 0;

function showTyping() { document.getElementById('typing-indicator').classList.add('visible'); }
function hideTyping()  { document.getElementById('typing-indicator').classList.remove('visible'); }

function addAIMessage(text, checklistItems = null, calendarOffer = false) {
  const welcome = document.getElementById('chat-welcome');
  if (welcome) welcome.style.display = 'none';

  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message ai';
  div.style.animationDelay = '0s';

  const checklistHTML = (checklistItems && checklistItems.length) ? `
    <div class="checklist-card">
      <div class="checklist-title">Your next steps</div>
      ${checklistItems.map((item, i) => `
        <div class="checklist-item" style="animation-delay:${0.1 * (i + 1)}s">
          <div class="check-icon pending">○</div>
          <span>${item}</span>
        </div>`).join('')}
    </div>` : '';

  div.innerHTML = `
    <div class="msg-avatar ai">🪄</div>
    <div>
      <div class="msg-bubble">${text}</div>
      ${checklistHTML}
      <div class="msg-actions">
        <button class="msg-action-btn listen" aria-label="Listen to this message" data-text="${text.replace(/"/g, '&quot;')}" onclick="playTTS(this, this.getAttribute('data-text'))">🔊 Listen</button>
        ${calendarOffer ? `<button class="msg-action-btn calendar" aria-label="Add to Google Calendar" onclick="addToCalendar()">📅 Add reminder</button>` : ''}
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  msgCount++;
}

function addUserMessage(text) {
  const welcome = document.getElementById('chat-welcome');
  if (welcome) welcome.style.display = 'none';

  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message user';
  div.innerHTML = `
    <div class="msg-avatar user-av">U</div>
    <div class="msg-bubble">${text}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = '24px';

  addUserMessage(text);
  showTyping();

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: text,
        language: userLanguage,
        state: userState,
        phase: userPhase,
        isFirstTime: userIsFirstTime,
        history: conversationHistory
      })
    });
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'API returned an error');
    }

    if (data.phase) userPhase = data.phase;
    conversationHistory.push({ role: 'user', content: text });
    conversationHistory.push({ role: 'model', content: data.message || '' });

    hideTyping();
    addAIMessage(data.message || 'Sorry, I could not get a response.', data.checklistItems, data.calendarOffer);
  } catch (err) {
    hideTyping();
    addAIMessage('Sorry, I encountered an error. Please try again.');
  }
}

function sendChip(btn) {
  document.getElementById('chat-input').value = btn.textContent;
  sendMessage();
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = '24px';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Voice ─────────────────────────────────────────────────────────
let recording = false;
let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    document.getElementById('chat-input').value = event.results[0][0].transcript;
    recording = false;
    document.getElementById('mic-btn').classList.remove('recording');
  };
  recognition.onend = () => {
    recording = false;
    document.getElementById('mic-btn').classList.remove('recording');
  };
}

function toggleMic() {
  if (!recognition) { alert('Speech recognition not supported in this browser.'); return; }
  const btn = document.getElementById('mic-btn');
  if (recording) {
    recognition.stop();
  } else {
    recognition.start();
    recording = true;
    btn.classList.add('recording');
  }
}

async function playTTS(btn, text) {
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: userLanguage })
    });
    const data = await res.json();
    if (data.audioBase64) {
      const audio = new Audio('data:audio/mp3;base64,' + data.audioBase64);
      audio.play();
    }
  } catch (e) {
    console.error('TTS error:', e);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔊 Listen';
  }
}

function handleLoginClick() {
  // Auth disabled for demo — skip directly to onboarding
  goToOnboarding();
}

async function addToCalendar() {
  try {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Election Day: Cast Your Vote',
        date: '2024-05-20',
        description: 'Remember to carry valid photo ID. Check your booth at electoralsearch.eci.gov.in'
      })
    });
    const data = await res.json();
    if (data.calendarUrl) {
      window.open(data.calendarUrl, '_blank');
    }
  } catch (e) {
    console.error('Calendar error:', e);
  }
}
