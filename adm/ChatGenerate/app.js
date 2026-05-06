const state = {
    options: [],
    answers: []
};

const $ = (selector) => document.querySelector(selector);

document.addEventListener('DOMContentLoaded', () => {
    bindBaseFields();
    $('#btn-add-option').addEventListener('click', () => addOption());
    $('#btn-add-answer').addEventListener('click', () => addAnswer());
    $('#btn-export').addEventListener('click', exportJson);
    $('#btn-copy').addEventListener('click', copyJson);
    $('#btn-fill-example').addEventListener('click', fillExample);

    addOption('Mais barato', 'mais barato');
    addOption('Mais vendido', 'mais vendido');
    addOption('Lancamentos', 'lancamentos');
    addAnswer('preco', 'barato, menor preco, mais em conta, valor', 'Tenho algumas opcoes com melhor custo-beneficio. Me diga sua faixa de valor que eu te ajudo a escolher sem enrolacao.');
    addAnswer('duvida de tamanho', 'tamanho, numero, medida, veste', 'Me diga seu tamanho/numero habitual e o tipo de uso. Assim eu consigo te orientar melhor antes de chamar no WhatsApp.');
    updatePreview();
});

function bindBaseFields() {
    ['segmento', 'nomeLoja', 'nomeAtendente', 'tomVoz', 'saudacao', 'fallback', 'whatsappTriggers', 'whatsappMessage'].forEach(id => {
        $('#' + id).addEventListener('input', updatePreview);
    });
}

function addOption(label = '', value = '') {
    const template = $('#tpl-option').content.cloneNode(true);
    const node = template.querySelector('.option-item');
    node.querySelector('.option-label').value = label;
    node.querySelector('.option-value').value = value;
    node.querySelectorAll('input').forEach(input => input.addEventListener('input', updatePreview));
    node.querySelector('.btn-remove').addEventListener('click', () => {
        node.remove();
        updatePreview();
    });
    $('#quick-options').appendChild(node);
    updatePreview();
}

function addAnswer(topic = '', keywords = '', answer = '') {
    const template = $('#tpl-answer').content.cloneNode(true);
    const node = template.querySelector('.answer-item');
    node.querySelector('.answer-topic').value = topic;
    node.querySelector('.answer-keywords').value = keywords;
    node.querySelector('.answer-text').value = answer;
    node.querySelectorAll('input, textarea').forEach(input => input.addEventListener('input', updatePreview));
    node.querySelector('.btn-remove').addEventListener('click', () => {
        node.remove();
        updatePreview();
    });
    $('#answers-list').appendChild(node);
    updatePreview();
}

function collectData() {
    const opcoesRapidas = Array.from(document.querySelectorAll('.option-item')).map(item => ({
        label: item.querySelector('.option-label').value.trim(),
        value: item.querySelector('.option-value').value.trim()
    })).filter(item => item.label || item.value);

    const respostas = Array.from(document.querySelectorAll('.answer-item')).map(item => ({
        assunto: item.querySelector('.answer-topic').value.trim(),
        palavrasChave: splitList(item.querySelector('.answer-keywords').value),
        resposta: item.querySelector('.answer-text').value.trim()
    })).filter(item => item.assunto || item.palavrasChave.length || item.resposta);

    return {
        version: 1,
        segmento: $('#segmento').value.trim(),
        nomeLoja: $('#nomeLoja').value.trim(),
        nomeAtendente: $('#nomeAtendente').value.trim(),
        tomVoz: $('#tomVoz').value,
        saudacao: $('#saudacao').value.trim(),
        fallback: $('#fallback').value.trim(),
        opcoesRapidas,
        respostas,
        whatsapp: {
            gatilhos: splitList($('#whatsappTriggers').value),
            mensagemBotao: $('#whatsappMessage').value.trim() || 'Continuar no WhatsApp'
        }
    };
}

function splitList(value) {
    return value.split(',').map(item => item.trim()).filter(Boolean);
}

function updatePreview() {
    const data = collectData();
    $('#preview-attendant').textContent = data.nomeAtendente || 'Assistente';
    $('#preview-segment').textContent = data.segmento || 'Segmento';
    $('#preview-saudacao').textContent = data.saudacao || 'Opa! Como posso te ajudar?';
    $('#preview-answer').textContent = data.respostas[0]?.resposta || data.fallback || 'As respostas aparecem aqui conforme voce preenche.';

    const options = $('#preview-options');
    options.innerHTML = '';
    data.opcoesRapidas.slice(0, 6).forEach(option => {
        const span = document.createElement('span');
        span.textContent = option.label || option.value;
        options.appendChild(span);
    });

    $('#json-preview').textContent = JSON.stringify(data, null, 2);
}

function exportJson() {
    const data = collectData();
    const safeSegment = (data.segmento || 'chat').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    downloadObject(data, `Chat-${safeSegment || 'loja'}.json`);
    toast('Chat exportado.');
}

async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(collectData(), null, 2));
    toast('JSON copiado.');
}

function downloadObject(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function fillExample() {
    $('#segmento').value = 'tenis';
    $('#nomeLoja').value = 'Vibe Sneakers';
    $('#nomeAtendente').value = 'Assistente da Vibe';
    $('#tomVoz').value = 'consultivo';
    $('#saudacao').value = 'Opa! Sou o assistente da Vibe Sneakers. Quer um tenis para corrida, treino ou dia a dia?';
    $('#fallback').value = 'Posso te ajudar melhor se voce me disser se busca preco, conforto, estilo ou algum modelo especifico.';
    $('#whatsappTriggers').value = 'troca, garantia, prazo, negociacao, disponibilidade';
    $('#whatsappMessage').value = 'Quero atendimento no WhatsApp';

    $('#quick-options').innerHTML = '';
    $('#answers-list').innerHTML = '';
    addOption('Mais barato', 'mais barato');
    addOption('Corrida', 'corrida');
    addOption('Casual', 'casual');
    addOption('Lancamentos', 'lancamentos');
    addAnswer('corrida', 'corrida, correr, treino, academia', 'Para corrida, recomendo priorizar amortecimento, leveza e estabilidade. Se voce me disser sua pisada e faixa de valor, eu te direciono melhor.');
    addAnswer('casual', 'casual, passeio, dia a dia, estilo', 'Para uso casual, vale escolher um modelo confortavel, facil de combinar e com material resistente para o dia a dia.');
    addAnswer('preco', 'barato, menor preco, promocao, valor', 'Tenho opcoes mais acessiveis e tambem modelos premium. Me diga sua faixa de valor que eu filtro as melhores alternativas.');
    updatePreview();
}

let toastTimer = null;
function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('active');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('active'), 2600);
}
