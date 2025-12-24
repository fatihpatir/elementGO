// Element İlk 18 GO - Core Logic
const app = {
    elements: [
        { no: 1, symbol: "H", name: "Hidrojen" },
        { no: 2, symbol: "He", name: "Helyum" },
        { no: 3, symbol: "Li", name: "Lityum" },
        { no: 4, symbol: "Be", name: "Berilyum" },
        { no: 5, symbol: "B", name: "Bor" },
        { no: 6, symbol: "C", name: "Karbon" },
        { no: 7, symbol: "N", name: "Azot" },
        { no: 8, symbol: "O", name: "Oksijen" },
        { no: 9, symbol: "F", name: "Flor" },
        { no: 10, symbol: "Ne", name: "Neon" },
        { no: 11, symbol: "Na", name: "Sodyum" },
        { no: 12, symbol: "Mg", name: "Magnezyum" },
        { no: 13, symbol: "Al", name: "Alüminyum" },
        { no: 14, symbol: "Si", name: "Silisyum" },
        { no: 15, symbol: "P", name: "Fosfor" },
        { no: 16, symbol: "S", name: "Kükürt" },
        { no: 17, symbol: "Cl", name: "Klor" },
        { no: 18, symbol: "Ar", name: "Argon" },
        { no: 26, symbol: "Fe", name: "Demir" },
        { no: 29, symbol: "Cu", name: "Bakır" },
        { no: 30, symbol: "Zn", name: "Çinko" },
        { no: 47, symbol: "Ag", name: "Gümüş" },
        { no: 79, symbol: "Au", name: "Altın" },
        { no: 82, symbol: "Pb", name: "Kurşun" },
        { no: 80, symbol: "Hg", name: "Cıva" },
        { no: 78, symbol: "Pt", name: "Platin" },
        { no: 53, symbol: "I", name: "İyot" }
    ],

    state: {
        view: 'menu',
        learnIndex: 0,
        shuffledLearn: [],
        quiz: {
            score: 0,
            timeLeft: 60,
            timer: null,
            currentQuestion: null,
            isActive: false
        },
        settings: {
            theme: 'dark',
            sound: true,
            volume: 0.4
        },
        bestScore: 0
    },

    init() {
        console.log("Element GO Başlatıldı...");
        this.loadSettings();
        this.applyTheme();
        this.bindEvents();

        // Use hash-based navigation for back button support
        window.onhashchange = () => {
            const hash = window.location.hash.replace('#', '') || 'menu';
            if (hash !== this.state.view) {
                this._navigateTo(hash, false);
            }
        };

        const initialView = window.location.hash.replace('#', '') || 'menu';
        this._navigateTo(initialView, false);

        // Prepare Learn Mode (Shuffle initially)
        this.shuffleLearn();
    },

    loadSettings() {
        const saved = localStorage.getItem('element18_settings');
        if (saved) {
            this.state.settings = JSON.parse(saved);
        }
        this.state.bestScore = localStorage.getItem('element18_best') || 0;
        document.getElementById('best-score').textContent = this.state.bestScore;

        // Sync UI
        document.getElementById('theme-toggle').checked = (this.state.settings.theme === 'light');
        document.getElementById('sound-toggle').checked = this.state.settings.sound;
        document.getElementById('volume-slider').value = this.state.settings.volume;
    },

    saveSettings() {
        localStorage.setItem('element18_settings', JSON.stringify(this.state.settings));
    },

    bindEvents() {
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.state.settings.volume = parseFloat(e.target.value);
            this.saveSettings();
        });
    },

    navigateTo(viewId) {
        if (window.location.hash !== '#' + viewId) {
            window.location.hash = viewId;
        }
        this._navigateTo(viewId, true);
    },

    _navigateTo(viewId, isDirectCall) {
        // Stop quiz if leaving play view
        if (this.state.view === 'play' && viewId !== 'play') {
            this.endQuiz(false);
        }

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(viewId + '-view');
        if (target) {
            target.classList.add('active');
            this.state.view = viewId;
        }

        if (viewId === 'learn') this.renderCard();
        if (viewId === 'play') this.startQuiz();
    },

    // --- Learn Mode Logic ---
    shuffleLearn() {
        this.state.shuffledLearn = [...this.elements].sort(() => Math.random() - 0.5);
    },

    renderCard() {
        const item = this.state.shuffledLearn[this.state.learnIndex];
        const card = document.getElementById('element-card');
        card.classList.remove('flipped');

        document.getElementById('card-atom-no').textContent = item.no;
        document.getElementById('card-symbol').textContent = item.symbol;
        document.getElementById('card-name').textContent = item.name;
        document.getElementById('card-counter').textContent = `${this.state.learnIndex + 1} / ${this.elements.length}`;
    },

    nextCard() {
        this.state.learnIndex = (this.state.learnIndex + 1) % this.elements.length;
        this.renderCard();
    },

    prevCard() {
        this.state.learnIndex = (this.state.learnIndex - 1 + this.elements.length) % this.elements.length;
        this.renderCard();
    },

    readElementName() {
        const name = this.state.shuffledLearn[this.state.learnIndex].name;
        const msg = new SpeechSynthesisUtterance();
        msg.text = name;
        msg.lang = 'tr-TR';
        msg.volume = this.state.settings.volume;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
    },

    // --- Play Mode Logic ---
    startQuiz() {
        this.state.quiz.score = 0;
        this.state.quiz.timeLeft = 60;
        this.state.quiz.isActive = true;
        document.getElementById('quiz-result').classList.remove('active');
        document.getElementById('current-score').textContent = '0';

        this.nextQuestion();
        this.startTimer();
    },

    startTimer() {
        if (this.state.quiz.timer) clearInterval(this.state.quiz.timer);

        const tick = () => {
            this.state.quiz.timeLeft--;
            document.getElementById('timer-text').textContent = this.state.quiz.timeLeft;

            // Progress Ring Update
            const offset = (this.state.quiz.timeLeft / 60) * 100;
            document.getElementById('timer-path').setAttribute('stroke-dasharray', `${offset}, 100`);

            if (this.state.quiz.timeLeft <= 0) {
                this.endQuiz(true);
            }
        };

        this.state.quiz.timer = setInterval(tick, 1000);
    },

    nextQuestion() {
        const types = ['name_from_symbol', 'symbol_from_name', 'no_from_symbol'];
        const type = types[Math.floor(Math.random() * types.length)];
        const correctItem = this.elements[Math.floor(Math.random() * this.elements.length)];
        this.state.quiz.currentQuestion = correctItem;

        let questionText = "";
        let labelText = "";
        let correctAnswer = "";

        if (type === 'name_from_symbol') {
            labelText = "Bu sembolün adı nedir?";
            questionText = correctItem.symbol;
            correctAnswer = correctItem.name;
        } else if (type === 'symbol_from_name') {
            labelText = "Bu elementin sembolü nedir?";
            questionText = correctItem.name;
            correctAnswer = correctItem.symbol;
        } else {
            labelText = "Atom numarası kaç?";
            questionText = correctItem.symbol;
            correctAnswer = correctItem.no.toString();
        }

        document.getElementById('q-label').textContent = labelText;
        document.getElementById('q-text').textContent = questionText;

        // Generate Options
        const options = [correctAnswer];
        while (options.length < 4) {
            const randomItem = this.elements[Math.floor(Math.random() * this.elements.length)];
            let val = "";
            if (type === 'name_from_symbol') val = randomItem.name;
            else if (type === 'symbol_from_name') val = randomItem.symbol;
            else val = randomItem.no.toString();

            if (!options.includes(val)) options.push(val);
        }

        options.sort(() => Math.random() - 0.5);

        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => this.handleAnswer(opt, correctAnswer, btn);
            grid.appendChild(btn);
        });
    },

    handleAnswer(selected, correct, btn) {
        if (!this.state.quiz.isActive) return;

        if (selected === correct) {
            this.playSound('ding');
            this.state.quiz.score += 10;
            btn.classList.add('correct');
            setTimeout(() => this.nextQuestion(), 500);
        } else {
            this.playSound('dup');
            this.state.quiz.score = Math.max(0, this.state.quiz.score - 5);
            btn.classList.add('wrong');

            // Educational Feedback
            this.showEducationalFeedback();
        }
        document.getElementById('current-score').textContent = this.state.quiz.score;
    },

    showEducationalFeedback() {
        const item = this.state.quiz.currentQuestion;
        const overlay = document.getElementById('feedback-overlay');

        document.getElementById('feedback-name').textContent = `${item.name} (${item.symbol})`;
        document.getElementById('feedback-no').textContent = item.no;

        overlay.classList.add('active');
        this.state.quiz.isActive = false; // Pause actions

        setTimeout(() => {
            overlay.classList.remove('active');
            if (this.state.view === 'play') {
                this.state.quiz.isActive = true;
                this.nextQuestion();
            }
        }, 2500);
    },

    endQuiz(showResult) {
        this.state.quiz.isActive = false;
        clearInterval(this.state.quiz.timer);

        if (showResult) {
            document.getElementById('final-score').textContent = this.state.quiz.score;
            document.getElementById('quiz-result').classList.add('active');

            // Check Best Score
            if (this.state.quiz.score > this.state.bestScore) {
                this.state.bestScore = this.state.quiz.score;
                localStorage.setItem('element18_best', this.state.bestScore);
                document.getElementById('best-score').textContent = this.state.bestScore;
                document.getElementById('result-stat').textContent = "YENİ REKOR! 🎉";
            } else {
                document.getElementById('result-stat').textContent = "Oyun Bitti!";
            }

            // Motivation Message
            const msgs = ["Harika!", "Muhteşem bir başarı!", "Biraz daha çalışırsan 1 numara olursun!", "Elementlerin Efendisi Geliyor!", "Pes etme, harika gidiyorsun!"];
            document.getElementById('motivation-msg').textContent = msgs[Math.floor(Math.random() * msgs.length)];
        }
    },

    // --- Utility Functions ---
    toggleTheme() {
        this.state.settings.theme = (this.state.settings.theme === 'dark') ? 'light' : 'dark';
        this.applyTheme();
        this.saveSettings();
    },

    applyTheme() {
        document.body.setAttribute('data-theme', this.state.settings.theme);
    },

    toggleSound() {
        this.state.settings.sound = !this.state.settings.sound;
        this.saveSettings();
    },

    playSound(type) {
        if (!this.state.settings.sound) return;

        // Procedural Audio Generation (Ding/Dup)
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'ding') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    app.init();

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Kaydedildi', reg))
            .catch(err => console.warn('Service Worker Hatası', err));
    }
});
