/**
 * HACKTOON — Plataforma de Treino e Dieta
 * app.js: Motor SPA, Gerenciador Relacional (HACKTOON_DB), Calculadora de IMC,
 * Modo "Em Treino" com Calculadora de Anilhas, Cronômetro com Áudio Web Audio,
 * Tabela TACO, Balanço Calórico, Score OTTER, Insights Dinâmicos e Assistente Gemini.
 */

// ==========================================
// 1. GERENCIADOR DE BANCO DE DADOS (HACKTOON_DB)
// ==========================================
const DB_KEY = 'HACKTOON_DB';
const AUTH_USERS_KEY = 'HACKTOON_ACCOUNTS';
const AUTH_SESSION_KEY = 'HACKTOON_AUTH_SESSION';
const DB_MIGRATED_KEY = 'HACKTOON_DB_MIGRATED';
let appInitialized = false;

function getDatabaseStorageKey() {
    return DB_KEY;
}

function getDB() {
    try {
        const raw = localStorage.getItem(getDatabaseStorageKey());
        if (!raw) return null;
        const stored = JSON.parse(raw);
        const accountId = sessionStorage.getItem(AUTH_SESSION_KEY);
        if (stored?.accounts && accountId) return stored.accounts[accountId] || null;
        if (stored?.accounts) return null;
        return stored;
    } catch (e) {
        console.error('Erro ao ler HACKTOON_DB:', e);
        return null;
    }
}

function saveDB(db) {
    try {
        const accountId = sessionStorage.getItem(AUTH_SESSION_KEY);
        if (!accountId) {
            localStorage.setItem(DB_KEY, JSON.stringify(db));
            return true;
        }
        let root = {};
        try { root = JSON.parse(localStorage.getItem(DB_KEY) || '{}'); } catch { root = {}; }
        const legacy = root && !root.accounts && root.user ? root : null;
        if (!root.accounts || typeof root.accounts !== 'object') {
            root = { schemaVersion: 1, accounts: {} };
            if (legacy) root.accounts[accountId] = legacy;
        }
        root.accounts[accountId] = db;
        localStorage.setItem(DB_KEY, JSON.stringify(root));
        return true;
    } catch (e) {
        console.error('Erro ao salvar HACKTOON_DB:', e);
        showToast('Erro ao salvar dados no armazenamento local', 'danger');
        return false;
    }
}

function createEmptyDatabase() {
    return {
        user: null,
        weeklyRoutine: [],
        weightLogs: [],
        workouts: [],
        executions: [],
        meals: [],
        customFoods: [],
        waterLogs: {},
        smartwatch: { connected: false, goalSteps: 0, goalActiveKcal: 0, dailyData: {} },
        aiChat: []
    };
}

function isUntouchedLegacyDemo(db) {
    const user = db?.user;
    const generatedWelcome = (db?.aiChat || []).some(message => message.id === 'msg_01' && /assistente inteligente da HACKTOON/i.test(message.text || ''));
    const demoProfile = user?.id === 'user_atleta_01' && user.name === 'Lucas Brandão' && user.weight === 81.2 && user.height === 180 && user.goalCalories === 2600;
    const generatedWeights = (db?.weightLogs || []).length >= 10 && db.weightLogs.every(log => /^wlog_\d{4}-\d{2}-\d{2}$/.test(log.id || '') && ['Rotina em dia.', 'Pesagem em jejum hoje cedo.'].includes(log.notes));
    const generatedWorkouts = (db?.workouts || []).length >= 5 && db.workouts.every(workout => /^wk_\d{4}-\d{2}-\d{2}$/.test(workout.id || '') && workout.status === 'completed');
    const generatedMeals = (db?.meals || []).length >= 30 && db.meals.every(meal => /^meal_\d{4}-\d{2}-\d{2}_/.test(meal.id || '') && String(meal.alimentoId || '').startsWith('taco_'));
    const generatedWater = Object.values(db?.waterLogs || {}).length >= 10 && Object.values(db.waterLogs).every(value => [3250, 3500, 3750, 4000].includes(value));
    const generatedWatch = Object.keys(db?.smartwatch?.dailyData || {}).length >= 10 && Object.values(db.smartwatch.dailyData).every(day => day.synced && day.battery === 88 && day.restingHeartRate === 54);
    return Boolean(demoProfile && generatedWelcome && generatedWeights && generatedWorkouts && generatedMeals && generatedWater && generatedWatch);
}

function getAuthAccounts() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]');
    } catch (error) {
        console.error('Erro ao ler contas locais:', error);
        return [];
    }
}

async function derivePasswordHash(password, saltBase64 = null) {
    const salt = saltBase64
        ? Uint8Array.from(atob(saltBase64), char => char.charCodeAt(0))
        : crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits({
        name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256'
    }, keyMaterial, 256);
    const hash = Array.from(new Uint8Array(derivedBits), byte => byte.toString(16).padStart(2, '0')).join('');
    return { salt: btoa(String.fromCharCode(...salt)), hash };
}

function prepareAccountDatabase(account) {
    sessionStorage.setItem(AUTH_SESSION_KEY, account.id);
    let db = getDB();

    if (!db) {
        const legacyDB = localStorage.getItem(DB_KEY);
        const alreadyMigrated = localStorage.getItem(DB_MIGRATED_KEY) === 'true';
        if (legacyDB && !alreadyMigrated) {
            try {
                const oldValue = JSON.parse(legacyDB);
                if (!oldValue.accounts && oldValue.user) {
                    db = oldValue;
                    localStorage.setItem(DB_MIGRATED_KEY, 'true');
                }
            } catch (error) {
                console.warn('Não foi possível migrar os dados locais antigos:', error);
            }
        }
    }

    if (!db) {
        db = createEmptyDatabase();
    }
    if (isUntouchedLegacyDemo(db)) db = createEmptyDatabase();
    db.user = db.user ? { ...db.user, id: account.id, name: db.user.name || account.name, email: account.email } : null;
    db.account = { id: account.id, email: account.email };
    saveDB(db);
    return db;
}

function showAuthForm(viewName) {
    document.querySelectorAll('.auth-form-panel').forEach(form => {
        form.classList.toggle('active', form.id === `${viewName}Form`);
    });
    document.querySelectorAll('.auth-error').forEach(error => { error.textContent = ''; });
}

function enterAppForAccount(account, showOnboarding = false) {
    const db = prepareAccountDatabase(account);
    document.getElementById('authScreen')?.classList.remove('active');
    initializeApplication(db);

    if (showOnboarding || !db.user?.onboarded) {
        const nameInput = document.getElementById('onboardName');
        if (nameInput) nameInput.value = account.name;
        document.getElementById('modalOnboarding')?.classList.add('active');
    }
}

function setupAuthListeners() {
    document.querySelectorAll('[data-auth-view]').forEach(button => {
        button.addEventListener('click', () => showAuthForm(button.dataset.authView));
    });

    document.getElementById('loginForm')?.addEventListener('submit', async event => {
        event.preventDefault();
        const errorBox = document.getElementById('loginError');
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) {
            errorBox.textContent = 'Preencha o e-mail e a senha.';
            return;
        }
        const account = getAuthAccounts().find(item => item.email === email);
        if (!account) {
            errorBox.textContent = 'Não encontramos uma conta com esse e-mail.';
            return;
        }

        try {
            const result = await derivePasswordHash(password, account.salt);
            if (result.hash !== account.passwordHash) {
                errorBox.textContent = 'E-mail ou senha incorretos.';
                return;
            }
            enterAppForAccount(account);
        } catch (error) {
            console.error('Falha ao validar login:', error);
            errorBox.textContent = 'Não foi possível validar a senha neste navegador. Abra o app em localhost ou HTTPS.';
        }
    });

    document.getElementById('registerForm')?.addEventListener('submit', async event => {
        event.preventDefault();
        const errorBox = document.getElementById('registerError');
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim().toLowerCase();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorBox.textContent = 'Informe um endereço de e-mail válido.';
            return;
        }
        if (name.length < 2) {
            errorBox.textContent = 'Informe um nome com pelo menos 2 caracteres.';
            return;
        }
        if (password.length < 8) {
            errorBox.textContent = 'A senha precisa ter pelo menos 8 caracteres.';
            return;
        }
        if (password !== passwordConfirm) {
            errorBox.textContent = 'As senhas não coincidem.';
            return;
        }

        const accounts = getAuthAccounts();
        if (accounts.some(item => item.email === email)) {
            errorBox.textContent = 'Já existe uma conta com esse e-mail. Faça login.';
            return;
        }

        try {
            const credentials = await derivePasswordHash(password);
            const account = {
                id: generateId('account'),
                name,
                email,
                salt: credentials.salt,
                passwordHash: credentials.hash,
                createdAt: new Date().toISOString()
            };
            accounts.push(account);
            localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(accounts));
            enterAppForAccount(account, true);
        } catch (error) {
            console.error('Falha ao criar cadastro local:', error);
            errorBox.textContent = 'Não foi possível criar a conta neste navegador. Abra o app em localhost ou HTTPS.';
        }
    });
}

function getTodayStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function getLocalDateTimeParts(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return {
        date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
    };
}

function isValidISODate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

// ==========================================
// 2. VALIDAÇÕES MANDATÓRIAS
// ==========================================
function validatePositiveNumber(val, fieldName = 'Campo') {
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
        throw new Error(`${fieldName} deve ser um número estritamente positivo.`);
    }
    return num;
}

function preventFutureDate(dateStr, fieldName = 'Data') {
    if (!dateStr) throw new Error(`${fieldName} é obrigatória.`);
    const todayStr = getTodayStr();
    if (dateStr > todayStr) {
        throw new Error(`${fieldName} não pode ser uma data futura.`);
    }
    return dateStr;
}

function validateRequired(val, fieldName = 'Campo') {
    if (val === null || val === undefined || String(val).trim() === '') {
        throw new Error(`${fieldName} é de preenchimento obrigatório.`);
    }
    return String(val).trim();
}

