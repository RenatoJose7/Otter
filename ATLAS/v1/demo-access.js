(() => {
    const demoAccountId = 'demo_renato_hackathon';
    const demoEmail = 'renato.demo@otter.local';
    const accountStorageKey = 'HACKTOON_ACCOUNTS';
    const databaseStorageKey = 'HACKTOON_DB';

    function readAccounts() {
        try {
            const value = JSON.parse(localStorage.getItem(accountStorageKey) || '[]');
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function readDatabaseRoot(accounts) {
        const raw = localStorage.getItem(databaseStorageKey);
        if (!raw) return { schemaVersion: 1, accounts: {} };

        const stored = JSON.parse(raw);
        if (stored?.accounts && typeof stored.accounts === 'object') return stored;
        if (stored?.user || stored?.workouts || stored?.meals) {
            const matchingAccount = accounts.find(account => account.email === stored.user?.email);
            let legacyId = matchingAccount?.id || stored.user?.id || 'legacy_local_data';
            if (legacyId === demoAccountId) legacyId = `legacy_${legacyId}`;
            return { schemaVersion: 1, accounts: { [legacyId]: stored } };
        }
        return { schemaVersion: 1, accounts: {} };
    }

    function dateAtOffset(offset) {
        const today = new Date(`${window.getTodayStr()}T12:00:00`);
        today.setDate(today.getDate() - offset);
        return today.toISOString().slice(0, 10);
    }

    function normalize(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function exercisesForFocus(focus, library) {
        const normalizedFocus = normalize(focus);
        const aliases = {
            peitoral: ['peitoral', 'peito'],
            costas: ['costas', 'dorsal', 'latissimo'],
            quadriceps: ['quadriceps', 'coxa', 'perna'],
            gluteo: ['gluteo'],
            ombros: ['ombro', 'deltoide'],
            bracos: ['biceps', 'triceps', 'braco'],
            abdomen: ['abdomen', 'abdominal', 'core'],
            cardio: ['cardio']
        };
        const words = Object.values(aliases).filter(group => group.some(word => normalizedFocus.includes(word))).flat();
        return [...new Map(library.filter(exercise => {
            const searchable = normalize(`${exercise.muscle} ${exercise.category} ${exercise.name}`);
            return words.some(word => searchable.includes(word));
        }).map(exercise => [exercise.id, exercise])).values()].slice(0, 4);
    }

    function createDemoDatabase(account) {
        const library = window.EXERCISES_DATABASE || [];
        const foodLibrary = window.TACO_DATABASE || [];
        const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const schedule = [
            { dayId: 0, focus: 'Descanso', restDay: true },
            { dayId: 1, focus: 'Peito, Tríceps & Ombro Anterior', restDay: false },
            { dayId: 2, focus: 'Costas, Bíceps & Deltoide Posterior', restDay: false },
            { dayId: 3, focus: 'Quadríceps & Glúteos', restDay: false },
            { dayId: 4, focus: 'Descanso e recuperação', restDay: true },
            { dayId: 5, focus: 'Ombros e Braços', restDay: false },
            { dayId: 6, focus: 'Cardio', restDay: false }
        ].map(day => ({
            ...day,
            dayName: dayNames[day.dayId],
            shortName: dayNames[day.dayId].slice(0, 3).toUpperCase(),
            targetSets: day.restDay ? 0 : 14
        }));
        const forceExercises = library.filter(exercise => normalize(exercise.category) !== 'cardio');
        const cardioExercise = library.find(exercise => normalize(exercise.category) === 'cardio');
        const previousMetric = new Map();
        const workouts = [];
        const executions = [];

        for (let offset = 13; offset >= 0; offset--) {
            const date = dateAtOffset(offset);
            const day = new Date(`${date}T12:00:00`).getDay();
            const plan = schedule.find(item => item.dayId === day);
            if (!plan || plan.restDay) continue;

            let selectedExercises = exercisesForFocus(plan.focus, library);
            if (normalize(plan.focus) === 'cardio') selectedExercises = cardioExercise ? [cardioExercise] : [];
            if (!selectedExercises.length && forceExercises.length) selectedExercises = [forceExercises[day % forceExercises.length]];
            if (!selectedExercises.length) continue;

            const workoutId = `wk_${date}`;
            const workoutExercises = selectedExercises.map((exercise, order) => {
                const exerciseIsCardio = normalize(exercise.category) === 'cardio';
                let sets = [];
                let totalVolume = 0;
                let progressionValue;
                let progressionMetric;
                let durationMin = 0;
                let distanceKm = 0;
                let estimatedCalories = 0;

                if (exerciseIsCardio) {
                    durationMin = 30 + (offset % 3) * 5;
                    distanceKm = Number((3.8 + (offset < 7 ? 0.4 : 0)).toFixed(1));
                    estimatedCalories = durationMin * 6;
                    progressionValue = distanceKm / (durationMin / 60);
                    progressionMetric = 'speedKmh';
                } else {
                    const exerciseIndex = forceExercises.findIndex(item => item.id === exercise.id);
                    const baseWeight = 35 + Math.max(0, exerciseIndex) * 2.5;
                    const weightKg = Number((baseWeight + (offset < 7 ? 2.5 : 0)).toFixed(1));
                    const reps = Math.max(6, Number(exercise.defaultReps) || 10);
                    const setCount = Math.max(2, Number(exercise.defaultSets) || 3);
                    totalVolume = weightKg * reps * setCount;
                    progressionValue = totalVolume;
                    progressionMetric = 'volumeKg';
                    sets = Array.from({ length: setCount }, (_, index) => ({
                        setNum: index + 1,
                        weightKg,
                        reps,
                        isHardSet: index >= 1,
                        rpe: index === setCount - 1 ? 9 : 8
                    }));
                    estimatedCalories = 220;
                }

                const previous = previousMetric.get(exercise.id);
                let comparisonStatus = 'Sem histórico';
                if (previous?.value > 0) {
                    const ratio = progressionValue / previous.value;
                    comparisonStatus = ratio > 1.03 ? 'Evoluindo' : ratio < 0.97 ? 'Regredindo' : 'Estagnado';
                }
                previousMetric.set(exercise.id, { value: progressionValue, metric: progressionMetric });

                const execution = {
                    id: `exec_${workoutId}_${exercise.id}`,
                    workoutId,
                    exerciseId: exercise.id,
                    exerciseName: exercise.name,
                    date,
                    type: exerciseIsCardio ? 'cardio' : 'strength',
                    order,
                    sets,
                    totalVolume,
                    progressionValue,
                    progressionMetric,
                    comparisonStatus,
                    hardSetsCount: sets.filter(set => set.isHardSet).length,
                    ...(exerciseIsCardio ? { durationMin, distanceKm } : {})
                };
                executions.push(execution);
                return estimatedCalories;
            });

            workouts.push({
                id: workoutId,
                date,
                name: `Treino: ${plan.focus}`,
                focus: plan.focus,
                durationMin: 55,
                status: 'completed',
                caloriesBurned: workoutExercises.reduce((sum, value) => sum + value, 0)
            });
        }

        const foods = ['taco_09', 'taco_23', 'taco_27', 'taco_16', 'taco_18', 'taco_01', 'taco_02', 'taco_31', 'taco_33', 'taco_37'];
        const mealTemplates = [
            { type: 'Café da Manhã', food: 'taco_09', grams: 150 },
            { type: 'Café da Manhã', food: 'taco_23', grams: 50 },
            { type: 'Café da Manhã', food: 'taco_27', grams: 120 },
            { type: 'Almoço', food: 'taco_16', grams: 250 },
            { type: 'Almoço', food: 'taco_18', grams: 150 },
            { type: 'Almoço', food: 'taco_01', grams: 200 },
            { type: 'Lanche', food: 'taco_37', grams: 35 },
            { type: 'Lanche', food: 'taco_27', grams: 100 },
            { type: 'Jantar', food: 'taco_02', grams: 150 },
            { type: 'Jantar', food: 'taco_16', grams: 180 },
            { type: 'Jantar', food: 'taco_31', grams: 100 },
            { type: 'Jantar', food: 'taco_33', grams: 8 }
        ];
        const meals = [];
        const waterLogs = {};
        const weightLogs = [];

        for (let offset = 13; offset >= 0; offset--) {
            const date = dateAtOffset(offset);
            mealTemplates.forEach((template, index) => {
                const food = foodLibrary.find(item => item.id === template.food);
                if (!food || !foods.includes(food.id)) return;
                const grams = template.grams;
                meals.push({
                    id: `demo_meal_${date}_${index}`,
                    date,
                    mealType: template.type,
                    alimentoId: food.id,
                    alimentoName: food.name,
                    name: food.name,
                    grams,
                    calories: Math.round(food.calories * grams / 100),
                    protein: Number((food.protein * grams / 100).toFixed(1)),
                    carbs: Number((food.carbs * grams / 100).toFixed(1)),
                    fat: Number((food.fat * grams / 100).toFixed(1))
                });
            });
            waterLogs[date] = 3200 + (offset % 3) * 150;
            const progressDays = 13 - offset;
            const variation = Math.sin(offset * 1.5) * 0.12;
            weightLogs.push({
                id: `demo_weight_${date}`,
                date,
                weight: Number((82.4 - progressDays * 0.055 + variation).toFixed(1)),
                notes: 'Pesagem demonstrativa'
            });
        }

        const lastWeight = weightLogs.at(-1)?.weight || 81.7;
        const trainingDays = schedule.filter(day => !day.restDay).map(day => day.dayId);
        const trainingFocuses = schedule.filter(day => !day.restDay).map(day => day.focus);
        const trainingPlans = schedule.filter(day => !day.restDay).map(day => ({
            id: `demo_plan_${day.dayId}`,
            name: day.focus,
            exerciseIds: exercisesForFocus(day.focus, library).map(exercise => exercise.id)
        }));

        return {
            demoSeedVersion: 1,
            account: { id: account.id, email: account.email },
            user: {
                id: account.id,
                name: 'Renato (Demonstração)',
                email: account.email,
                age: 27,
                gender: 'male',
                activity: 'moderate',
                weight: lastWeight,
                height: 180,
                bmi: Number((lastWeight / 1.8 ** 2).toFixed(1)),
                goalWeight: 78.5,
                goalCalories: 2500,
                goalProtein: 160,
                goalCarbs: 300,
                goalFat: 75,
                goalWater: 3000,
                objective: 'hipertrofia',
                trainingFrequency: trainingDays.length,
                trainingDays,
                trainingFocuses,
                onboarded: true,
                createdAt: new Date().toISOString()
            },
            weeklyRoutine: schedule,
            trainingPlans,
            customExercises: [],
            workouts,
            executions,
            meals,
            weightLogs,
            waterLogs,
            smartwatch: { connected: false, goalSteps: 0, goalActiveKcal: 0, dailyData: {} },
            aiChat: []
        };
    }

    function ensureAccountAndDemoData() {
        const accounts = readAccounts();
        let account = accounts.find(item => item.id === demoAccountId);
        if (!account) {
            account = {
                id: demoAccountId,
                name: 'Renato (Demonstração)',
                email: demoEmail,
                salt: '',
                passwordHash: '',
                demoOnly: true,
                createdAt: new Date().toISOString()
            };
            accounts.push(account);
        }

        const root = readDatabaseRoot(accounts);
        root.accounts ||= {};
        if (!root.accounts[demoAccountId]?.demoSeedVersion) {
            root.accounts[demoAccountId] = createDemoDatabase(account);
        }
        localStorage.setItem(databaseStorageKey, JSON.stringify(root));
        localStorage.setItem(accountStorageKey, JSON.stringify(accounts));
        return account;
    }

    function addDemoButton() {
        const loginForm = document.getElementById('loginForm');
        const submitButton = loginForm?.querySelector('button[type="submit"]');
        if (!loginForm || !submitButton || loginForm.querySelector('[data-demo-login]')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary auth-submit';
        button.dataset.demoLogin = 'true';
        button.textContent = 'Entrar na demonstração · Renato';
        button.title = 'Usa um perfil e dados fictícios locais; não substitui uma conta real.';
        button.style.marginTop = '0.85rem';
        submitButton.insertAdjacentElement('afterend', button);

        button.addEventListener('click', () => {
            button.disabled = true;
            try {
                const account = ensureAccountAndDemoData();
                if (typeof window.enterAppForAccount !== 'function') throw new Error('O app principal ainda nao carregou.');
                window.enterAppForAccount(account);
                window.showToast?.('Demonstração Renato aberta com dados fictícios.', 'success');
            } catch (error) {
                button.disabled = false;
                const errorBox = document.getElementById('loginError');
                if (errorBox) errorBox.textContent = `Não foi possível abrir a demonstração: ${error.message}`;
            }
        });
    }

    function mount() {
        addDemoButton();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
