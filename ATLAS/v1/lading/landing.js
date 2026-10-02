
        const hero = document.getElementById('heroSection');
        const canvas = document.getElementById('heroCanvas');
        const ctx = canvas.getContext('2d');

        // Redimensionamento responsivo do Canvas
        function resizeCanvas() {
            canvas.width = hero.clientWidth;
            canvas.height = hero.clientHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // 7 nós conectados por física elástica que geram a cauda líquida
        const NUM_POINTS = 7;
        const points = Array.from({ length: NUM_POINTS }, () => ({
            x: canvas.width / 2,
            y: canvas.height / 2
        }));

        let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        function animateFluidTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // A cabeça segue o mouse diretamente
    points[0].x += (mouse.x - points[0].x) * 0.12;
    points[0].y += (mouse.y - points[0].y) * 0.12;

    // Cada ponto seguinte segue o anterior com amortecimento
    for (let i = 1; i < NUM_POINTS; i++) {
        const prev = points[i - 1];
        const cur = points[i];
        const damping = 0.28 - (i * 0.02);
        cur.x += (prev.x - cur.x) * damping;
        cur.y += (prev.y - cur.y) * damping;
    }

    // Renderiza as camadas de plasma com RAIO MAIOR
    for (let i = NUM_POINTS - 1; i >= 0; i--) {
        const p = points[i];
        // Aqui você controla o tamanho: 950 é o tamanho da cabeça principal.
        const radius = 950 - (i * 35);
        const alpha = (1 - (i / NUM_POINTS) * 0.65);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(radius, 60));
        grad.addColorStop(0, `rgba(255, 170, 0, ${0.45 * alpha})`);
        grad.addColorStop(0.25, `rgba(255, 93, 0, ${0.35 * alpha})`);
        grad.addColorStop(0.55, `rgba(216, 48, 0, ${0.22 * alpha})`);
        grad.addColorStop(0.8, `rgba(128, 20, 0, ${0.08 * alpha})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(radius, 60), 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(animateFluidTrail);
}
        animateFluidTrail();


        // DADOS DAS PERGUNTAS E RESPOSTAS SIMULADAS DA IA
const conversasIA = [
    {
        user: "Como foram meus últimos 7 dias de treino e dieta?",
        bot: "Nos últimos 7 dias você treinou 5 vezes com volume total acumulado de <b>5.300 kg</b> (+12% de sobrecarga). Seu consumo calórico médio foi de <b>1.920 kcal</b>, resultando em uma redução de <b>0,6 kg</b> de peso corporal de forma saudável.",
        tag: "Classificação: Evoluindo • Déficit Controlado"
    },
    {
        user: "Estou progredindo nas minhas cargas de supino e agachamento?",
        bot: "Sim! Seu Agachamento Livre subiu de <b>100 kg para 110 kg</b> (+10%) com manutenção das 10 repetições. A tonelagem por sessão aumentou, indicando que sua recuperação muscular está otimizada pela ingestão correta de proteínas.",
        tag: "Progressão: Sobrecarga Positiva"
    },
    {
        user: "Minha alimentação de hoje atingiu a meta da tabela TACO?",
        bot: "Você consumiu <b>165g de Proteínas</b> (meta: 160g) e <b>195g de Carboidratos</b>. Seu saldo calórico fechou em <b>1.950 kcal</b>, exatamente na meta de déficit recomendada para sua taxa metabólica.",
        tag: "Meta Diária: 100% Concluída"
    }
];

// Função que renderiza a mensagem no celular
function carregarMensagem(index) {
    // Atualiza botões ativos
    const buttons = document.querySelectorAll('.prompt-btn');
    buttons.forEach((btn, i) => {
        if(i === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const stream = document.getElementById('chatStream');
    const dados = conversasIA[index];

    // Renderiza com efeito de balões de conversa
    stream.innerHTML = `
        <div class="chat-bubble user">
            ${dados.user}
        </div>
        <div class="chat-bubble bot">
            <p>${dados.bot}</p>
            <div class="chat-metric-tag"><i class="fa-solid fa-arrow-trend-up"></i> ${dados.tag}</div>
        </div>
    `;
}

// Inicializa a primeira conversa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('chatStream')) {
        carregarMensagem(0);
    }
});