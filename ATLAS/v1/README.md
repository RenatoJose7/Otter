# HACKTOON — Plataforma OTTER de Treino e Dieta (Hackathon MVP)

Plataforma construída com HTML5, CSS3 e JavaScript Vanilla; Chart.js é usado somente nos gráficos e Font Awesome nos ícones. Os dados ficam no `localStorage` sob a chave mestre `HACKTOON_DB`.

> **Autenticação demonstrativa:** login e cadastro funcionam apenas neste navegador. Os registros e dados não são compartilhados entre dispositivos e não substituem um provedor de autenticação/backend para produção. Não use senhas reais.

---

## Como Executar Imediatamente

1. **Execução via servidor local (recomendado para o Gemini)**:
  - Inicie um servidor de arquivos estáticos na pasta `v1` e abra o endereço local informado por ele.
  - O Gemini usa `fetch`; abrir com `file://` pode bloquear a chamada por políticas de origem do navegador.

2. **Configuração do Gemini**:
  - Na página inicial, selecione **Configurar API key** e cole a chave do Google AI Studio.
  - A chave fica no `sessionStorage` somente durante a sessão atual do navegador.
  - Este projeto é estático e não consegue ler um arquivo `.env`. Em um frontend puro, a chave pode ser inspecionada pelo usuário; restrinja-a no Google Cloud/AI Studio e não use esta configuração em produção pública.

3. **Execução direta no navegador (módulos sem Gemini)**:
  - Abrir `index.html` com dois cliques ainda permite testar a interface e os módulos locais, mas a chamada ao Gemini pode ser bloqueada pelo navegador.

4. **Servidor HTTP simples (opcional)**:
   ```bash
  cd v1
  python -m http.server 5500
   ```

---

## Diferenciais Técnicos Apresentáveis em Banca

### 1. Banco local sem amostras (`HACKTOON_DB`)
- Conta nova começa com perfil e registros vazios. O onboarding salva somente dados informados e a pesagem inicial que o usuário forneceu.
- Refeições, água, smartwatch, treino e histórico passam a existir apenas após uma ação de registro/confirmacão.

### 2. Score OTTER de Consistência (0 a 100) & Streaks
Calculado a partir dos objetivos diários de treino, ingestão calórica e água. A conta inicia com streak de 1 dia; não há mínimo de demonstração.

### 3. Modo "Em Treino" Interativo
- **Calculadora Visual de Anilhas (Barbell Calculator)**:
  - Subtrai a barra de 20kg e calcula a combinação ótima de anilhas (20kg, 15kg, 10kg, 5kg, 2.5kg, 1.25kg) por lado da barra, renderizando a manga da barra colorida em tempo real.
- **Cronômetro Regressivo com Áudio Nativo (Web Audio API)**:
  - Síntese de beeps harmônicos nos últimos 3 segundos e alarme duplo no zero, sem depender de arquivos de áudio externos.
- Os exercícios disponíveis são filtrados pelo foco da rotina semanal; cargas e repetições precisam ser inseridas antes de salvar.
- **Sobrecarga Progressiva Objetiva**:
  - Volume Total = $\text{Carga} \times \text{Reps} \times \text{Séries}$
  - Evoluindo ($> 103\%$), Estagnado ($97\% - 103\%$), Regredindo ($< 97\%$).

### 4. Nutrição e hidratação
- Alimentos e macros são registrados manualmente. As sugestões de receitas consideram o objetivo e a diferença entre metas e consumo, mas só viram registros após confirmação.
- Hidratação inicia em 0 ml e recebe acréscimos confirmados pelo usuário.

### 5. Smartwatch e gráficos
- Não há sincronização simulada. Metas, passos e calorias ativas são digitados e confirmados manualmente.
- Os gráficos usam somente pesagens, refeições e treinos armazenados pelo usuário.

### 6. Assistente Gemini
- Página inicial de chat e drawer lateral conectados à Gemini API pelo navegador.
- Envia contexto resumido de perfil, hidratação, refeições e registros recentes para personalizar as respostas.
- O chat envia ao Gemini o resumo real do perfil, das metas e dos registros. Ele orienta e sugere; as operações de alteração de dados podem ser realizadas nos formulários e precisam de confirmação do usuário.
- Como não há backend, a API key digitada no navegador é acessível pelo próprio usuário e não deve ser usada assim em um site público; o navegador também não consegue ler um `.env`.
