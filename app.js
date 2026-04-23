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
            const zapFallback = versao.whatsapp || "Olá, tenho interesse!";
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
            
            let parsedPrice = parseFloat(precoFallback.replace(/\./g, '').replace(',', '.'));
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
                    <div class="price" style="margin-top: 24px; margin-bottom: 0;">${isNaN(precoFallback) ? precoFallback : 'R$ ' + precoFallback}</div>
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
            produtoData.versoes.forEach((versao, vIndex) => {
                let pPrice = parseFloat((versao.preco || "0").replace(/\./g, '').replace(',', '.'));
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
                        const priceFallback = primeiraVersao.preco || "Sob consulta";
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
                                <h3>${nomeProduto}</h3>
                                <p style="margin: 8px 0; font-size: 0.9rem; color: var(--text-muted);">${prod.descricao || ''}</p>
                                <span class="price">${priceFallback}</span>
                                <div class="buttons" style="margin-top: 16px;">
                                    <a href="https://api.whatsapp.com/send?phone=555185729132&text=${encodeURIComponent(zapFallback)}" class="btn btn-buy" target="_blank" rel="noopener noreferrer">Comprar</a>
                                </div>
                            </div>
                        `;
                        grid.appendChild(card);
                        
                        // Add open modal listener
                        const modalBtn = card.querySelector('.open-modal-btn');
                        if (modalBtn) {
                            modalBtn.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openModal(prod, index);
                            });
                        }

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

    container.innerHTML = '';

    const limiteVisivel = 5;

    for (let i = 1; i <= maxParcelas; i++) {
        if (i > limiteVisivel) break;

        const btn = document.createElement('button');
        btn.textContent = i + 'x';
        btn.onclick = () => atualizarParcela(i);
        container.appendChild(btn);
    }

    // BOTÃO "+"
    if (maxParcelas > limiteVisivel) {
        const more = document.createElement('button');
        more.textContent = '+';
        more.onclick = () => {
            container.innerHTML = '';

            for (let i = 1; i <= maxParcelas; i++) {
                const btn = document.createElement('button');
                btn.textContent = i + 'x';
                btn.onclick = () => atualizarParcela(i);
                container.appendChild(btn);
            }
        };
        container.appendChild(more);
    }

    function atualizarParcela(x) {
        const valorParcela = (valor / x).toFixed(2);
        valorEl.textContent = `ou ${x}x de R$ ${valorParcela}`;

        const btnZap = document.getElementById(`btn-zap-${index}`);
        if (btnZap) {
            const texto = `${titulo} em ${x}x de R$ ${valorParcela}`;
            btnZap.href = `https://api.whatsapp.com/send?phone=555185729132&text=${encodeURIComponent(texto)}`;
        }
    }

    atualizarParcela(1);
}
// CHAT 
function initChatIA() {
    const btn = document.getElementById("chat-btn");
    const box = document.getElementById("chat-box");
    const input = document.getElementById("chat-input");
    const send = document.getElementById("chat-send");
    const messages = document.getElementById("chat-messages");

    if (!btn || !box) return;

    btn.addEventListener("click", () => {
        box.classList.toggle("active");
    });

    function addMsg(text, type) {
        const div = document.createElement("div");
        div.className = "msg " + type;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

   function responderRapido(texto) {
        addMsg(texto, "user");

        const resp = responderIA(texto);

        setTimeout(() => {
            addMsg(resp, "ia");
        }, 300);
    }
   
   function mostrarOpcoesPrincipais() {
    const opcoes = document.createElement("div");
    opcoes.className = "opcoes";

    const botoes = [
        { texto: "💰 Ver mais baratos", acao: () => responderRapido("barato") },
        { texto: "📸 Melhor câmera", acao: () => responderRapido("câmera") },
        { texto: "🔋 Melhor bateria", acao: () => responderRapido("bateria") },
        { texto: "🚀 Melhor modelo", acao: () => responderRapido("melhor") }
    ];

    botoes.forEach(btn => {
        const b = document.createElement("button");
        b.textContent = btn.texto;
        b.onclick = btn.acao;
        opcoes.appendChild(b);
    });

    messages.appendChild(opcoes);
    messages.scrollTop = messages.scrollHeight;
}
   
    function responderIA(msg) {
    //msg = msg.toLowerCase();
       //msg = msg.toLowerCase().trim();
       msg = msg
   .toLowerCase()
    .trim()
    .replace(/[!?.]/g, "");

           // 👋 SAUDAÇÃO (COLOCA AQUI NO TOPO)
if (
    msg === "oi" ||
    msg === "ola" ||
    msg === "olá" ||
    msg === "opa" ||
    msg.startsWith("bom dia") ||
    msg.startsWith("boa tarde") ||
    msg.startsWith("boa noite")
) 
//{
//setTimeout(() => {
   // mostrarOpcoesPrincipais();
//}, 700); // maior que o delay do sendMsg
{
return "Opa! Tudo certo por aí? 😄 Como posso te ajudar?";
} 
    //if (
      //  msg.includes("oi") ||
      //  msg.includes("olá") ||
       // msg.includes("ola") ||
       // msg.includes("opa") ||
       // msg.includes("bom dia") ||
       // msg.includes("boa tarde") ||
       // msg.includes("boa noite")
   // ) 
      // {
     //   setTimeout(() => {
       //     mostrarOpcoesPrincipais();
     //  }, 300);

      //  return "Opa! Tudo certo por aí? 😄 Como posso te ajudar?";
   // }
       
    const produtos = document.querySelectorAll('[data-produto]');

    function abrirPorNome(nome) {
        nome = nome.toLowerCase().replace(/\s+/g, '');

        const alvo = Array.from(produtos).find(p => {
            const produtoNome = p.dataset.produto.toLowerCase();
            return produtoNome.includes(nome);
        });

        if (alvo) {
            alvo.querySelector('.open-modal-btn')?.click();
            return true;
        }
        return false;
    }
       
    // 🔎 MODELO DIRETO
    if (msg.includes("iphone")) {
        let modelo = msg.replace("iphone", "").trim();

        if (abrirPorNome(modelo)) {
            return "Boa escolha 👌 Esse modelo é muito procurado!";
        }

        return "Não encontrei exatamente esse modelo, mas posso te sugerir opções 👇";
    }

    // 💰 PREÇO / BARATO
    if (msg.includes("barato") || msg.includes("mais em conta")) {
        abrirPorNome("11") || abrirPorNome("12");
        return "Tenho opções mais acessíveis e com ótimo custo-benefício 💰";
    }

    // 💰 PERGUNTA DE PREÇO (Atualizado)
if (msg.includes("quanto") || msg.includes("valor") || msg.includes("preço")) {
    abrirPorNome("11") || abrirPorNome("12");

    //setTimeout(() => {
      //  mostrarOpcoesPrincipais();
    //}, 500);

    return "Temos várias opções 💰 Me diz o que você prefere 👇";
}

    // 📸 CÂMERA
    if (msg.includes("câmera") || msg.includes("foto") || msg.includes("vídeo")) {
        abrirPorNome("pro");
        return "Se você quer câmera top, recomendo linha Pro 📸";
    }

    // 🔋 BATERIA
    if (msg.includes("bateria") || msg.includes("dura") || msg.includes("carrega")) {
        abrirPorNome("max") || abrirPorNome("plus");
        return "Esses modelos têm bateria mais duradoura 🔋";
    }

    // 👍 USADO / VALE A PENA
    if (msg.includes("vale a pena") || msg.includes("compensa") || msg.includes("usado")) {
        abrirPorNome("12") || abrirPorNome("13");
        return "Sim, vale muito a pena 👍 Esses modelos ainda são rápidos e atualizados";
    }

    // 🚀 MELHOR MODELO
    if (msg.includes("melhor") || msg.includes("top") || msg.includes("mais novo")) {
        const ultimo = produtos[produtos.length - 1];
        ultimo?.querySelector('.open-modal-btn')?.click();
        return "Esse é o mais avançado que temos 🚀";
    }

    // 🧠 COMPARAÇÃO
    if (msg.includes("diferença") || msg.includes("qual melhor entre")) {
        abrirPorNome("12");
        return "Posso te mostrar um ótimo equilíbrio entre preço e desempenho 👍";
    }

    // 💬 FINAL
    return "Posso te ajudar melhor 😄 Você busca algo mais barato, melhor câmera ou bateria?";
}

    function sendMsg() {
    const text = input.value.trim();
    if (!text) return;

    addMsg(text, "user");
       
    const msg = text
        .toLowerCase()
        .trim()
        .replace(/[!?.]/g, "");
       
   //  const resp = responderIA(text) || "Deixa eu te ajudar melhor 👇";
   const resp = responderIA(msg) || "Deixa eu te ajudar melhor 👇";


    setTimeout(() => {
        addMsg(resp, "ia");

       // 👇 DETECÇÃO COMPLETA DE SAUDAÇÃO
        if (
            msg === "oi" ||
            msg === "ola" ||
            msg === "olá" ||
            msg === "opa" ||
            msg.startsWith("bom dia") ||
            msg.startsWith("boa tarde") ||
            msg.startsWith("boa noite")
        ) {
            setTimeout(() => {
                mostrarOpcoesPrincipais();
            }, 300);
        }
    
    }, 400);

    input.value = "";
}

    send.addEventListener("click", sendMsg);

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") sendMsg();
    });

    // 💬 Mensagem inicial automática
    //setTimeout(() => {
     //   addMsg("Olá! 👋 Posso te ajudar a escolher seu iPhone.\nQuer algo mais barato, melhor câmera ou bateria?", "ia");
   // }, 800);
}