// ==========================================
// 3. SISTEMA DE TOAST & NOTIFICAÇÕES VISUAIS
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'fa-info-circle';
    let iconColor = 'var(--c-sunbeam)';
    if (type === 'success') {
        icon = 'fa-check-circle';
        iconColor = '#00ff88';
    } else if (type === 'danger') {
        icon = 'fa-triangle-exclamation';
        iconColor = '#ff3366';
    } else if (type === 'magic') {
        icon = 'fa-wand-magic-sparkles';
        iconColor = 'var(--c-glow-core)';
    }

    toast.innerHTML = `
        <i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 1.1rem;"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==========================================
// 4. ÁUDIO SINTETIZADO (WEB AUDIO API) PARA O CRONÔMETRO
// ==========================================
let audioCtx = null;
let soundEnabled = true;

function playRestTimerBeep(isDouble = false) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isDouble ? 880 : 587.33, audioCtx.currentTime); // Lá ou Ré

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);

        if (isDouble) {
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.5);
            }, 180);
        }
    } catch (e) {
        console.warn('AudioContext não pôde reproduzir som:', e);
    }
}

// ==========================================
// 5. CALCULADORA DE IMC (TEMPO REAL & ONBOARDING)
// ==========================================
function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm <= 0) return { imc: 0, text: '--', color: '#888' };
    const heightM = heightCm / 100;
    const imc = Number((weightKg / (heightM * heightM)).toFixed(1));

    let text = 'Peso saudável (18,5–24,9)';
    let color = '#00ff88';
    if (imc < 16) { text = 'Magreza grave (<16)'; color = '#ff3366'; }
    else if (imc < 17) { text = 'Magreza moderada (16–16,9)'; color = '#ff7b2b'; }
    else if (imc < 18.5) { text = 'Magreza leve (17–18,4)'; color = '#ff9e00'; }
    else if (imc < 25) { text = 'Peso saudável (18,5–24,9)'; color = '#00ff88'; }
    else if (imc < 30) { text = 'Sobrepeso (25–29,9)'; color = '#ff9e00'; }
    else if (imc < 35) { text = 'Obesidade grau I (30–34,9)'; color = '#ff7b2b'; }
    else if (imc < 40) { text = 'Obesidade grau II (35–39,9)'; color = '#ff5555'; }
    else { text = 'Obesidade grau III (≥40)'; color = '#ff3366'; }

    return { imc, text, color };
}

function updateBmiDisplays() {
    // 1. No Perfil
    const pWeight = Number(document.getElementById('profWeight')?.value) || 0;
    const pHeight = Number(document.getElementById('profHeight')?.value) || 0;
    if (pWeight && pHeight) {
        const res = calculateBMI(pWeight, pHeight);
        const imcVal = document.getElementById('profileImcVal');
        const imcBadge = document.getElementById('profileImcBadge');
        if (imcVal) imcVal.textContent = res.imc;
        if (imcBadge) {
            imcBadge.textContent = res.text;
            imcBadge.style.color = res.color;
            imcBadge.style.borderColor = res.color;
            imcBadge.style.background = `${res.color}20`;
        }
    }

    // 2. No Onboarding
    const oWeight = Number(document.getElementById('onboardWeight')?.value) || 0;
    const oHeight = Number(document.getElementById('onboardHeight')?.value) || 0;
    if (oWeight && oHeight) {
        const res = calculateBMI(oWeight, oHeight);
        const oImcVal = document.getElementById('onboardingImcVal');
        const oImcBadge = document.getElementById('onboardingImcBadge');
        if (oImcVal) oImcVal.textContent = res.imc;
        if (oImcBadge) {
            oImcBadge.textContent = res.text;
            oImcBadge.style.color = res.color;
            oImcBadge.style.borderColor = res.color;
            oImcBadge.style.background = `${res.color}20`;
        }
    }
}

const ACTIVITY_FACTORS = { sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725, athlete: 1.9 };
const WEEK_DAYS = [
    { id: 1, name: 'Segunda-feira', shortName: 'SEG' }, { id: 2, name: 'Terça-feira', shortName: 'TER' },
    { id: 3, name: 'Quarta-feira', shortName: 'QUA' }, { id: 4, name: 'Quinta-feira', shortName: 'QUI' },
    { id: 5, name: 'Sexta-feira', shortName: 'SEX' }, { id: 6, name: 'Sábado', shortName: 'SÁB' },
    { id: 0, name: 'Domingo', shortName: 'DOM' }
];

function calculateNutritionTargets({ weight, height, age, gender, activity, objective }) {
    const weightKg = Number(weight) || 0;
    const heightCm = Number(height) || 0;
    const ageYears = Number(age) || 0;
    if (!weightKg || !heightCm || !ageYears || !gender || !activity) return null;

    const genderConstant = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
    const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + genderConstant;
    const tdee = Math.round(bmr * (ACTIVITY_FACTORS[activity] || 1.2));
    const calorieAdjustments = { emagrecimento: 0.85, hipertrofia: 0.95, ganhar_peso: 1.1, condicionamento: 1, fortalecimento: 1 };
    const goalCalories = Math.max(1200, Math.round(tdee * (calorieAdjustments[objective] ?? 1)));
    const proteinPerKg = { emagrecimento: 1.8, hipertrofia: 2, ganhar_peso: 1.8, condicionamento: 1.6, fortalecimento: 1.8 };
    const protein = Math.round(weightKg * (proteinPerKg[objective] || 1.6));
    const fat = Math.round(weightKg * 0.8);
    const carbs = Math.max(0, Math.round((goalCalories - protein * 4 - fat * 9) / 4));
    const water = Math.round(weightKg * 37.5 / 50) * 50;
    return { bmr: Math.round(bmr), tdee, goalCalories, protein, carbs, fat, water };
}

function getOnboardingFormData() {
    return {
        name: document.getElementById('onboardName')?.value.trim() || '',
        age: Number(document.getElementById('onboardAge')?.value),
        gender: document.getElementById('onboardGender')?.value,
        weight: Number(document.getElementById('onboardWeight')?.value),
        height: Number(document.getElementById('onboardHeight')?.value),
        activity: document.getElementById('onboardActivity')?.value,
        frequency: Number(document.getElementById('onboardFrequency')?.value),
        objective: document.getElementById('onboardObjective')?.value,
        trainingDays: [...document.querySelectorAll('input[name="trainingDay"]:checked')].map(input => Number(input.value)),
        trainingFocuses: [...document.querySelectorAll('input[name="trainingFocus"]:checked')].map(input => input.value)
    };
}

function updateOnboardingPreview() {
    const form = getOnboardingFormData();
    const bmi = calculateBMI(form.weight, form.height);
    const bmiVal = document.getElementById('onboardingImcVal');
    const bmiBadge = document.getElementById('onboardingImcBadge');
    if (bmiVal) bmiVal.textContent = bmi.imc || '—';
    if (bmiBadge) {
        bmiBadge.textContent = bmi.imc ? bmi.text : 'Preencha peso e altura';
        bmiBadge.style.color = bmi.color;
        bmiBadge.style.borderColor = bmi.color;
    }

    const targets = calculateNutritionTargets(form);
    const previews = {
        onboardTdee: targets ? `${targets.tdee.toLocaleString('pt-BR')} kcal` : '— kcal',
        onboardGoalCalPreview: targets ? `${targets.goalCalories.toLocaleString('pt-BR')} kcal` : '— kcal',
        onboardProteinPreview: targets ? `${targets.protein} g` : '— g',
        onboardCarbsPreview: targets ? `${targets.carbs} g` : '— g',
        onboardFatPreview: targets ? `${targets.fat} g` : '— g',
        onboardGoalWaterPreview: targets ? `${targets.water.toLocaleString('pt-BR')} ml` : '— ml'
    };
    Object.entries(previews).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    });
    return { form, targets, bmi };
}

function buildWeeklyRoutine(trainingDays, focuses) {
    const selected = new Set(trainingDays);
    const focusList = focuses.length ? focuses : ['Treino livre'];
    let focusIndex = 0;
    return WEEK_DAYS.map(day => {
        const isTrainingDay = selected.has(day.id);
        const focus = isTrainingDay ? focusList[focusIndex++ % focusList.length] : 'Descanso';
        return {
            ...day,
            focus,
            restDay: !isTrainingDay,
            targetSets: 0,
            color: isTrainingDay ? '#ff7b2b' : '#78665c'
        };
    });
}

let onboardingStep = 1;
function showOnboardingStep(step) {
    onboardingStep = Math.min(4, Math.max(1, step));
    document.querySelectorAll('.onboarding-step').forEach(section => {
        section.classList.toggle('active', Number(section.dataset.onboardingStep) === onboardingStep);
    });
    document.getElementById('onboardingStepLabel').textContent = `ETAPA ${onboardingStep} DE 4`;
    document.getElementById('onboardingProgressBar').style.width = `${onboardingStep * 25}%`;
    document.getElementById('onboardingBack').hidden = onboardingStep === 1;
    document.getElementById('onboardingNext').hidden = onboardingStep === 4;
    document.getElementById('onboardingFinish').hidden = onboardingStep !== 4;
    document.getElementById('onboardingError').textContent = '';
    if (onboardingStep === 3) updateOnboardingPreview();
    if (onboardingStep === 4) updateOnboardingReview();
}

function updateOnboardingReview() {
    const { form, targets } = updateOnboardingPreview();
    const daysText = form.trainingDays.map(id => WEEK_DAYS.find(day => day.id === id)?.name).filter(Boolean).join(', ');
    const focusText = form.trainingFocuses.join(', ');
    const element = document.getElementById('onboardingReview');
    if (element) element.textContent = `${form.name} · ${form.weight} kg · ${form.height} cm. Objetivo: ${form.objective}. Treinos ${form.frequency} dia(s)/semana (${daysText}). Focos: ${focusText}. Meta: ${targets?.goalCalories || '—'} kcal, ${targets?.protein || '—'} g proteína, ${targets?.carbs || '—'} g carboidratos, ${targets?.fat || '—'} g gorduras, ${targets?.water || '—'} ml água. Streak inicial: 1 dia.`;
}

function validateOnboardingStep(step) {
    const form = getOnboardingFormData();
    const error = document.getElementById('onboardingError');
    if (step === 1) {
        if (!form.name || form.name.length < 2 || !form.age || !form.gender || !form.weight || !form.height) {
            error.textContent = 'Preencha nome, idade, gênero, peso e altura para continuar.';
            return false;
        }
        if (form.age < 15 || form.age > 100 || form.weight < 30 || form.weight > 300 || form.height < 100 || form.height > 250) {
            error.textContent = 'Confira idade (15–100), peso (30–300 kg) e altura (100–250 cm).';
            return false;
        }
    }
    if (step === 2) {
        if (!form.activity || !form.objective || !form.frequency) {
            error.textContent = 'Selecione nível de atividade, frequência e objetivo.';
            return false;
        }
        if (form.trainingDays.length !== form.frequency) {
            error.textContent = `Selecione exatamente ${form.frequency} dia(s) de treino.`;
            return false;
        }
    }
    if (step === 3 && form.trainingFocuses.length === 0) {
        error.textContent = 'Selecione pelo menos um foco de treino.';
        return false;
    }
    return true;
}

// ==========================================
// 6. MOTOR DO SCORE OTTER & MÉTRICA DE CONSISTÊNCIA
// ==========================================
function computeOtterScore(db) {
    if (!db?.user) return { score: 0, streak: 1, breakdown: {} };
    const todayStr = getTodayStr();
    const todayMeals = (db.meals || []).filter(meal => meal.date === todayStr);
    const caloriesToday = todayMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
    const waterToday = Number(db.waterLogs?.[todayStr]) || 0;
    const routineToday = (db.weeklyRoutine || []).find(day => day.dayId === new Date().getDay());
    const didWorkout = (db.workouts || []).some(workout => workout.date === todayStr && workout.status === 'completed');
    const hasWorkoutTarget = routineToday && !routineToday.restDay;
    const workoutMet = hasWorkoutTarget ? didWorkout : Boolean(routineToday?.restDay);
    const waterMet = Number(db.user.goalWater) > 0 && waterToday >= Number(db.user.goalWater);
    const calorieTarget = Number(db.user.goalCalories) || 0;
    const caloriesMet = todayMeals.length > 0 && calorieTarget > 0 && Math.abs(caloriesToday - calorieTarget) <= calorieTarget * 0.1;
    const checks = [workoutMet, waterMet, caloriesMet];
    const completed = checks.filter(Boolean).length;
    const hasActualActivity = todayMeals.length > 0 || Object.prototype.hasOwnProperty.call(db.waterLogs || {}, todayStr) || didWorkout;
    const score = hasActualActivity ? Math.round(completed / checks.length * 100) : 0;

    let streak = 1;
    for (let offset = 1; offset < 90; offset++) {
        const date = new Date();
        date.setDate(date.getDate() - offset);
        const dateString = date.toISOString().slice(0, 10);
        const routine = (db.weeklyRoutine || []).find(day => day.dayId === date.getDay());
        const workoutDone = routine?.restDay || (db.workouts || []).some(workout => workout.date === dateString && workout.status === 'completed');
        const waterDone = Number(db.waterLogs?.[dateString]) >= Number(db.user.goalWater || Infinity);
        const dayMeals = (db.meals || []).filter(meal => meal.date === dateString);
        const kcal = dayMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
        const foodDone = dayMeals.length > 0 && Number(db.user.goalCalories) > 0 && Math.abs(kcal - db.user.goalCalories) <= db.user.goalCalories * 0.1;
        if (workoutDone && waterDone && foodDone) streak++;
        else break;
    }
    return { score, streak, breakdown: { workout: workoutMet, water: waterMet, calories: caloriesMet } };
}

// ==========================================
// 7. GERADOR DE INSIGHTS DINÂMICOS (NÚCLEO PRINCIPAL)
// Cruzamento de dados de Treino, Dieta e Variação de Peso
// ==========================================
function getEstimatedWorkoutCaloriesForDate(db, dateStr) {
    if (!db) return 0;
    const completedWorkoutIds = new Set((db.workouts || [])
        .filter(workout => workout.date === dateStr && workout.status === 'completed' && workout.id)
        .map(workout => workout.id));

    return [...completedWorkoutIds].reduce((sum, workoutId) => {
        const sessionExecutions = (db.executions || []).filter(execution => execution.workoutId === workoutId);
        const isCardio = execution => execution.type === 'cardio'
            || execution.exerciseType === 'cardio'
            || Number(execution.durationMin) > 0
            || Number(execution.distanceKm) > 0
            || Number(execution.estimatedCalories) > 0;
        const hasStrength = sessionExecutions.some(execution => Number(execution.totalVolume) > 0 && !isCardio(execution));
        const cardioCalories = sessionExecutions
            .filter(isCardio)
            .reduce((cardioSum, execution) => {
                const durationMin = Number(execution.durationMin);
                const storedEstimate = Number(execution.estimatedCalories);
                const estimate = Number.isFinite(durationMin) && durationMin > 0
                    ? durationMin * 6
                    : Number.isFinite(storedEstimate) && storedEstimate > 0 ? storedEstimate : 0;
                return cardioSum + estimate;
            }, 0);
        return sum + (hasStrength ? 200 : 0) + cardioCalories;
    }, 0);
}

function generateDynamicInsight(db) {
    if (!db?.user) return 'Complete seu onboarding para começar a acompanhar seus dados.';
    const today = getTodayStr();
    const meals = (db.meals || []).filter(meal => meal.date === today);
    const workouts = (db.workouts || []).filter(workout => workout.date === today && workout.status === 'completed');
    const water = Number(db.waterLogs?.[today]) || 0;
    const parts = [];
    if (meals.length) parts.push(`${meals.length} refeição(ões) registradas, totalizando ${meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0)} kcal`);
    if (water > 0) parts.push(`${water} ml de água registrados`);
    if (workouts.length) parts.push(`${workouts.length} treino(s) concluído(s)`);

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
        const d = new Date();
        d.setDate(d.getDate() - index);
        return d.toISOString().slice(0, 10);
    }).reverse();

    const daySummaries = lastSevenDays.map(date => {
        const dailyMeals = (db.meals || []).filter(meal => meal.date === date);
        const consumed = dailyMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
        const goal = Number(db.user.goalCalories) || 0;
        const workoutDone = (db.workouts || []).some(workout => workout.date === date && workout.status === 'completed');
        const delta = goal ? consumed - goal : 0;
        return { date, consumed, goal, workoutDone, delta };
    });

    const withWorkout = daySummaries.filter(day => day.workoutDone && day.goal > 0);
    const withoutWorkout = daySummaries.filter(day => !day.workoutDone && day.goal > 0);
    if (withWorkout.length >= 2 && withoutWorkout.length >= 2) {
        const avgWith = withWorkout.reduce((sum, day) => sum + day.delta, 0) / withWorkout.length;
        const avgWithout = withoutWorkout.reduce((sum, day) => sum + day.delta, 0) / withoutWorkout.length;
        const resultText = avgWith < avgWithout
            ? `Nos últimos 7 dias, dias com treino ficaram ${Math.abs(avgWith).toFixed(0)} kcal mais perto da meta em média do que dias sem treino.`
            : `Nos últimos 7 dias, dias com treino ficaram ${Math.abs(avgWithout - avgWith).toFixed(0)} kcal mais distantes da meta em média do que dias sem treino.`;
        return resultText;
    }

    const weightLogs = db.weightLogs || [];
    if (weightLogs.length > 1) {
        const delta = Number((weightLogs.at(-1).weight - weightLogs.at(-2).weight).toFixed(1));
        parts.push(`variação da última pesagem: ${delta > 0 ? '+' : ''}${delta} kg`);
    }
    return parts.length ? parts.join(' · ') + '.' : 'Ainda não há registros de hoje. Registre uma refeição, água ou treino para gerar insights reais.';
}

// ==========================================
// 8. CALCULADORA DE ANILHAS VISUAL (BARBELL CALCULATOR)
// Considera barra olímpica de 20kg e anilhas: 20, 15, 10, 5, 2.5, 1.25kg
// ==========================================
const AVAILABLE_PLATES = [
    { weight: 20, class: 'plate-20kg', color: '#0055ff' },
    { weight: 15, class: 'plate-15kg', color: '#e6b800' },
    { weight: 10, class: 'plate-10kg', color: '#009944' },
    { weight: 5,  class: 'plate-5kg',  color: '#ffffff' },
    { weight: 2.5, class: 'plate-2_5kg', color: '#222222' },
    { weight: 1.25, class: 'plate-1_25kg', color: '#888888' }
];

function calculateBarbellPlates(totalWeightKg) {
    const barWeight = 20;
    if (totalWeightKg < barWeight) {
        return { perSide: 0, plates: [], totalWeight: barWeight };
    }

    let remainingWeightPerSide = (totalWeightKg - barWeight) / 2;
    const platesUsed = [];

    for (const plate of AVAILABLE_PLATES) {
        while (remainingWeightPerSide >= plate.weight) {
            platesUsed.push(plate);
            remainingWeightPerSide = Number((remainingWeightPerSide - plate.weight).toFixed(2));
        }
    }

    return {
        barWeight,
        perSide: Number(((totalWeightKg - barWeight) / 2).toFixed(2)),
        plates: platesUsed,
        totalWeight: totalWeightKg
    };
}

function renderBarbellVisual(totalWeightKg) {
    const result = calculateBarbellPlates(totalWeightKg);
    const sleeve = document.getElementById('barbellVisualSleeve');
    const summary = document.getElementById('barbellPlateSummary');

    if (!sleeve || !summary) return;

    // Remove anilhas anteriores mantendo o eixo e o colar da barra
    const existingPlates = sleeve.querySelectorAll('.barbell-plate');
    existingPlates.forEach(p => p.remove());

    // Agrupa para contagem de texto
    const counts = {};
    result.plates.forEach(plate => {
        counts[plate.weight] = (counts[plate.weight] || 0) + 1;

        // Renderiza elemento visual da anilha
        const plateEl = document.createElement('div');
        plateEl.className = `barbell-plate ${plate.class}`;
        plateEl.title = `Anilha de ${plate.weight}kg`;
        plateEl.textContent = plate.weight >= 5 ? `${plate.weight}` : '';
        sleeve.appendChild(plateEl);
    });

    // Renderiza resumo em tags
    if (result.plates.length === 0) {
        summary.innerHTML = `<span style="font-size: 0.8rem; color: var(--c-text-muted);">Apenas a barra olímpica de 20kg (sem anilhas adicionais).</span>`;
    } else {
        const tagsHtml = Object.keys(counts)
            .sort((a, b) => Number(b) - Number(a))
            .map(w => `<span class="plate-badge-count"><strong>${counts[w]}x</strong> anilha de ${w}kg por lado</span>`)
            .join(' ');
        summary.innerHTML = `
            <div style="font-size: 0.75rem; color: var(--c-ardent); margin-bottom: 0.3rem;">
                Por lado: <strong>${result.perSide} kg</strong> + Barra (20 kg) = <strong>${result.totalWeight} kg</strong>:
            </div>
            ${tagsHtml}
        `;
    }
}

// ==========================================
// 9. CRONÔMETRO DE DESCANSO REGRESSIVO COM CONTROLE
// ==========================================
let restTimerInterval = null;
let restTimerSeconds = 0;
let isTimerRunning = false;

function updateTimerDisplay() {
    const display = document.getElementById('restTimerDisplay');
    if (!display) return;
    const mins = Math.floor(restTimerSeconds / 60);
    const secs = restTimerSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startRestTimer() {
    if (isTimerRunning) return;
    if (!restTimerSeconds) {
        showToast('Ajuste o tempo de descanso antes de iniciar.', 'info');
        return;
    }
    isTimerRunning = true;
    const btn = document.getElementById('timerPlayPauseBtn');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-pause"></i> Pausar`;

    restTimerInterval = setInterval(() => {
        if (restTimerSeconds > 0) {
            restTimerSeconds--;
            updateTimerDisplay();

            // Beep de aviso nos 3 segundos finais
            if (restTimerSeconds <= 3 && restTimerSeconds > 0) {
                playRestTimerBeep(false);
            }
        } else {
            // Fim do descanso!
            clearInterval(restTimerInterval);
            isTimerRunning = false;
            if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar`;
            playRestTimerBeep(true);
            showToast('Tempo de descanso encerrado! Próxima série.', 'magic');
            updateTimerDisplay();
        }
    }, 1000);
}

function setRestTimerFromInput() {
    const input = document.getElementById('restTimerInput');
    const seconds = Number(input?.value);
    if (!Number.isFinite(seconds) || seconds <= 0) {
        showToast('Informe um tempo de descanso maior que zero.', 'danger');
        return;
    }
    pauseRestTimer();
    restTimerSeconds = Math.round(seconds);
    updateTimerDisplay();
}

function pauseRestTimer() {
    if (!isTimerRunning) return;
    clearInterval(restTimerInterval);
    isTimerRunning = false;
    const btn = document.getElementById('timerPlayPauseBtn');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar`;
}

function toggleRestTimer() {
    if (isTimerRunning) {
        pauseRestTimer();
    } else {
        startRestTimer();
    }
}

function resetRestTimer() {
    pauseRestTimer();
    restTimerSeconds = 0;
    const input = document.getElementById('restTimerInput');
    if (input) input.value = '';
    updateTimerDisplay();
}

function adjustRestTimer(deltaSeconds) {
    restTimerSeconds = Math.max(0, restTimerSeconds + deltaSeconds);
    const input = document.getElementById('restTimerInput');
    if (input) input.value = restTimerSeconds || '';
    updateTimerDisplay();
}

// ==========================================
// 10. MODO "EM TREINO" INTERATIVO & REGISTRO DE SÉRIES
// ==========================================
let activeExerciseIndex = 0;
let activeSessionExercises = [];

function normalizeText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getExercisesForToday(db = getDB()) {
    const day = (db?.weeklyRoutine || []).find(item => item.dayId === new Date().getDay());
    if (!day || day.restDay) return [];
    const focus = normalizeText(day.focus);
    const aliases = {
        gluteo: ['gluteo'], quadriceps: ['quadriceps', 'coxa', 'perna'], peitoral: ['peitoral', 'peito'],
        costas: ['costas', 'dorsal', 'latissimo'], ombros: ['ombro', 'deltoide'], bracos: ['biceps', 'triceps', 'braco'],
        abdomen: ['abdomen', 'abdominal', 'core'], cardio: ['cardio']
    };
    const chosen = Object.entries(aliases).filter(([, words]) => words.some(word => focus.includes(word))).flatMap(([, words]) => words);
    const found = (window.EXERCISES_DATABASE || []).filter(exercise => {
        const muscle = normalizeText(`${exercise.muscle} ${exercise.category} ${exercise.name}`);
        return chosen.some(word => muscle.includes(word));
    });
    return [...new Map(found.map(exercise => [exercise.id, exercise])).values()];
}

function openInTrainingModal(exerciseId = null) {
    const db = getDB();
    if (!db) return;

    activeSessionExercises = getExercisesForToday(db);
    if (!activeSessionExercises.length) {
        showToast('Hoje não há exercícios da biblioteca para o foco programado. Edite sua rotina ou cadastre exercícios.', 'info');
        return;
    }
    activeExerciseIndex = 0;

    if (exerciseId) {
        const foundIdx = activeSessionExercises.findIndex(e => e.id === exerciseId);
        if (foundIdx !== -1) activeExerciseIndex = foundIdx;
    }

    renderCurrentInTrainingExercise();
    const modal = document.getElementById('modalInTraining');
    if (modal) modal.classList.add('active');
}

function closeInTrainingModal() {
    pauseRestTimer();
    const modal = document.getElementById('modalInTraining');
    if (modal) modal.classList.remove('active');
}

function renderCurrentInTrainingExercise() {
    const curEx = activeSessionExercises[activeExerciseIndex];
    if (!curEx) return;

    document.getElementById('modalExerciseTitle').textContent = curEx.name;
    document.getElementById('modalExerciseTarget').textContent = `${curEx.muscle} • ${curEx.equipment}`;

    const weightInput = document.getElementById('barbellWeightInput');
    if (weightInput) {
        weightInput.value = '';
        renderBarbellVisual(20);
    }

    // Carrega séries da execução gravada ou gera 4 séries padrão
    const db = getDB();
    const todayStr = getTodayStr();
    const workoutId = `wk_${todayStr}`;
    const currentExec = (db.executions || []).find(e => e.exerciseId === curEx.id && e.workoutId === workoutId);

    const tbody = document.getElementById('inTrainingSetsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const setsToRender = currentExec?.sets || [];

    setsToRender.forEach((s, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${s.setNum}</strong></td>
            <td><input type="number" min="0" step="0.5" class="set-input set-weight-input" value="${s.weightKg}" onchange="recalculateExerciseVolume()"></td>
            <td><input type="number" min="1" class="set-input set-reps-input" value="${s.reps}" onchange="recalculateExerciseVolume()"></td>
            <td><input type="checkbox" class="hard-set-checkbox" ${s.isHardSet ? 'checked' : ''} onchange="recalculateExerciseVolume()"></td>
            <td><span class="progression-badge evolving"><i class="fa-solid fa-arrow-trend-up"></i> Evoluindo</span></td>
            <td><button class="btn-icon" style="width: 28px; height: 28px; font-size: 0.75rem;" onclick="removeSetRow(this)"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    recalculateExerciseVolume();
}

function recalculateExerciseVolume() {
    const tbody = document.getElementById('inTrainingSetsTableBody');
    if (!tbody) return;

    let totalVol = 0;
    let hardSets = 0;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(r => {
        const w = Number(r.querySelector('.set-weight-input')?.value) || 0;
        const reps = Number(r.querySelector('.set-reps-input')?.value) || 0;
        const isHard = r.querySelector('.hard-set-checkbox')?.checked;
        totalVol += (w * reps);
        if (isHard) hardSets++;
    });

    const summary = document.getElementById('exerciseProgressionSummary');
    if (summary) {
        summary.innerHTML = `Volume Total: <strong style="color: var(--c-sunbeam);">${totalVol.toLocaleString('pt-BR')} kg</strong> • <strong>${hardSets} Séries Efetivas</strong> (Evoluindo <i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> vs anterior)`;
    }
}

function addSetRow() {
    const tbody = document.getElementById('inTrainingSetsTableBody');
    if (!tbody) return;
    const currentCount = tbody.querySelectorAll('tr').length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><strong>#${currentCount}</strong></td>
        <td><input type="number" min="0" step="0.5" class="set-input set-weight-input" placeholder="kg" onchange="recalculateExerciseVolume()"></td>
        <td><input type="number" min="1" class="set-input set-reps-input" placeholder="reps" onchange="recalculateExerciseVolume()"></td>
        <td><input type="checkbox" class="hard-set-checkbox" onchange="recalculateExerciseVolume()"></td>
        <td><span class="progression-badge evolving"><i class="fa-solid fa-arrow-trend-up"></i> Evoluindo</span></td>
        <td><button class="btn-icon" style="width: 28px; height: 28px; font-size: 0.75rem;" onclick="removeSetRow(this)"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
    recalculateExerciseVolume();
    showToast(`Série #${currentCount} adicionada`, 'info');
}

function removeSetRow(btn) {
    const row = btn.closest('tr');
    if (row) {
        row.remove();
        recalculateExerciseVolume();
    }
}

function saveCurrentExerciseSets() {
    const db = getDB();
    if (!db) return;

    const curEx = activeSessionExercises[activeExerciseIndex];
    if (!curEx) return;

    const tbody = document.getElementById('inTrainingSetsTableBody');
    const rows = tbody.querySelectorAll('tr');

    const sets = [];
    let totalVol = 0;
    let hardSets = 0;
    let incompleteSet = false;

    rows.forEach((r, idx) => {
        const weightValue = r.querySelector('.set-weight-input')?.value;
        const repsValue = r.querySelector('.set-reps-input')?.value;
        if (weightValue === '' || repsValue === '') {
            incompleteSet = true;
            return;
        }
        const w = Number(weightValue);
        const reps = Number(repsValue);
        const isHard = r.querySelector('.hard-set-checkbox')?.checked;
        if (!Number.isFinite(w) || w < 0 || !Number.isFinite(reps) || reps <= 0) {
            incompleteSet = true;
            return;
        }
        totalVol += (w * reps);
        if (isHard) hardSets++;
        sets.push({
            setNum: idx + 1,
            weightKg: w,
            reps: reps,
            isHardSet: isHard,
            rpe: 8.5
        });
    });

    if (!sets.length || incompleteSet) {
        showToast('Preencha carga e repetições em todas as séries antes de salvar.', 'danger');
        return;
    }

    const todayStr = getTodayStr();
    const todayRoutine = (db.weeklyRoutine || []).find(day => day.dayId === new Date().getDay());
    let workout = (db.workouts || []).find(w => w.date === todayStr);
    if (!workout) {
        workout = {
            id: `wk_${todayStr}`,
            date: todayStr,
            name: `Treino: ${todayRoutine?.focus || curEx.muscle}`,
            focus: todayRoutine?.focus || curEx.muscle,
            status: 'in_progress'
        };
        db.workouts.push(workout);
    }

    const previous = (db.executions || []).filter(e => e.exerciseId === curEx.id && e.date && e.date < todayStr).sort((a, b) => b.date.localeCompare(a.date))[0];
    let comparisonStatus = 'Sem histórico';
    if (previous?.totalVolume > 0) {
        const ratio = totalVol / previous.totalVolume;
        comparisonStatus = ratio > 1.03 ? 'Evoluindo' : ratio < 0.97 ? 'Regredindo' : 'Estagnado';
    }
    const execIndex = (db.executions || []).findIndex(e => e.exerciseId === curEx.id && e.workoutId === workout.id);
    const execData = {
        id: `exec_${workout.id}_${curEx.id}`,
        workoutId: workout.id,
        exerciseId: curEx.id,
        exerciseName: curEx.name,
        date: todayStr,
        order: activeExerciseIndex,
        sets: sets,
        totalVolume: totalVol,
        hardSetsCount: hardSets,
        comparisonStatus
    };

    if (execIndex !== -1) {
        db.executions[execIndex] = execData;
    } else {
        db.executions.push(execData);
    }

    const sessionIds = activeSessionExercises.map(exercise => exercise.id);
    const savedIds = new Set(db.executions.filter(execution => execution.workoutId === workout.id).map(execution => execution.exerciseId));
    workout.status = sessionIds.every(id => savedIds.has(id)) ? 'completed' : 'in_progress';

    saveDB(db);
    showToast(`Exercício "${curEx.name}" salvo com sucesso!`, 'success');
    renderWorkoutsView();
    renderDashboardView();
}

// Substituição inteligente de exercício (aparelho ocupado)
function triggerSubstituteExercise() {
    const curEx = activeSessionExercises[activeExerciseIndex];
    if (!curEx || !curEx.equivalents || curEx.equivalents.length === 0) {
        showToast('Nenhum substituto biomecânico direto encontrado.', 'danger');
        return;
    }

    const eq = curEx.equivalents[0]; // Seleciona a primeira alternativa
    const newEx = EXERCISES_DATABASE.find(e => e.id === eq.id) || {
        id: eq.id,
        name: eq.name,
        muscle: curEx.muscle,
        equipment: 'Pesos Livres',
        defaultSets: curEx.defaultSets,
        defaultReps: curEx.defaultReps,
        defaultRestSec: curEx.defaultRestSec,
        instructions: eq.reason
    };

    activeSessionExercises[activeExerciseIndex] = newEx;
    renderCurrentInTrainingExercise();
    showToast(`Substituição ativada: ${newEx.name} (${eq.reason})`, 'magic');
}

// ==========================================
// 11. MÓDULO DIETA & TABELA TACO & SUBSTITUIÇÃO EQUIVALENTE
// ==========================================
let selectedTacoFood = null;

function setupTacoAutocomplete() {
    const input = document.getElementById('tacoSearchInput');
    const dropdown = document.getElementById('tacoDropdown');
    const preview = document.getElementById('tacoSelectedPreview');
    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            dropdown.classList.remove('open');
            return;
        }

        const matches = TACO_DATABASE.filter(f => 
            f.name.toLowerCase().includes(query) || f.category.toLowerCase().includes(query)
        ).slice(0, 8);

        if (matches.length === 0) {
            dropdown.innerHTML = `<div class="taco-dropdown-item"><span style="color: var(--c-text-muted);">Nenhum alimento TACO encontrado</span></div>`;
            dropdown.classList.add('open');
            return;
        }

        dropdown.innerHTML = matches.map(f => `
            <div class="taco-dropdown-item" data-food-id="${f.id}">
                <div>
                    <div class="taco-food-name">${f.name}</div>
                    <div style="font-size: 0.72rem; color: var(--c-text-muted);">${f.category} • ${f.calories} kcal/100g</div>
                </div>
                <div class="taco-macro-tags">
                    <span class="tag-p">P: ${f.protein}g</span>
                    <span class="tag-c">C: ${f.carbs}g</span>
                    <span class="tag-f">G: ${f.fat}g</span>
                </div>
            </div>
        `).join('');

        dropdown.classList.add('open');

        dropdown.querySelectorAll('.taco-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const fId = item.getAttribute('data-food-id');
                const food = TACO_DATABASE.find(f => f.id === fId);
                if (food) {
                    selectedTacoFood = food;
                    input.value = food.name;
                    dropdown.classList.remove('open');
                    if (preview) {
                        preview.style.display = 'block';
                        document.getElementById('previewFoodName').textContent = food.name;
                        document.getElementById('previewMacros').textContent = 
                            `${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | G: ${food.fat}g`;
                    }
                }
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.taco-search-wrapper')) {
            dropdown.classList.remove('open');
        }
    });
}

function addMealFromTaco() {
    const db = getDB();
    if (!db) return;

    if (!selectedTacoFood) {
        showToast('Selecione um alimento da busca TACO.', 'danger');
        return;
    }

    const gramsInput = document.getElementById('mealGramsInput');
    const grams = validatePositiveNumber(gramsInput.value, 'Gramas');
    const mealType = document.getElementById('mealTypeSelect').value;
    const todayStr = getTodayStr();
    const loggedTime = getLocalDateTimeParts().time;

    const cals = Math.round((selectedTacoFood.calories * grams) / 100);
    const prot = Number(((selectedTacoFood.protein * grams) / 100).toFixed(1));
    const carbs = Number(((selectedTacoFood.carbs * grams) / 100).toFixed(1));
    const fat = Number(((selectedTacoFood.fat * grams) / 100).toFixed(1));

    const newMeal = {
        id: generateId('meal'),
        date: todayStr,
        mealDate: todayStr,
        time: loggedTime,
        mealTime: loggedTime,
        mealType: mealType,
        foodId: selectedTacoFood.id,
        foodSource: 'taco',
        alimentoId: selectedTacoFood.id,
        alimentoName: selectedTacoFood.name,
        name: selectedTacoFood.name,
        foodNameSnapshot: selectedTacoFood.name,
        foodMacrosPer100gSnapshot: {
            calories: selectedTacoFood.calories,
            protein: selectedTacoFood.protein,
            carbs: selectedTacoFood.carbs,
            fat: selectedTacoFood.fat
        },
        grams: grams,
        calories: cals,
        protein: prot,
        carbs: carbs,
        fat: fat
    };

    db.meals.push(newMeal);
    saveDB(db);

    showToast(`${selectedTacoFood.name} (${grams}g) adicionado ao ${mealType}!`, 'success');
    renderDietView();
    renderDashboardView();
}

function removeMealItem(mealId) {
    const db = getDB();
    if (!db) return;
    db.meals = db.meals.filter(m => m.id !== mealId);
    saveDB(db);
    showToast('Alimento removido da refeição.', 'info');
    renderDietView();
    renderDashboardView();
}

// Modal de Substituição Equivalente
function openFoodSubstitutionModal() {
    const origSelect = document.getElementById('subOrigFoodSelect');
    const targetSelect = document.getElementById('subTargetFoodSelect');
    if (!origSelect || !targetSelect) return;

    // Popula selects com TACO
    origSelect.innerHTML = TACO_DATABASE.map(f => `<option value="${f.id}">${f.name} (${f.protein}g P)</option>`).join('');
    targetSelect.innerHTML = TACO_DATABASE.map(f => `<option value="${f.id}">${f.name} (${f.protein}g P)</option>`).join('');

    // Padrão: Frango -> Tilápia
    origSelect.value = 'taco_01'; // Frango
    targetSelect.value = 'taco_04'; // Tilápia

    recalculateFoodSubstitutionModal();

    origSelect.onchange = recalculateFoodSubstitutionModal;
    targetSelect.onchange = recalculateFoodSubstitutionModal;
    document.getElementById('subOrigGrams').oninput = recalculateFoodSubstitutionModal;
    document.getElementById('subMacroTargetSelect').onchange = recalculateFoodSubstitutionModal;

    document.getElementById('modalFoodSubstitution').classList.add('active');
}

function recalculateFoodSubstitutionModal() {
    const origId = document.getElementById('subOrigFoodSelect').value;
    const targetId = document.getElementById('subTargetFoodSelect').value;
    const origGrams = Number(document.getElementById('subOrigGrams').value) || 150;
    const targetMacro = document.getElementById('subMacroTargetSelect').value || 'protein';

    const origFood = TACO_DATABASE.find(f => f.id === origId);
    const targetFood = TACO_DATABASE.find(f => f.id === targetId);

    const result = calculateEquivalentFood(origFood, targetFood, origGrams, targetMacro);
    if (!result) return;

    const macroNames = { protein: 'Proteínas', carbs: 'Carboidratos', fat: 'Gorduras' };
    const macroKey = targetMacro;

    document.getElementById('subOrigMacrosBox').innerHTML = `
        <strong>${result.originalNutrients.calories} kcal</strong> | P: ${result.originalNutrients.protein}g | C: ${result.originalNutrients.carbs}g | G: ${result.originalNutrients.fat}g
    `;

    document.getElementById('subTargetMacrosBox').innerHTML = `
        Por 100g: ${targetFood.calories} kcal | P: ${targetFood.protein}g | C: ${targetFood.carbs}g | G: ${targetFood.fat}g
    `;

    document.getElementById('subResultGrams').textContent = `${result.requiredTargetGrams} g`;
    document.getElementById('subResultDescription').innerHTML = `
        Para obter exatamente <strong>${result.originalNutrients[macroKey]}g de ${macroNames[macroKey]}</strong>, 
        consuma <strong>${result.requiredTargetGrams}g</strong> de <em>${targetFood.name}</em>.
        <br><span style="font-size: 0.78rem; color: var(--c-ardent);">
            Diferença calórica resultante: ${result.diffCalories > 0 ? '+' : ''}${result.diffCalories} kcal
        </span>
    `;
}

function applyFoodSubstitutionToToday() {
    const db = getDB();
    if (!db) return;

    const origId = document.getElementById('subOrigFoodSelect').value;
    const targetId = document.getElementById('subTargetFoodSelect').value;
    const origGrams = Number(document.getElementById('subOrigGrams').value) || 150;
    const targetMacro = document.getElementById('subMacroTargetSelect').value || 'protein';

    const origFood = TACO_DATABASE.find(f => f.id === origId);
    const targetFood = TACO_DATABASE.find(f => f.id === targetId);
    const result = calculateEquivalentFood(origFood, targetFood, origGrams, targetMacro);

    const todayStr = getTodayStr();
    // Procura uma refeição de hoje com o alimento original ou adiciona diretamente
    const mealIdx = db.meals.findIndex(m => m.date === todayStr && m.alimentoId === origId);

    if (mealIdx !== -1) {
        db.meals[mealIdx].alimentoId = targetFood.id;
        db.meals[mealIdx].alimentoName = targetFood.name;
        db.meals[mealIdx].grams = result.requiredTargetGrams;
        db.meals[mealIdx].calories = result.newNutrients.calories;
        db.meals[mealIdx].protein = result.newNutrients.protein;
        db.meals[mealIdx].carbs = result.newNutrients.carbs;
        db.meals[mealIdx].fat = result.newNutrients.fat;
    } else {
        db.meals.push({
            id: generateId('meal'),
            date: todayStr,
            mealType: 'Almoço',
            alimentoId: targetFood.id,
            alimentoName: targetFood.name,
            grams: result.requiredTargetGrams,
            calories: result.newNutrients.calories,
            protein: result.newNutrients.protein,
            carbs: result.newNutrients.carbs,
            fat: result.newNutrients.fat
        });
    }

    saveDB(db);
    document.getElementById('modalFoodSubstitution').classList.remove('active');
    showToast(`Substituição realizada: ${result.requiredTargetGrams}g de ${targetFood.name}!`, 'magic');
    renderDietView();
    renderDashboardView();
}

// Ingestão Hídrica
function addWaterMl(amount) {
    const db = getDB();
    if (!db || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return;
    const todayStr = getTodayStr();
    if (!db.waterLogs) db.waterLogs = {};
    db.waterLogs[todayStr] = (Number(db.waterLogs[todayStr]) || 0) + Number(amount);
    saveDB(db);
    showToast(`+${amount} ml de água registrados!`, 'info');
    renderDietView();
    renderDashboardView();
}

function resetWaterToday() {
    const db = getDB();
    if (!db) return;
    const todayStr = getTodayStr();
    if (!db.waterLogs) db.waterLogs = {};
    db.waterLogs[todayStr] = 0;
    saveDB(db);
    showToast('Contador de água zerado.', 'info');
    renderDietView();
    renderDashboardView();
}

// ==========================================
// 12. CALENDÁRIO SEMANAL & GRAVAÇÃO DIRETA NO HACKTOON_DB
// ==========================================
let selectedRoutineDayId = 1; // Segunda-feira

function renderWeeklyRoutine() {
    const db = getDB();
    if (!db || !db.weeklyRoutine) return;

    const grid = document.getElementById('weekRoutineGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayDayOfWeek = new Date().getDay(); // 0 Dom, 1 Seg...

    db.weeklyRoutine.forEach(day => {
        const isToday = (day.dayId === todayDayOfWeek);
        const card = document.createElement('div');
        card.className = `week-day-card ${isToday ? 'active-today' : ''} ${day.restDay ? 'rest-day' : ''}`;
        card.innerHTML = `
            <div class="week-day-header">
                <span class="week-day-short">${day.shortName}</span>
                ${isToday ? '<span class="status-pill" style="font-size: 0.6rem; padding: 2px 6px;">Hoje</span>' : ''}
            </div>
            <div class="week-day-focus">${day.restDay ? '<i class="fa-solid fa-bed"></i> Descanso Ativo' : day.focus}</div>
            <div class="week-day-badge">${day.restDay ? 'Recuperação' : day.targetSets ? `${day.targetSets} Séries` : 'Treino'}</div>
        `;

        card.addEventListener('click', () => {
            selectRoutineDayForEdit(day.dayId);
        });

        grid.appendChild(card);
    });

    selectRoutineDayForEdit(selectedRoutineDayId);
}

function selectRoutineDayForEdit(dayId) {
    const db = getDB();
    if (!db || !db.weeklyRoutine) return;
    const day = db.weeklyRoutine.find(d => d.dayId === dayId);
    if (!day) return;

    selectedRoutineDayId = dayId;
    document.getElementById('editorDayName').textContent = day.dayName;
    document.getElementById('editorDayFocus').value = day.focus;
    document.getElementById('editorDaySets').value = day.targetSets;
    document.getElementById('editorDayRestCheck').checked = day.restDay;
}

function setupRoutineAutoSave() {
    const focusInput = document.getElementById('editorDayFocus');
    const setsInput = document.getElementById('editorDaySets');
    const restCheck = document.getElementById('editorDayRestCheck');

    function saveDay() {
        const db = getDB();
        if (!db || !db.weeklyRoutine) return;
        const day = db.weeklyRoutine.find(d => d.dayId === selectedRoutineDayId);
        if (!day) return;

        day.focus = focusInput.value;
        day.targetSets = Number(setsInput.value) || 0;
        day.restDay = restCheck.checked;

        saveDB(db);
        renderDashboardView();
    }

    if (focusInput) focusInput.addEventListener('input', saveDay);
    if (setsInput) setsInput.addEventListener('input', saveDay);
    if (restCheck) restCheck.addEventListener('change', saveDay);
}

// ==========================================
// 13. SMARTWATCH & SINCRONIZAÇÃO EM TEMPO REAL
// ==========================================
function saveManualSmartwatchData(event) {
    event?.preventDefault();
    const db = getDB();
    if (!db?.user) return;
    const stepsValue = document.getElementById('manualStepsInput').value;
    const activeValue = document.getElementById('manualActiveKcalInput').value;
    const steps = Number(stepsValue);
    const activeKcal = Number(activeValue);
    if (stepsValue === '' || activeValue === '' || !Number.isFinite(steps) || !Number.isFinite(activeKcal) || steps < 0 || activeKcal < 0) {
        showToast('Informe passos e calorias ativas para confirmar os dados de hoje.', 'danger');
        return;
    }
    const todayStr = getTodayStr();
    if (!db.smartwatch) db.smartwatch = { connected: false, dailyData: {} };
    if (!db.smartwatch.dailyData) db.smartwatch.dailyData = {};
    const goalSteps = document.getElementById('goalStepsInput').value;
    const goalActiveKcal = document.getElementById('goalActiveKcalInput').value;
    if (goalSteps !== '') db.smartwatch.goalSteps = Math.max(0, Number(goalSteps));
    if (goalActiveKcal !== '') db.smartwatch.goalActiveKcal = Math.max(0, Number(goalActiveKcal));

    db.smartwatch.dailyData[todayStr] = {
        steps: steps,
        activeKcal: activeKcal,
        confirmed: true,
        updatedAt: new Date().toISOString()
    };

    saveDB(db);
    showToast('Dados manuais do Smartwatch registrados.', 'success');
    renderSmartwatchView();
    renderDashboardView();
}

// ==========================================
// 14. EVOLUÇÃO DE PESO & GRÁFICOS CHART.JS
// ==========================================
let chartCalBalance = null;
let chartMacros = null;
let chartVolume = null;
let chartWeight = null;

function renderCharts(db) {
    if (!db) return;

    // Destrói instâncias anteriores para evitar erro no Chart.js
    if (chartCalBalance) chartCalBalance.destroy();
    if (chartMacros) chartMacros.destroy();
    if (chartVolume) chartVolume.destroy();
    if (chartWeight) chartWeight.destroy();

    const todayStr = getTodayStr();

    // 1. Gráfico de Balanço Calórico (Últimos 7 dias)
    const ctxCal = document.getElementById('chartCaloricBalance');
    if (ctxCal) {
        const last7Dates = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            return getLocalDateTimeParts(date).date;
        });
        const last7Days = last7Dates.map(date => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }));
        const consumedData = last7Dates.map(date => (db.meals || [])
            .filter(meal => (meal.date || meal.mealDate) === date)
            .reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0));
        const targetData = last7Dates.map(() => Number(db.user?.goalCalories) || 0);
        const workoutBurnData = last7Dates.map(date => getEstimatedWorkoutCaloriesForDate(db, date));

        chartCalBalance = new Chart(ctxCal, {
            type: 'bar',
            data: {
                labels: last7Days,
                datasets: [
                    {
                        label: 'Consumidas (kcal)',
                        data: consumedData,
                        backgroundColor: '#ff5500',
                        borderRadius: 6
                    },
                    {
                        label: 'Meta diária (kcal)',
                        data: targetData,
                        backgroundColor: 'rgba(255, 158, 0, 0.35)',
                        borderColor: '#ff9e00',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Gasto estimado do treino (kcal)',
                        data: workoutBurnData,
                        backgroundColor: 'rgba(0, 229, 255, 0.5)',
                        borderColor: '#00e5ff',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#f7f4ef', font: { family: 'Poppins' } } }
                },
                scales: {
                    x: { ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } },
                    y: { ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } }
                }
            }
        });
    }

    // 2. Consumo de macros real versus metas do perfil
    const ctxMacros = document.getElementById('chartMacrosDoughnut');
    if (ctxMacros) {
        const todayMeals = (db.meals || []).filter(m => m.date === todayStr);
        const pTotal = todayMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);
        const cTotal = todayMeals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);
        const fTotal = todayMeals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);

        chartMacros = new Chart(ctxMacros, {
            type: 'bar',
            data: {
                labels: ['Proteínas (g)', 'Carboidratos (g)', 'Gorduras (g)'],
                datasets: [
                    { label: 'Consumo registrado (g)', data: [pTotal, cTotal, fTotal], backgroundColor: ['#ff5500', '#ff9e00', '#00e5ff'], borderRadius: 6 },
                    { label: 'Meta diária (g)', data: [db.user?.goalProtein || 0, db.user?.goalCarbs || 0, db.user?.goalFat || 0], backgroundColor: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.45)', borderWidth: 1, borderRadius: 6 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#f7f4ef', font: { family: 'Poppins' } } }
                },
                scales: {
                    x: { ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } },
                    y: { beginAtZero: true, ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } }
                }
            }
        });
    }

    // 3. Gráfico de Progressão de Volume de Treino
    const ctxVol = document.getElementById('chartVolumeProgression');
    if (ctxVol) {
        const completedWorkouts = (db.workouts || []).filter(w => w.status === 'completed').slice(-8);
        const labels = completedWorkouts.map(w => w.date.split('-').slice(1).join('/'));
        const volumes = completedWorkouts.map(w => {
            const wExecs = (db.executions || []).filter(e => e.workoutId === w.id);
            return wExecs.reduce((acc, e) => acc + (Number(e.totalVolume) || 0), 0);
        });

        chartVolume = new Chart(ctxVol, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Volume Levantado (kg)',
                    data: volumes,
                    borderColor: '#ff5500',
                    backgroundColor: 'rgba(255, 85, 0, 0.15)',
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#ff9e00',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#f7f4ef', font: { family: 'Poppins' } } }
                },
                scales: {
                    x: { ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } },
                    y: { ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } }
                }
            }
        });
    }

    // 4. Gráfico Histórico de Peso vs Meta
    const ctxWeight = document.getElementById('chartWeightHistory');
    if (ctxWeight) {
        const logs = (db.weightLogs || []).slice(-14);
        const labels = logs.map(l => l.date.split('-').slice(1).join('/'));
        const weights = logs.map(l => l.weight);
        const goal = Number(db.user?.goalWeight) || null;
        const goalData = logs.map(() => goal);

        chartWeight = new Chart(ctxWeight, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Peso Atual (kg)',
                        data: weights,
                        borderColor: '#ff9e00',
                        backgroundColor: 'rgba(255, 158, 0, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4
                    },
                    ...(goal ? [{
                        label: `Meta (${goal} kg)`,
                        data: goalData,
                        borderColor: '#00ff88',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }] : [])
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#f7f4ef', font: { family: 'Poppins' } } }
                },
                scales: {
                    x: { ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } },
                    y: { ticks: { color: '#78665c' }, grid: { color: 'rgba(255, 123, 43, 0.08)' } }
                }
            }
        });
    }
}

