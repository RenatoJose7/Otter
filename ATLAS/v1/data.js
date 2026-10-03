/**
 * HACKTOON - Plataforma de Treino e Dieta
 * data.js: Base de dados estruturada TACO, Banco de Exercícios, Rotina Padrão e Gerador de Seed Data (14 Dias)
 */

// ==========================================
// 1. TABELA TACO (Tabela Brasileira de Composição de Alimentos)
// Valores nutricionais médios por 100g de alimento
// ==========================================
const LEGACY_TACO_DATABASE = [
  // --- CARNES, AVES E PEIXES ---
  { id: 'taco_01', name: 'Peito de Frango grelhado/cozido', category: 'Aves', calories: 159, protein: 31.5, carbs: 0.0, fat: 2.5, fiber: 0.0, defaultServing: 150 },
  { id: 'taco_02', name: 'Patinho bovino grelhado', category: 'Carnes', calories: 219, protein: 35.9, carbs: 0.0, fat: 7.3, fiber: 0.0, defaultServing: 150 },
  { id: 'taco_03', name: 'Alcatra bovina grelhada', category: 'Carnes', calories: 241, protein: 31.9, carbs: 0.0, fat: 11.6, fiber: 0.0, defaultServing: 150 },
  { id: 'taco_04', name: 'Filé de Tilápia grelhado', category: 'Peixes', calories: 128, protein: 26.1, carbs: 0.0, fat: 2.7, fiber: 0.0, defaultServing: 180 },
  { id: 'taco_05', name: 'Atum sólido em água (enlatado)', category: 'Peixes', calories: 116, protein: 26.2, carbs: 0.0, fat: 1.0, fiber: 0.0, defaultServing: 120 },
  { id: 'taco_06', name: 'Salmão filé grelhado', category: 'Peixes', calories: 229, protein: 23.9, carbs: 0.0, fat: 14.1, fiber: 0.0, defaultServing: 150 },
  { id: 'taco_07', name: 'Carne Moída (Acém cozido)', category: 'Carnes', calories: 212, protein: 26.7, carbs: 0.0, fat: 10.9, fiber: 0.0, defaultServing: 150 },
  { id: 'taco_08', name: 'Sobrecoxa de Frango sem pele', category: 'Aves', calories: 162, protein: 28.8, carbs: 0.0, fat: 4.6, fiber: 0.0, defaultServing: 150 },

  // --- OVOS E LATICÍNIOS ---
  { id: 'taco_09', name: 'Ovo de galinha inteiro cozido', category: 'Ovos', calories: 146, protein: 13.3, carbs: 0.6, fat: 9.5, fiber: 0.0, defaultServing: 100 },
  { id: 'taco_10', name: 'Clara de ovo cozida', category: 'Ovos', calories: 52, protein: 11.0, carbs: 0.7, fat: 0.2, fiber: 0.0, defaultServing: 120 },
  { id: 'taco_11', name: 'Queijo Cottage', category: 'Laticínios', calories: 98, protein: 11.1, carbs: 3.4, fat: 4.3, fiber: 0.0, defaultServing: 100 },
  { id: 'taco_12', name: 'Queijo Minas Frescal', category: 'Laticínios', calories: 227, protein: 17.4, carbs: 3.2, fat: 16.0, fiber: 0.0, defaultServing: 60 },
  { id: 'taco_13', name: 'Leite desnatado fluido', category: 'Laticínios', calories: 35, protein: 3.4, carbs: 5.0, fat: 0.1, fiber: 0.0, defaultServing: 200 },
  { id: 'taco_14', name: 'Leite integral fluido', category: 'Laticínios', calories: 60, protein: 3.2, carbs: 4.8, fat: 3.2, fiber: 0.0, defaultServing: 200 },
  { id: 'taco_15', name: 'Iogurte natural desnatado', category: 'Laticínios', calories: 41, protein: 3.8, carbs: 5.8, fat: 0.3, fiber: 0.0, defaultServing: 170 },

  // --- CARBOIDRATOS & CEREAIS ---
  { id: 'taco_16', name: 'Arroz branco cozido', category: 'Cereais', calories: 128, protein: 2.5, carbs: 28.1, fat: 0.2, fiber: 1.6, defaultServing: 150 },
  { id: 'taco_17', name: 'Arroz integral cozido', category: 'Cereais', calories: 124, protein: 2.6, carbs: 25.8, fat: 1.0, fiber: 2.7, defaultServing: 150 },
  { id: 'taco_18', name: 'Feijão preto cozido (50% grão/caldo)', category: 'Leguminosas', calories: 77, protein: 4.5, carbs: 14.0, fat: 0.5, fiber: 8.4, defaultServing: 130 },
  { id: 'taco_19', name: 'Feijão carioca cozido', category: 'Leguminosas', calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5, defaultServing: 130 },
  { id: 'taco_20', name: 'Batata doce cozida', category: 'Tubérculos', calories: 77, protein: 0.6, carbs: 18.4, fat: 0.1, fiber: 2.2, defaultServing: 150 },
  { id: 'taco_21', name: 'Batata inglesa cozida', category: 'Tubérculos', calories: 52, protein: 1.2, carbs: 11.9, fat: 0.0, fiber: 1.3, defaultServing: 150 },
  { id: 'taco_22', name: 'Mandioca cozida (Aipim)', category: 'Tubérculos', calories: 125, protein: 0.6, carbs: 30.1, fat: 0.3, fiber: 1.6, defaultServing: 130 },
  { id: 'taco_23', name: 'Aveia em flocos finos', category: 'Cereais', calories: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1, defaultServing: 40 },
  { id: 'taco_24', name: 'Macarrão cozido al dente', category: 'Cereais', calories: 141, protein: 4.5, carbs: 28.5, fat: 0.8, fiber: 1.8, defaultServing: 150 },
  { id: 'taco_25', name: 'Pão de forma integral', category: 'Cereais', calories: 253, protein: 9.4, carbs: 49.9, fat: 3.7, fiber: 6.9, defaultServing: 50 },
  { id: 'taco_26', name: 'Pão francês de trigo', category: 'Cereais', calories: 300, protein: 8.0, carbs: 58.7, fat: 3.1, fiber: 2.3, defaultServing: 50 },

  // --- FRUTAS E VEGETAIS ---
  { id: 'taco_27', name: 'Banana prata crua', category: 'Frutas', calories: 98, protein: 1.3, carbs: 26.0, fat: 0.1, fiber: 2.0, defaultServing: 100 },
  { id: 'taco_28', name: 'Maçã Fuji com casca', category: 'Frutas', calories: 56, protein: 0.3, carbs: 15.2, fat: 0.2, fiber: 1.3, defaultServing: 130 },
  { id: 'taco_29', name: 'Morango cru', category: 'Frutas', calories: 30, protein: 0.9, carbs: 6.8, fat: 0.3, fiber: 1.7, defaultServing: 150 },
  { id: 'taco_30', name: 'Mamão papaia cru', category: 'Frutas', calories: 40, protein: 0.5, carbs: 10.4, fat: 0.1, fiber: 1.0, defaultServing: 150 },
  { id: 'taco_31', name: 'Brócolis cozido', category: 'Vegetais', calories: 25, protein: 2.1, carbs: 4.4, fat: 0.5, fiber: 3.4, defaultServing: 100 },
  { id: 'taco_32', name: 'Cenoura crua ralada', category: 'Vegetais', calories: 34, protein: 1.3, carbs: 7.7, fat: 0.2, fiber: 3.2, defaultServing: 80 },

  // --- GORDURAS, OLEAGINOSAS E SUPLEMENTOS ---
  { id: 'taco_33', name: 'Azeite de Oliva Extravirgem', category: 'Gorduras', calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0.0, defaultServing: 13 },
  { id: 'taco_34', name: 'Pasta de Amendoim Integral', category: 'Gorduras', calories: 588, protein: 25.0, carbs: 20.0, fat: 50.0, fiber: 8.0, defaultServing: 30 },
  { id: 'taco_35', name: 'Castanha-do-Pará', category: 'Oleaginosas', calories: 643, protein: 14.5, carbs: 15.1, fat: 63.5, fiber: 7.9, defaultServing: 20 },
  { id: 'taco_36', name: 'Abacate cru', category: 'Gorduras', calories: 96, protein: 1.2, carbs: 6.0, fat: 8.4, fiber: 6.3, defaultServing: 100 },
  { id: 'taco_37', name: 'Whey Protein Concentrado 80%', category: 'Suplementos', calories: 400, protein: 80.0, carbs: 8.0, fat: 6.0, fiber: 0.0, defaultServing: 30 },
  { id: 'taco_38', name: 'Creatina Monohidratada', category: 'Suplementos', calories: 0, protein: 0.0, carbs: 0.0, fat: 0.0, fiber: 0.0, defaultServing: 5 },
  { id: 'taco_39', name: 'Lenteilha cozida', category: 'Leguminosas', calories: 93, protein: 6.3, carbs: 16.3, fat: 0.5, fiber: 7.9, defaultServing: 120 },
  { id: 'taco_40', name: 'Tofu firme tradicional', category: 'Leguminosas', calories: 76, protein: 8.1, carbs: 1.9, fat: 4.8, fiber: 0.3, defaultServing: 100 }
];

