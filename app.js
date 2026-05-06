/**
 * app.js
 * Lógica Javascript para Landing Page Data-Driven (Premium Store)
 */

document.addEventListener('DOMContentLoaded', () => {
   
    const fadeOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, fadeOptions);


    console.log("Chat iniciado");

    function bindSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                const targetElement = document.querySelector(targetId);
                if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    // Modal System
    const modalOverlay = document.getElementById('product-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalCarousel = document.getElementById('modal-carousel-container');
    const prevCtrl = document.querySelector('.prev-control');
    const nextCtrl = document.querySelector('.next-control');

    function openModal(produtoData, pIndex) {
        console.log("Abrindo modal para produto:", produtoData.nome || `Index ${pIndex}`);
        modalCarousel.innerHTML = '';
        
        const versoes = produtoData.versoes || [];
        if (versoes.length === 0) {
            console.log("Aviso: Nenhuma versão encontrada para este produto.");
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-main); width: 100%;">Este produto não possui versões detalhadas.</div>`;
            modalCarousel.appendChild(slide);
        }
        
        versoes.forEach((versao, vIndex) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            
            const precoFallback = versao.preco || "Sob consulta";
            const precoPromocional = versao.precoPromocional || "";
            const zapFallback = versao.whatsapp || produtoData.whatsapp || "Ola, tenho interesse!";
            const tituloFallback = versao.titulo || produtoData.nome || "Produto";
            
            const imagens = versao.imagens || [];
            const img1 = imagens[0] || `ImageP${pIndex + 1}${vIndex === 0 ? '' : '-' + (vIndex + 1)}.jpg`;
            const img2 = imagens[1] || "";
            const img3 = imagens[2] || "";
            
            const specsFormatted = versao.specs ? versao.specs.replace(/\n/g, '<br>') : "Especificações não disponíveis.";

            let slidesHtml = `<div class="mini-slide"><img src="./ImagensProduto/${img1}" alt="1" onerror="this.onerror=null; console.warn('Imagem não encontrada:', '${img1}'); this.src='./assets/placeholder.png';"></div>`;
            let dotsHtml = `<div class="mini-dot active" data-tgt="0"></div>`;
            if (img2) {
                slidesHtml += `<div class="mini-slide"><img src="./ImagensProduto/${img2}" alt="2" onerror="this.onerror=null; console.warn('Imagem não encontrada:', '${img2}'); this.src='./assets/placeholder.png';"></div>`;
                dotsHtml += `<div class="mini-dot" data-tgt="1"></div>`;
            }
            if (img3) {
                slidesHtml += `<div class="mini-slide"><img src="./ImagensProduto/${img3}" alt="3" onerror="this.onerror=null; console.warn('Imagem não encontrada:', '${img3}'); this.src='./assets/placeholder.png';"></div>`;
                dotsHtml += `<div class="mini-dot" data-tgt="2"></div>`;
            }
            
            const precoBaseParcelas = precoPromocional || precoFallback;
            let parsedPrice = parseFloat(String(precoBaseParcelas).replace(/\./g, '').replace(',', '.'));
            let parcelasHtml = '';
            if(!isNaN(parsedPrice) && parsedPrice > 0) {
                parcelasHtml = `
                    <div class="parcelas" id="parcelas-${vIndex}"></div>
                    <div class="parcelas-valor" id="parcelas-valor-${vIndex}"></div>
                `;
            }

            slide.innerHTML = `
                <div class="modal-image">
                    <div class="mini-carousel-wrapper" data-slide="${vIndex}" data-prod="${pIndex}">
                        <div class="mini-carousel-inner" id="inner-${vIndex}">
                            ${slidesHtml}
                        </div>
                        <div class="mini-dots-container" id="dots-${vIndex}">
                            ${dotsHtml}
                        </div>
                    </div>
                </div>
                <div class="modal-text">
                    <h2 class="slide-title">${tituloFallback}</h2>
                    <div class="specs-content" id="specs-${vIndex}">${specsFormatted}</div>
                    <div class="price" style="margin-top: 24px; margin-bottom: 0;">${precoPromocional ? '<span class="old-price">R$ ' + precoFallback + '</span><span>R$ ' + precoPromocional + '</span>' : (isNaN(parsedPrice) ? precoFallback : 'R$ ' + precoFallback)}</div>
                    ${parcelasHtml}
                    <div style="margin-top: 24px;">
                        <a href="https://api.whatsapp.com/send?phone=555185729132&text=${encodeURIComponent(zapFallback)}" class="btn btn-buy cta-btn" id="btn-zap-${vIndex}" style="padding: 16px 32px;" target="_blank" rel="noopener noreferrer">
                             Falar no WhatsApp
                        </a>
                    </div>
                </div>
            `;
            modalCarousel.appendChild(slide);
        });

        setTimeout(() => {
            modalCarousel.scrollTo({ left: 0, behavior: 'auto' });
            window.updateCarouselControls();
            initMiniCarousels();
            
            // Build parcelamento logic
            versoes.forEach((versao, vIndex) => {
                let pPrice = parseFloat(String(versao.precoPromocional || versao.preco || "0").replace(/\./g, '').replace(',', '.'));
                if(!isNaN(pPrice) && pPrice > 0) {
                    gerarParcelasUI(pPrice, versao.parcelamentoMax || 12, vIndex, versao.titulo || "Produto");
                }
            });
            
        }, 10);
        
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    window.updateCarouselControls = function() {
        const slides = modalCarousel.querySelectorAll('.carousel-slide');
        if (slides.length <= 1) {
            prevCtrl.style.display = 'none';
            nextCtrl.style.display = 'none';
        } else {
            prevCtrl.style.display = 'flex';
            nextCtrl.style.display = 'flex';
        }
    };

    prevCtrl.addEventListener('click', () => modalCarousel.scrollBy({ left: -modalCarousel.clientWidth, behavior: 'smooth' }));
    nextCtrl.addEventListener('click', () => modalCarousel.scrollBy({ left: modalCarousel.clientWidth, behavior: 'smooth' }));

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if(window.miniCarouselIntervals) {
            window.miniCarouselIntervals.forEach(clearInterval);
            window.miniCarouselIntervals = [];
        }
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    function initMiniCarousels() {
        const wrappers = document.querySelectorAll('.mini-carousel-wrapper');
        if(!window.miniCarouselIntervals) window.miniCarouselIntervals = [];
        window.miniCarouselIntervals.forEach(clearInterval);
        window.miniCarouselIntervals = [];
        
        wrappers.forEach(wrapper => {
            const inner = wrapper.querySelector('.mini-carousel-inner');
            const dots = wrapper.querySelectorAll('.mini-dot');
            // Timeout to allow failed images to process their onerror
            setTimeout(() => {
                const slides = Array.from(inner.querySelectorAll('.mini-slide:not(.failed-slide)'));
                if(slides.length === 0) return;
                
                // Hide extra dots if some images failed
                dots.forEach((dot, index) => {
                    if(index >= slides.length) dot.style.display = 'none';
                });
                
                if(slides.length <= 1) return;

                let currentIndex = 0;
                let paused = false;

                function goToSlide(index) {
                    currentIndex = index;
                    inner.style.transform = `translateX(-${currentIndex * 100}%)`;
                    dots.forEach(d => d.classList.remove('active'));
                    dots[currentIndex].classList.add('active');
                }

                function nextSlide() {
                    if(paused) return;
                    let nextIndex = (currentIndex + 1) % slides.length;
                    goToSlide(nextIndex);
                }

                const intervalId = setInterval(nextSlide, 3000);
                window.miniCarouselIntervals.push(intervalId);

                // Interaction pauses
                wrapper.addEventListener('mouseenter', () => paused = true);
                wrapper.addEventListener('mouseleave', () => paused = false);
                wrapper.addEventListener('touchstart', () => paused = true, {passive: true});
                wrapper.addEventListener('touchend', () => paused = false);
                
                // Swipe Support Simple
                let startX = 0;
                wrapper.addEventListener('touchstart', e => {
                    startX = e.changedTouches[0].screenX;
                }, {passive: true});
                wrapper.addEventListener('touchend', e => {
                    let diff = e.changedTouches[0].screenX - startX;
                    if(diff < -30) {
                        goToSlide((currentIndex + 1) % slides.length);
                    } else if(diff > 30) {
                        goToSlide((currentIndex - 1 + slides.length) % slides.length);
                    }
                });

                // Click Dots
                dots.forEach(dot => {
                    dot.addEventListener('click', (e) => {
                        const target = parseInt(e.target.dataset.tgt);
                        if(target < slides.length) goToSlide(target);
                    });
                });
            }, 100);
        });
    }


    // Protocol check before anything
    if (window.location.protocol === "file:") {
        alert("Para visualizar os produtos, abra o projeto com um servidor local.\n\nExemplo:\n- Use Live Server no VS Code\n- Ou rode: python -m http.server\n\nO navegador bloqueia o JSON no modo file://");
    } else {
        carregarProdutos();
    }

    function carregarProdutos() {
        // Load Data with anti-cache
        fetch('./data/siteData.json?v=' + Date.now())
            .then(res => res.json())
            .then(data => {
                console.log("JSON carregado:", data);
                
                if (!data || !Array.isArray(data.produtos)) {
                    console.error("JSON inválido ou array de produtos ausente");
                    return;
                }
                
                if (data.produtos.length === 0) {
                    console.error("Sem produtos no JSON");
                } else {
                    console.log("Produtos:", data.produtos);
                }
                
                // Apply Configs
                if (data.config) {
                    if(data.config.nomeLoja) {
                        document.title = `${data.config.nomeLoja} | Lançamentos`;
                        const logo = document.querySelector('.logo') || document.getElementById('dyn-header-name');
                        if (logo) logo.textContent = data.config.nomeLoja;
                        
                        const footerName = document.getElementById('dyn-footer-name');
                        if (footerName) footerName.innerHTML = `&copy; ${new Date().getFullYear()} ${data.config.nomeLoja}. Todos os direitos reservados.`;
                    }
                    if(data.config.titulo) {
                        const heroTitle = document.getElementById('dyn-hero-title') || document.querySelector('.hero-title');
                        if (heroTitle) heroTitle.innerHTML = data.config.titulo;
                    }
                    if(data.config.subtituloHero) {
                        const heroSubtitle = document.getElementById('dyn-hero-subtitle');
                        if (heroSubtitle) heroSubtitle.textContent = data.config.subtituloHero;
                    }
                    if(data.config.heroImagem) {
                        document.documentElement.style.setProperty('--hero-image', `url("./ImagensProduto/${data.config.heroImagem}")`);
                    } else {
                        document.documentElement.style.setProperty('--hero-image', 'none');
                    }
                    if(data.config.heroOverlay !== undefined && data.config.heroOverlay !== '') {
                        document.documentElement.style.setProperty('--hero-overlay', String(data.config.heroOverlay));
                    }
                    if(data.config.tema) {
                        document.body.setAttribute('data-theme', data.config.tema);
                    }
                    if(data.config.corPrimaria) {
                        document.documentElement.style.setProperty('--primary-color', data.config.corPrimaria);
                        document.documentElement.style.setProperty('--text-main', data.config.corPrimaria); // Backwards compatibility
                    }
                    if(data.config.textoBusca) {
                        const ctaText = document.getElementById('dyn-cta-text') || document.querySelector('.cta-title');
                        if (ctaText) ctaText.textContent = data.config.textoBusca;
                    }
                }

                // Render Products
                const grid = document.getElementById('produtos-grid');
                if (grid) {
                    grid.innerHTML = '';
                }
                
                if (data.produtos && Array.isArray(data.produtos)) {
                    console.log(`Renderizando ${data.produtos.length} produtos...`);
                    
                    if (data.produtos.length === 0 && grid) {
                        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; opacity: 0.7;">Nenhum produto cadastrado ainda.</p>';
                    }
                    
                    data.produtos.forEach((prod, index) => {
                        const versoes = prod.versoes || [];
                        const primeiraVersao = versoes[0] || {};
                        const priceFallback = primeiraVersao.precoPromocional || primeiraVersao.preco || "Sob consulta";
                        const oldPrice = primeiraVersao.precoPromocional && primeiraVersao.preco ? primeiraVersao.preco : "";
                        const stockLabel = prod.estoque !== undefined && prod.estoque !== null && prod.estoque !== "" ? `${prod.estoque} em estoque` : "";
                        const zapFallback = primeiraVersao.whatsapp || "Olá, tenho interesse!";
                        const nomeProduto = prod.nome || `Produto ${index + 1}`;
                        const nomeFormatado = nomeProduto.toLowerCase().replace(/\s+/g, '');
                        const imgProduto = prod.imagem || `imagem${index + 1}.jpg`;

                        const card = document.createElement('div');
                        card.className = 'product-card fade-in';
                        card.dataset.produto = nomeFormatado;
                        
                        // We will build the innerHTML and add the onerror using an event listener or inline
                        card.innerHTML = `
                            <div class="image-container">
                                <img src="./ImagensProduto/${imgProduto}" alt="${nomeProduto}" class="img-main" onerror="this.onerror=null; console.warn('Imagem não encontrada:', '${imgProduto}'); this.src='./assets/placeholder.png';">
                                <div class="tile-button-wrapper open-modal-btn">
                                    <span class="tile-button tile-button-high-contrast">
                                        <svg class="icon-control icon-control-plus tile-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
                                            <path d="m24 16.5h-4.5v-4.5c0-.8286-.6719-1.5-1.5-1.5s-1.5.6714-1.5 1.5v4.5h-4.5c-.8281 0-1.5.6714-1.5 1.5s.6719 1.5 1.5 1.5h4.5v4.5c0 .8286.6719 1.5 1.5 1.5s1.5-.6714 1.5-1.5v-4.5h4.5c.8281 0 1.5-.6714 1.5-1.5s-.6719-1.5-1.5-1.5z"></path>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div class="product-info">
                                <div class="product-badges">${prod.destaque ? '<span>Destaque</span>' : ''}${prod.promocao ? '<span>Promoção</span>' : ''}${stockLabel ? '<span>' + stockLabel + '</span>' : ''}</div>
                                <h3>${nomeProduto}</h3>
                                <p style="margin: 8px 0; font-size: 0.9rem; color: var(--text-muted);">${prod.descricao || ''}</p>
                                <div class="buttons product-actions">
    <button class="btn btn-buy open-modal-btn">Ver detalhes</button>
</div>
                                </div>
                            </div>
                        `;
                        grid.appendChild(card);
                        
                        // Add open modal listener

                       const modalBtns = card.querySelectorAll('.open-modal-btn');

modalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal(prod, index);
    });
});
                       
                        //const modalBtn = card.querySelector('.open-modal-btn');
                      //  if (modalBtn) {
                          //  modalBtn.addEventListener('click', (e) => {
                            //    e.preventDefault();
                            //    e.stopPropagation();
                            //    openModal(prod, index);
                           // });
                       // }

                        // Observe for fade-in
                        fadeObserver.observe(card);
                    });
                }

                bindSmoothScroll();
                initChatIA();
            })
            .catch(err => {
                console.error("Falha ao carregar siteData.json:", err);
            });
    }
        
    // Bind initial static elements
    bindSmoothScroll();
    const staticFade = document.querySelectorAll('.fade-in');
    staticFade.forEach(el => fadeObserver.observe(el));
});