// ==========================================
// 15. ASSISTENTE GEMINI INTEGRADO COM DISPARO DE AÇÕES
// ==========================================
function appendChatMessage(sender, text, actionData = null, chatBodyId = 'geminiChatMessages') {
    const chatBody = document.getElementById(chatBodyId);
    if (!chatBody) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${sender}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = String(text ?? '');

    if (actionData) {
        const actionCard = document.createElement('div');
        actionCard.className = 'chat-action-card';
        const actionTitle = document.createElement('div');
        const actionIcon = document.createElement('i');
        actionIcon.className = 'fa-solid fa-bolt';
        actionIcon.setAttribute('aria-hidden', 'true');
        actionTitle.append(actionIcon, document.createTextNode(' Ação pronta para executar'));
        actionTitle.style.cssText = 'font-weight:700;font-size:.78rem;color:var(--c-glow-core)';
        const actionLabel = document.createElement('div');
        actionLabel.textContent = actionData.label;
        actionLabel.style.cssText = 'font-size:.8rem;margin-top:.2rem';
        const actionButton = document.createElement('button');
        actionButton.className = 'btn btn-primary chat-action-btn';
        actionButton.type = 'button';
        actionButton.textContent = 'Executar agora no app';
        actionButton.addEventListener('click', () => {
            executeGeminiAction(actionData.type, encodeURIComponent(JSON.stringify(actionData.payload)));
        });
        actionCard.append(actionTitle, actionLabel, actionButton);
        bubble.appendChild(actionCard);
    }

    const time = document.createElement('span');
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    time.style.cssText = `font-size:.65rem;color:var(--c-text-muted);align-self:${sender === 'user' ? 'flex-end' : 'flex-start'}`;
    msgEl.append(bubble, time);
    if (chatBodyId === 'aiHomeConversation' && sender === 'user') {
        document.body.classList.add('ai-chat-active');
    }
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
    requestAnimationFrame(() => {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    });
}

