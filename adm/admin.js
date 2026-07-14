(() => {
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'admin123';
    const SESSION_KEY = 'vibeStoreAdminSession';

    let siteData = {
        config: {
            nomeLoja: 'CALLEJA IMPORTS',
            titulo: 'Tecnologia com Confiança.',
            subtituloHero: 'Seu próximo upgrade com segurança e confiança.',
            heroImagem: '',
            heroOverlay: 0.68,
            tema: 'dark',
            corPrimaria: '#ffffff',
            textoBusca: 'Nao encontrou o que deseja?'
        },
        produtos: []
    };
    let rootHandle = null;
    const pendingImageFiles = new Map();
    const collapsedProducts = new Set();
    const collapsedVersions = new Set();

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        bindLogin();
        bindTabs();
        bindActions();
        if (sessionStorage.getItem(SESSION_KEY) === 'ok') showAdmin();
    }

    function bindLogin() {
        const form = document.getElementById('login-form');
        const error = document.getElementById('login-error');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const user = document.getElementById('login-user').value.trim();
            const pass = document.getElementById('login-pass').value;
            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                sessionStorage.setItem(SESSION_KEY, 'ok');
                error.textContent = '';
                showAdmin();
                return;
            }
            error.textContent = 'Usuario ou senha incorretos.';
        });
    }

    function showAdmin() {
        document.getElementById('login-screen').classList.add('is-hidden');
        document.getElementById('admin-app').classList.remove('is-hidden');
        loadData();
    }

    function bindTabs() {
        const tabs = document.querySelectorAll('.menu-item');
        const contents = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                tabs.forEach(item => item.classList.remove('active'));
                contents.forEach(content => content.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
    }

    function bindActions() {
        document.getElementById('btn-add-product').addEventListener('click', addProduct);
        document.getElementById('btn-save').addEventListener('click', saveDirect);
        document.getElementById('btn-save-geral').addEventListener('click', saveDirect);
        document.getElementById('btn-save-produtos').addEventListener('click', saveDirect);
        document.getElementById('btn-json-config').addEventListener('click', toggleJsonConfig);
        document.querySelectorAll('.json-accordion-trigger').forEach(button => {
            button.addEventListener('click', () => toggleJsonSection(button.dataset.jsonSection));
        });
        document.getElementById('btn-download').addEventListener('click', downloadJson);
        document.getElementById('btn-import-chat').addEventListener('click', () => {
            document.getElementById('file-import-chat').click();
});

document.getElementById('file-import-chat').addEventListener('change', importChatJson);
        document.getElementById('btn-export-geral').addEventListener('click', () => downloadJsonPart('geral'));
        document.getElementById('btn-export-produtos').addEventListener('click', () => downloadJsonPart('produtos'));
        document.getElementById('btn-import-geral').addEventListener('click', () => document.getElementById('file-import-geral').click());
        document.getElementById('btn-import-produtos').addEventListener('click', () => document.getElementById('file-import-produtos').click());
        document.getElementById('file-import-geral').addEventListener('change', event => importJsonPart(event, 'geral'));
        document.getElementById('file-import-produtos').addEventListener('change', event => importJsonPart(event, 'produtos'));
        document.getElementById('btn-connect-folder').addEventListener('click', connectFolder);
        document.getElementById('btn-logout').addEventListener('click', () => {
            sessionStorage.removeItem(SESSION_KEY);
            location.reload();
        });
    }

    async function importChatJson(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    try {
        const data = JSON.parse(await file.text());

        // Aqui você decide onde salvar esse chat
        // Exemplo: dentro do config
        siteData.chat = data;

        toast('Chat importado com sucesso!');
        console.log('Chat carregado:', data);

    } catch (error) {
        toast('Erro ao importar o chat.', true);
        console.error(error);
    }
}

    function toggleJsonConfig() {
        const panel = document.getElementById('json-config-panel');
        const button = document.getElementById('btn-json-config');
        const open = panel.classList.toggle('active');
        button.classList.toggle('active', open);
        button.setAttribute('aria-expanded', String(open));
    }

    function toggleJsonSection(section) {
        const panel = document.getElementById(`json-section-${section}`);
        const trigger = document.querySelector(`[data-json-section="${section}"]`);
        if (!panel || !trigger) return;
        const open = panel.classList.toggle('active');
        trigger.classList.toggle('active', open);
    }

    async function loadData() {
        try {
            const response = await fetch('../data/siteData.json?v=' + Date.now());
            if (!response.ok) throw new Error('HTTP ' + response.status);
            siteData = await response.json();
            normalizeData();
            renderAll();
            toast('Dados carregados do JSON atual.');
        } catch (error) {
            normalizeData();
            renderAll();
            toast('Nao consegui carregar ../data/siteData.json. Usando estado inicial.', true);
            console.error(error);
        }
    }

    function normalizeData() {
        siteData.config = siteData.config || {};
        if (siteData.config.subtituloHero === undefined) siteData.config.subtituloHero = 'Minimalismo encontra a maxima performance.';
        if (siteData.config.heroImagem === undefined) siteData.config.heroImagem = '';
        if (siteData.config.heroOverlay === undefined || siteData.config.heroOverlay === '') siteData.config.heroOverlay = 0.68;
        siteData.produtos = Array.isArray(siteData.produtos) ? siteData.produtos : [];
        siteData.produtos.forEach(prod => {
            prod.versoes = Array.isArray(prod.versoes) ? prod.versoes : [];
            prod.estoque = toNumberOrEmpty(prod.estoque);
            prod.destaque = Boolean(prod.destaque);
            prod.promocao = Boolean(prod.promocao);
            prod.whatsapp = prod.whatsapp || '';
            prod.versoes.forEach(vers => {
                vers.imagens = Array.isArray(vers.imagens) ? vers.imagens : ['', '', ''];
                while (vers.imagens.length < 3) vers.imagens.push('');
                vers.estoque = toNumberOrEmpty(vers.estoque);
                vers.precoPromocional = vers.precoPromocional || '';
                vers.whatsapp = vers.whatsapp || '';
            });
        });
    }

    function renderAll() {
        renderConfig();
        const container = document.getElementById('products-list-container');
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        siteData.produtos.forEach((prod, index) => renderProduct(prod, index, fragment));
        container.appendChild(fragment);
        if (!siteData.produtos.length) {
            const empty = document.createElement('div');
            empty.className = 'panel-card';
            empty.textContent = 'Nenhum produto cadastrado ainda.';
            container.appendChild(empty);
        }
    }

    function renderConfig() {
        const fields = getConfigFields();
        fields.nomeLoja.value = siteData.config.nomeLoja || '';
        fields.titulo.value = siteData.config.titulo || '';
        fields.subtituloHero.value = siteData.config.subtituloHero || '';
        fields.corPrimaria.value = siteData.config.corPrimaria || '#ffffff';
        fields.tema.value = siteData.config.tema || 'dark';
        fields.textoBusca.value = siteData.config.textoBusca || '';
        fields.heroImagem.value = siteData.config.heroImagem || '';
        fields.heroOverlay.value = siteData.config.heroOverlay || 0.68;
        updateHeroOverlayLabel();
        setPreview(document.getElementById('cfg-hero-preview'), document.getElementById('cfg-hero-preview-img'), fields.heroImagem.value);
        Object.values(fields).forEach(field => {
            if (!field) return;
            field.oninput = autoSaveMemory;
            field.onchange = autoSaveMemory;
        });
        const heroFile = document.getElementById('cfg-hero-file');
        heroFile.onchange = (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const safeName = safeFileName(file.name, 'hero');
            fields.heroImagem.value = safeName;
            pendingImageFiles.set(safeName, file);
            setPreview(document.getElementById('cfg-hero-preview'), document.getElementById('cfg-hero-preview-img'), safeName, file);
            autoSaveMemory();
        };
    }

    function getConfigFields() {
        return {
            nomeLoja: document.getElementById('cfg-nomeLoja'),
            titulo: document.getElementById('cfg-titulo'),
            subtituloHero: document.getElementById('cfg-subtituloHero'),
            corPrimaria: document.getElementById('cfg-corPrimaria'),
            tema: document.getElementById('cfg-tema'),
            textoBusca: document.getElementById('cfg-textoBusca'),
            heroImagem: document.getElementById('cfg-heroImagem'),
            heroOverlay: document.getElementById('cfg-heroOverlay')
        };
    }

    function renderProduct(prod, pIndex, target) {
        const template = document.getElementById('tpl-product').content.cloneNode(true);
        const node = template.querySelector('.product-item');
        node.dataset.prodIndex = pIndex;
        node.querySelector('.prod-title-display').textContent = prod.nome || `Produto ${pIndex + 1}`;
        node.querySelector('.prod-subtitle-display').textContent = prod.descricao || 'Sem descricao';
        renderProductSummary(node, prod);
        if (collapsedProducts.has(pIndex)) {
            node.classList.add('is-collapsed');
            node.querySelector('.btn-toggle-prod').textContent = 'Maximizar';
        }
        node.querySelector('.prod-nome').value = prod.nome || '';
        node.querySelector('.prod-estoque').value = prod.estoque ?? '';
        node.querySelector('.prod-descricao').value = prod.descricao || '';
        node.querySelector('.prod-whatsapp').value = prod.whatsapp || '';
        node.querySelector('.prod-destaque').checked = Boolean(prod.destaque);
        node.querySelector('.prod-promocao').checked = Boolean(prod.promocao);
        node.querySelector('.prod-imagem').value = prod.imagem || '';
        setPreview(node.querySelector('.image-preview'), node.querySelector('.img-preview'), prod.imagem);

        node.querySelector('.btn-toggle-prod').addEventListener('click', () => {
            if (collapsedProducts.has(pIndex)) {
                collapsedProducts.delete(pIndex);
            } else {
                collapsedProducts.add(pIndex);
            }
            renderAll();
        });

        node.querySelector('.btn-remove-prod').addEventListener('click', () => {
            if (confirm('Remover este produto?')) {
                siteData.produtos.splice(pIndex, 1);
                collapsedProducts.delete(pIndex);
                renderAll();
            }
        });

        node.querySelector('.prod-file').addEventListener('change', (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const safeName = safeFileName(file.name, `produto-${pIndex + 1}`);
            node.querySelector('.prod-imagem').value = safeName;
            pendingImageFiles.set(safeName, file);
            setPreview(node.querySelector('.image-preview'), node.querySelector('.img-preview'), safeName, file);
            autoSaveMemory();
        });

        node.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', autoSaveMemory);
            input.addEventListener('change', autoSaveMemory);
        });

        const versionsList = node.querySelector('.versions-list');
        prod.versoes.forEach((vers, vIndex) => renderVersion(vers, vIndex, pIndex, versionsList));
        node.querySelector('.btn-add-version').addEventListener('click', () => {
            siteData.produtos[pIndex].versoes.forEach((_, oldIndex) => collapsedVersions.add(`${pIndex}-${oldIndex}`));
            collapsedProducts.delete(pIndex);
            siteData.produtos[pIndex].versoes.push({ titulo: 'iPhone', specs: '', preco: '', precoPromocional: '', parcelamentoMax: 12, estoque: '', whatsapp: '', imagens: ['', '', ''] });
            renderAll();
        });
        target.appendChild(node);
    }

    function renderVersion(vers, vIndex, pIndex, target) {
        const template = document.getElementById('tpl-version').content.cloneNode(true);
        const node = template.querySelector('.version-item');
        node.dataset.versIndex = vIndex;
        node.querySelector('.vers-num').textContent = vIndex + 1;
        if (collapsedVersions.has(`${pIndex}-${vIndex}`)) {
            node.classList.add('is-collapsed');
            node.querySelector('.btn-toggle-vers').textContent = 'Maximizar';
        }
        node.querySelector('.vers-titulo').value = vers.titulo || '';
        node.querySelector('.vers-preco').value = vers.preco || '';
        node.querySelector('.vers-preco-promocional').value = vers.precoPromocional || '';
        node.querySelector('.vers-parcelas').value = vers.parcelamentoMax || 12;
        node.querySelector('.vers-estoque').value = vers.estoque ?? '';
        node.querySelector('.vers-whatsapp').value = vers.whatsapp || '';
        node.querySelector('.vers-specs').value = vers.specs || '';

        node.querySelector('.btn-toggle-vers').addEventListener('click', () => {
            const key = `${pIndex}-${vIndex}`;
            if (collapsedVersions.has(key)) {
                collapsedVersions.delete(key);
            } else {
                collapsedVersions.add(key);
            }
            renderAll();
        });

        node.querySelector('.btn-remove-vers').addEventListener('click', () => {
            siteData.produtos[pIndex].versoes.splice(vIndex, 1);
            collapsedVersions.delete(`${pIndex}-${vIndex}`);
            renderAll();
        });

        node.querySelectorAll('.vers-img-file').forEach((input) => {
            const imageIndex = Number(input.dataset.idx);
            const hidden = node.querySelector(`.vers-img-hidden[data-idx="${imageIndex}"]`);
            const preview = input.closest('.img-upload-box');
            const previewImg = preview.querySelector('.img-preview-mini');
            hidden.value = vers.imagens[imageIndex] || '';
            setPreview(preview, previewImg, hidden.value);
            input.addEventListener('change', (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                const safeName = safeFileName(file.name, `produto-${pIndex + 1}-versao-${vIndex + 1}-${imageIndex + 1}`);
                hidden.value = safeName;
                pendingImageFiles.set(safeName, file);
                setPreview(preview, previewImg, safeName, file);
                autoSaveMemory();
            });
        });

        node.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', autoSaveMemory);
            input.addEventListener('change', autoSaveMemory);
        });
        target.appendChild(node);
    }

    function renderProductSummary(node, prod) {
        const summary = node.querySelector('.prod-summary');
        if (!summary) return;
        const versoes = Array.isArray(prod.versoes) ? prod.versoes : [];
        const chips = versoes.length
            ? versoes.map((vers, index) => `<span>${vers.titulo || 'Versao ' + (index + 1)}</span>`).join('')
            : '<span>Sem versoes</span>';
        summary.innerHTML = `
            <strong>${prod.nome || 'Produto sem nome'}</strong>
            <small>${prod.estoque !== '' && prod.estoque !== undefined ? prod.estoque + ' em estoque' : 'Estoque nao informado'}</small>
            <div class="summary-versions">${chips}</div>
        `;
    }

    function setPreview(wrapper, image, name, file) {
        if (!wrapper || !image) return;
        if (!name && !file) {
            wrapper.classList.remove('has-image');
            image.removeAttribute('src');
            return;
        }
        image.src = file ? URL.createObjectURL(file) : `../ImagensProduto/${name}`;
        image.onerror = () => wrapper.classList.remove('has-image');
        wrapper.classList.add('has-image');
    }

    function addProduct() {
        siteData.produtos.push({
            nome: 'iPhone ',
            descricao: '',
            imagem: '',
            estoque: 1,
            destaque: false,
            promocao: false,
            whatsapp: '',
            versoes: []
        });
        renderAll();
    }

    function autoSaveMemory() {
        const fields = getConfigFields();
        siteData.config.nomeLoja = fields.nomeLoja.value;
        siteData.config.titulo = fields.titulo.value;
        siteData.config.subtituloHero = fields.subtituloHero.value;
        siteData.config.corPrimaria = fields.corPrimaria.value;
        siteData.config.tema = fields.tema.value;
        siteData.config.textoBusca = fields.textoBusca.value;
        siteData.config.heroImagem = fields.heroImagem.value;
        siteData.config.heroOverlay = fields.heroOverlay.value;
        updateHeroOverlayLabel();

        document.querySelectorAll('.product-item').forEach((pNode, pIndex) => {
            const prod = siteData.produtos[pIndex];
            if (!prod) return;
            prod.nome = pNode.querySelector('.prod-nome').value;
            prod.descricao = pNode.querySelector('.prod-descricao').value;
            prod.imagem = pNode.querySelector('.prod-imagem').value;
            prod.estoque = toNumberOrEmpty(pNode.querySelector('.prod-estoque').value);
            prod.destaque = pNode.querySelector('.prod-destaque').checked;
            prod.promocao = pNode.querySelector('.prod-promocao').checked;
            prod.whatsapp = pNode.querySelector('.prod-whatsapp').value;
            pNode.querySelector('.prod-title-display').textContent = prod.nome || 'Produto sem nome';
            pNode.querySelector('.prod-subtitle-display').textContent = prod.descricao || 'Sem descricao';

            pNode.querySelectorAll('.version-item').forEach((vNode, vIndex) => {
                if (!prod.versoes[vIndex]) prod.versoes[vIndex] = { imagens: ['', '', ''] };
                const vers = prod.versoes[vIndex];
                vers.titulo = vNode.querySelector('.vers-titulo').value;
                vers.preco = vNode.querySelector('.vers-preco').value;
                vers.precoPromocional = vNode.querySelector('.vers-preco-promocional').value;
                vers.parcelamentoMax = Number(vNode.querySelector('.vers-parcelas').value) || 12;
                vers.estoque = toNumberOrEmpty(vNode.querySelector('.vers-estoque').value);
                vers.whatsapp = vNode.querySelector('.vers-whatsapp').value;
                vers.specs = vNode.querySelector('.vers-specs').value;
                vers.imagens = Array.from(vNode.querySelectorAll('.vers-img-hidden')).map(input => input.value);
            });
        });
    }

    async function connectFolder() {
        if (!window.showDirectoryPicker) {
            toast('Seu navegador nao permite salvar direto. Use Chrome ou Edge atualizado.', true);
            return;
        }
        try {
            rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            updateFolderStatus(true, rootHandle.name);
            toast('Pasta conectada. Agora o salvamento direto esta pronto.');
        } catch (error) {
            if (error.name !== 'AbortError') toast('Nao consegui conectar a pasta.', true);
            console.error(error);
        }
    }

    async function saveDirect() {
        autoSaveMemory();
        if (!rootHandle) {
            await connectFolder();
            if (!rootHandle) return;
        }
        try {
            await writeImages();
            const dataDir = await rootHandle.getDirectoryHandle('data', { create: true });
            const fileHandle = await dataDir.getFileHandle('siteData.json', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(siteData, null, 2));
            await writable.close();
            pendingImageFiles.clear();
            toast('JSON e imagens salvos direto no projeto.');
        } catch (error) {
            toast('Falha ao salvar direto. Confira se voce selecionou a pasta Store.', true);
            console.error(error);
        }
    }

    async function writeImages() {
        if (!pendingImageFiles.size) return;
        const imgDir = await rootHandle.getDirectoryHandle('ImagensProduto', { create: true });
        for (const [name, file] of pendingImageFiles.entries()) {
            const fileHandle = await imgDir.getFileHandle(name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(file);
            await writable.close();
        }
    }

    function downloadJson() {
        autoSaveMemory();
        downloadObject(siteData, 'siteData.json');
        toast('JSON completo baixado.');
    }

    function uploadChatJson() {
        autoSaveMemory();
        const chatData = {
            version: 1,
            segmento: 'iphone',
            nomeLoja: siteData.config.nomeLoja || 'Vibe Store',
            nomeAtendente: 'Assistente de Vendas',
            tomVoz: 'consultivo',
            saudacao: `Opa! Sou o assistente da ${siteData.config.nomeLoja || 'loja'}. Quer ajuda para escolher?`,
            fallback: 'Posso te ajudar melhor se voce me disser se busca preco, camera, bateria ou algum modelo especifico.',
            opcoesRapidas: [
                { label: 'Mais barato', value: 'mais barato' },
                { label: 'Melhor camera', value: 'melhor camera' },
                { label: 'Melhor bateria', value: 'melhor bateria' },
                { label: 'Parcelamento', value: 'parcelamento' }
            ],
            respostas: [
                {
                    assunto: 'preco',
                    palavrasChave: ['barato', 'menor preco', 'mais em conta', 'valor'],
                    resposta: 'Tenho opcoes com bom custo-beneficio. Me diga sua faixa de valor que eu te ajudo a escolher.'
                },
                {
                    assunto: 'camera',
                    palavrasChave: ['camera', 'foto', 'video'],
                    resposta: 'Para camera, vale olhar modelos Pro ou modelos mais novos da vitrine.'
                },
                {
                    assunto: 'troca',
                    palavrasChave: ['troca', 'usado', 'aceita'],
                    resposta: 'Aceitamos usado na troca. O ideal e chamar no WhatsApp com modelo, estado e saude da bateria.'
                }
            ],
            whatsapp: {
                gatilhos: ['troca', 'garantia', 'prazo', 'negociacao'],
                mensagemBotao: 'Continuar no WhatsApp'
            }
        };
        downloadObject(chatData, 'Chat-iPhone.json');
        toast('Chat exportado.');
    }

    function downloadJsonPart(type) {
        autoSaveMemory();
        if (type === 'geral') {
            downloadObject({ config: siteData.config }, 'siteData-geral.json');
            toast('JSON Geral exportado.');
            return;
        }
        downloadObject({ produtos: siteData.produtos }, 'siteData-produtos.json');
        toast('JSON Produtos exportado.');
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

    async function importJsonPart(event, type) {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        try {
            const data = JSON.parse(await file.text());
            if (type === 'geral') {
                const config = data.config || data;
                siteData.config = { ...siteData.config, ...config };
                normalizeData();
                renderAll();
                toast('JSON Geral importado.');
                return;
            }
            const produtos = Array.isArray(data) ? data : data.produtos;
            if (!Array.isArray(produtos)) throw new Error('JSON de produtos precisa ser uma lista ou conter a chave produtos.');
            siteData.produtos = produtos;
            collapsedProducts.clear();
            collapsedVersions.clear();
            normalizeData();
            renderAll();
            toast('JSON Produtos importado.');
        } catch (error) {
            toast('Nao consegui importar esse JSON.', true);
            console.error(error);
        }
    }

    function updateFolderStatus(connected, folderName) {
        document.getElementById('folder-status-dot').classList.toggle('connected', connected);
        document.getElementById('folder-status-title').textContent = connected ? 'Pasta conectada' : 'Pasta nao conectada';
        document.getElementById('folder-status-text').textContent = connected ? folderName : 'Conecte a pasta Store para salvar direto.';
    }

    function updateHeroOverlayLabel() {
        const input = document.getElementById('cfg-heroOverlay');
        const label = document.getElementById('cfg-heroOverlay-label');
        if (!input || !label) return;
        label.textContent = Math.round(Number(input.value || 0) * 100) + '%';
    }

    function safeFileName(fileName, fallback) {
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const base = parts.join('.') || fallback;
        return base
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 70) + ext;
    }

    function toNumberOrEmpty(value) {
        if (value === '' || value === null || typeof value === 'undefined') return '';
        const number = Number(value);
        return Number.isFinite(number) ? number : '';
    }

    let toastTimer = null;
    function toast(message, isError = false) {
        const el = document.getElementById('toast');
        el.textContent = message;
        el.classList.toggle('error', isError);
        el.classList.add('active');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('active'), 3600);
    }
})();