function gerarParcelasUI(valor, maxParcelas, index, titulo) {
    const container = document.getElementById(`parcelas-${index}`);
    const valorEl = document.getElementById(`parcelas-valor-${index}`);

    if (!container || !valorEl) return;

    const limiteVisivel = 3;
    let expandido = false;
    let parcelaSelecionada = 1;

    function renderBotoes() {
        container.innerHTML = '';
        const limite = expandido ? maxParcelas : Math.min(maxParcelas, limiteVisivel);

        for (let i = 1; i <= limite; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = i + 'x';
            btn.classList.toggle('active', i === parcelaSelecionada);
            btn.onclick = () => atualizarParcela(i);
            container.appendChild(btn);
        }

        if (!expandido && maxParcelas > limiteVisivel) {
            const more = document.createElement('button');
            more.type = 'button';
            more.textContent = '+';
            more.className = 'parcelas-more';
            more.onclick = () => {
                expandido = true;
                renderBotoes();
            };
            container.appendChild(more);
        }
    }

    function atualizarParcela(x) {
        parcelaSelecionada = x;
        const valorParcela = (valor / x).toFixed(2).replace('.', ',');
        valorEl.textContent = `ou ${x}x de R$ ${valorParcela}`;

        const btnZap = document.getElementById(`btn-zap-${index}`);
        if (btnZap) {
            const texto = `${titulo} em ${x}x de R$ ${valorParcela}`;
            btnZap.href = `https://api.whatsapp.com/send?phone=555185729132&text=${encodeURIComponent(texto)}`;
        }

        renderBotoes();
    }

    renderBotoes();
    atualizarParcela(1);
}
// CHAT
function initChatIA() {
    const btn = document.getElementById("chat-btn");
    const box = document.getElementById("chat-box");
    const input = document.getElementById("chat-input");
    const send = document.getElementById("chat-send");
    const messages = document.getElementById("chat-messages");

    if (!btn || !box || !input || !send || !messages || box.dataset.ready === "true") return;
    box.dataset.ready = "true";

    const whatsappBase = "https://api.whatsapp.com/send?phone=555185729132&text=";
    let ultimoProdutoAberto = null;

    btn.setAttribute("role", "button");
    btn.setAttribute("aria-label", "Abrir assistente de vendas");
    btn.setAttribute("tabindex", "0");

    btn.addEventListener("click", toggleChat);
    btn.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") toggleChat();
    });

    function toggleChat() {
        box.classList.toggle("active");
        if (box.classList.contains("active")) {
            setTimeout(() => input.focus(), 120);
        }
    }

    function normalizar(texto) {
        return texto
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[!?.;,]/g, "")
            .trim();
    }

    function getProdutos() {
        return Array.from(document.querySelectorAll("[data-produto]")).map(card => ({
            card,
            chave: card.dataset.produto || "",
            nome: card.querySelector("h3")?.textContent?.trim() || "Produto",
            descricao: card.querySelector(".product-info p")?.textContent?.trim() || ""
        }));
    }

    function abrirProduto(card) {
        card?.querySelector(".open-modal-btn")?.click();
        const produto = getProdutos().find(item => item.card === card);
        if (produto) ultimoProdutoAberto = produto;
    }

    function abrirPorBusca(termo) {
        const query = normalizar(termo).replace(/\s+/g, "");
        if (!query) return null;
        const produtos = getProdutos();
        const encontrado = produtos.find(prod => normalizar(prod.nome).replace(/\s+/g, "").includes(query) || prod.chave.includes(query));
        if (encontrado) abrirProduto(encontrado.card);
        return encontrado || null;
    }

    function extrairModelo(msg) {
        const match = msg.match(/\b(xr|11|12|13|14|15|16|17)\b/);
        return match ? match[0] : "";
    }

    function perguntaSobreProdutoAtual(msg) {
        return !!ultimoProdutoAberto && (
            msg.includes("dele") ||
            msg.includes("desse") ||
            msg.includes("deste") ||
            msg.includes("do aparelho") ||
            msg.includes(normalizar(ultimoProdutoAberto.nome).replace(/iphone/g, "").trim())
        );
    }

    function addMsg(text, type) {
        const div = document.createElement("div");
        div.className = "msg " + type;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function addOptions(options) {
        const old = messages.querySelector(".opcoes:last-child");
        if (old) old.remove();

        const wrap = document.createElement("div");
        wrap.className = "opcoes";
        options.forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = option.label;
            button.addEventListener("click", () => responderRapido(option.value || option.label));
            wrap.appendChild(button);
        });
        messages.appendChild(wrap);
        messages.scrollTop = messages.scrollHeight;
    }

    function addWhatsappOption(texto) {
        const link = document.createElement("a");
        link.className = "chat-whatsapp-link";
        link.href = whatsappBase + encodeURIComponent(texto);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Continuar no WhatsApp";
        messages.appendChild(link);
        messages.scrollTop = messages.scrollHeight;
    }

    function opcoesPrincipais() {
        addOptions([
            { label: "Mais barato", value: "mais barato" },
            { label: "Melhor camera", value: "melhor camera" },
            { label: "Melhor bateria", value: "melhor bateria" },
            { label: "Linha Pro", value: "linha pro" },
            { label: "Parcelamento", value: "parcelamento" }
        ]);
    }

    function responderRapido(texto) {
        addMsg(texto, "user");
        responder(texto);
    }

    function responder(textoOriginal) {
        const msg = normalizar(textoOriginal);
        const produtos = getProdutos();

        let resposta = "";
        let mostrarOpcoes = false;
        let abrirWhats = false;

        const saudacao = ["oi", "ola", "opa", "bom dia", "boa tarde", "boa noite"].some(item => msg === item || msg.startsWith(item));
        if (saudacao) {
            resposta = "Opa! Me diz o que voce procura: menor preco, camera melhor, bateria boa ou algum modelo especifico?";
            mostrarOpcoes = true;
        } else if (msg.includes("parcel") || msg.includes("vezes") || msg.includes("cartao")) {
            resposta = "Temos parcelamento por modelo. Abra um produto em Ver detalhes e escolha 1x, 2x, 3x ou toque no + para ver todas as parcelas disponiveis.";
            mostrarOpcoes = true;
        } else if (msg.includes("troca") || msg.includes("usado") || msg.includes("pega meu") || msg.includes("aceita")) {
            resposta = "Aceitamos usado na troca. O ideal e chamar no WhatsApp com modelo, estado, bateria e se acompanha caixa/carregador.";
            abrirWhats = true;
        } else if (msg.includes("garantia") || msg.includes("procedencia") || msg.includes("original")) {
            resposta = "Nos detalhes de cada aparelho voce encontra estado, bateria e observacoes. Para confirmar garantia e procedencia do aparelho escolhido, recomendo fechar pelo WhatsApp.";
            abrirWhats = true;
        } else if (msg.includes("barato") || msg.includes("menor preco") || msg.includes("mais em conta") || msg.includes("economico")) {
            const alvo = abrirPorBusca("xr") || abrirPorBusca("11") || produtos[0];
            if (alvo) abrirProduto(alvo.card);
            resposta = alvo ? `Separei uma opcao com bom custo-beneficio: ${alvo.nome}. Da uma olhada nos detalhes.` : "Me chama no WhatsApp que eu te mostro as opcoes mais em conta.";
        } else if (msg.includes("camera") || msg.includes("foto") || msg.includes("video")) {
            const alvo = abrirPorBusca("pro") || abrirPorBusca("14") || abrirPorBusca("15");
            resposta = alvo ? `Para camera, eu olharia primeiro a linha Pro. Abri ${alvo.nome} para voce comparar.` : "Para camera, procure modelos Pro ou modelos mais novos.";
        } else if (msg.includes("bateria") || msg.includes("dura") || msg.includes("carrega")) {
            const modeloPedido = extrairModelo(msg);
            const alvo = modeloPedido ? abrirPorBusca(modeloPedido) : (perguntaSobreProdutoAtual(msg) ? ultimoProdutoAberto : null);
            if (alvo) {
                abrirProduto(alvo.card);
                resposta = `A saude/estado da bateria do ${alvo.nome} fica nos detalhes da versao. Abri ele para voce conferir as especificacoes.`;
            } else {
                const sugestao = abrirPorBusca("max") || abrirPorBusca("plus") || abrirPorBusca("13") || abrirPorBusca("14");
                resposta = sugestao ? "Para bateria, modelos Plus/Max costumam ser melhores. Abri uma boa opcao para voce." : "Para bateria, vale priorizar Plus, Pro Max ou modelos mais novos.";
            }
        } else if (msg.includes("pro") || msg.includes("linha pro")) {
            const alvo = abrirPorBusca("pro");
            resposta = alvo ? `Boa escolha. A linha Pro entrega camera e acabamento superiores. Abri ${alvo.nome}.` : "No momento nao encontrei linha Pro na vitrine carregada.";
        } else if (msg.includes("melhor") || msg.includes("top") || msg.includes("mais novo")) {
            const alvo = produtos[produtos.length - 1];
            if (alvo) abrirProduto(alvo.card);
            resposta = alvo ? `O mais interessante para olhar primeiro e ${alvo.nome}. Abri os detalhes para voce.` : "Ainda nao encontrei produtos carregados na vitrine.";
        } else if (msg.includes("iphone")) {
            const modelo = extrairModelo(msg) || msg.replace("iphone", "").replace(/\b(tem|vc|voce|temos|o|a|um|uma)\b/g, "").trim();
            const alvo = abrirPorBusca(modelo);
            resposta = alvo ? `Boa escolha. Abri ${alvo.nome} para voce ver fotos, especificacoes e parcelamento.` : "Nao encontrei exatamente esse modelo na vitrine. Posso te mostrar mais barato, melhor camera ou melhor bateria.";
            mostrarOpcoes = !alvo;
        } else if (/\b(xr|11|12|13|14|15|16|17)\b/.test(msg)) {
            const modelo = extrairModelo(msg);
            const alvo = abrirPorBusca(modelo);
            resposta = alvo ? `Abri ${alvo.nome}. Confere as fotos e detalhes.` : "Nao achei esse modelo carregado agora.";
        } else {
            resposta = "Posso te ajudar melhor se voce me disser: quer pagar menos, ter camera melhor, bateria melhor ou esta procurando um modelo especifico?";
            mostrarOpcoes = true;
        }

        setTimeout(() => {
            addMsg(resposta, "ia");
            if (mostrarOpcoes) opcoesPrincipais();
            if (abrirWhats) addWhatsappOption(textoOriginal);
        }, 320);
    }

    function sendMsg() {
        const text = input.value.trim();
        if (!text) return;
        addMsg(text, "user");
        input.value = "";
        responder(text);
    }

    send.addEventListener("click", sendMsg);
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") sendMsg();
    });

    setTimeout(() => {
        if (!messages.dataset.welcomeAdded) {
            messages.dataset.welcomeAdded = "true";
            opcoesPrincipais();
        }
    }, 500);
}