const GEMINI_MODELS = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
const GEMINI_REQUEST_TIMEOUT_MS = 15000;
const geminiConversation = [];
let geminiRequestInProgress = false;
const GEMINI_ACTION_TOOLS = [{ functionDeclarations: [
    { name: 'set_water_goal', description: 'Altera a meta diária de água.', parameters: { type: 'OBJECT', properties: { milliliters: { type: 'NUMBER' } }, required: ['milliliters'] } },
    { name: 'add_water_log', description: 'Registra água que o usuário já consumiu hoje.', parameters: { type: 'OBJECT', properties: { milliliters: { type: 'NUMBER' } }, required: ['milliliters'] } },
    { name: 'set_calorie_goal', description: 'Altera a meta diária de calorias.', parameters: { type: 'OBJECT', properties: { calories: { type: 'NUMBER' } }, required: ['calories'] } },
    { name: 'set_macro_goals', description: 'Altera as metas de macronutrientes.', parameters: { type: 'OBJECT', properties: { protein: { type: 'NUMBER' }, carbs: { type: 'NUMBER' }, fat: { type: 'NUMBER' } }, required: ['protein', 'carbs', 'fat'] } },
    { name: 'log_meal', description: 'Registra um alimento que o usuário afirma já ter consumido. Use um ID existente do catálogo TACO ou dos alimentos próprios e a quantidade em gramas.', parameters: { type: 'OBJECT', properties: { foodId: { type: 'STRING' }, grams: { type: 'NUMBER' }, mealType: { type: 'STRING' } }, required: ['foodId', 'grams', 'mealType'] } }
] }];