// foods.js fornece o catálogo ampliado; a lista legada mantém o app funcional
// caso este arquivo seja aberto isoladamente durante o desenvolvimento.
const TACO_DATABASE = window.TACO_DATABASE || LEGACY_TACO_DATABASE;

// ==========================================
// 2. BANCO DE EXERCÍCIOS & SUBSTITUIÇÕES EQUIVALENTES
// Inclui movimentos de força e cardio, tipo de equipamento e alternativas
// ==========================================
const EXERCISES_DATABASE = [
  // --- PEITORAL ---
  {
    id: 'ex_supino_reto_barra',
    name: 'Supino Reto com Barra',
    category: 'Força',
    muscle: 'Peitoral Maior',
    equipment: 'Barra Olímpica e Banco Reto',
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSec: 120,
    animationType: 'bench_press',
    instructions: 'Deite no banco, apoie as escápulas, desça a barra até a linha dos mamilos e empurre com controle.',
    equivalents: [
      { id: 'ex_supino_reto_halteres', name: 'Supino Reto com Halteres', reason: 'Mesma linha de força com maior amplitude livre' },
      { id: 'ex_supino_articulado', name: 'Supino Máquina Articulada', reason: 'Excelente estabilidade e segurança mecânica' },
      { id: 'ex_flexao_braco', name: 'Flexão de Braços (Solo)', reason: 'Substituição livre com peso corporal' }
    ]
  },
  {
    id: 'ex_supino_reto_halteres',
    name: 'Supino Reto com Halteres',
    category: 'Força',
    muscle: 'Peitoral Maior',
    equipment: 'Halteres e Banco Reto',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSec: 90,
    animationType: 'bench_press',
    instructions: 'Com halteres na largura do peito, desça alinhando os cotovelos a 75 graus do tronco e suba contraindo.',
    equivalents: [
      { id: 'ex_supino_reto_barra', name: 'Supino Reto com Barra', reason: 'Carga mais estável para progressão pura' },
      { id: 'ex_supino_articulado', name: 'Supino Máquina Articulada', reason: 'Máquina isolada caso os halteres estejam ocupados' }
    ]
  },
  {
    id: 'ex_supino_inclinado_halteres',
    name: 'Supino Inclinado com Halteres',
    category: 'Força',
    muscle: 'Peitoral Superior (Clavicular)',
    equipment: 'Halteres e Banco a 30-45°',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSec: 90,
    animationType: 'incline_press',
    instructions: 'Banco inclinado a 30-40 graus. Pressione verticalmente focalizando na porção clavicular do peito.',
    equivalents: [
      { id: 'ex_supino_inclinado_barra', name: 'Supino Inclinado com Barra', reason: 'Equivalente clássico com barra' },
      { id: 'ex_crossover_polia_baixa', name: 'Crossover na Polia Baixa', reason: 'Tensão contínua na porção superior do peito' }
    ]
  },
  {
    id: 'ex_peck_deck',
    name: 'Crucifixo na Máquina (Peck Deck)',
    category: 'Força',
    muscle: 'Peitoral Maior (Isolador)',
    equipment: 'Máquina Peck Deck / Voador',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    animationType: 'fly',
    instructions: 'Braços levemente flexionados, traga os pegadores à frente aproximando o peitoral em pico de contração.',
    equivalents: [
      { id: 'ex_crucifixo_halteres', name: 'Crucifixo Reto com Halteres', reason: 'Alternativa com pesos livres e bom alongamento' },
      { id: 'ex_crossover_polia_media', name: 'Crossover na Polia Média', reason: 'Mesmo plano horizontal com cabos' }
    ]
  },

  // --- DORSAL / COSTAS ---
  {
    id: 'ex_puxada_alta',
    name: 'Puxada Alta Frontal (Pulley)',
    category: 'Força',
    muscle: 'Latíssimo do Dorso',
    equipment: 'Polia Alta (Pulley)',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSec: 90,
    animationType: 'lat_pulldown',
    instructions: 'Pegada aberta pronada. Puxe a barra em direção ao início do peitoral, deprimindo as escápulas.',
    equivalents: [
      { id: 'ex_barra_fixa', name: 'Barra Fixa (Pull-up)', reason: 'Movimento calistênico equivalente padrão ouro' },
      { id: 'ex_puxada_triangulo', name: 'Puxada com Triângulo Fechado', reason: 'Variação neutra de alta ativação dorsal' }
    ]
  },
  {
    id: 'ex_remada_curvada_barra',
    name: 'Remada Curvada com Barra',
    category: 'Força',
    muscle: 'Dorsal e Rombóides',
    equipment: 'Barra Olímpica',
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSec: 120,
    animationType: 'bent_row',
    instructions: 'Tronco inclinado a 45 graus, coluna ereta e core travado. Traga a barra na altura do umbigo.',
    equivalents: [
      { id: 'ex_remada_cavalinho', name: 'Remada Cavalinho (Barra T)', reason: 'Mesmo padrão de tração horizontal com menor torque lombar' },
      { id: 'ex_remada_baixa_triangulo', name: 'Remada Baixa com Triângulo', reason: 'Máquina de cabo muito estável e segura' },
      { id: 'ex_remada_serrote', name: 'Remada Unilateral com Halter (Serrote)', reason: 'Trabalho unilateral com halter livre' }
    ]
  },
  {
    id: 'ex_remada_baixa_triangulo',
    name: 'Remada Baixa com Triângulo (Polia)',
    category: 'Força',
    muscle: 'Dorsal e Trapézio Médio',
    equipment: 'Polia Baixa',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 75,
    animationType: 'seated_row',
    instructions: 'Coluna alinhada, puxe o triângulo até o abdômen espremendo as escápulas ao final.',
    equivalents: [
      { id: 'ex_remada_maquina_articulada', name: 'Remada na Máquina Articulada', reason: 'Tração neutra com peitoral apoiado' },
      { id: 'ex_remada_curvada_barra', name: 'Remada Curvada com Barra', reason: 'Versão em peso livre' }
    ]
  },

  // --- MEMBROS INFERIORES ---
  {
    id: 'ex_agachamento_livre',
    name: 'Agachamento Livre com Barra',
    category: 'Força',
    muscle: 'Quadríceps, Glúteos e Core',
    equipment: 'Gaiola e Barra Olímpica',
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSec: 150,
    animationType: 'squat',
    instructions: 'Barra no trapézio, pés afastados na largura dos ombros. Agache até o quadril passar a linha dos joelhos.',
    equivalents: [
      { id: 'ex_leg_press_45', name: 'Leg Press 45º', reason: 'Mesma cadeia muscular com menor estresse na coluna' },
      { id: 'ex_agachamento_hack', name: 'Agachamento no Hack Machine', reason: 'Movimento guiado ideal para sobrecarga' },
      { id: 'ex_agachamento_smith', name: 'Agachamento no Smith', reason: 'Trajetória fixa caso a gaiola esteja cheia' }
    ]
  },
  {
    id: 'ex_leg_press_45',
    name: 'Leg Press 45º',
    category: 'Força',
    muscle: 'Quadríceps e Glúteos',
    equipment: 'Aparelho Leg Press 45',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSec: 120,
    animationType: 'leg_press',
    instructions: 'Pés na metade da plataforma na largura dos ombros. Desça até 90 graus sem descolar a lombar do encosto.',
    equivalents: [
      { id: 'ex_agachamento_hack', name: 'Agachamento no Hack Machine', reason: 'Mesma intensidade de quadríceps' },
      { id: 'ex_agachamento_livre', name: 'Agachamento Livre com Barra', reason: 'Movimento livre completo' }
    ]
  },
  {
    id: 'ex_cadeira_extensora',
    name: 'Cadeira Extensora',
    category: 'Força',
    muscle: 'Quadríceps (Isolador)',
    equipment: 'Cadeira Extensora',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    animationType: 'leg_extension',
    instructions: 'Apoio sobre os tornozelos. Estenda totalmente as pernas segurando 1s no pico de contração.',
    equivalents: [
      { id: 'ex_afundo_halteres', name: 'Afundo / Passada com Halteres', reason: 'Excelente trabalho dinâmico de quadríceps' },
      { id: 'ex_sissy_squat', name: 'Sissy Squat Livre', reason: 'Isolamento de quadríceps com peso corporal' }
    ]
  },
  {
    id: 'ex_stiff_barra',
    name: 'Stiff com Barra (RDL)',
    category: 'Força',
    muscle: 'Posterior de Coxa e Glúteo',
    equipment: 'Barra Olímpica',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSec: 90,
    animationType: 'deadlift',
    instructions: 'Joelhos semi-flexionados, empurre o quadril para trás mantendo as costas neutras sentindo o posterior alongar.',
    equivalents: [
      { id: 'ex_mesa_flexora', name: 'Mesa Flexora Deitada', reason: 'Flexão pura de joelho isolando os isquiotibiais' },
      { id: 'ex_stiff_halteres', name: 'Stiff com Halteres', reason: 'Maior controle do alinhamento dos punhos e escápulas' }
    ]
  },
  {
    id: 'ex_mesa_flexora',
    name: 'Mesa Flexora Deitada',
    category: 'Força',
    muscle: 'Isquiotibiais (Posterior)',
    equipment: 'Aparelho Mesa Flexora',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    animationType: 'leg_curl',
    instructions: 'Deitado em decúbito ventral, flexione os joelhos levando o rolo em direção aos glúteos.',
    equivalents: [
      { id: 'ex_cadeira_flexora', name: 'Cadeira Flexora Sentada', reason: 'Alternativa sentada que alonga mais o posterior' },
      { id: 'ex_stiff_barra', name: 'Stiff com Barra (RDL)', reason: 'Movimento composto livre' }
    ]
  },

  // --- OMBROS & BRAÇOS ---
  {
    id: 'ex_desenvolvimento_halteres',
    name: 'Desenvolvimento com Halteres',
    category: 'Força',
    muscle: 'Deltoide Anterior e Lateral',
    equipment: 'Halteres e Banco 90°',
    defaultSets: 4,
    defaultReps: 10,
    defaultRestSec: 90,
    animationType: 'overhead_press',
    instructions: 'Sentado no banco com apoio, empurre os halteres acima da cabeça sem bater os pesos no topo.',
    equivalents: [
      { id: 'ex_desenvolvimento_barra_militar', name: 'Desenvolvimento Militar com Barra', reason: 'Movimento em pé de alta ativação de core' },
      { id: 'ex_desenvolvimento_maquina', name: 'Desenvolvimento na Máquina', reason: 'Máquina guiada com trajetória controlada' }
    ]
  },
  {
    id: 'ex_elevacao_lateral_halteres',
    name: 'Elevação Lateral com Halteres',
    category: 'Força',
    muscle: 'Deltoide Lateral',
    equipment: 'Halteres',
    defaultSets: 4,
    defaultReps: 12,
    defaultRestSec: 60,
    animationType: 'lateral_raise',
    instructions: 'Eleve os braços lateralmente até a linha dos ombros mantendo o mindinho ligeiramente mais alto que o polegar.',
    equivalents: [
      { id: 'ex_elevacao_lateral_polia', name: 'Elevação Lateral na Polia Baixa', reason: 'Tensão contínua durante todo o arco do movimento' },
      { id: 'ex_elevacao_lateral_maquina', name: 'Elevação Lateral Máquina', reason: 'Isolamento estrito dos ombros' }
    ]
  },
  {
    id: 'ex_rosca_direta_barra_w',
    name: 'Rosca Direta com Barra W',
    category: 'Força',
    muscle: 'Bíceps Braquial',
    equipment: 'Barra W e Anilhas',
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 60,
    animationType: 'bicep_curl',
    instructions: 'Cotovelos colados ao tronco, flexione os braços controlando a descida excêntrica.',
    equivalents: [
      { id: 'ex_rosca_alternada_halteres', name: 'Rosca Alternada com Halteres', reason: 'Permite rotação e supinação livre dos punhos' },
      { id: 'ex_rosca_scott', name: 'Rosca Scott no Banco', reason: 'Impede o uso de embalo do tronco' }
    ]
  },
  {
    id: 'ex_triceps_corda_polia',
    name: 'Tríceps Corda na Polia Alta',
    category: 'Força',
    muscle: 'Tríceps (Cabeça Lateral)',
    equipment: 'Polia Alta e Corda',
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    animationType: 'tricep_pushdown',
    instructions: 'Empurre a corda para baixo abrindo as pontas no final do movimento para contração máxima.',
    equivalents: [
      { id: 'ex_triceps_barra_reta', name: 'Tríceps Barra Reta na Polia', reason: 'Permite cargas ligeiramente maiores' },
      { id: 'ex_triceps_testa_barra_w', name: 'Tríceps Testa com Barra W', reason: 'Movimento livre clássico para volume dos tríceps' }
    ]
  },

  // --- CARDIO ---
  {
    id: 'ex_esteira_inclinada',
    name: 'Caminhada Inclinada na Esteira',
    category: 'Cardio',
    muscle: 'Sistema Cardiovascular e Panturrilhas',
    equipment: 'Esteira Elétrica',
    defaultSets: 1,
    defaultReps: 30, // minutos
    defaultRestSec: 0,
    animationType: 'cardio_treadmill',
    instructions: 'Ajuste inclinação entre 6% e 12% e velocidade entre 5.0 e 6.5 km/h sem segurar nas barras laterais.',
    equivalents: [
      { id: 'ex_bike_ergometrica', name: 'Bicicleta Ergométrica', reason: 'Menor impacto articular para joelhos' },
      { id: 'ex_eliptico', name: 'Aparelho Elíptico', reason: 'Cardio de corpo inteiro com baixo impacto' }
    ]
  }
];

