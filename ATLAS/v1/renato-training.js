(() => {
    const MODULE_ID = 'renatoTrainingManager';
    const STYLE_ID = 'renatoTrainingStyles';

    const styles = `
        .renato-training-manager { margin: 0 0 2rem; }
        .renato-training-manager h2, .renato-training-manager h3 { margin: 0; }
        .renato-module-intro { margin: .35rem 0 1.1rem; color: var(--c-text-muted); font-size: .84rem; }
        .renato-training-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
        .renato-training-form { min-width: 0; padding: 1rem; background: rgba(10, 11, 15, .55); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; }
        .renato-training-form h3 { margin-bottom: .8rem; font-size: .95rem; }
        .renato-training-form .form-group { margin-bottom: .75rem; }
        .renato-training-form .btn { width: 100%; }
        .renato-exercise-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .35rem .7rem; max-height: 150px; overflow: auto; padding: .55rem; background: rgba(0,0,0,.18); border: 1px solid rgba(255,255,255,.08); border-radius: 8px; }
        .renato-exercise-option { display: flex; align-items: flex-start; gap: .4rem; color: var(--c-cream); font-size: .74rem; }
        .renato-exercise-option input { margin-top: .16rem; accent-color: var(--c-sunbeam); }
        .renato-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; }
        .renato-record-lists { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem; }
        .renato-list { display: grid; gap: .5rem; margin-top: .75rem; }
        .renato-list-item { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: .65rem .75rem; background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 8px; }
        .renato-list-item strong { display: block; font-size: .8rem; }
        .renato-list-item small { display: block; margin-top: .15rem; color: var(--c-text-muted); font-size: .7rem; }
        .renato-list-item button { flex: none; }
        .renato-empty { color: var(--c-text-muted); font-size: .78rem; }
        .renato-type-fields[hidden] { display: none !important; }
        @media (max-width: 1050px) { .renato-training-grid { grid-template-columns: 1fr 1fr; } .renato-record-form { grid-column: 1 / -1; } }
        @media (max-width: 700px) { .renato-training-grid, .renato-record-lists { grid-template-columns: 1fr; } .renato-record-form { grid-column: auto; } .renato-exercise-options { grid-template-columns: 1fr; } }
    `;

    function localDateString() {
        const date = new Date();
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
    }

    function createId(prefix) {
        return typeof window.generateId === 'function'
            ? window.generateId(prefix)
            : `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }

    function notify(message, type = 'info') {
        if (typeof window.showToast === 'function') window.showToast(message, type);
        else window.alert(message);
    }

    function getDatabase() {
        if (typeof window.getDB !== 'function' || typeof window.saveDB !== 'function') {
            notify('O modulo de treino precisa ser carregado depois de app.js.', 'danger');
            return null;
        }
        const db = window.getDB();
        if (!db?.user) return null;
        db.customExercises ||= [];
        db.trainingPlans ||= [];
        db.workouts ||= [];
        db.executions ||= [];
        return db;
    }

    function exerciseType(exercise) {
        return exercise.type === 'cardio' || exercise.category === 'Cardio' ? 'cardio' : 'strength';
    }

    function allExercises(db) {
        const library = (window.EXERCISES_DATABASE || []).map(exercise => ({
            ...exercise,
            type: exerciseType(exercise),
            source: 'Biblioteca'
        }));
        const custom = (db.customExercises || []).map(exercise => ({ ...exercise, source: 'Criado por voce' }));
        return [...library, ...custom];
    }

    function addOption(select, value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    }

    function makeListItem(title, detail, buttonLabel, buttonData, disabled = false) {
        const item = document.createElement('div');
        item.className = 'renato-list-item';
        const copy = document.createElement('div');
        const heading = document.createElement('strong');
        heading.textContent = title;
        const metadata = document.createElement('small');
        metadata.textContent = detail;
        copy.append(heading, metadata);
        item.appendChild(copy);
        if (buttonLabel) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-secondary btn-icon';
            button.title = buttonLabel;
            button.setAttribute('aria-label', buttonLabel);
            button.textContent = '×';
            button.dataset[buttonData.name] = buttonData.value;
            button.disabled = disabled;
            item.appendChild(button);
        }
        return item;
    }

    function render() {
        const db = getDatabase();
        const root = document.getElementById(MODULE_ID);
        if (!db || !root) return;

        const exercises = allExercises(db);
        const planOptions = root.querySelector('[data-renato-plan]');
        const executionExercise = root.querySelector('[data-renato-exercise]');
        const planExerciseOptions = root.querySelector('[data-renato-plan-exercises]');
        const selectedPlan = planOptions.value;
        const selectedExercise = executionExercise.value;

        planOptions.replaceChildren();
        addOption(planOptions, '', 'Sessao livre');
        (db.trainingPlans || []).forEach(plan => addOption(planOptions, plan.id, plan.name));
        if ([...planOptions.options].some(option => option.value === selectedPlan)) planOptions.value = selectedPlan;

        executionExercise.replaceChildren();
        exercises.forEach(exercise => {
            const suffix = exerciseType(exercise) === 'cardio' ? 'Cardio' : 'Forca';
            addOption(executionExercise, exercise.id, `${exercise.name} · ${suffix}`);
        });
        if ([...executionExercise.options].some(option => option.value === selectedExercise)) executionExercise.value = selectedExercise;
        updateTypeFields(root, exercises);

        planExerciseOptions.replaceChildren();
        if (!exercises.length) {
            const empty = document.createElement('span');
            empty.className = 'renato-empty';
            empty.textContent = 'Cadastre ou selecione um exercicio da biblioteca.';
            planExerciseOptions.appendChild(empty);
        } else {
            exercises.forEach((exercise, index) => {
                const label = document.createElement('label');
                label.className = 'renato-exercise-option';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'planExercise';
                checkbox.value = exercise.id;
                checkbox.id = `renatoPlanExercise${index}`;
                const text = document.createElement('span');
                text.textContent = exercise.name;
                label.append(checkbox, text);
                planExerciseOptions.appendChild(label);
            });
        }

        const exerciseList = root.querySelector('[data-renato-exercise-list]');
        exerciseList.replaceChildren();
        const customExercises = db.customExercises || [];
        if (!customExercises.length) {
            const empty = document.createElement('p');
            empty.className = 'renato-empty';
            empty.textContent = 'Nenhum exercicio proprio cadastrado. A biblioteca base continua disponivel.';
            exerciseList.appendChild(empty);
        } else {
            customExercises.forEach(exercise => {
                const used = (db.trainingPlans || []).some(plan => plan.exerciseIds.includes(exercise.id))
                    || (db.executions || []).some(execution => execution.exerciseId === exercise.id);
                exerciseList.appendChild(makeListItem(
                    exercise.name,
                    `${exercise.muscleGroup} · ${exercise.type === 'cardio' ? 'Cardio' : 'Forca'}`,
                    'Remover exercicio',
                    { name: 'renatoDeleteExercise', value: exercise.id },
                    used
                ));
            });
        }

        const planList = root.querySelector('[data-renato-plan-list]');
        planList.replaceChildren();
        if (!(db.trainingPlans || []).length) {
            const empty = document.createElement('p');
            empty.className = 'renato-empty';
            empty.textContent = 'Nenhum treino proprio cadastrado.';
            planList.appendChild(empty);
        } else {
            db.trainingPlans.forEach(plan => {
                const names = plan.exerciseIds.map(id => exercises.find(exercise => exercise.id === id)?.name).filter(Boolean);
                planList.appendChild(makeListItem(
                    plan.name,
                    `${names.length} exercicio(s): ${names.join(', ')}`,
                    'Remover treino',
                    { name: 'renatoDeletePlan', value: plan.id }
                ));
            });
        }

        const executionList = root.querySelector('[data-renato-execution-list]');
        executionList.replaceChildren();
        const recent = [...(db.executions || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);
        if (!recent.length) {
            const empty = document.createElement('p');
            empty.className = 'renato-empty';
            empty.textContent = 'As sessoes registradas aparecerao aqui.';
            executionList.appendChild(empty);
        } else {
            recent.forEach(execution => {
                const cardio = Number(execution.durationMin) > 0;
                const detail = cardio
                    ? `${execution.durationMin} min · ${execution.distanceKm || 0} km · ~${execution.estimatedCalories || 0} kcal · ${execution.comparisonStatus || 'Sem historico'}`
                    : `${execution.totalVolume || 0} kg de volume · ${execution.comparisonStatus || 'Sem historico'}`;
                executionList.appendChild(makeListItem(execution.exerciseName || execution.exerciseId, `${execution.date} · ${detail}`));
            });
        }
    }

    function updateTypeFields(root, exercises = null) {
        const all = exercises || allExercises(getDatabase() || {});
        const selected = all.find(exercise => exercise.id === root.querySelector('[data-renato-exercise]')?.value);
        const cardio = selected ? exerciseType(selected) === 'cardio' : false;
        root.querySelector('[data-renato-strength-fields]').hidden = cardio;
        root.querySelector('[data-renato-cardio-fields]').hidden = !cardio;
    }

    function progressionStatus(db, exerciseId, type, value, date) {
        const previous = (db.executions || [])
            .filter(execution => execution.exerciseId === exerciseId && execution.date < date)
            .filter(execution => type === 'strength'
                ? Number(execution.totalVolume) > 0
                : execution.progressionMetric === 'speedKmh' && Number(execution.progressionValue) > 0)
            .sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!previous) return 'Sem historico';
        const previousValue = type === 'strength' ? Number(previous.totalVolume) : Number(previous.progressionValue);
        const ratio = value / previousValue;
        if (ratio > 1.03) return 'Evoluindo';
        if (ratio < 0.97) return 'Regredindo';
        return 'Estagnado';
    }

    function createWorkout(db, plan, date) {
        const planId = plan?.id || 'free';
        let workout = (db.workouts || []).find(item => item.date === date && item.planId === planId);
        if (!workout) {
            workout = {
                id: createId('workout'),
                date,
                name: plan?.name || 'Treino livre',
                focus: plan?.name || 'Sessao livre',
                planId,
                status: 'in_progress'
            };
            db.workouts.push(workout);
        }
        return workout;
    }

    function setupEventHandlers(root) {
        root.querySelector('[data-renato-exercise-form]').addEventListener('submit', event => {
            event.preventDefault();
            const db = getDatabase();
            if (!db) return;
            const form = event.currentTarget;
            const name = form.elements.exerciseName.value.trim();
            const muscleGroup = form.elements.muscleGroup.value.trim();
            const type = form.elements.exerciseType.value;
            if (name.length < 2 || !muscleGroup) return notify('Informe o nome e o grupo muscular.', 'danger');
            if (allExercises(db).some(exercise => exercise.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
                return notify('Ja existe um exercicio com esse nome.', 'danger');
            }
            db.customExercises.push({
                id: createId('custom_ex'),
                name,
                muscleGroup,
                muscle: muscleGroup,
                category: type === 'cardio' ? 'Cardio' : 'Forca',
                type,
                defaultSets: type === 'cardio' ? 1 : 3,
                defaultReps: type === 'cardio' ? 1 : 10,
                createdAt: new Date().toISOString()
            });
            if (!window.saveDB(db)) return;
            form.reset();
            render();
            notify('Exercicio cadastrado.', 'success');
        });

        root.querySelector('[data-renato-plan-form]').addEventListener('submit', event => {
            event.preventDefault();
            const db = getDatabase();
            if (!db) return;
            const form = event.currentTarget;
            const name = form.elements.planName.value.trim();
            const exerciseIds = [...form.querySelectorAll('input[name="planExercise"]:checked')].map(input => input.value);
            if (name.length < 2) return notify('Informe o nome do treino.', 'danger');
            if (!exerciseIds.length) return notify('Selecione ao menos um exercicio para o treino.', 'danger');
            db.trainingPlans.push({ id: createId('plan'), name, exerciseIds, createdAt: new Date().toISOString() });
            if (!window.saveDB(db)) return;
            form.reset();
            render();
            notify('Treino cadastrado.', 'success');
        });

        root.querySelector('[data-renato-execution-form]').addEventListener('submit', event => {
            event.preventDefault();
            const db = getDatabase();
            if (!db) return;
            const form = event.currentTarget;
            const exercise = allExercises(db).find(item => item.id === form.elements.exerciseId.value);
            const plan = (db.trainingPlans || []).find(item => item.id === form.elements.planId.value) || null;
            const date = form.elements.sessionDate.value;
            const today = localDateString();
            if (!exercise) return notify('Selecione um exercicio.', 'danger');
            if (!date || date > today) return notify('A data da sessao e obrigatoria e nao pode ser futura.', 'danger');
            if (plan && !plan.exerciseIds.includes(exercise.id)) return notify('Esse exercicio nao pertence ao treino selecionado.', 'danger');

            const workout = createWorkout(db, plan, date);
            const type = exerciseType(exercise);
            let sets = [];
            let totalVolume = 0;
            let progressionValue;
            let progressionMetric;
            let durationMin;
            let distanceKm;
            let estimatedCalories = 0;

            if (type === 'strength') {
                const weightKg = Number(form.elements.weightKg.value);
                const reps = Number(form.elements.reps.value);
                const setCount = Number(form.elements.setCount.value);
                if (![weightKg, reps, setCount].every(Number.isFinite) || weightKg < 0 || reps <= 0 || setCount <= 0) {
                    return notify('Carga deve ser zero ou maior; repeticoes e series devem ser positivas.', 'danger');
                }
                sets = Array.from({ length: setCount }, (_, index) => ({
                    setNum: index + 1, weightKg, reps, isHardSet: false, rpe: null
                }));
                totalVolume = weightKg * reps * setCount;
                progressionValue = totalVolume;
                progressionMetric = 'volumeKg';
            } else {
                durationMin = Number(form.elements.durationMin.value);
                distanceKm = Number(form.elements.distanceKm.value);
                if (![durationMin, distanceKm].every(Number.isFinite) || durationMin <= 0 || distanceKm <= 0) {
                    return notify('Duracao e distancia do cardio devem ser positivas.', 'danger');
                }
                progressionValue = distanceKm / (durationMin / 60);
                progressionMetric = 'speedKmh';
                estimatedCalories = Math.round(durationMin * 6);
            }

            const comparisonStatus = progressionStatus(db, exercise.id, type, progressionValue, date);
            const execution = {
                id: createId('execution'), workoutId: workout.id, exerciseId: exercise.id,
                exerciseName: exercise.name, date, type, sets, totalVolume, progressionValue,
                progressionMetric, comparisonStatus,
                ...(type === 'cardio' ? { durationMin, distanceKm, estimatedCalories } : {})
            };
            const existingIndex = db.executions.findIndex(item => item.workoutId === workout.id && item.exerciseId === exercise.id);
            if (existingIndex >= 0) db.executions[existingIndex] = execution;
            else db.executions.push(execution);

            const completedIds = new Set(db.executions.filter(item => item.workoutId === workout.id).map(item => item.exerciseId));
            workout.status = !plan || plan.exerciseIds.every(id => completedIds.has(id)) ? 'completed' : 'in_progress';
            if (!window.saveDB(db)) return;
            form.elements.weightKg.value = '';
            form.elements.reps.value = '';
            form.elements.setCount.value = '3';
            form.elements.durationMin.value = '';
            form.elements.distanceKm.value = '';
            render();
            notify(`Sessao salva. Progressao: ${comparisonStatus}.`, 'success');
        });

        const workoutsView = document.getElementById('view-workouts');
        if (workoutsView) {
            new MutationObserver(() => {
                if (workoutsView.classList.contains('active')) render();
            }).observe(workoutsView, { attributes: true, attributeFilter: ['class'] });
        }

        root.querySelector('[data-renato-exercise]').addEventListener('change', () => {
            const db = getDatabase();
            if (db) updateTypeFields(root, allExercises(db));
        });

        root.addEventListener('click', event => {
            const removeExerciseButton = event.target.closest('[data-renato-delete-exercise]');
            const removePlanButton = event.target.closest('[data-renato-delete-plan]');
            if (!removeExerciseButton && !removePlanButton) return;
            const db = getDatabase();
            if (!db) return;
            if (removeExerciseButton) {
                const exerciseId = removeExerciseButton.dataset.renatoDeleteExercise;
                const referenced = (db.trainingPlans || []).some(plan => plan.exerciseIds.includes(exerciseId))
                    || (db.executions || []).some(execution => execution.exerciseId === exerciseId);
                if (referenced) return notify('Este exercicio ja esta ligado a um treino ou historico e nao pode ser removido.', 'danger');
                db.customExercises = (db.customExercises || []).filter(exercise => exercise.id !== exerciseId);
            } else {
                const planId = removePlanButton.dataset.renatoDeletePlan;
                db.trainingPlans = (db.trainingPlans || []).filter(plan => plan.id !== planId);
            }
            if (!window.saveDB(db)) return;
            render();
            notify(removeExerciseButton ? 'Exercicio removido.' : 'Treino removido. O historico das sessoes foi preservado.', 'success');
        });
    }

    function mount() {
        if (document.getElementById(MODULE_ID)) return;
        const view = document.getElementById('view-workouts');
        const anchor = view?.querySelector('.view-header');
        if (!view || !anchor) return;

        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = styles;
            document.head.appendChild(style);
        }

        const root = document.createElement('section');
        root.id = MODULE_ID;
        root.className = 'card renato-training-manager';
        root.innerHTML = `
            <div class="card-header"><div><h2>Biblioteca e planejamento de treinos</h2><p class="renato-module-intro">Cadastre exercicios, monte treinos e registre sessoes de forca ou cardio.</p></div></div>
            <div class="renato-training-grid">
                <form class="renato-training-form" data-renato-exercise-form>
                    <h3>Novo exercicio</h3>
                    <div class="form-group"><label class="form-label" for="renatoExerciseName">Nome</label><input class="form-control" id="renatoExerciseName" name="exerciseName" required minlength="2"></div>
                    <div class="form-group"><label class="form-label" for="renatoMuscleGroup">Grupo muscular</label><input class="form-control" id="renatoMuscleGroup" name="muscleGroup" required></div>
                    <div class="form-group"><label class="form-label" for="renatoExerciseType">Tipo</label><select class="form-control" id="renatoExerciseType" name="exerciseType"><option value="strength">Forca</option><option value="cardio">Cardio</option></select></div>
                    <button class="btn btn-secondary" type="submit">Cadastrar exercicio</button>
                </form>
                <form class="renato-training-form" data-renato-plan-form>
                    <h3>Novo treino</h3>
                    <div class="form-group"><label class="form-label" for="renatoPlanName">Nome do treino</label><input class="form-control" id="renatoPlanName" name="planName" required minlength="2" placeholder="Ex.: Treino A"></div>
                    <div class="form-group"><span class="form-label">Exercicios do treino</span><div class="renato-exercise-options" data-renato-plan-exercises></div></div>
                    <button class="btn btn-secondary" type="submit">Salvar treino</button>
                </form>
                <form class="renato-training-form renato-record-form" data-renato-execution-form>
                    <h3>Registrar sessao</h3>
                    <div class="renato-field-grid">
                        <div class="form-group"><label class="form-label" for="renatoPlanSelect">Treino</label><select class="form-control" id="renatoPlanSelect" data-renato-plan name="planId"></select></div>
                        <div class="form-group"><label class="form-label" for="renatoExerciseSelect">Exercicio</label><select class="form-control" id="renatoExerciseSelect" data-renato-exercise name="exerciseId" required></select></div>
                        <div class="form-group"><label class="form-label" for="renatoSessionDate">Data</label><input class="form-control" id="renatoSessionDate" name="sessionDate" type="date" required></div>
                    </div>
                    <div class="renato-field-grid renato-type-fields" data-renato-strength-fields>
                        <div class="form-group"><label class="form-label" for="renatoWeight">Carga (kg)</label><input class="form-control" id="renatoWeight" name="weightKg" type="number" min="0" step="0.5" value="0"></div>
                        <div class="form-group"><label class="form-label" for="renatoReps">Repeticoes por serie</label><input class="form-control" id="renatoReps" name="reps" type="number" min="1" step="1" value="10"></div>
                        <div class="form-group"><label class="form-label" for="renatoSets">Series</label><input class="form-control" id="renatoSets" name="setCount" type="number" min="1" step="1" value="3"></div>
                    </div>
                    <div class="renato-field-grid renato-type-fields" data-renato-cardio-fields hidden>
                        <div class="form-group"><label class="form-label" for="renatoDuration">Duracao (min)</label><input class="form-control" id="renatoDuration" name="durationMin" type="number" min="1" step="1"></div>
                        <div class="form-group"><label class="form-label" for="renatoDistance">Distancia (km)</label><input class="form-control" id="renatoDistance" name="distanceKm" type="number" min="0.01" step="0.01"></div>
                    </div>
                    <button class="btn btn-primary" type="submit">Salvar sessao</button>
                </form>
            </div>
            <div class="renato-record-lists">
                <div><h3>Exercicios proprios</h3><div class="renato-list" data-renato-exercise-list></div></div>
                <div><h3>Treinos cadastrados</h3><div class="renato-list" data-renato-plan-list></div></div>
            </div>
            <div style="margin-top:1rem"><h3>Sessoes recentes</h3><div class="renato-list" data-renato-execution-list></div></div>
        `;
        anchor.insertAdjacentElement('afterend', root);
        root.querySelector('[name="sessionDate"]').value = localDateString();
        setupEventHandlers(root);
        render();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
