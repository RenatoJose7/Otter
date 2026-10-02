# Plano paralelo para fechar os requisitos da hackathon

Prazo de referência: 60 minutos. Escopo: requisitos do PDF; Firebase, Gemini e API TACO são extras e não substituem os requisitos do produto.

## Estado atual

- Atendido: perfil/onboarding com peso, meta calórica e estimativa de metas; validação de peso e metas positivas.
- Atendido: execução de força com séries, carga, repetições, volume e comparação com a sessão anterior; gráfico de volume.
- Atendido: registro manual de refeições e TACO pré-carregada; gráfico de calorias consumidas versus meta.
- Atendido: histórico de peso, bloqueio de datas futuras e gráfico de evolução.
- Atendido: persistência em `localStorage`, relações por IDs e navegação SPA.
- Parcial: catálogo de exercícios é fixo; falta cadastrar treinos/exercícios próprios.
- Parcial: alimentos vêm de um catálogo fixo; falta cadastrar alimentos próprios e guardar horário da refeição.
- Faltando: execução de cardio por duração/distância.
- Faltando: incluir gasto estimado do treino no balanço calórico.
- Parcial: o insight atual é dinâmico, mas resume dados; falta mostrar uma comparação calculada entre treino e dieta.

## Divisão de trabalho

### Renato — Treinos, exercícios e cardio

**Entrega:** cadastro/edição/exclusão de exercícios e treinos, mais registro de cardio com duração e distância.

**Dados:** exercícios com `id`, `name`, `muscleGroup`, `type` (`strength` ou `cardio`); treinos com `id`, `name` e lista de `exerciseIds`. A execução mantém `exerciseId`, `workoutId` e `date`; cardio acrescenta `durationMin`, `distanceKm` e `estimatedCalories`.

**Aceite:** criar um exercício e um treino, executar força e cardio, recarregar a página e confirmar que os dados e relações continuam no `localStorage`.

### Laura — Alimentos e refeições

**Entrega:** cadastro/edição/exclusão de alimentos próprios, além de refeições com tipo, data, horário e quantidade. Preservar a busca da TACO como catálogo inicial.

**Dados:** guardar alimentos próprios em `db.customFoods`; cada refeição deve referenciar o alimento por ID e preservar nome/macros usados no momento do consumo para não alterar o histórico se o alimento for editado.

**Aceite:** cadastrar um alimento, registrar quantidade e horário numa refeição, conferir o total diário e testar valores inválidos.

### Marcelo — Balanço calórico e gráficos

**Entrega:** cálculo diário incluindo gasto estimado do treino e atualização dos gráficos.

**Fórmula proposta para a demo:** `saldo ajustado = calorias consumidas - meta calórica - gasto estimado do treino`. Exibir o gasto como estimativa e deixar a fórmula visível no rótulo/legenda. Para começar simples: força = 200 kcal por sessão concluída; cardio = 6 kcal por minuto. Não apresentar isso como medição fisiológica.

**Aceite:** mesmo consumo, em dia com treino, produz saldo ajustado diferente do dia sem treino; gráfico compara consumo, meta e gasto estimado; não soma um treino em duplicidade.

### Maria — Insight cruzado, integração e aceite

**Entrega:** implementar pelo menos um insight realmente calculado a partir de alimentação e treino; integrar as três entregas e executar a checklist final.

**Insight proposto:** nos últimos 7 dias, comparar a média de calorias acima/abaixo da meta em dias com treino concluído versus dias sem treino. Exigir dados suficientes dos dois grupos; sem dados, exibir uma mensagem de insuficiência em vez de inventar conclusão.

**Aceite:** alterar ou adicionar um registro de refeição/treino muda o insight; dias com e sem treino são calculados a partir dos registros reais; testar o estado sem dados.

## Contrato e trabalho simultâneo

- Todos usam `getDB()` e `saveDB(db)` existentes; não criar uma segunda persistência nem substituir o `localStorage`.
- Preservar IDs e relações atuais (`exerciseId`, `workoutId`, `date`). Fazer migrações tolerantes: bases antigas podem não ter `customFoods`, cardio ou planos; inicializar listas ausentes sem apagar dados existentes.
- Para evitar conflitos, cada IA trabalha em branch/cópia própria e entrega a lista de arquivos alterados. Não editar simultaneamente `v1/app.js`, `v1/index.html` e `v1/style.css` no mesmo workspace.
- Renato entrega o módulo/patch de treino; Laura, o de dieta; Marcelo, o de balanço; Maria é a única pessoa a integrar os patches nesses três arquivos compartilhados e resolver conflitos.
- Não incluir chaves de API, credenciais nem dados pessoais reais nos patches, seeds ou screenshots.

## Cronograma de 60 minutos

1. 0–5 min: Maria confirma contrato de dados e fórmula com a equipe.
2. 5–35 min: Renato, Laura e Marcelo implementam em paralelo; Maria prepara insight e checklist.
3. 35–50 min: Maria integra os patches e corrige incompatibilidades.
4. 50–60 min: rodar a checklist e ensaiar o fluxo de apresentação.

## Checklist final do PDF

- Perfil salva peso atual, meta de peso e meta calórica; valores obrigatórios são positivos.
- Exercício/treino próprio pode ser cadastrado e a execução aponta para os IDs corretos.
- Força compara volume da mesma execução anterior e sinaliza evolução, estagnação ou regressão.
- Cardio guarda duração e distância e entra na estimativa de gasto.
- Alimento próprio pode ser cadastrado; refeição guarda tipo, data, horário, alimento e quantidade.
- Balanço do dia mostra consumo, meta e gasto estimado do treino.
- Gráficos mostram volume, calorias versus meta e evolução do peso.
- Pelo menos um insight muda quando os dados de treino ou dieta mudam.
- Recarregar a página mantém os dados; datas futuras e entradas inválidas são rejeitadas.
- Navegação continua sem reload e os fluxos principais cabem em desktop e celular.

## Roteiro de demo

1. Abrir perfil e mostrar metas calculadas/salvas.
2. Criar um exercício e um treino; registrar uma execução de força e uma de cardio.
3. Cadastrar alimento, registrar refeição com horário e mostrar o balanço ajustado.
4. Abrir o insight, explicar a comparação dos dias com/sem treino e apontar o gráfico.
5. Recarregar e confirmar persistência local.