// ==========================================
// 3. ESTRUTURA SEMANAL PADRÃO (SEGUNDA A DOMINGO)
// ==========================================
const DEFAULT_WEEKLY_ROUTINE = [
  { dayId: 1, dayName: 'Segunda-feira', shortName: 'SEG', focus: '', restDay: true, targetSets: 0 },
  { dayId: 2, dayName: 'Terça-feira', shortName: 'TER', focus: '', restDay: true, targetSets: 0 },
  { dayId: 3, dayName: 'Quarta-feira', shortName: 'QUA', focus: '', restDay: true, targetSets: 0 },
  { dayId: 4, dayName: 'Quinta-feira', shortName: 'QUI', focus: '', restDay: true, targetSets: 0 },
  { dayId: 5, dayName: 'Sexta-feira', shortName: 'SEX', focus: '', restDay: true, targetSets: 0 },
  { dayId: 6, dayName: 'Sábado', shortName: 'SÁB', focus: '', restDay: true, targetSets: 0 },
  { dayId: 0, dayName: 'Domingo', shortName: 'DOM', focus: '', restDay: true, targetSets: 0 }
];

// ==========================================
// 4. FUNÇÃO AUXILIAR: SUBSTITUIÇÃO INTELIGENTE DE ALIMENTOS
// Calcula a gramagem equivalente baseada em um macronutriente alvo (proteína, carboidrato ou gordura)
// ==========================================
function calculateEquivalentFood(originalFood, targetFood, originalGrams, targetMacro = 'protein') {
  if (!originalFood || !targetFood || !originalGrams || originalGrams <= 0) return null;
  
  const originalMacroPer100 = originalFood[targetMacro] || 0.001;
  const targetMacroPer100 = targetFood[targetMacro] || 0.001;

  // Quantidade total do macronutriente no alimento original
  const totalTargetMacroGrams = (originalMacroPer100 * originalGrams) / 100;
  
  // Quantas gramas do novo alimento são necessárias para atingir a mesma quantidade do macro
  const requiredTargetGrams = Math.round((totalTargetMacroGrams / targetMacroPer100) * 100);

  // Calcula novas calorias e macros correspondentes
  const newCalories = Math.round((targetFood.calories * requiredTargetGrams) / 100);
  const newProtein = Number(((targetFood.protein * requiredTargetGrams) / 100).toFixed(1));
  const newCarbs = Number(((targetFood.carbs * requiredTargetGrams) / 100).toFixed(1));
  const newFat = Number(((targetFood.fat * requiredTargetGrams) / 100).toFixed(1));

  const origCalories = Math.round((originalFood.calories * originalGrams) / 100);
  const origProtein = Number(((originalFood.protein * originalGrams) / 100).toFixed(1));
  const origCarbs = Number(((originalFood.carbs * originalGrams) / 100).toFixed(1));
  const origFat = Number(((originalFood.fat * originalGrams) / 100).toFixed(1));

  return {
    originalFood,
    targetFood,
    targetMacro,
    originalGrams: Math.round(originalGrams),
    requiredTargetGrams,
    originalNutrients: { calories: origCalories, protein: origProtein, carbs: origCarbs, fat: origFat },
    newNutrients: { calories: newCalories, protein: newProtein, carbs: newCarbs, fat: newFat },
    diffCalories: newCalories - origCalories
  };
}