const GEMINI_API_KEY = 'AQ.Ab8RN6JmIyBv2hhdD0ud7yRkXnJsgkJaTEMmJuUvhq-8Uqm2fQ';

function getGeminiApiKey() {
    return GEMINI_API_KEY.trim();
}

function buildGeminiSystemInstruction(db) {
    const today = getTodayStr();
    const currentSection = document.querySelector('.view-section.active')?.id?.replace('view-', '') || 'ai-home';
    const mealsToday = (db?.meals || [])
        .filter(meal => meal.date === today)
        .map(meal => ({ name: meal.name || meal.alimentoName, mealType: meal.mealType, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }));
    const recentWeights = (db?.weightLogs || []).slice(-7).map(log => ({ date: log.date, kg: log.weight }));
    const recentExecutions = (db?.executions || []).slice(-10).map(execution => ({
        exercise: execution.exerciseName || execution.exerciseId,
        date: execution.date,
        volume: execution.totalVolume,
        status: execution.comparisonStatus
    }));
    const context = {
        currentSection,
        profile: db?.user ? {
            name: db.user.name,
            objective: db.user.objective,
            weightKg: db.user.weight,
            goalWeightKg: db.user.goalWeight,
            goalCalories: db.user.goalCalories,
            goalWaterMl: db.user.goalWater,
            goalProtein: db.user.goalProtein,
            goalCarbs: db.user.goalCarbs,
            goalFat: db.user.goalFat,
            activity: db.user.activity
        } : null,
        otter: db ? computeOtterScore(db) : null,
        waterTodayMl: db?.waterLogs?.[today] || 0,
        smartwatchToday: db?.smartwatch?.dailyData?.[today]?.confirmed ? db.smartwatch.dailyData[today] : null,
        mealsToday,
        recentWeights,
        recentExecutions
    };

    return `Você é o OTTER AI, assistente de treino e nutrição. Responda em português brasileiro e use somente os dados fornecidos. Se o usuário pedir explicitamente alteração de uma meta ou registro de refeição/água já consumida, use a ferramenta correspondente. Nunca invente quantidades; se faltarem parâmetros, pergunte. Sugestões de receitas são recomendações e não devem ser registradas como consumo. Não diagnostique doenças nem substitua profissionais de saúde. Contexto real atual do app (JSON): ${JSON.stringify(context)}`;
}

async function processGeminiCommand(promptText, chatBodyId = 'geminiChatMessages') {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        appendChatMessage('gemini', 'O Gemini ainda não foi configurado. Preencha GEMINI_API_KEY no arquivo app.js.', null, chatBodyId);
        return;
    }
    if (geminiRequestInProgress) {
        appendChatMessage('gemini', 'Aguarde a resposta atual antes de enviar outra mensagem.', null, chatBodyId);
        return;
    }

    const db = getDB();
    geminiConversation.push({ role: 'user', parts: [{ text: promptText }] });
    const recentConversation = geminiConversation.slice(-12);
    geminiRequestInProgress = true;
    const chatBody = document.getElementById(chatBodyId);
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chat-msg gemini gemini-loading';
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble';
    loadingBubble.textContent = 'Gemini está pensando…';
    loadingMessage.appendChild(loadingBubble);
    chatBody?.appendChild(loadingMessage);
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

    try {
        let result;
        for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
            const model = GEMINI_MODELS[modelIndex];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);
            let response;
            try {
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: buildGeminiSystemInstruction(db) }] },
                        contents: recentConversation,
                        tools: GEMINI_ACTION_TOOLS,
                        generationConfig: { temperature: 0.65, maxOutputTokens: 900 }
                    }),
                    signal: controller.signal
                });
                result = await response.json();
            } catch (error) {
                const hasFallback = modelIndex < GEMINI_MODELS.length - 1;
                if (error.name !== 'AbortError' || !hasFallback) {
                    if (error.name === 'AbortError') {
                        throw new Error(`O Gemini não respondeu em ${GEMINI_REQUEST_TIMEOUT_MS / 1000} segundos.`);
                    }
                    throw error;
                }

                loadingBubble.textContent = 'Uma versão demorou; tentando outra…';
                console.warn(`Gemini ${model} excedeu o tempo limite; tentando ${GEMINI_MODELS[modelIndex + 1]}.`);
                continue;
            } finally {
                clearTimeout(timeoutId);
            }

            if (response.ok) break;

            const apiStatus = result?.error?.status;
            const retryable = [429, 500, 502, 503, 504].includes(response.status)
                || ['RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'INTERNAL', 'OVERLOADED'].includes(apiStatus);
            const hasFallback = modelIndex < GEMINI_MODELS.length - 1;
            if (!retryable) {
                throw new Error(result?.error?.message || `A API respondeu com HTTP ${response.status}.`);
            }
            if (!hasFallback) {
                throw new Error('Os modelos do Gemini estão com alta demanda. Aguarde alguns segundos e tente novamente.');
            }

            loadingBubble.textContent = 'Modelo ocupado; tentando a versão anterior…';
            console.warn(`Gemini ${model} ocupado; tentando ${GEMINI_MODELS[modelIndex + 1]}.`);
        }

        const modelParts = result.candidates?.[0]?.content?.parts || [];
        const functionCall = modelParts.find(part => part.functionCall)?.functionCall;
        const reply = modelParts.map(part => part.text || '').join('').trim();
        if (functionCall) {
            const actionData = makeGeminiActionProposal(functionCall.name, functionCall.args || {});
            if (!actionData) throw new Error('A ação sugerida contém valores inválidos ou não permitidos.');
            const actionReply = reply || 'Posso aplicar esta alteração. Confirme antes de salvar.';
            geminiConversation.push({ role: 'model', parts: [{ text: actionReply }] });
            appendChatMessage('gemini', actionReply, actionData, chatBodyId);
        } else {
            if (!reply) throw new Error('O Gemini não retornou texto. Tente reformular a pergunta.');
            geminiConversation.push({ role: 'model', parts: [{ text: reply }] });
            appendChatMessage('gemini', reply, null, chatBodyId);
        }
    } catch (error) {
        geminiConversation.pop();
        console.error('Falha ao consultar Gemini:', error);
        appendChatMessage('gemini', `Não consegui consultar o Gemini. ${error.message} Confira a chave, o modelo e a conexão.`, null, chatBodyId);
    } finally {
        loadingMessage.remove();
        geminiRequestInProgress = false;
    }
}

function executeGeminiAction(type, encodedPayload) {
    const payload = JSON.parse(decodeURIComponent(encodedPayload));
    const db = getDB();
    if (!db?.user) return;
    const numericValues = Object.values(payload).filter(value => typeof value === 'number');
    if (numericValues.some(value => !Number.isFinite(value) || value < 0)) {
        showToast('Valores inválidos. Nenhuma alteração foi aplicada.', 'danger');
        return;
    }
    if (type === 'set_water_goal') db.user.goalWater = Math.round(payload.milliliters);
    else if (type === 'add_water_log') {
        addWaterMl(payload.milliliters);
        return;
    } else if (type === 'set_calorie_goal') db.user.goalCalories = Math.round(payload.calories);
    else if (type === 'set_macro_goals') {
        db.user.goalProtein = Math.round(payload.protein);
        db.user.goalCarbs = Math.round(payload.carbs);
        db.user.goalFat = Math.round(payload.fat);
    } else if (type === 'log_meal') {
        const food = getFoodById(String(payload.foodId || ''), db);
        const grams = Number(payload.grams);
        if (!food || !Number.isFinite(grams) || grams <= 0 || !String(payload.mealType || '').trim()) {
            return showToast('Alimento, quantidade e tipo de refeição são necessários.', 'danger');
        }
        const factor = grams / 100;
        const loggedTime = getLocalDateTimeParts().time;
        db.meals.push({
            id: generateId('meal'), foodId: food.id, foodSource: food.source,
            alimentoId: food.id, name: food.name, alimentoName: food.name, foodNameSnapshot: food.name,
            foodMacrosPer100gSnapshot: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat },
            grams, date: getTodayStr(), mealDate: getTodayStr(),
            time: loggedTime, mealTime: loggedTime,
            mealType: String(payload.mealType).slice(0, 40),
            calories: Math.round(food.calories * factor), protein: Number((food.protein * factor).toFixed(1)),
            carbs: Number((food.carbs * factor).toFixed(1)), fat: Number((food.fat * factor).toFixed(1))
        });
    } else {
        showToast('Ação não reconhecida; nenhum dado foi alterado.', 'danger');
        return;
    }
    saveDB(db);
    renderDietView();
    renderDashboardView();
    renderProfileView();
    showToast('Ação confirmada e salva no HACKTOON_DB.', 'success');
}

function makeGeminiActionProposal(name, args) {
    const labels = {
        set_water_goal: `Definir meta diária de água: ${Math.round(args.milliliters || 0)} ml`,
        add_water_log: `Registrar ${Math.round(args.milliliters || 0)} ml de água já consumida`,
        set_calorie_goal: `Definir meta diária de calorias: ${Math.round(args.calories || 0)} kcal`,
        set_macro_goals: `Definir macros: ${Math.round(args.protein || 0)}g proteína, ${Math.round(args.carbs || 0)}g carboidratos e ${Math.round(args.fat || 0)}g gorduras`,
        log_meal: `Registrar ${Math.round(args.grams || 0)} g do alimento ${String(args.foodId || '')} em ${String(args.mealType || 'refeição')}`
    };
    if (!labels[name]) return null;
    if (name === 'log_meal' && (!String(args.foodId || '').trim() || !String(args.mealType || '').trim() || !(Number(args.grams) > 0))) return null;
    return { type: name, label: labels[name], payload: args };
}

function askGeminiQuick(text) {
    appendChatMessage('user', text);
    processGeminiCommand(text);
}

// ==========================================
// 16. RENDERIZAÇÃO DAS VIEWS DO SPA
// ==========================================
function renderDashboardView() {
    const db = getDB();
    if (!db || !db.user) return;

    const user = db.user;
    const todayStr = getTodayStr();
    const otter = computeOtterScore(db);

    // Topbar
    const topOtter = document.getElementById('topOtterScore');
    const topStreak = document.getElementById('topStreakDays');
    const topWatch = document.getElementById('topWatchStatus');
    if (topOtter) topOtter.textContent = otter.score;
    if (topStreak) topStreak.textContent = otter.streak;
    if (topWatch) topWatch.textContent = db.smartwatch?.dailyData?.[todayStr]?.confirmed ? 'Dados registrados' : 'Sem registro de hoje';

    // Sidebar
    const sideName = document.getElementById('sidebarUserName');
    const sideGoal = document.getElementById('sidebarUserGoal');
    const sideInitials = document.getElementById('sidebarUserInitials');
    if (sideName) sideName.textContent = user.name;
    if (sideGoal) sideGoal.textContent = `${user.objective || 'Objetivo não definido'} • ${user.weight}kg`;
    if (sideInitials) {
        const parts = user.name.split(' ');
        sideInitials.textContent = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }

    // Dashboard Hero
    const dashOtter = document.getElementById('dashOtterScore');
    const dashStreak = document.getElementById('dashStreakBadge');
    const otterMeter = document.getElementById('otterCircleMeter');
    const greeting = document.getElementById('dashGreeting');
    if (dashOtter) dashOtter.textContent = otter.score;
    if (dashStreak) dashStreak.innerHTML = `<i class="fa-solid fa-fire"></i> ${otter.streak} ${otter.streak === 1 ? 'dia' : 'dias'}`;
    if (greeting) greeting.textContent = `Olá, ${user.name.split(' ')[0]}!`;

    // Anima o círculo do Score OTTER (circunferência = 440)
    if (otterMeter) {
        const offset = 440 - (440 * (otter.score / 100));
        otterMeter.style.strokeDashoffset = offset;
    }

    // Dynamic Insight
    const insightBox = document.getElementById('dashDynamicInsight');
    if (insightBox) insightBox.textContent = generateDynamicInsight(db);

    // Balanço Calórico Hoje (consumo + gasto estimado do treino)
    const todayMeals = (db.meals || []).filter(m => m.date === todayStr);
    const consumedKcal = todayMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
    const workoutBurn = getEstimatedWorkoutCaloriesForDate(db, todayStr);
    const baseGoal = Number(user.goalCalories) || 0;
    const adjustedBalance = (consumedKcal - baseGoal) - workoutBurn;

    const calBalanceEl = document.getElementById('dashCalBalance');
    const calSubEl = document.getElementById('dashCalSub');
    if (calBalanceEl) {
        calBalanceEl.innerHTML = todayMeals.length || workoutBurn > 0 ? `${adjustedBalance > 0 ? '+' : ''}${Math.round(adjustedBalance)} <span class="stat-unit">kcal</span>` : 'Sem registros';
        calBalanceEl.style.color = adjustedBalance > 0 ? 'var(--c-sunbeam)' : '#00e5ff';
    }
    if (calSubEl) {
        calSubEl.textContent = todayMeals.length || workoutBurn > 0
            ? `Consumidas: ${consumedKcal.toLocaleString('pt-BR')} kcal · Meta: ${baseGoal.toLocaleString('pt-BR')} kcal · Gasto estimado: ${workoutBurn.toLocaleString('pt-BR')} kcal`
            : 'Registre uma refeição para iniciar o saldo.';
    }
    const calBar = document.getElementById('dashCalBar');
    if (calBar) {
        const pct = baseGoal ? Math.min(100, Math.round((consumedKcal / baseGoal) * 100)) : 0;
        calBar.style.width = `${pct}%`;
    }

    // Volume Acumulado
    const weeklyVol = (db.executions || []).filter(execution => execution.date === todayStr || (db.workouts || []).some(workout => workout.id === execution.workoutId && workout.date === todayStr)).reduce((acc, e) => acc + (Number(e.totalVolume) || 0), 0);
    const weeklyVolEl = document.getElementById('dashWeeklyVolume');
    if (weeklyVolEl) weeklyVolEl.innerHTML = `${weeklyVol.toLocaleString('pt-BR')} <span class="stat-unit">kg</span>`;
    const progression = document.getElementById('dashProgressionBadge');
    if (progression) progression.textContent = weeklyVol ? `${(db.executions || []).filter(e => e.comparisonStatus === 'Evoluindo').length} em evolução` : 'Sem execuções';
    const volumeBar = document.getElementById('dashVolumeBar');
    if (volumeBar) volumeBar.style.width = weeklyVol ? '100%' : '0%';

    // Hidratação
    const todayWater = Number(db.waterLogs?.[todayStr]) || 0;
    const waterGoal = Number(user.goalWater) || 0;
    const waterEl = document.getElementById('dashWaterVal');
    const waterBar = document.getElementById('dashWaterBar');
    if (waterEl) waterEl.innerHTML = `${todayWater.toLocaleString()} <span class="stat-unit">/ ${waterGoal.toLocaleString()} ml</span>`;
    if (waterBar) {
        const pct = waterGoal ? Math.min(100, Math.round((todayWater / waterGoal) * 100)) : 0;
        waterBar.style.width = `${pct}%`;
    }
    const waterSub = document.getElementById('dashWaterSub');
    if (waterSub) waterSub.textContent = todayWater ? `${waterGoal ? Math.round(todayWater / waterGoal * 100) : 0}% da meta` : 'Nenhuma ingestão registrada.';

    // Smartwatch Passos
    const watchToday = db.smartwatch?.dailyData?.[todayStr];
    const steps = watchToday?.confirmed ? Number(watchToday.steps) : null;
    const stepsEl = document.getElementById('dashStepsVal');
    const stepsBar = document.getElementById('dashStepsBar');
    if (stepsEl) stepsEl.innerHTML = steps === null ? 'Sem registro de hoje' : `${steps.toLocaleString('pt-BR')} <span class="stat-unit">passos</span>`;
    const activeSub = document.getElementById('dashActiveKcalSub');
    if (activeSub) activeSub.textContent = watchToday?.confirmed ? `${watchToday.activeKcal.toLocaleString('pt-BR')} kcal ativas` : 'Clique para inserir dados de hoje.';
    if (stepsBar) {
        const pct = steps !== null && Number(db.smartwatch?.goalSteps) ? Math.min(100, Math.round((steps / db.smartwatch.goalSteps) * 100)) : 0;
        stepsBar.style.width = `${pct}%`;
    }

    // Foco de Hoje
    const todayDayOfWeek = new Date().getDay();
    const todayRoutine = (db.weeklyRoutine || []).find(d => d.dayId === todayDayOfWeek);
    if (todayRoutine) {
        document.getElementById('dashTodayFocus').textContent = todayRoutine.restDay ? 'Dia de descanso' : todayRoutine.focus;
        document.getElementById('dashTodayRoutineMeta').textContent = todayRoutine.restDay ? 'Sem treino programado para hoje.' : 'Foco do calendário semanal.';
    }

    // Re-renderiza gráficos Chart.js
    renderCharts(db);
}

