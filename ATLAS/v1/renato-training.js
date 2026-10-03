(() => {
    const MODULE_ID = 'renatoTrainingManager';
    const STYLE_ID = 'renatoTrainingStyles';
    const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    const state = {
        editingPlanId: null,
        draft: [],
        search: '',
        sessionPlanId: '',
        sessionConfigs: []
    };

    const styles = `
        .renato-training-manager { margin: 0 0 2rem; overflow: hidden; }
        .renato-training-manager h2, .renato-training-manager h3, .renato-training-manager p { margin-top: 0; }
        .renato-module-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
        .renato-module-heading p { margin: .35rem 0 0; color: var(--c-text-muted); font-size: .85rem; }
        .renato-step { display: inline-flex; align-items: center; gap: .4rem; color: var(--c-sunbeam); font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .renato-week { margin-bottom: 1rem; padding: .85rem; border: 1px solid rgba(255,123,43,.16); border-radius: 14px; background: rgba(255,123,43,.035); }
        .renato-week-head { display: flex; justify-content: space-between; gap: .75rem; margin-bottom: .7rem; }
        .renato-week-head strong { font-size: .84rem; }
        .renato-week-head span { color: var(--c-text-muted); font-size: .7rem; }
        .renato-week-grid { display: grid; grid-template-columns: repeat(7, minmax(95px, 1fr)); gap: .45rem; overflow-x: auto; padding-bottom: .15rem; }
        .renato-day { min-width: 95px; padding: .65rem; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; background: rgba(5,6,9,.55); color: var(--c-cream); text-align: left; cursor: pointer; }
        .renato-day:hover, .renato-day.is-today { border-color: rgba(255,123,43,.48); background: rgba(255,123,43,.09); }
        .renato-day.is-linked { box-shadow: inset 0 0 0 1px rgba(255,158,0,.15); }
        .renato-day.is-rest { opacity: .68; }
        .renato-day b { display: block; color: var(--c-sunbeam); font-size: .67rem; letter-spacing: .05em; }
        .renato-day span { display: block; margin-top: .3rem; overflow: hidden; font-size: .68rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
        .renato-day small { display: block; margin-top: .16rem; color: var(--c-text-muted); font-size: .59rem; }
        .renato-planner-grid { display: grid; grid-template-columns: minmax(250px, .8fr) minmax(0, 1.55fr); gap: 1rem; align-items: start; }
        .renato-panel { min-width: 0; padding: 1rem; background: rgba(9, 9, 13, .58); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; }
        .renato-panel-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .85rem; }
        .renato-panel-head h3 { margin: 0; font-size: 1rem; }
        .renato-count { flex: none; padding: .2rem .5rem; border: 1px solid rgba(255,123,43,.28); border-radius: 999px; color: var(--c-sunbeam); font-size: .68rem; font-weight: 700; }
        .renato-library-list { display: grid; gap: .5rem; max-height: 590px; margin-top: .75rem; overflow: auto; padding-right: .2rem; }
        .renato-library-item { display: flex; align-items: center; justify-content: space-between; gap: .65rem; padding: .7rem; border: 1px solid rgba(255,255,255,.07); border-radius: 10px; background: rgba(255,255,255,.025); }
        .renato-library-item strong, .renato-plan-card strong { display: block; font-size: .8rem; color: var(--c-white); }
        .renato-library-item small, .renato-plan-card small { display: block; margin-top: .16rem; color: var(--c-text-muted); font-size: .68rem; line-height: 1.35; }
        .renato-add-btn { width: 34px; height: 34px; padding: 0; flex: none; }
        .renato-add-btn:disabled { opacity: .42; cursor: default; }
        .renato-builder-meta { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(175px, .7fr); gap: .75rem; }
        .renato-selected-list, .renato-session-list { display: grid; gap: .7rem; margin-top: .8rem; }
        .renato-exercise-card { padding: .85rem; border: 1px solid rgba(255,123,43,.18); border-radius: 12px; background: linear-gradient(145deg, rgba(43,10,2,.54), rgba(8,9,12,.72)); }
        .renato-exercise-card-head { display: flex; align-items: center; justify-content: space-between; gap: .65rem; margin-bottom: .7rem; }
        .renato-exercise-title { display: flex; align-items: center; gap: .6rem; min-width: 0; }
        .renato-order { display: grid; place-items: center; width: 28px; height: 28px; flex: none; border-radius: 8px; background: rgba(255,123,43,.13); color: var(--c-sunbeam); font-size: .72rem; font-weight: 800; }
        .renato-exercise-title strong { display: block; overflow: hidden; font-size: .82rem; text-overflow: ellipsis; white-space: nowrap; }
        .renato-exercise-title small { display: block; color: var(--c-text-muted); font-size: .66rem; }
        .renato-card-actions { display: flex; gap: .3rem; flex: none; }
        .renato-card-actions button { width: 30px; height: 30px; padding: 0; }
        .renato-config-grid { display: grid; grid-template-columns: repeat(3, minmax(85px, 1fr)); gap: .55rem; }
        .renato-config-grid .form-group { margin: 0; }
        .renato-config-grid .form-label { margin-bottom: .3rem; font-size: .67rem; }
        .renato-config-grid .form-control { min-width: 0; height: 40px; padding: .55rem .65rem; }
        .renato-notes { grid-column: 1 / -1; }
        .renato-empty { padding: 1.1rem; border: 1px dashed rgba(255,255,255,.11); border-radius: 10px; color: var(--c-text-muted); font-size: .78rem; text-align: center; }
        .renato-builder-actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1rem; padding-top: .85rem; border-top: 1px solid rgba(255,255,255,.07); }
        .renato-secondary-section { margin-top: 1rem; }
        .renato-plans-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
        .renato-plan-card { display: flex; flex-direction: column; justify-content: space-between; min-width: 0; gap: .8rem; padding: .85rem; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; background: rgba(255,255,255,.025); }
        .renato-plan-day { display: inline-flex; margin-bottom: .45rem; padding: .2rem .45rem; border-radius: 999px; background: rgba(255,123,43,.11); color: var(--c-sunbeam); font-size: .66rem; font-weight: 700; }
        .renato-plan-actions { display: flex; flex-wrap: wrap; gap: .4rem; }
        .renato-plan-actions .btn { min-height: 34px; padding: .4rem .6rem; font-size: .68rem; }
        .renato-session-layout { display: grid; grid-template-columns: minmax(220px, .55fr) minmax(0, 1.45fr); gap: 1rem; align-items: start; }
        .renato-session-controls { display: grid; gap: .75rem; }
        .renato-session-summary { padding: .75rem; border-radius: 10px; background: rgba(255,123,43,.08); color: var(--c-text-muted); font-size: .75rem; line-height: 1.45; }
        .renato-session-submit { width: 100%; }
        .renato-custom-details { margin-top: 1rem; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; background: rgba(0,0,0,.16); }
        .renato-custom-details summary { padding: .85rem 1rem; cursor: pointer; color: var(--c-cream); font-size: .8rem; font-weight: 700; }
        .renato-custom-form { display: grid; grid-template-columns: 1.2fr 1fr .65fr auto; gap: .65rem; padding: 0 1rem 1rem; align-items: end; }
        .renato-custom-form .form-group { margin: 0; }
        .renato-custom-list { display: grid; gap: .45rem; padding: 0 1rem 1rem; }
        .renato-custom-item, .renato-history-item { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .65rem .75rem; border: 1px solid rgba(255,255,255,.06); border-radius: 9px; background: rgba(255,255,255,.02); }
        .renato-custom-item strong, .renato-history-item strong { display: block; font-size: .76rem; }
        .renato-custom-item small, .renato-history-item small { color: var(--c-text-muted); font-size: .67rem; }
        .renato-history-list { display: grid; gap: .45rem; }
        .renato-progression-list { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .45rem; }
        .renato-progression-badge { display: inline-flex; align-items: center; gap: .25rem; padding: .22rem .45rem; border-radius: 999px; background: rgba(255,255,255,.06); color: var(--c-text-muted); font-size: .61rem; font-weight: 750; }
        .renato-progression-badge.is-evolving { background: rgba(34,197,94,.14); color: #86efac; }
        .renato-progression-badge.is-stagnant { background: rgba(255,158,0,.14); color: var(--c-glow-core); }
        .renato-progression-badge.is-regressing { background: rgba(255,51,102,.14); color: #fda4af; }
        @media (max-width: 1050px) {
            .renato-planner-grid, .renato-session-layout { grid-template-columns: 1fr; }
            .renato-library-list { max-height: 300px; }
        }
        @media (max-width: 720px) {
            .renato-builder-meta, .renato-plans-grid, .renato-config-grid, .renato-custom-form { grid-template-columns: 1fr; }
            .renato-notes { grid-column: auto; }
            .renato-module-heading, .renato-exercise-card-head { align-items: stretch; flex-direction: column; }
            .renato-card-actions { align-self: flex-end; }
            .renato-builder-actions { flex-direction: column-reverse; }
            .renato-builder-actions .btn { width: 100%; }
        }
    `;

    function localDateString() {
        const date = new Date();
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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
        if (typeof window.getDB !== 'function' || typeof window.saveDB !== 'function') return null;
        const db = window.getDB();
        if (!db?.user) return null;
        db.customExercises ||= [];
        db.trainingPlans ||= [];
        db.weeklyRoutine ||= [];
        db.workouts ||= [];
        db.executions ||= [];
        return db;
    }

    function exerciseType(exercise) {
        return exercise?.type === 'cardio' || exercise?.category === 'Cardio' ? 'cardio' : 'strength';
    }

    function allExercises(db) {
        const library = (window.EXERCISES_DATABASE || []).map(exercise => ({ ...exercise, type: exerciseType(exercise), source: 'Biblioteca' }));
        const custom = (db.customExercises || []).map(exercise => ({ ...exercise, source: 'Criado por você' }));
        return [...library, ...custom];
    }

    function findExercise(exercises, id) {
        return exercises.find(exercise => String(exercise.id) === String(id));
    }

    function finiteNumber(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function defaultConfig(exercise, order = 0) {
        const type = exerciseType(exercise);
        return {
            exerciseId: exercise.id,
            type,
            order,
            sets: type === 'strength' ? finiteNumber(exercise.defaultSets, 3) : 1,
            reps: type === 'strength' ? finiteNumber(exercise.defaultReps, 10) : 1,
            weightKg: 0,
            restSeconds: type === 'strength' ? 60 : 0,
            durationMin: type === 'cardio' ? 30 : 0,
            distanceKm: 0,
            notes: ''
        };
    }

    function normalizeConfig(config, exercise, order) {
        return { ...defaultConfig(exercise, order), ...config, exerciseId: exercise.id, type: exerciseType(exercise), order };
    }

    function configsForPlan(plan, exercises) {
        const stored = Array.isArray(plan?.exerciseConfigs) && plan.exerciseConfigs.length
            ? [...plan.exerciseConfigs].sort((a, b) => finiteNumber(a.order) - finiteNumber(b.order))
            : (plan?.exerciseIds || []).map(exerciseId => ({ exerciseId }));
        return stored.map((config, index) => {
            const exercise = findExercise(exercises, config.exerciseId);
            return exercise ? normalizeConfig(config, exercise, index) : null;
        }).filter(Boolean);
    }

    function dayLabel(dayId) {
        if (dayId === null || dayId === undefined || dayId === '') return 'Qualquer dia';
        const numericDay = Number(dayId);
        return Number.isInteger(numericDay) && DAY_NAMES[numericDay] ? DAY_NAMES[numericDay] : 'Qualquer dia';
    }

    function comparableText(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function iconButton(icon, label, action, index, disabled = false) {
        const button = createElement('button', 'btn btn-secondary');
        button.type = 'button';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.dataset.action = action;
        button.dataset.index = String(index);
        button.disabled = disabled;
        button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        return button;
    }

    function field(labelText, value, fieldName, options = {}) {
        const group = createElement('div', `form-group${options.className ? ` ${options.className}` : ''}`);
        const label = createElement('label', 'form-label', labelText);
        const input = document.createElement(options.multiline ? 'textarea' : 'input');
        input.className = 'form-control';
        input.value = value ?? '';
        input.dataset.configField = fieldName;
        if (!options.multiline) {
            input.type = options.type || 'number';
            if (options.min !== undefined) input.min = String(options.min);
            if (options.step !== undefined) input.step = String(options.step);
        } else {
            input.rows = 1;
            input.placeholder = 'Observação opcional';
        }
        label.appendChild(input);
        group.appendChild(label);
        return group;
    }

    function renderConfigCard(config, exercise, index, mode) {
        const card = createElement('article', 'renato-exercise-card');
        card.dataset.configIndex = String(index);
        card.dataset.configMode = mode;
        const head = createElement('div', 'renato-exercise-card-head');
        const titleWrap = createElement('div', 'renato-exercise-title');
        titleWrap.appendChild(createElement('span', 'renato-order', String(index + 1)));
        const copy = createElement('div');
        copy.appendChild(createElement('strong', '', exercise.name));
        copy.appendChild(createElement('small', '', `${exercise.muscleGroup || exercise.muscle || exercise.category || 'Geral'} · ${config.type === 'cardio' ? 'Cardio' : 'Força'}`));
        titleWrap.appendChild(copy);
        head.appendChild(titleWrap);
        if (mode === 'draft') {
            const actions = createElement('div', 'renato-card-actions');
            actions.append(
                iconButton('fa-arrow-up', 'Mover para cima', 'move-up', index, index === 0),
                iconButton('fa-arrow-down', 'Mover para baixo', 'move-down', index, index === state.draft.length - 1),
                iconButton('fa-trash', 'Remover do treino', 'remove-draft', index)
            );
            head.appendChild(actions);
        }
        card.appendChild(head);
        const grid = createElement('div', 'renato-config-grid');
        if (config.type === 'cardio') {
            grid.append(
                field('Duração (min)', config.durationMin, 'durationMin', { min: 1, step: 1 }),
                field('Distância (km)', config.distanceKm, 'distanceKm', { min: 0, step: .1 }),
                field('Observações', config.notes, 'notes', { multiline: true, className: 'renato-notes' })
            );
        } else {
            grid.append(
                field('Séries', config.sets, 'sets', { min: 1, step: 1 }),
                field('Repetições', config.reps, 'reps', { min: 1, step: 1 }),
                field('Carga (kg)', config.weightKg, 'weightKg', { min: 0, step: .5 }),
                field('Descanso (s)', config.restSeconds, 'restSeconds', { min: 0, step: 5 }),
                field('Observações', config.notes, 'notes', { multiline: true, className: 'renato-notes' })
            );
        }
        card.appendChild(grid);
        return card;
    }

    function renderLibrary(root, exercises) {
        const list = root.querySelector('[data-library-list]');
        const count = root.querySelector('[data-library-count]');
        const selectedIds = new Set(state.draft.map(config => String(config.exerciseId)));
        const query = state.search.trim().toLocaleLowerCase('pt-BR');
        const filtered = exercises.filter(exercise => `${exercise.name} ${exercise.muscleGroup || ''} ${exercise.muscle || ''} ${exercise.category || ''}`.toLocaleLowerCase('pt-BR').includes(query));
        count.textContent = `${filtered.length} opções`;
        list.replaceChildren();
        if (!filtered.length) {
            list.appendChild(createElement('div', 'renato-empty', 'Nenhum exercício encontrado. Você também pode criar um exercício próprio abaixo.'));
            return;
        }
        filtered.forEach(exercise => {
            const item = createElement('div', 'renato-library-item');
            const copy = createElement('div');
            copy.appendChild(createElement('strong', '', exercise.name));
            copy.appendChild(createElement('small', '', `${exercise.muscleGroup || exercise.muscle || exercise.category || 'Geral'} · ${exercise.source}`));
            const button = createElement('button', 'btn btn-secondary renato-add-btn');
            button.type = 'button';
            button.dataset.action = 'add-exercise';
            button.dataset.exerciseId = exercise.id;
            button.disabled = selectedIds.has(String(exercise.id));
            button.title = button.disabled ? 'Já adicionado' : 'Adicionar ao treino';
            button.setAttribute('aria-label', button.title);
            button.innerHTML = `<i class="fa-solid ${button.disabled ? 'fa-check' : 'fa-plus'}"></i>`;
            item.append(copy, button);
            list.appendChild(item);
        });
    }

    function renderWeeklyMap(root, db) {
        const grid = root.querySelector('[data-week-grid]');
        if (!grid) return;
        grid.replaceChildren();
        const today = new Date().getDay();
        (db.weeklyRoutine || []).forEach(day => {
            const plan = db.trainingPlans.find(item => item.id === day.planId)
                || db.trainingPlans.find(item => item.dayId !== null && item.dayId !== undefined && Number(item.dayId) === Number(day.dayId));
            const button = createElement('button', `renato-day${day.dayId === today ? ' is-today' : ''}${plan ? ' is-linked' : ''}${day.restDay ? ' is-rest' : ''}`);
            button.type = 'button';
            button.dataset.action = 'select-routine-day';
            button.dataset.dayId = String(day.dayId);
            button.appendChild(createElement('b', '', `${day.shortName}${day.dayId === today ? ' · HOJE' : ''}`));
            button.appendChild(createElement('span', '', day.restDay ? 'Descanso' : plan?.name || day.focus || 'Treino livre'));
            button.appendChild(createElement('small', '', plan ? 'Clique para editar' : day.restDay ? 'Recuperação' : 'Clique para montar'));
            grid.appendChild(button);
        });
    }

    function renderDraft(root, exercises) {
        const list = root.querySelector('[data-draft-list]');
        root.querySelector('[data-draft-count]').textContent = `${state.draft.length} exercício${state.draft.length === 1 ? '' : 's'}`;
        root.querySelector('[data-builder-title]').textContent = state.editingPlanId ? 'Editar treino' : 'Novo treino';
        root.querySelector('[data-save-label]').textContent = state.editingPlanId ? 'Salvar alterações' : 'Salvar treino';
        list.replaceChildren();
        if (!state.draft.length) {
            list.appendChild(createElement('div', 'renato-empty', 'Adicione exercícios pela biblioteca. Depois ajuste séries, repetições, carga, descanso e a ordem.'));
            return;
        }
        state.draft.forEach((config, index) => {
            const exercise = findExercise(exercises, config.exerciseId);
            if (exercise) list.appendChild(renderConfigCard(config, exercise, index, 'draft'));
        });
    }

    function renderPlans(root, db, exercises) {
        const list = root.querySelector('[data-plan-list]');
        list.replaceChildren();
        if (!db.trainingPlans.length) {
            list.appendChild(createElement('div', 'renato-empty', 'Seus treinos salvos aparecerão aqui. Monte o primeiro treino acima.'));
            return;
        }
        db.trainingPlans.forEach(plan => {
            const configs = configsForPlan(plan, exercises);
            const names = configs.map(config => findExercise(exercises, config.exerciseId)?.name).filter(Boolean);
            const card = createElement('article', 'renato-plan-card');
            const copy = createElement('div');
            copy.appendChild(createElement('span', 'renato-plan-day', dayLabel(plan.dayId)));
            copy.appendChild(createElement('strong', '', plan.name));
            copy.appendChild(createElement('small', '', `${names.length} exercício${names.length === 1 ? '' : 's'} · ${names.slice(0, 4).join(', ')}${names.length > 4 ? '…' : ''}`));
            const actions = createElement('div', 'renato-plan-actions');
            const register = createElement('button', 'btn btn-primary', 'Registrar sessão');
            register.type = 'button'; register.dataset.action = 'use-plan'; register.dataset.planId = plan.id;
            const edit = createElement('button', 'btn btn-secondary', 'Editar');
            edit.type = 'button'; edit.dataset.action = 'edit-plan'; edit.dataset.planId = plan.id;
            const duplicate = createElement('button', 'btn btn-secondary', 'Duplicar');
            duplicate.type = 'button'; duplicate.dataset.action = 'duplicate-plan'; duplicate.dataset.planId = plan.id;
            const remove = iconButton('fa-trash', 'Excluir treino', 'delete-plan', 0);
            remove.dataset.planId = plan.id;
            actions.append(register, edit, duplicate, remove);
            card.append(copy, actions);
            list.appendChild(card);
        });
    }

    function renderSession(root, db, exercises) {
        const select = root.querySelector('[data-session-plan]');
        const previous = state.sessionPlanId;
        select.replaceChildren();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = db.trainingPlans.length ? 'Selecione um treino' : 'Crie um treino primeiro';
        select.appendChild(placeholder);
        db.trainingPlans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = plan.name;
            select.appendChild(option);
        });
        if ([...select.options].some(option => option.value === previous)) select.value = previous;
        const list = root.querySelector('[data-session-list]');
        const summary = root.querySelector('[data-session-summary]');
        const submit = root.querySelector('[data-session-submit]');
        list.replaceChildren();
        if (!state.sessionPlanId || !state.sessionConfigs.length) {
            list.appendChild(createElement('div', 'renato-empty', 'Escolha um treino salvo para revisar e registrar todos os exercícios de uma vez.'));
            summary.textContent = 'Você pode alterar carga, séries, repetições e observações somente para esta sessão.';
            submit.disabled = true;
            return;
        }
        state.sessionConfigs.forEach((config, index) => {
            const exercise = findExercise(exercises, config.exerciseId);
            if (exercise) list.appendChild(renderConfigCard(config, exercise, index, 'session'));
        });
        const plan = db.trainingPlans.find(item => item.id === state.sessionPlanId);
        summary.textContent = `${plan?.name || 'Treino'} · ${dayLabel(plan?.dayId)} · ${state.sessionConfigs.length} exercício${state.sessionConfigs.length === 1 ? '' : 's'}. Ajustes feitos aqui não alteram o modelo salvo.`;
        submit.disabled = false;
    }

    function renderCustomExercises(root, db) {
        const list = root.querySelector('[data-custom-list]');
        list.replaceChildren();
        if (!db.customExercises.length) {
            list.appendChild(createElement('div', 'renato-empty', 'Nenhum exercício próprio cadastrado.'));
            return;
        }
        db.customExercises.forEach(exercise => {
            const referenced = db.trainingPlans.some(plan => (plan.exerciseIds || []).includes(exercise.id)) || db.executions.some(execution => execution.exerciseId === exercise.id);
            const item = createElement('div', 'renato-custom-item');
            const copy = createElement('div');
            copy.appendChild(createElement('strong', '', exercise.name));
            copy.appendChild(createElement('small', '', `${exercise.muscleGroup} · ${exerciseType(exercise) === 'cardio' ? 'Cardio' : 'Força'}`));
            const button = iconButton('fa-trash', referenced ? 'Em uso: não pode ser removido' : 'Remover exercício', 'delete-custom', 0, referenced);
            button.dataset.exerciseId = exercise.id;
            item.append(copy, button);
            list.appendChild(item);
        });
    }

    function renderHistory(root, db) {
        const list = root.querySelector('[data-history-list]');
        list.replaceChildren();
        const recent = [...db.workouts].filter(workout => workout.status === 'completed').sort((a, b) => `${b.date || ''}${b.completedAt || ''}`.localeCompare(`${a.date || ''}${a.completedAt || ''}`)).slice(0, 5);
        if (!recent.length) {
            list.appendChild(createElement('div', 'renato-empty', 'As sessões concluídas aparecerão aqui.'));
            return;
        }
        recent.forEach(workout => {
            const executions = db.executions.filter(execution => execution.workoutId === workout.id);
            const totalVolume = executions.reduce((sum, execution) => sum + finiteNumber(execution.totalVolume), 0);
            const item = createElement('div', 'renato-history-item');
            const copy = createElement('div');
            copy.appendChild(createElement('strong', '', workout.name || 'Treino'));
            copy.appendChild(createElement('small', '', `${new Date(`${workout.date}T12:00:00`).toLocaleDateString('pt-BR')} · ${executions.length} exercício${executions.length === 1 ? '' : 's'} · ${totalVolume.toLocaleString('pt-BR')} kg de volume`));
            const progressionList = createElement('div', 'renato-progression-list');
            executions.forEach(execution => {
                const status = execution.comparisonStatus || 'Sem histórico';
                const statusClass = status === 'Evoluindo'
                    ? 'is-evolving'
                    : status === 'Estagnado'
                        ? 'is-stagnant'
                        : status === 'Regredindo'
                            ? 'is-regressing'
                            : '';
                const badge = createElement('span', `renato-progression-badge ${statusClass}`, `${execution.exerciseName || 'Exercício'}: ${status}`);
                progressionList.appendChild(badge);
            });
            if (executions.length) copy.appendChild(progressionList);
            item.appendChild(copy);
            list.appendChild(item);
        });
    }

    function renderAll() {
        const root = document.getElementById(MODULE_ID);
        const db = getDatabase();
        if (!root || !db) return;
        const exercises = allExercises(db);
        bridgeRoutinePlans(db, exercises);
        renderWeeklyMap(root, db);
        renderLibrary(root, exercises);
        renderDraft(root, exercises);
        renderPlans(root, db, exercises);
        if (!state.sessionPlanId) {
            const todayRoutine = db.weeklyRoutine.find(day => day.dayId === new Date().getDay());
            const todayPlan = db.trainingPlans.find(plan => plan.id === todayRoutine?.planId)
                || db.trainingPlans.find(plan => plan.dayId !== null && plan.dayId !== undefined && Number(plan.dayId) === new Date().getDay());
            if (todayPlan) loadPlanIntoSession(todayPlan, exercises);
        }
        renderSession(root, db, exercises);
        renderCustomExercises(root, db);
        renderHistory(root, db);
    }

    function resetBuilder(root) {
        state.editingPlanId = null;
        state.draft = [];
        root.querySelector('[name="planName"]').value = '';
        root.querySelector('[name="planDay"]').value = 'any';
        renderAll();
    }

    function loadPlanIntoSession(plan, exercises) {
        state.sessionPlanId = plan?.id || '';
        state.sessionConfigs = plan ? configsForPlan(plan, exercises).map(config => ({ ...config })) : [];
    }

    function planTargetSets(plan, exercises = []) {
        const configs = exercises.length ? configsForPlan(plan, exercises) : (plan?.exerciseConfigs || []);
        return configs.reduce((total, config) => config.type === 'cardio' ? total : total + finiteNumber(config.sets), 0);
    }

    function bridgeRoutinePlans(db, exercises) {
        let changed = false;
        db.weeklyRoutine.forEach(day => {
            if (day.restDay || day.planId || !day.focus) return;
            const plan = db.trainingPlans.find(item => comparableText(item.name) === comparableText(day.focus));
            if (!plan) return;
            day.planId = plan.id;
            if (plan.dayId === null || plan.dayId === undefined) plan.dayId = day.dayId;
            if (!finiteNumber(day.targetSets)) day.targetSets = planTargetSets(plan, exercises);
            changed = true;
        });
        if (changed) window.saveDB(db);
    }

    function syncPlanWithRoutine(db, plan, previousDayId) {
        if (previousDayId !== null && previousDayId !== undefined && Number(previousDayId) !== Number(plan.dayId)) {
            const previousDay = db.weeklyRoutine.find(day => Number(day.dayId) === Number(previousDayId));
            if (previousDay?.planId === plan.id) previousDay.planId = null;
        }
        if (plan.dayId === null || plan.dayId === undefined) return;
        const day = db.weeklyRoutine.find(item => Number(item.dayId) === Number(plan.dayId));
        if (!day) return;
        day.planId = plan.id;
        day.focus = plan.name;
        day.targetSets = planTargetSets(plan);
        day.restDay = false;
    }

    function progressionStatus(db, exerciseId, metric, value, date) {
        if (!Number.isFinite(value) || value <= 0) return 'Sem histórico';
        const previous = db.executions.filter(execution => execution.exerciseId === exerciseId && execution.date < date).filter(execution => execution.progressionMetric === metric && finiteNumber(execution.progressionValue) > 0).sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!previous) return 'Sem histórico';
        const ratio = value / finiteNumber(previous.progressionValue, value);
        if (ratio > 1.03) return 'Evoluindo';
        if (ratio < .97) return 'Regredindo';
        return 'Estagnado';
    }

    function createWorkout(db, plan, date) {
        let workout = db.workouts.find(item => item.date === date && item.planId === plan.id);
        if (!workout) {
            workout = { id: createId('workout'), date, name: plan.name, focus: plan.name, planId: plan.id, status: 'in_progress' };
            db.workouts.push(workout);
        }
        return workout;
    }

    function saveSession(root) {
        const db = getDatabase();
        if (!db) return;
        const exercises = allExercises(db);
        const plan = db.trainingPlans.find(item => item.id === state.sessionPlanId);
        const date = root.querySelector('[name="sessionDate"]').value;
        if (!plan) return notify('Selecione um treino para registrar.', 'danger');
        if (!date || date > localDateString()) return notify('A data da sessão é obrigatória e não pode ser futura.', 'danger');
        if (!state.sessionConfigs.length) return notify('Esse treino não possui exercícios válidos.', 'danger');
        for (const config of state.sessionConfigs) {
            if (config.type === 'cardio') {
                if (finiteNumber(config.durationMin) <= 0 || finiteNumber(config.distanceKm) < 0) return notify('No cardio, informe duração positiva e distância igual ou maior que zero.', 'danger');
            } else if (finiteNumber(config.sets) <= 0 || finiteNumber(config.reps) <= 0 || finiteNumber(config.weightKg) < 0) {
                return notify('Em exercícios de força, séries e repetições devem ser positivas e a carga não pode ser negativa.', 'danger');
            }
        }
        const workout = createWorkout(db, plan, date);
        state.sessionConfigs.forEach(config => {
            const exercise = findExercise(exercises, config.exerciseId);
            if (!exercise) return;
            let sets = [];
            let totalVolume = 0;
            let progressionValue = 0;
            let progressionMetric = 'volumeKg';
            let estimatedCalories = 0;
            if (config.type === 'cardio') {
                const durationMin = finiteNumber(config.durationMin);
                const distanceKm = finiteNumber(config.distanceKm);
                if (distanceKm > 0) {
                    progressionValue = distanceKm / (durationMin / 60);
                    progressionMetric = 'speedKmh';
                } else {
                    progressionValue = durationMin;
                    progressionMetric = 'durationMin';
                }
                estimatedCalories = Math.round(durationMin * 6);
            } else {
                const setCount = Math.round(finiteNumber(config.sets));
                const reps = Math.round(finiteNumber(config.reps));
                const weightKg = finiteNumber(config.weightKg);
                sets = Array.from({ length: setCount }, (_, index) => ({ setNum: index + 1, weightKg, reps, isHardSet: false, rpe: null }));
                totalVolume = weightKg * reps * setCount;
                progressionValue = totalVolume;
            }
            const execution = {
                id: createId('execution'), workoutId: workout.id, exerciseId: exercise.id, exerciseName: exercise.name,
                date, type: config.type, sets, totalVolume, progressionValue, progressionMetric,
                comparisonStatus: progressionStatus(db, exercise.id, progressionMetric, progressionValue, date),
                hardSetsCount: 0, plannedRestSeconds: finiteNumber(config.restSeconds), notes: String(config.notes || '').trim(),
                ...(config.type === 'cardio' ? { durationMin: finiteNumber(config.durationMin), distanceKm: finiteNumber(config.distanceKm), estimatedCalories } : {})
            };
            const existingIndex = db.executions.findIndex(item => item.workoutId === workout.id && item.exerciseId === exercise.id);
            if (existingIndex >= 0) execution.id = db.executions[existingIndex].id || execution.id;
            if (existingIndex >= 0) db.executions[existingIndex] = execution;
            else db.executions.push(execution);
        });
        workout.status = 'completed';
        workout.completedAt = new Date().toISOString();
        workout.exerciseIds = state.sessionConfigs.map(config => config.exerciseId);
        if (window.saveDB(db) === false) return;
        renderAll();
        notify(`Sessão “${plan.name}” registrada com ${state.sessionConfigs.length} exercícios.`, 'success');
    }

    function setupEventHandlers(root) {
        root.querySelector('[data-library-search]').addEventListener('input', event => {
            state.search = event.target.value;
            const db = getDatabase();
            if (db) renderLibrary(root, allExercises(db));
        });
        root.addEventListener('input', event => {
            const input = event.target.closest('[data-config-field]');
            if (!input) return;
            const card = input.closest('[data-config-index]');
            const index = Number(card?.dataset.configIndex);
            const collection = card?.dataset.configMode === 'session' ? state.sessionConfigs : state.draft;
            const config = collection[index];
            if (config) config[input.dataset.configField] = input.type === 'number' ? finiteNumber(input.value) : input.value;
        });
        root.addEventListener('click', event => {
            const button = event.target.closest('[data-action]');
            if (!button) return;
            const db = getDatabase();
            if (!db) return;
            const exercises = allExercises(db);
            const action = button.dataset.action;
            const index = Number(button.dataset.index);
            if (action === 'add-exercise') {
                const exercise = findExercise(exercises, button.dataset.exerciseId);
                if (exercise && !state.draft.some(config => String(config.exerciseId) === String(exercise.id))) state.draft.push(defaultConfig(exercise, state.draft.length));
                renderLibrary(root, exercises); renderDraft(root, exercises); return;
            }
            if (action === 'remove-draft') {
                state.draft.splice(index, 1); state.draft.forEach((config, order) => { config.order = order; });
                renderLibrary(root, exercises); renderDraft(root, exercises); return;
            }
            if (action === 'move-up' || action === 'move-down') {
                const destination = action === 'move-up' ? index - 1 : index + 1;
                if (destination >= 0 && destination < state.draft.length) {
                    [state.draft[index], state.draft[destination]] = [state.draft[destination], state.draft[index]];
                    state.draft.forEach((config, order) => { config.order = order; }); renderDraft(root, exercises);
                }
                return;
            }
            if (action === 'reset-builder') { resetBuilder(root); return; }
            if (action === 'select-routine-day') {
                const dayId = Number(button.dataset.dayId);
                const day = db.weeklyRoutine.find(item => Number(item.dayId) === dayId);
                const linkedPlan = db.trainingPlans.find(item => item.id === day?.planId)
                    || db.trainingPlans.find(item => item.dayId !== null && item.dayId !== undefined && Number(item.dayId) === dayId);
                if (linkedPlan) {
                    state.editingPlanId = linkedPlan.id;
                    state.draft = configsForPlan(linkedPlan, exercises).map(config => ({ ...config }));
                    root.querySelector('[name="planName"]').value = linkedPlan.name;
                } else {
                    state.editingPlanId = null;
                    state.draft = [];
                    root.querySelector('[name="planName"]').value = day && !day.restDay ? day.focus || '' : '';
                }
                root.querySelector('[name="planDay"]').value = String(dayId);
                renderLibrary(root, exercises);
                renderDraft(root, exercises);
                root.querySelector('[data-builder-panel]').scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            const plan = db.trainingPlans.find(item => item.id === button.dataset.planId);
            if (action === 'edit-plan' && plan) {
                state.editingPlanId = plan.id;
                state.draft = configsForPlan(plan, exercises).map(config => ({ ...config }));
                root.querySelector('[name="planName"]').value = plan.name;
                root.querySelector('[name="planDay"]').value = plan.dayId === null || plan.dayId === undefined ? 'any' : String(plan.dayId);
                renderLibrary(root, exercises); renderDraft(root, exercises);
                root.querySelector('[data-builder-panel]').scrollIntoView({ behavior: 'smooth', block: 'start' }); return;
            }
            if (action === 'duplicate-plan' && plan) {
                const clone = { ...plan, id: createId('plan'), name: `${plan.name} (cópia)`, dayId: null, exerciseIds: [...(plan.exerciseIds || [])], exerciseConfigs: configsForPlan(plan, exercises).map(config => ({ ...config })), createdAt: new Date().toISOString() };
                db.trainingPlans.push(clone);
                if (window.saveDB(db) === false) return;
                renderAll(); notify('Treino duplicado. Agora você pode editar a cópia para outro dia.', 'success'); return;
            }
            if (action === 'use-plan' && plan) {
                loadPlanIntoSession(plan, exercises); renderSession(root, db, exercises);
                root.querySelector('[data-session-panel]').scrollIntoView({ behavior: 'smooth', block: 'start' }); return;
            }
            if (action === 'delete-plan' && plan) {
                if (!window.confirm(`Excluir o treino “${plan.name}”? O histórico já registrado será mantido.`)) return;
                db.trainingPlans = db.trainingPlans.filter(item => item.id !== plan.id);
                db.weeklyRoutine.forEach(day => { if (day.planId === plan.id) day.planId = null; });
                if (state.editingPlanId === plan.id) { state.editingPlanId = null; state.draft = []; }
                if (state.sessionPlanId === plan.id) loadPlanIntoSession(null, exercises);
                if (window.saveDB(db) === false) return;
                renderAll(); notify('Treino excluído. O histórico foi preservado.', 'success'); return;
            }
            if (action === 'delete-custom') {
                db.customExercises = db.customExercises.filter(exercise => String(exercise.id) !== String(button.dataset.exerciseId));
                if (window.saveDB(db) === false) return;
                renderAll(); notify('Exercício removido.', 'success');
            }
        });
        root.querySelector('[data-plan-form]').addEventListener('submit', event => {
            event.preventDefault();
            const db = getDatabase();
            if (!db) return;
            const name = event.currentTarget.elements.planName.value.trim();
            const dayValue = event.currentTarget.elements.planDay.value;
            if (name.length < 2) return notify('Informe um nome para o treino.', 'danger');
            if (!state.draft.length) return notify('Adicione pelo menos um exercício.', 'danger');
            const exerciseConfigs = state.draft.map((config, order) => ({ ...config, order }));
            const payload = { name, dayId: dayValue === 'any' ? null : Number(dayValue), exerciseIds: exerciseConfigs.map(config => config.exerciseId), exerciseConfigs, updatedAt: new Date().toISOString() };
            const existing = db.trainingPlans.find(plan => plan.id === state.editingPlanId);
            const previousDayId = existing?.dayId;
            const savedPlan = existing || { id: createId('plan'), createdAt: new Date().toISOString() };
            Object.assign(savedPlan, payload);
            if (!existing) db.trainingPlans.push(savedPlan);
            syncPlanWithRoutine(db, savedPlan, previousDayId);
            if (window.saveDB(db) === false) return;
            const message = existing ? 'Treino atualizado.' : 'Treino salvo.';
            resetBuilder(root); notify(message, 'success');
        });
        root.querySelector('[data-session-plan]').addEventListener('change', event => {
            const db = getDatabase();
            if (!db) return;
            const exercises = allExercises(db);
            loadPlanIntoSession(db.trainingPlans.find(item => item.id === event.target.value), exercises);
            renderSession(root, db, exercises);
        });
        root.querySelector('[data-session-form]').addEventListener('submit', event => { event.preventDefault(); saveSession(root); });
        root.querySelector('[data-custom-form]').addEventListener('submit', event => {
            event.preventDefault();
            const db = getDatabase();
            if (!db) return;
            const form = event.currentTarget;
            const name = form.elements.exerciseName.value.trim();
            const muscleGroup = form.elements.muscleGroup.value.trim();
            const type = form.elements.exerciseType.value;
            if (name.length < 2 || !muscleGroup) return notify('Informe o nome e o grupo muscular.', 'danger');
            if (allExercises(db).some(exercise => exercise.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) return notify('Já existe um exercício com esse nome.', 'danger');
            db.customExercises.push({ id: createId('custom_ex'), name, muscleGroup, muscle: muscleGroup, category: type === 'cardio' ? 'Cardio' : 'Força', type, defaultSets: type === 'cardio' ? 1 : 3, defaultReps: type === 'cardio' ? 1 : 10, createdAt: new Date().toISOString() });
            if (window.saveDB(db) === false) return;
            form.reset(); renderAll(); notify('Exercício cadastrado e disponível na biblioteca.', 'success');
        });
        const view = document.getElementById('view-workouts');
        if (view) new MutationObserver(() => { if (view.classList.contains('active')) renderAll(); }).observe(view, { attributes: true, attributeFilter: ['class'] });
    }

    function mount() {
        if (document.getElementById(MODULE_ID)) return;
        const mountPoint = document.getElementById('renatoTrainingMount');
        if (!mountPoint) return;
        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style'); style.id = STYLE_ID; style.textContent = styles; document.head.appendChild(style);
        }
        const root = document.createElement('section');
        root.id = MODULE_ID;
        root.className = 'card renato-training-manager';
        root.innerHTML = `
            <div class="renato-module-heading">
                <div><span class="renato-step"><i class="fa-solid fa-wand-magic-sparkles"></i> Construtor de treino</span><h2>Monte seu treino por dia</h2><p>Escolha os exercícios, organize a ordem e personalize cada detalhe antes de salvar.</p></div>
                <span class="brand-tag">SALVAMENTO LOCAL</span>
            </div>
            <section class="renato-week">
                <div class="renato-week-head"><strong>Sua rotina semanal</strong><span>Clique em um dia para montar ou editar o treino vinculado.</span></div>
                <div class="renato-week-grid" data-week-grid></div>
            </section>
            <div class="renato-planner-grid">
                <aside class="renato-panel">
                    <div class="renato-panel-head"><h3>1. Escolha os exercícios</h3><span class="renato-count" data-library-count></span></div>
                    <label class="form-label" for="renatoLibrarySearch">Buscar na biblioteca</label><input class="form-control" id="renatoLibrarySearch" data-library-search type="search" placeholder="Ex.: peito, remada, corrida…"><div class="renato-library-list" data-library-list></div>
                </aside>
                <form class="renato-panel" data-plan-form data-builder-panel>
                    <div class="renato-panel-head"><h3 data-builder-title>Novo treino</h3><span class="renato-count" data-draft-count>0 exercícios</span></div>
                    <div class="renato-builder-meta">
                        <div class="form-group"><label class="form-label" for="renatoPlanName">Nome do treino</label><input class="form-control" id="renatoPlanName" name="planName" required minlength="2" placeholder="Ex.: Peito e tríceps"></div>
                        <div class="form-group"><label class="form-label" for="renatoPlanDay">Dia planejado</label><select class="form-control" id="renatoPlanDay" name="planDay"><option value="any">Qualquer dia</option><option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option><option value="4">Quinta-feira</option><option value="5">Sexta-feira</option><option value="6">Sábado</option><option value="0">Domingo</option></select></div>
                    </div>
                    <div class="renato-selected-list" data-draft-list></div>
                    <div class="renato-builder-actions"><button class="btn btn-secondary" type="button" data-action="reset-builder">Limpar</button><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> <span data-save-label>Salvar treino</span></button></div>
                </form>
            </div>
            <section class="renato-panel renato-secondary-section"><div class="renato-panel-head"><div><span class="renato-step">Seus modelos</span><h3>Treinos salvos</h3></div></div><div class="renato-plans-grid" data-plan-list></div></section>
            <form class="renato-panel renato-secondary-section" data-session-form data-session-panel>
                <div class="renato-panel-head"><div><span class="renato-step">Registro rápido</span><h3>Registrar uma sessão completa</h3></div></div>
                <div class="renato-session-layout">
                    <div class="renato-session-controls">
                        <div class="form-group"><label class="form-label" for="renatoSessionPlan">Treino</label><select class="form-control" id="renatoSessionPlan" data-session-plan name="sessionPlanId"></select></div>
                        <div class="form-group"><label class="form-label" for="renatoSessionDate">Data da sessão</label><input class="form-control" id="renatoSessionDate" name="sessionDate" type="date" required></div>
                        <div class="renato-session-summary" data-session-summary></div><button class="btn btn-primary renato-session-submit" data-session-submit type="submit"><i class="fa-solid fa-check"></i> Concluir e registrar treino</button>
                    </div>
                    <div class="renato-session-list" data-session-list></div>
                </div>
            </form>
            <details class="renato-custom-details">
                <summary><i class="fa-solid fa-plus"></i> Não encontrou um exercício? Criar exercício próprio</summary>
                <form class="renato-custom-form" data-custom-form>
                    <div class="form-group"><label class="form-label" for="renatoExerciseName">Nome</label><input class="form-control" id="renatoExerciseName" name="exerciseName" required minlength="2" placeholder="Ex.: Elevação pélvica"></div>
                    <div class="form-group"><label class="form-label" for="renatoMuscleGroup">Grupo muscular</label><input class="form-control" id="renatoMuscleGroup" name="muscleGroup" required placeholder="Ex.: Glúteos"></div>
                    <div class="form-group"><label class="form-label" for="renatoExerciseType">Tipo</label><select class="form-control" id="renatoExerciseType" name="exerciseType"><option value="strength">Força</option><option value="cardio">Cardio</option></select></div>
                    <button class="btn btn-secondary" type="submit">Cadastrar</button>
                </form><div class="renato-custom-list" data-custom-list></div>
            </details>
            <section class="renato-panel renato-secondary-section"><div class="renato-panel-head"><h3>Sessões recentes</h3></div><div class="renato-history-list" data-history-list></div></section>
        `;
        mountPoint.appendChild(root);
        root.querySelector('[name="sessionDate"]').value = localDateString();
        root.querySelector('[name="sessionDate"]').max = localDateString();
        setupEventHandlers(root);
        renderAll();
        window.renderRenatoTrainingManager = renderAll;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