// ==========================================
// 5. GERADOR DE SEED DATA (14 DIAS HISTÓRICOS COERENTES)
// Cria dados completos de peso, treinos, execuções, refeições, smartwatch e água
// ==========================================
function legacyDemoDataFixtureUnused() {
  return {
    user: null,
    weeklyRoutine: [],
    weightLogs: [],
    workouts: [],
    executions: [],
    meals: [],
    waterLogs: {},
    smartwatch: { connected: false, goalSteps: 0, goalActiveKcal: 0, dailyData: {} },
    aiChat: []
  };

  const today = new Date();
  
  // 1. Perfil Inicial
  const user = {
    id: 'user_atleta_01',
    name: 'Lucas Brandão',
    weight: 81.2,
    height: 180,
    goalWeight: 78.5,
    goalCalories: 2600,
    goalWater: 3500,
    objective: 'hipertrofia', // 'hipertrofia', 'emagrecimento', 'manutencao'
    onboarded: true,
    createdAt: new Date(today.getTime() - 14 * 24 * 3600 * 1000).toISOString()
  };

  // 2. Histórico de 14 dias de peso decrescente/recomposição
  const weightLogs = [];
  const baseWeight = 83.2;
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    // Queda consistente com pequenas variações hídricas naturais
    const jitter = Math.sin(i * 1.5) * 0.15;
    const dayWeight = Number((baseWeight - (13 - i) * 0.15 + jitter).toFixed(1));
    weightLogs.push({
      id: `wlog_${dateStr}`,
      date: dateStr,
      weight: dayWeight,
      notes: i === 0 ? 'Pesagem em jejum hoje cedo.' : 'Rotina em dia.'
    });
  }

  // 3. Workouts & Execuções nos últimos 14 dias
  const workouts = [];
  const executions = [];
  
  // Mapa de treinos com sobrecarga progressiva entre semana 1 e semana 2
  const workoutTemplates = [
    {
      focus: 'Peito, Tríceps & Ombro Anterior',
      exercises: [
        { exId: 'ex_supino_reto_barra', w1: 75, w2: 80, reps: 8, sets: 4 },
        { exId: 'ex_supino_inclinado_halteres', w1: 26, w2: 28, reps: 10, sets: 4 },
        { exId: 'ex_peck_deck', w1: 55, w2: 60, reps: 12, sets: 3 },
        { exId: 'ex_triceps_corda_polia', w1: 30, w2: 35, reps: 12, sets: 4 }
      ]
    },
    {
      focus: 'Costas, Bíceps & Deltoide Posterior',
      exercises: [
        { exId: 'ex_puxada_alta', w1: 60, w2: 65, reps: 10, sets: 4 },
        { exId: 'ex_remada_curvada_barra', w1: 65, w2: 70, reps: 8, sets: 4 },
        { exId: 'ex_remada_baixa_triangulo', w1: 50, w2: 55, reps: 12, sets: 3 },
        { exId: 'ex_rosca_direta_barra_w', w1: 26, w2: 28, reps: 10, sets: 3 }
      ]
    },
    {
      focus: 'Pernas Completo (Quadríceps & Glúteo)',
      exercises: [
        { exId: 'ex_agachamento_livre', w1: 90, w2: 100, reps: 8, sets: 4 },
        { exId: 'ex_leg_press_45', w1: 220, w2: 240, reps: 10, sets: 4 },
        { exId: 'ex_cadeira_extensora', w1: 55, w2: 60, reps: 12, sets: 3 }
      ]
    },
    {
      focus: 'Ombros Completo & Braços',
      exercises: [
        { exId: 'ex_desenvolvimento_halteres', w1: 22, w2: 24, reps: 10, sets: 4 },
        { exId: 'ex_elevacao_lateral_halteres', w1: 12, w2: 14, reps: 12, sets: 4 },
        { exId: 'ex_rosca_direta_barra_w', w1: 28, w2: 30, reps: 10, sets: 3 },
        { exId: 'ex_triceps_corda_polia', w1: 35, w2: 35, reps: 12, sets: 3 }
      ]
    },
    {
      focus: 'Posterior de Coxa & Glúteo',
      exercises: [
        { exId: 'ex_stiff_barra', w1: 80, w2: 85, reps: 10, sets: 4 },
        { exId: 'ex_mesa_flexora', w1: 45, w2: 50, reps: 12, sets: 4 }
      ]
    }
  ];

  let templateIdx = 0;
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const dayOfWeek = d.getDay(); // 0 Dom, 4 Qui (rest days)
    const dateStr = d.toISOString().split('T')[0];
    const isRest = (dayOfWeek === 0 || dayOfWeek === 4);

    if (!isRest) {
      const template = workoutTemplates[templateIdx % workoutTemplates.length];
      templateIdx++;
      const workoutId = `wk_${dateStr}`;
      
      workouts.push({
        id: workoutId,
        date: dateStr,
        name: `Treino: ${template.focus}`,
        focus: template.focus,
        durationMin: 65,
        status: 'completed',
        caloriesBurned: 480 + (i % 3) * 35
      });

      // Execuções dos exercícios com progressão real
      const isSecondWeek = (i <= 6);
      template.exercises.forEach((item, exOrder) => {
        const weight = isSecondWeek ? item.w2 : item.w1;
        const totalVol = weight * item.reps * item.sets;
        const previousVol = item.w1 * item.reps * item.sets;
        const ratio = totalVol / previousVol;
        
        let comparisonStatus = 'Estagnado';
        if (ratio > 1.03) comparisonStatus = 'Evoluindo';
        else if (ratio < 0.97) comparisonStatus = 'Regredindo';

        const execSets = [];
        for (let s = 1; s <= item.sets; s++) {
          execSets.push({
            setNum: s,
            weightKg: weight,
            reps: item.reps,
            isHardSet: s >= 2, // Hard set a partir da 2ª série
            rpe: s === item.sets ? 9.5 : 8.5
          });
        }

        executions.push({
          id: `exec_${workoutId}_${item.exId}`,
          workoutId: workoutId,
          exerciseId: item.exId,
          order: exOrder,
          sets: execSets,
          totalVolume: totalVol,
          hardSetsCount: execSets.filter(s => s.isHardSet).length,
          comparisonStatus: comparisonStatus
        });
      });
    }
  }

  // 4. Refeições Diárias dos 14 Dias (TACO integrado)
  const meals = [];
  const foodPeitoFrango = TACO_DATABASE.find(f => f.id === 'taco_01');
  const foodPatinho = TACO_DATABASE.find(f => f.id === 'taco_02');
  const foodArroz = TACO_DATABASE.find(f => f.id === 'taco_16');
  const foodFeijao = TACO_DATABASE.find(f => f.id === 'taco_18');
  const foodOvos = TACO_DATABASE.find(f => f.id === 'taco_09');
  const foodAveia = TACO_DATABASE.find(f => f.id === 'taco_23');
  const foodBanana = TACO_DATABASE.find(f => f.id === 'taco_27');
  const foodWhey = TACO_DATABASE.find(f => f.id === 'taco_37');
  const foodAzeite = TACO_DATABASE.find(f => f.id === 'taco_33');

  function buildMealItem(mealType, dateStr, food, grams) {
    const cals = Math.round((food.calories * grams) / 100);
    const prot = Number(((food.protein * grams) / 100).toFixed(1));
    const carbs = Number(((food.carbs * grams) / 100).toFixed(1));
    const fat = Number(((food.fat * grams) / 100).toFixed(1));
    return {
      id: `meal_${dateStr}_${mealType.replace(/\s+/g, '_')}_${food.id}`,
      date: dateStr,
      mealType: mealType,
      alimentoId: food.id,
      alimentoName: food.name,
      grams: grams,
      calories: cals,
      protein: prot,
      carbs: carbs,
      fat: fat
    };
  }

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    // Café da Manhã: Ovos, Aveia e Banana
    meals.push(buildMealItem('Café da Manhã', dateStr, foodOvos, 150)); // 3 ovos aprox
    meals.push(buildMealItem('Café da Manhã', dateStr, foodAveia, 50));
    meals.push(buildMealItem('Café da Manhã', dateStr, foodBanana, 120));

    // Almoço: Arroz, Feijão, Frango ou Patinho, Azeite
    const meat = (i % 2 === 0) ? foodPeitoFrango : foodPatinho;
    meals.push(buildMealItem('Almoço', dateStr, foodArroz, 200));
    meals.push(buildMealItem('Almoço', dateStr, foodFeijao, 130));
    meals.push(buildMealItem('Almoço', dateStr, meat, 180));
    meals.push(buildMealItem('Almoço', dateStr, foodAzeite, 10));

    // Lanche da Tarde: Whey e Banana
    meals.push(buildMealItem('Lanche da Tarde', dateStr, foodWhey, 40));
    meals.push(buildMealItem('Lanche da Tarde', dateStr, foodBanana, 100));

    // Jantar: Arroz e Frango
    meals.push(buildMealItem('Jantar', dateStr, foodArroz, 180));
    meals.push(buildMealItem('Jantar', dateStr, foodPeitoFrango, 180));
    meals.push(buildMealItem('Jantar', dateStr, foodAzeite, 8));
  }

  // 5. Registros de Água
  const waterLogs = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    waterLogs[dateStr] = 3250 + (i % 4) * 250; // varia entre 3250ml e 4000ml (cumprindo meta)
  }

  // 6. Dados de Smartwatch (Garmin / Apple Watch sincronizado)
  const smartwatch = {
    connected: true,
    deviceName: 'Garmin Forerunner 965',
    lastSync: new Date().toISOString(),
    dailyData: {}
  };

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const steps = 9500 + Math.floor(Math.sin(i) * 1800);
    const activeKcal = 490 + Math.floor(Math.cos(i) * 90);
    smartwatch.dailyData[dateStr] = {
      steps: steps,
      activeKcal: activeKcal,
      synced: true,
      battery: 88,
      restingHeartRate: 54
    };
  }

  // 7. Chat de IA Inicial
  const aiChat = [
    {
      id: 'msg_01',
      sender: 'gemini',
      text: 'Olá Lucas! Eu sou o Ottinho, seu assistente inteligente com acesso em tempo real aos dados do OTTER. Como posso acelerar seus resultados hoje? Você pode me pedir para substituir refeições, trocar exercícios ocupados ou analisar seu progresso!',
      timestamp: new Date(today.getTime() - 2 * 3600 * 1000).toISOString(),
      actionTriggered: null
    }
  ];

  return {
    user,
    weeklyRoutine: DEFAULT_WEEKLY_ROUTINE,
    weightLogs,
    workouts,
    executions,
    meals,
    waterLogs,
    smartwatch,
    aiChat
  };
}

// Exportação global limpa para Vanilla JS no navegador
window.TACO_DATABASE = TACO_DATABASE;
window.EXERCISES_DATABASE = EXERCISES_DATABASE;
window.DEFAULT_WEEKLY_ROUTINE = DEFAULT_WEEKLY_ROUTINE;
window.calculateEquivalentFood = calculateEquivalentFood;
window.generate14DaysSeedData = function createEmptyDatabase() {
  return {
    user: null,
    weeklyRoutine: [],
    weightLogs: [],
    workouts: [],
    executions: [],
    meals: [],
    waterLogs: {},
    smartwatch: { connected: false, goalSteps: 0, goalActiveKcal: 0, dailyData: {} },
    aiChat: []
  };
};