function renderWorkoutsView() {
    const db = getDB();
    if (!db) return;

    const list = document.getElementById('workoutExercisesList');
    if (!list) return;
    list.innerHTML = '';

    const exercises = getExercisesForToday(db);
    const today = getTodayStr();
    const routine = (db.weeklyRoutine || []).find(day => day.dayId === new Date().getDay());
    const banner = document.getElementById('workoutBannerTitle');
    if (banner) banner.textContent = routine?.focus || 'Sem treino programado';
    const stats = document.getElementById('workoutBannerStats');
    const todayVolume = (db.executions || []).filter(execution => execution.date === today).reduce((sum, execution) => sum + (Number(execution.totalVolume) || 0), 0);
    if (stats) stats.textContent = `${exercises.length} exercício(s) disponível(is) · Volume registrado hoje: ${todayVolume.toLocaleString('pt-BR')} kg`;
    if (!exercises.length) {
        list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-day"></i><p>Sem exercícios da biblioteca associados ao foco de hoje. Ajuste o foco no calendário semanal.</p></div>';
        return;
    }

    exercises.forEach(ex => {
        const exec = (db.executions || []).find(e => e.exerciseId === ex.id && e.date === today);
        const vol = Number(exec?.totalVolume) || 0;
        const hardSets = Number(exec?.hardSetsCount) || 0;
        const status = exec?.comparisonStatus || 'Sem registro';

        let badgeClass = status === 'Sem registro' || status === 'Sem histórico' ? 'stagnant' : 'evolving';
        let badgeIcon = status === 'Sem registro' || status === 'Sem histórico' ? 'fa-minus' : 'fa-arrow-trend-up';
        if (status === 'Estagnado') { badgeClass = 'stagnant'; badgeIcon = 'fa-arrow-right'; }
        if (status === 'Regredindo') { badgeClass = 'regressing'; badgeIcon = 'fa-arrow-trend-down'; }

        const div = document.createElement('div');
        div.className = 'card';
        div.style.background = 'rgba(22, 4, 0, 0.6)';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.1rem; color: var(--c-white);">${ex.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--c-text-muted);">${ex.muscle} • ${ex.equipment}</p>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem; font-size: 0.78rem;">
                        <span class="status-pill"><i class="fa-solid fa-layer-group"></i> ${exec?.sets?.length || 0} Séries registradas</span>
                        <span class="status-pill"><i class="fa-solid fa-weight-hanging"></i> ${vol.toLocaleString('pt-BR')} kg Volume</span>
                        <span class="status-pill"><i class="fa-solid fa-fire"></i> ${hardSets} Hard Sets</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span class="progression-badge ${badgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${status}</span>
                    <button class="btn btn-secondary" onclick="openInTrainingModal('${ex.id}')">
                        <i class="fa-solid fa-play"></i> Treinar
                    </button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function renderDietView() {
    const db = getDB();
    if (!db) return;
    ensureDietCollections(db);
    renderCustomFoods();

    const todayStr = getTodayStr();
    const historyDate = document.getElementById('mealHistoryDate');
    if (historyDate && !historyDate.value) historyDate.value = todayStr;
    if (historyDate) historyDate.max = todayStr;
    const mealDateInput = document.getElementById('mealDateInput');
    if (mealDateInput) {
        if (!mealDateInput.value) mealDateInput.value = todayStr;
        mealDateInput.max = getTodayStr();
    }
    const mealTimeInput = document.getElementById('mealTimeInput');
    if (mealTimeInput && !mealTimeInput.value) mealTimeInput.value = getLocalDateTimeParts().time;
    const selectedDate = historyDate?.value || todayStr;
    const heading = document.getElementById('mealHistoryHeading');
    if (heading) heading.textContent = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR');
    const todayMeals = (db.meals || []).filter(m => (m.date || m.mealDate) === selectedDate).sort((a, b) => String(a.time || a.mealTime || '').localeCompare(String(b.time || b.mealTime || '')));

    const totalCals = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    const totalP = Number(todayMeals.reduce((acc, m) => acc + m.protein, 0).toFixed(1));
    const totalC = Number(todayMeals.reduce((acc, m) => acc + m.carbs, 0).toFixed(1));
    const totalF = Number(todayMeals.reduce((acc, m) => acc + m.fat, 0).toFixed(1));

    const user = db.user || {};
    const totalsEl = document.getElementById('dietTodayTotals');
    if (totalsEl) totalsEl.textContent = todayMeals.length
        ? `Real: ${totalCals} kcal · P ${totalP}g · C ${totalC}g · G ${totalF}g | Metas: ${user.goalCalories || 0} kcal · P ${user.goalProtein || 0}g · C ${user.goalCarbs || 0}g · G ${user.goalFat || 0}g`
        : `Sem consumo registrado · Metas: ${user.goalCalories || 0} kcal · P ${user.goalProtein || 0}g · C ${user.goalCarbs || 0}g · G ${user.goalFat || 0}g`;

    // Ingestão de Água
    const todayWater = Number(db.waterLogs?.[todayStr]) || 0;
    const waterTitle = document.getElementById('dietWaterTitle');
    if (waterTitle) {
        waterTitle.textContent = `${todayWater.toLocaleString('pt-BR')} ml / ${(user.goalWater || 0).toLocaleString('pt-BR')} ml consumidos hoje`;
    }

    // Agrupa por tipo de refeição
    const container = document.getElementById('todayMealsContainer');
    if (!container) return;
    container.innerHTML = '';

    const mealTypes = [...new Set(todayMeals.map(meal => meal.mealType || 'Outra'))];
    if (!todayMeals.length) container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-utensils"></i><p>Nenhuma refeição registrada hoje.</p></div>';

    mealTypes.forEach(type => {
        const typeMeals = todayMeals.filter(m => m.mealType === type);
        if (typeMeals.length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.style.background = 'rgba(22, 4, 0, 0.6)';
        groupDiv.style.border = 'var(--border-subtle)';
        groupDiv.style.borderRadius = 'var(--radius-md)';
        groupDiv.style.padding = '1rem';

        const rowsHtml = typeMeals.map(m => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid rgba(255, 123, 43, 0.08);">
                <div>
                    <strong style="color: var(--c-cream); font-size: 0.9rem;">${escapeHtml(m.foodNameSnapshot || m.name || m.alimentoName || 'Refeição')}</strong>
                    <span class="meal-entry-meta">${Number(m.grams) || 0} g · ${escapeHtml(m.time || m.mealTime || 'Horário não informado')}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 0.8rem; font-weight: 700;">
                        <span style="color: var(--c-sunbeam);">${m.calories} kcal</span>
                        <span style="color: var(--c-text-muted); margin-left: 0.4rem;">(P: ${m.protein}g C: ${m.carbs}g G: ${m.fat}g)</span>
                    </div>
                    <button class="btn-icon" style="width: 26px; height: 26px; font-size: 0.7rem;" onclick="editMealItem('${m.id}')" title="Editar refeição"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon" style="width: 26px; height: 26px; font-size: 0.7rem;" onclick="removeMealItem('${m.id}')" title="Excluir refeição">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        groupDiv.innerHTML = `
            <h4 style="font-size: 0.95rem; color: var(--c-glow-core); margin-bottom: 0.5rem;"><i class="fa-solid fa-utensils"></i> ${escapeHtml(type)}</h4>
            <div>${rowsHtml}</div>
        `;
        container.appendChild(groupDiv);
    });
    renderRecipeSuggestions(db, totalCals, totalP, totalC, totalF);
}

function editMealItem(mealId) {
    const db = getDB();
    const meal = db?.meals?.find(item => item.id === mealId);
    if (!meal) return;
    const grams = Number(prompt('Quantidade consumida (g):', meal.grams || 100));
    if (!Number.isFinite(grams) || grams <= 0) return showToast('Quantidade inválida; a refeição não foi alterada.', 'danger');
    const date = prompt('Data (AAAA-MM-DD):', meal.date || meal.mealDate || getTodayStr());
    if (date === null) return;
    const time = prompt('Horário (HH:MM):', meal.time || meal.mealTime || '12:00');
    if (time === null) return;
    const mealType = prompt('Tipo de refeição:', meal.mealType || 'Outra');
    if (mealType === null) return;
    if (!isValidISODate(date) || date > getTodayStr() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !mealType.trim()) {
        return showToast('Data, horário ou tipo inválido; a refeição não foi alterada.', 'danger');
    }
    meal.grams = grams;
    meal.date = date;
    meal.mealDate = date;
    meal.time = time;
    meal.mealTime = time;
    meal.mealType = mealType.trim();
    if (meal.foodMacrosPer100gSnapshot) {
        const factor = grams / 100;
        const macros = meal.foodMacrosPer100gSnapshot;
        meal.calories = Math.round(macros.calories * factor);
        meal.protein = Number((macros.protein * factor).toFixed(1));
        meal.carbs = Number((macros.carbs * factor).toFixed(1));
        meal.fat = Number((macros.fat * factor).toFixed(1));
    }
    saveDB(db);
    document.getElementById('mealHistoryDate').value = date;
    renderDietView();
    renderDashboardView();
}

let selectedMealFood = null;
let editingCustomFoodId = null;

function ensureDietCollections(db = getDB()) {
    if (!db) return null;
    let changed = false;
    if (!Array.isArray(db.customFoods)) { db.customFoods = []; changed = true; }
    if (!Array.isArray(db.meals)) db.meals = [];
    if (changed) saveDB(db);
    return db;
}

function getFoodById(foodId, db = getDB()) {
    if (!foodId) return null;
    const customFood = (db?.customFoods || []).find(food => food.id === foodId);
    if (customFood) return { ...customFood, source: 'custom' };
    const tacoFood = (window.TACO_DATABASE || []).find(food => food.id === foodId);
    return tacoFood ? { ...tacoFood, source: 'taco' } : null;
}

function renderCustomFoods() {
    const db = ensureDietCollections();
    const list = document.getElementById('customFoodsList');
    if (!db || !list) return;
    list.replaceChildren();
    if (!db.customFoods.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Você ainda não cadastrou alimentos próprios.';
        list.appendChild(empty);
        return;
    }
    db.customFoods.forEach(food => {
        const row = document.createElement('article');
        row.className = 'custom-food-row';
        const info = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = food.name;
        const macros = document.createElement('span');
        macros.textContent = `${food.calories} kcal · P ${food.protein} g · C ${food.carbs} g · G ${food.fat} g por 100 g`;
        info.append(name, macros);
        const actions = document.createElement('div');
        actions.className = 'custom-food-row-actions';
        const edit = document.createElement('button');
        edit.type = 'button'; edit.className = 'btn-icon'; edit.title = 'Editar alimento';
        edit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        edit.addEventListener('click', () => editCustomFood(food.id));
        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'btn-icon'; remove.title = 'Excluir alimento';
        remove.innerHTML = '<i class="fa-solid fa-trash"></i>';
        remove.addEventListener('click', () => deleteCustomFood(food.id));
        actions.append(edit, remove);
        row.append(info, actions);
        list.appendChild(row);
    });
}

function resetCustomFoodForm() {
    editingCustomFoodId = null;
    document.getElementById('customFoodForm')?.reset();
    document.getElementById('customFoodSubmit').innerHTML = '<i class="fa-solid fa-plus"></i> Cadastrar alimento';
    document.getElementById('customFoodCancel').hidden = true;
}

function saveCustomFood(event) {
    event.preventDefault();
    const db = ensureDietCollections();
    if (!db) return;
    const name = document.getElementById('customFoodName').value.trim();
    const macros = {
        calories: Number(document.getElementById('customFoodCalories').value),
        protein: Number(document.getElementById('customFoodProtein').value),
        carbs: Number(document.getElementById('customFoodCarbs').value),
        fat: Number(document.getElementById('customFoodFat').value)
    };
    if (!name) return showToast('Informe o nome do alimento.', 'danger');
    if (['customFoodCalories', 'customFoodProtein', 'customFoodCarbs', 'customFoodFat'].some(id => document.getElementById(id).value === '')) {
        return showToast('Preencha os quatro valores nutricionais por 100 g.', 'danger');
    }
    if (Object.values(macros).some(value => !Number.isFinite(value) || value < 0)) {
        return showToast('Macros por 100 g devem ser valores válidos e não negativos.', 'danger');
    }
    const duplicate = db.customFoods.find(food => food.id !== editingCustomFoodId && food.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    if (duplicate) return showToast('Já existe um alimento próprio com esse nome.', 'danger');

    if (editingCustomFoodId) {
        const food = db.customFoods.find(item => item.id === editingCustomFoodId);
        if (!food) return resetCustomFoodForm();
        Object.assign(food, { name, ...macros, updatedAt: new Date().toISOString() });
    } else {
        db.customFoods.push({ id: generateId('food'), name, ...macros, createdAt: new Date().toISOString() });
    }
    saveDB(db);
    resetCustomFoodForm();
    renderCustomFoods();
    renderMealFoodDropdown();
    showToast('Alimento próprio salvo. Refeições existentes mantêm seus macros originais.', 'success');
}

function editCustomFood(foodId) {
    const db = ensureDietCollections();
    const food = db?.customFoods.find(item => item.id === foodId);
    if (!food) return;
    editingCustomFoodId = foodId;
    document.getElementById('customFoodName').value = food.name;
    document.getElementById('customFoodCalories').value = food.calories;
    document.getElementById('customFoodProtein').value = food.protein;
    document.getElementById('customFoodCarbs').value = food.carbs;
    document.getElementById('customFoodFat').value = food.fat;
    document.getElementById('customFoodSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar alterações';
    document.getElementById('customFoodCancel').hidden = false;
    document.getElementById('customFoodName').focus();
}

function deleteCustomFood(foodId) {
    const db = ensureDietCollections();
    if (!db) return;
    db.customFoods = db.customFoods.filter(food => food.id !== foodId);
    saveDB(db);
    if (editingCustomFoodId === foodId) resetCustomFoodForm();
    renderCustomFoods();
    renderMealFoodDropdown();
    showToast('Alimento excluído do catálogo. Refeições anteriores preservam seus snapshots.', 'info');
}

function renderSelectedMealFoodPreview(food = selectedMealFood) {
    const preview = document.getElementById('selectedFoodPreview');
    if (!preview) return;
    if (!food) {
        preview.hidden = true;
        preview.textContent = '';
        return;
    }
    const grams = Number(document.getElementById('mealGramsInput').value) || 0;
    const factor = grams / 100;
    preview.hidden = false;
    preview.textContent = `${food.name} · ${grams || '—'} g · ${Math.round(food.calories * factor)} kcal · P ${Number((food.protein * factor).toFixed(1))} g · C ${Number((food.carbs * factor).toFixed(1))} g · G ${Number((food.fat * factor).toFixed(1))} g (estimado pela porção)`;
}

function renderMealFoodDropdown(query = '') {
    const dropdown = document.getElementById('mealFoodDropdown');
    const db = ensureDietCollections();
    if (!dropdown || !db) return;
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const foods = [
        ...(window.TACO_DATABASE || []).map(food => ({ ...food, source: 'taco' })),
        ...db.customFoods.map(food => ({ ...food, source: 'custom' }))
    ].filter(food => !normalizedQuery || food.name.toLocaleLowerCase().includes(normalizedQuery));
    dropdown.replaceChildren();
    foods.slice(0, 12).forEach(food => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'taco-dropdown-item';
        option.innerHTML = `<span>${escapeHtml(food.name)} <small>${food.source === 'taco' ? 'TACO' : 'Meu alimento'}</small></span><span class="taco-macro-tags">${food.calories} kcal · P ${food.protein} · C ${food.carbs} · G ${food.fat}</span>`;
        option.addEventListener('click', () => {
            selectedMealFood = { ...food };
            document.getElementById('mealFoodSearch').value = food.name;
            dropdown.classList.remove('open');
            renderSelectedMealFoodPreview();
        });
        dropdown.appendChild(option);
    });
    if (!foods.length) {
        const empty = document.createElement('div');
        empty.className = 'taco-dropdown-item';
        empty.textContent = 'Nenhum alimento encontrado. Cadastre-o em Meus alimentos.';
        dropdown.appendChild(empty);
    }
    dropdown.classList.add('open');
}

function setupMealFoodPicker() {
    const search = document.getElementById('mealFoodSearch');
    if (!search) return;
    search.addEventListener('focus', () => renderMealFoodDropdown(search.value));
    search.addEventListener('input', () => {
        selectedMealFood = null;
        renderSelectedMealFoodPreview(null);
        renderMealFoodDropdown(search.value);
    });
    document.getElementById('mealGramsInput')?.addEventListener('input', () => renderSelectedMealFoodPreview());
    document.addEventListener('click', event => {
        if (!event.target.closest('.food-search-group')) document.getElementById('mealFoodDropdown')?.classList.remove('open');
    });
}

function registerMeal(event) {
    event.preventDefault();
    const db = ensureDietCollections();
    const grams = Number(document.getElementById('mealGramsInput').value);
    const date = document.getElementById('mealDateInput').value;
    const time = document.getElementById('mealTimeInput').value;
    const mealType = document.getElementById('mealTypeSelect').value;
    if (!selectedMealFood) return showToast('Selecione um alimento do catálogo TACO ou dos seus alimentos.', 'danger');
    const currentFood = getFoodById(selectedMealFood.id, db);
    if (!currentFood) return showToast('Esse alimento não existe mais no catálogo. Selecione outro.', 'danger');
    selectedMealFood = currentFood;
    if (!Number.isFinite(grams) || grams <= 0) return showToast('A quantidade deve ser maior que zero.', 'danger');
    if (!isValidISODate(date) || date > getTodayStr()) return showToast('Informe uma data válida, que não seja futura.', 'danger');
    if (!time || !mealType) return showToast('Informe o tipo e o horário da refeição.', 'danger');

    const factor = grams / 100;
    db.meals.push({
        id: generateId('meal'), foodId: selectedMealFood.id, foodSource: selectedMealFood.source,
        alimentoId: selectedMealFood.id, name: selectedMealFood.name, alimentoName: selectedMealFood.name,
        foodNameSnapshot: selectedMealFood.name,
        foodMacrosPer100gSnapshot: {
            calories: Number(selectedMealFood.calories), protein: Number(selectedMealFood.protein),
            carbs: Number(selectedMealFood.carbs), fat: Number(selectedMealFood.fat)
        },
        grams, date, mealDate: date, time, mealTime: time, mealType,
        calories: Math.round(selectedMealFood.calories * factor),
        protein: Number((selectedMealFood.protein * factor).toFixed(1)),
        carbs: Number((selectedMealFood.carbs * factor).toFixed(1)),
        fat: Number((selectedMealFood.fat * factor).toFixed(1))
    });
    saveDB(db);
    event.target.reset();
    selectedMealFood = null;
    renderSelectedMealFoodPreview(null);
    renderDietView();
    renderDashboardView();
    showToast('Refeição registrada com alimento, quantidade, data e horário.', 'success');
}

const RECIPE_IDEAS = [
    { title: 'Omelete de claras e legumes', objective: ['hipertrofia', 'emagrecimento', 'fortalecimento'], calories: 320, protein: 32, carbs: 18, fat: 12, description: 'Opção proteica e rápida.' },
    { title: 'Iogurte com aveia e fruta', objective: ['condicionamento', 'ganhar_peso', 'hipertrofia'], calories: 390, protein: 24, carbs: 55, fat: 9, description: 'Lanche com carboidratos e proteína.' },
    { title: 'Bowl de frango, arroz e vegetais', objective: ['hipertrofia', 'fortalecimento', 'condicionamento'], calories: 520, protein: 42, carbs: 62, fat: 11, description: 'Refeição completa para recuperação.' },
    { title: 'Salada de atum e grão-de-bico', objective: ['emagrecimento', 'condicionamento'], calories: 410, protein: 35, carbs: 38, fat: 13, description: 'Boa proteína com fibras.' },
    { title: 'Vitamina de banana, leite e aveia', objective: ['ganhar_peso', 'hipertrofia'], calories: 480, protein: 26, carbs: 72, fat: 12, description: 'Mais energia em uma preparação prática.' },
    { title: 'Tofu salteado com legumes e quinoa', objective: ['fortalecimento', 'condicionamento', 'emagrecimento'], calories: 430, protein: 25, carbs: 48, fat: 16, description: 'Alternativa vegetal equilibrada.' }
];

function renderRecipeSuggestions(db, eatenCalories, eatenProtein, eatenCarbs, eatenFat) {
    const container = document.getElementById('recipeSuggestions');
    if (!container) return;
    const user = db.user || {};
    const candidates = RECIPE_IDEAS.filter(recipe => recipe.objective.includes(user.objective));
    if (!candidates.length) {
        container.textContent = 'Escolha um objetivo no perfil para personalizar as sugestões.';
        return;
    }
    const remaining = {
        calories: Math.max(0, (user.goalCalories || 0) - eatenCalories),
        protein: Math.max(0, (user.goalProtein || 0) - eatenProtein),
        carbs: Math.max(0, (user.goalCarbs || 0) - eatenCarbs),
        fat: Math.max(0, (user.goalFat || 0) - eatenFat)
    };
    const suggested = [...candidates].sort((a, b) =>
        Math.abs(a.calories - remaining.calories) - Math.abs(b.calories - remaining.calories)
    ).slice(0, 3);
    container.innerHTML = '';
    suggested.forEach(recipe => {
        const card = document.createElement('article');
        card.className = 'recipe-suggestion';
        const heading = document.createElement('h3'); heading.textContent = recipe.title;
        const desc = document.createElement('p'); desc.textContent = recipe.description;
        const macros = document.createElement('p'); macros.className = 'recipe-macros';
        macros.textContent = `${recipe.calories} kcal · P ${recipe.protein}g · C ${recipe.carbs}g · G ${recipe.fat}g`;
        const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-secondary'; button.textContent = 'Explorar com Gemini';
        button.addEventListener('click', () => {
            switchView('ai-home');
            const prompt = document.getElementById('aiHomePrompt');
            prompt.value = `Sugira uma receita semelhante a ${recipe.title} para meu objetivo, ajustando aos macros que ainda faltam hoje. Os valores mostrados são estimativas e não devem ser registrados automaticamente.`;
            document.getElementById('aiHomeForm').requestSubmit();
        });
        card.append(heading, desc, macros, button);
        container.appendChild(card);
    });
}

function renderSmartwatchView() {
    const db = getDB();
    if (!db) return;
    const todayStr = getTodayStr();
    const watch = db.smartwatch || {};
    const today = watch.dailyData?.[todayStr];
    document.getElementById('watchDeviceName').textContent = 'Entrada manual';
    document.getElementById('watchStepsDisplay').textContent = today?.confirmed ? Number(today.steps).toLocaleString('pt-BR') : 'Sem registro de hoje';
    document.getElementById('watchActiveKcalDisplay').textContent = today?.confirmed ? `${Number(today.activeKcal).toLocaleString('pt-BR')} kcal` : 'Sem registro de hoje';
    document.getElementById('watchStepsMeta').textContent = `Meta diária: ${watch.goalSteps ? Number(watch.goalSteps).toLocaleString('pt-BR') : 'não definida'} passos`;
    document.getElementById('watchCaloriesMeta').textContent = `Meta diária: ${watch.goalActiveKcal ? Number(watch.goalActiveKcal).toLocaleString('pt-BR') : 'não definida'} kcal`;
    document.getElementById('goalStepsInput').value = watch.goalSteps || '';
    document.getElementById('goalActiveKcalInput').value = watch.goalActiveKcal || '';
    document.getElementById('manualStepsInput').value = today?.confirmed ? today.steps : '';
    document.getElementById('manualActiveKcalInput').value = today?.confirmed ? today.activeKcal : '';
}

function renderEvolutionView() {
    const db = getDB();
    if (!db) return;

    const tbody = document.getElementById('weightLogsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const logs = [...(db.weightLogs || [])].reverse();
    const deltaTag = document.getElementById('weightDeltaTag');
    if (deltaTag) {
        if (logs.length > 1) {
            const delta = Number((logs[0].weight - logs[logs.length - 1].weight).toFixed(1));
            deltaTag.textContent = `${delta > 0 ? '+' : ''}${delta} kg no período registrado`;
        } else {
            deltaTag.textContent = logs.length ? 'Apenas uma pesagem registrada' : 'Sem registros';
        }
    }
    logs.forEach((log, idx) => {
        let diffText = '--';
        let diffColor = 'var(--c-text-muted)';
        if (idx < logs.length - 1) {
            const nextLog = logs[idx + 1];
            const diff = Number((log.weight - nextLog.weight).toFixed(1));
            diffText = `${diff > 0 ? '+' : ''}${diff} kg`;
            diffColor = diff <= 0 ? '#00ff88' : '#ff7b2b';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${log.date}</strong></td>
            <td><strong style="color: var(--c-sunbeam);">${log.weight} kg</strong></td>
            <td style="color: ${diffColor}; font-weight: 700;">${diffText}</td>
            <td style="color: var(--c-text-muted); font-size: 0.8rem;">${escapeHtml(log.notes || '')}</td>
            <td><button class="btn-icon" type="button" title="Editar pesagem" onclick="editWeightLog('${log.id}')"><i class="fa-solid fa-pen-to-square"></i></button><button class="btn-icon" type="button" title="Excluir pesagem" onclick="deleteWeightLog('${log.id}')"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('weightLogDate').value = getTodayStr();
    document.getElementById('weightLogDate').max = getTodayStr(); // Impede datas futuras no input date
}

function renderProfileView() {
    const db = getDB();
    if (!db || !db.user) return;
    const user = db.user;

    document.getElementById('profName').value = user.name;
    document.getElementById('profWeight').value = user.weight;
    document.getElementById('profHeight').value = user.height;
    document.getElementById('profAge').value = user.age || '';
    document.getElementById('profGender').value = user.gender || 'female';
    document.getElementById('profActivity').value = user.activity || 'sedentary';
    document.getElementById('profGoalWeight').value = user.goalWeight ?? '';
    document.getElementById('profGoalCal').value = user.goalCalories;
    document.getElementById('profGoalWater').value = user.goalWater;
    document.getElementById('profGoalProtein').value = user.goalProtein ?? '';
    document.getElementById('profGoalCarbs').value = user.goalCarbs ?? '';
    document.getElementById('profGoalFat').value = user.goalFat ?? '';
    document.getElementById('profObjective').value = user.objective;

    updateBmiDisplays();
}

function editWeightLog(logId) {
    const db = getDB();
    const log = db?.weightLogs?.find(item => item.id === logId);
    if (!log) return;
    const date = prompt('Data (AAAA-MM-DD):', log.date);
    if (date === null) return;
    const weight = prompt('Peso (kg):', log.weight);
    if (weight === null) return;
    const notes = prompt('Observações:', log.notes || '');
    if (notes === null) return;
    try {
        log.date = preventFutureDate(date, 'Data da pesagem');
        log.weight = validatePositiveNumber(weight, 'Peso');
        log.notes = notes;
        if (log.date === getTodayStr()) db.user.weight = log.weight;
        saveDB(db);
        renderEvolutionView();
        renderDashboardView();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function deleteWeightLog(logId) {
    const db = getDB();
    if (!db) return;
    db.weightLogs = db.weightLogs.filter(log => log.id !== logId);
    saveDB(db);
    renderEvolutionView();
    renderDashboardView();
}

// ==========================================
// 17. INICIALIZAÇÃO & CONTROLE GERAL DO APP
// ==========================================
function switchView(viewName) {
    document.body.classList.toggle('ai-home-open', viewName === 'ai-home');
    document.body.classList.toggle(
        'ai-chat-active',
        viewName === 'ai-home' && Boolean(document.getElementById('aiHomeConversation')?.children.length)
    );
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetSection = document.getElementById(`view-${viewName}`);
    const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (targetSection) targetSection.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    // Atualiza a visualização correspondente
    const db = getDB();
    if (viewName === 'dashboard') renderDashboardView();
    if (viewName === 'workouts') renderWorkoutsView();
    if (viewName === 'routine') renderWeeklyRoutine();
    if (viewName === 'diet') renderDietView();
    if (viewName === 'smartwatch') renderSmartwatchView();
    if (viewName === 'evolution') renderEvolutionView();
    if (viewName === 'profile') renderProfileView();
    if (viewName === 'ai-home') {
        const name = db?.user?.name?.trim().split(/\s+/)[0];
        const greeting = document.getElementById('aiHomeGreeting');
        if (greeting) greeting.textContent = name ? `Olá, ${name}! O que vamos evoluir hoje?` : 'Olá! O que vamos evoluir hoje?';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupEventListeners() {
    // 1. Navegação SPA
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            switchView(view);
        });
    });

    // 2. Botão Home / Brand
    document.getElementById('brandHomeBtn')?.addEventListener('click', () => switchView('ai-home'));
    document.getElementById('sidebarProfileTrigger')?.addEventListener('click', () => switchView('profile'));
    document.getElementById('btnGoToRoutine')?.addEventListener('click', () => switchView('routine'));
    document.getElementById('btnLogout')?.addEventListener('click', () => {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        geminiConversation.length = 0;
        document.getElementById('geminiDrawer')?.classList.remove('open');
        document.getElementById('modalOnboarding')?.classList.remove('active');
        document.body.classList.remove('ai-home-open');
        document.getElementById('authScreen')?.classList.add('active');
        document.getElementById('loginForm')?.reset();
        showAuthForm('login');
    });

    // Home do assistente Gemini
    document.getElementById('aiHomeForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('aiHomePrompt');
        const text = input.value.trim();
        if (!text) return;
        appendChatMessage('user', text, null, 'aiHomeConversation');
        input.value = '';
        processGeminiCommand(text, 'aiHomeConversation');
    });
    document.querySelectorAll('.ai-suggestion[data-prompt]').forEach(button => {
        button.addEventListener('click', () => {
            const input = document.getElementById('aiHomePrompt');
            input.value = button.dataset.prompt;
            document.getElementById('aiHomeForm').requestSubmit();
        });
    });
    document.querySelectorAll('[data-open-view]').forEach(button => {
        button.addEventListener('click', () => switchView(button.dataset.openView));
    });
    // Drawer do Gemini
    const geminiDrawer = document.getElementById('geminiDrawer');
    document.getElementById('btnToggleGemini')?.addEventListener('click', () => {
        geminiDrawer.classList.toggle('open');
    });
    document.getElementById('btnCloseGeminiDrawer')?.addEventListener('click', () => {
        geminiDrawer.classList.remove('open');
    });

    document.getElementById('geminiChatForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('geminiPromptInput');
        const text = input.value.trim();
        if (!text) return;
        appendChatMessage('user', text);
        input.value = '';
        processGeminiCommand(text);
    });

    // 5. Modal "Em Treino"
    document.getElementById('btnQuickStartWorkout')?.addEventListener('click', () => openInTrainingModal());
    document.getElementById('btnStartWorkoutMode')?.addEventListener('click', () => openInTrainingModal());
    document.getElementById('btnLaunchWorkoutFromDash')?.addEventListener('click', () => openInTrainingModal());
    document.getElementById('btnEnterWorkoutInteractive')?.addEventListener('click', () => openInTrainingModal());
    document.getElementById('btnCloseInTrainingModal')?.addEventListener('click', closeInTrainingModal);

    // Calculadora de Anilhas: input change
    document.getElementById('barbellWeightInput')?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        if (e.target.value === '' || !Number.isFinite(val)) {
            document.getElementById('barbellPlateSummary').textContent = 'Informe a carga total para calcular as anilhas.';
            return;
        }
        renderBarbellVisual(val);
    });

    // Cronômetro controls
    document.getElementById('timerPlayPauseBtn')?.addEventListener('click', toggleRestTimer);
    document.getElementById('timerResetBtn')?.addEventListener('click', resetRestTimer);
    document.getElementById('timerPlusBtn')?.addEventListener('click', () => adjustRestTimer(30));
    document.getElementById('timerMinusBtn')?.addEventListener('click', () => adjustRestTimer(-15));
    document.getElementById('timerAudioToggle')?.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const icon = document.getElementById('timerAudioToggle');
        if (icon) {
            icon.innerHTML = soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
            icon.style.color = soundEnabled ? 'var(--c-sunbeam)' : 'var(--c-text-muted)';
        }
        showToast(soundEnabled ? 'Alarme sonoro ativado' : 'Alarme sonoro mutado', 'info');
    });
    document.getElementById('restTimerInput')?.addEventListener('change', setRestTimerFromInput);

    // Séries e Ações do Modo Treino
    document.getElementById('btnAddSetBtn')?.addEventListener('click', addSetRow);
    document.getElementById('btnSaveExerciseSets')?.addEventListener('click', saveCurrentExerciseSets);
    document.getElementById('btnSubstituteExercise')?.addEventListener('click', triggerSubstituteExercise);
    document.getElementById('btnNextExerciseInModal')?.addEventListener('click', () => {
        activeExerciseIndex = (activeExerciseIndex + 1) % activeSessionExercises.length;
        renderCurrentInTrainingExercise();
    });

    // Registro manual de refeição e hidratação
    document.getElementById('customFoodForm')?.addEventListener('submit', saveCustomFood);
    document.getElementById('customFoodCancel')?.addEventListener('click', resetCustomFoodForm);
    document.getElementById('mealLogForm')?.addEventListener('submit', registerMeal);
    document.getElementById('mealHistoryDate')?.addEventListener('change', renderDietView);
    setupMealFoodPicker();
    document.getElementById('btnAddManualWater')?.addEventListener('click', () => {
        const input = document.getElementById('manualWaterMl');
        const amount = Number(input.value);
        if (!Number.isFinite(amount) || amount <= 0) return showToast('Informe uma quantidade de água maior que zero.', 'danger');
        addWaterMl(amount);
        input.value = '';
    });
    document.getElementById('btnAskGeminiRecipes')?.addEventListener('click', () => {
        switchView('ai-home');
        const prompt = document.getElementById('aiHomePrompt');
        prompt.value = 'Sugira receitas práticas para meu objetivo, respeitando minhas metas diárias de calorias e macronutrientes. Não invente meus registros.';
        document.getElementById('aiHomeForm').requestSubmit();
    });

    // 7. Smartwatch Modal
    document.getElementById('topWatchPill')?.addEventListener('click', () => switchView('smartwatch'));
    document.getElementById('openSmartwatchPanel')?.addEventListener('click', () => switchView('smartwatch'));
    document.getElementById('smartwatchForm')?.addEventListener('submit', saveManualSmartwatchData);

    // 8. Registro de Peso Form
    document.getElementById('formWeightLog')?.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const date = preventFutureDate(document.getElementById('weightLogDate').value, 'Data da pesagem');
            const weight = validatePositiveNumber(document.getElementById('weightLogVal').value, 'Peso');
            const notes = document.getElementById('weightLogNotes').value;

            const db = getDB();
            if (!db) return;

            db.weightLogs.push({
                id: generateId('wlog'),
                date: date,
                weight: weight,
                notes: notes
            });

            // Atualiza peso atual no perfil
            if (date === getTodayStr()) {
                db.user.weight = weight;
            }

            saveDB(db);
            showToast(`Pesagem de ${weight}kg registrada com sucesso!`, 'success');
            document.getElementById('weightLogVal').value = '';
            document.getElementById('weightLogNotes').value = '';
            renderEvolutionView();
            renderDashboardView();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    // 9. Formulário de Perfil & IMC em Tempo Real
    document.getElementById('profWeight')?.addEventListener('input', updateBmiDisplays);
    document.getElementById('profHeight')?.addEventListener('input', updateBmiDisplays);
    document.getElementById('onboardWeight')?.addEventListener('input', updateBmiDisplays);
    document.getElementById('onboardHeight')?.addEventListener('input', updateBmiDisplays);
    document.querySelectorAll('.onboarding-calc-input').forEach(input => input.addEventListener('input', updateOnboardingPreview));
    document.querySelectorAll('.onboarding-calc-input').forEach(input => input.addEventListener('change', updateOnboardingPreview));
    document.getElementById('onboardingBack')?.addEventListener('click', () => showOnboardingStep(onboardingStep - 1));
    document.getElementById('onboardingNext')?.addEventListener('click', () => {
        if (validateOnboardingStep(onboardingStep)) showOnboardingStep(onboardingStep + 1);
    });

    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const db = getDB();
            if (!db) return;

            db.user.name = validateRequired(document.getElementById('profName').value, 'Nome');
            db.user.weight = validatePositiveNumber(document.getElementById('profWeight').value, 'Peso');
            db.user.height = validatePositiveNumber(document.getElementById('profHeight').value, 'Altura');
            db.user.age = validatePositiveNumber(document.getElementById('profAge').value, 'Idade');
            db.user.gender = document.getElementById('profGender').value;
            db.user.activity = document.getElementById('profActivity').value;
            const goalWeightValue = document.getElementById('profGoalWeight').value;
            db.user.goalWeight = goalWeightValue ? validatePositiveNumber(goalWeightValue, 'Meta de Peso') : null;
            db.user.goalCalories = validatePositiveNumber(document.getElementById('profGoalCal').value, 'Meta Calórica');
            db.user.goalWater = validatePositiveNumber(document.getElementById('profGoalWater').value, 'Meta de Água');
            db.user.goalProtein = Number(document.getElementById('profGoalProtein').value);
            db.user.goalCarbs = Number(document.getElementById('profGoalCarbs').value);
            db.user.goalFat = Number(document.getElementById('profGoalFat').value);
            db.user.objective = document.getElementById('profObjective').value;
            db.user.bmi = calculateBMI(db.user.weight, db.user.height).imc;

            saveDB(db);
            showToast('Perfil e metas atualizados com sucesso!', 'success');
            renderDashboardView();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    // Questionário passo a passo
    document.getElementById('onboardingForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            for (let step = 1; step < 4; step++) {
                if (!validateOnboardingStep(step)) {
                    showOnboardingStep(step);
                    return;
                }
            }
            const { form, targets, bmi } = updateOnboardingPreview();
            if (!targets) throw new Error('Complete os dados biométricos e de atividade para calcular as metas.');
            const account = getAuthAccounts().find(item => item.id === sessionStorage.getItem(AUTH_SESSION_KEY));
            const db = getDB() || { meals: [], workouts: [], executions: [], weightLogs: [], waterLogs: {}, smartwatch: { dailyData: {} }, aiChat: [] };
            const createdAt = new Date().toISOString();
            const goalWeightValue = Number(document.getElementById('onboardGoalWeight').value);
            const routine = buildWeeklyRoutine(form.trainingDays, form.trainingFocuses);
            db.user = {
                ...(db.user || {}),
                id: account?.id || db.account?.id || generateId('user'),
                email: account?.email || db.account?.email || '',
                name: form.name,
                age: form.age,
                gender: form.gender,
                weight: form.weight,
                height: form.height,
                bmi: bmi.imc,
                activity: form.activity,
                trainingFrequency: form.frequency,
                trainingDays: form.trainingDays,
                trainingFocuses: form.trainingFocuses,
                goalWeight: goalWeightValue > 0 ? goalWeightValue : null,
                objective: form.objective,
                bmr: targets.bmr,
                tdee: targets.tdee,
                goalCalories: targets.goalCalories,
                goalProtein: targets.protein,
                goalCarbs: targets.carbs,
                goalFat: targets.fat,
                goalWater: targets.water,
                streak: 1,
                onboarded: true,
                createdAt
            };
            db.weeklyRoutine = routine;
            db.meals ||= [];
            db.workouts ||= [];
            db.executions ||= [];
            db.weightLogs ||= [];
            db.waterLogs ||= {};
            db.smartwatch = { ...(db.smartwatch || {}), connected: false, goalSteps: 0, goalActiveKcal: 0, dailyData: db.smartwatch?.dailyData || {} };
            db.weightLogs.push({ id: generateId('wlog'), date: getTodayStr(), weight: form.weight, notes: 'Peso inicial informado no onboarding.' });

            saveDB(db);
            document.getElementById('modalOnboarding').classList.remove('active');
            showToast(`Perfil salvo. Bem-vindo(a), ${form.name}!`, 'success');
            showOnboardingStep(1);
            document.getElementById('onboardingForm').reset();
            initializeApplication(db);
            renderDashboardView();
            renderWeeklyRoutine();
        } catch (err) {
            document.getElementById('onboardingError').textContent = err.message;
        }
    });

    // 11. Calendário Semanal
    setupRoutineAutoSave();
    document.getElementById('btnResetRoutineDefaults')?.addEventListener('click', () => {
        const db = getDB();
        if (!db) return;
        db.weeklyRoutine = buildWeeklyRoutine(db.user?.trainingDays || [], db.user?.trainingFocuses || []);
        saveDB(db);
        renderWeeklyRoutine();
        showToast('Rotina semanal restaurada para o padrão.', 'info');
    });
}

function setupLocalIconRenderer() {
    const iconMap = {
        'fa-apple': 'apple',
        'fa-arrow-right': 'arrow-right',
        'fa-arrow-right-from-bracket': 'log-out',
        'fa-arrow-right-arrow-left': 'arrows-left-right',
        'fa-right-left': 'arrows-left-right',
        'fa-arrow-trend-up': 'trending-up',
        'fa-arrow-trend-down': 'trending-down',
        'fa-arrow-up': 'arrow-up',
        'fa-bluetooth': 'bluetooth',
        'fa-bolt': 'bolt',
        'fa-bottle-water': 'droplet',
        'fa-droplet': 'droplet',
        'fa-brain': 'brain',
        'fa-bullseye': 'target',
        'fa-calculator': 'calculator',
        'fa-calendar-week': 'calendar',
        'fa-chart-column': 'chart-column',
        'fa-chart-line': 'trending-up',
        'fa-chart-pie': 'chart-pie',
        'fa-check': 'check',
        'fa-check-circle': 'check',
        'fa-list-check': 'list-check',
        'fa-circle': 'circle',
        'fa-circle-info': 'info',
        'fa-info-circle': 'info',
        'fa-clock': 'clock',
        'fa-clock-rotate-left': 'history',
        'fa-database': 'database',
        'fa-dumbbell': 'dumbbell',
        'fa-envelope': 'envelope',
        'fa-eye': 'eye',
        'fa-fire': 'flame',
        'fa-fire-burner': 'flame',
        'fa-fire-flame-curved': 'flame',
        'fa-floppy-disk': 'save',
        'fa-forward-step': 'forward',
        'fa-heart-pulse': 'heart-pulse',
        'fa-hourglass-half': 'hourglass',
        'fa-id-card': 'id-card',
        'fa-key': 'key',
        'fa-layer-group': 'layers',
        'fa-list-ol': 'list-ol',
        'fa-lock': 'lock',
        'fa-magnifying-glass': 'search',
        'fa-search': 'search',
        'fa-minus': 'minus',
        'fa-paper-plane': 'send',
        'fa-pen': 'pen',
        'fa-pen-to-square': 'pen',
        'fa-person-walking': 'walking',
        'fa-pause': 'pause',
        'fa-play': 'play',
        'fa-plus': 'plus',
        'fa-rocket': 'rocket',
        'fa-rotate': 'rotate',
        'fa-rotate-left': 'rotate-left',
        'fa-scale-balanced': 'scale',
        'fa-weight-scale': 'scale',
        'fa-weight-hanging': 'weight',
        'fa-shield': 'shield',
        'fa-shield-halved': 'shield',
        'fa-shoe-prints': 'footprints',
        'fa-sliders': 'sliders',
        'fa-stopwatch': 'stopwatch',
        'fa-strava': 'strava',
        'fa-trash': 'trash',
        'fa-bed': 'bed',
        'fa-user': 'user',
        'fa-user-gear': 'settings',
        'fa-utensils': 'utensils',
        'fa-volume-high': 'volume',
        'fa-volume-xmark': 'volume-off',
        'fa-wand-magic-sparkles': 'wand',
        'fa-triangle-exclamation': 'warning',
        'fa-xmark': 'close'
    };
    const iconSelector = 'i[class^="fa-"], i[class*=" fa-"]';

    function renderIcon(element) {
        if (element.dataset.localSvgIcon) return;
        const symbol = Array.from(element.classList).map(className => iconMap[className]).find(Boolean) || 'circle';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        svg.setAttribute('class', 'icon-svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        use.setAttribute('href', `#icon-${symbol}`);
        svg.appendChild(use);
        element.replaceChildren(svg);
        element.dataset.localSvgIcon = 'true';
    }

    function renderIcons(node) {
        if (!(node instanceof Element)) return;
        if (node.matches(iconSelector)) renderIcon(node);
        node.querySelectorAll(iconSelector).forEach(renderIcon);
    }

    renderIcons(document.body);
    new MutationObserver(records => {
        records.forEach(record => record.addedNodes.forEach(renderIcons));
    }).observe(document.body, { childList: true, subtree: true });
}

setupLocalIconRenderer();

function initializeApplication(db) {
    setupLocalIconRenderer();

    if (!appInitialized) {
        setupEventListeners();
        appInitialized = true;
    }

    renderDashboardView();
    renderWeeklyRoutine();
    renderWorkoutsView();
    renderDietView();
    renderSmartwatchView();
    renderEvolutionView();
    renderProfileView();

    const chatBody = document.getElementById('geminiChatMessages');
    if (chatBody) chatBody.innerHTML = '';
    (db?.aiChat || []).forEach(msg => {
        appendChatMessage(msg.sender, msg.text, msg.actionTriggered);
    });

    renderBarbellVisual(20);
    switchView('ai-home');
}

// Inicialização: autentica antes de abrir os módulos
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    const sessionId = sessionStorage.getItem(AUTH_SESSION_KEY);
    const account = getAuthAccounts().find(item => item.id === sessionId);

    if (!account) {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        document.getElementById('authScreen')?.classList.add('active');
        showAuthForm('login');
        return;
    }

    const db = prepareAccountDatabase(account);
    document.getElementById('authScreen')?.classList.remove('active');
    initializeApplication(db);
    if (!db.user?.onboarded) {
        const nameInput = document.getElementById('onboardName');
        if (nameInput) nameInput.value = account.name;
        showOnboardingStep(1);
        document.getElementById('modalOnboarding')?.classList.add('active');
    }
});
