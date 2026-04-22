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

    console.log("Sistema iniciado");

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
        modalCarousel.innerHTML = '';
        
        const versoes = produtoData.versoes || [];

        versoes.forEach((versao, vIndex) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            
            const precoFallback = versao.preco || "Sob consulta";
            const zapFallback = versao.whatsapp || "Olá, tenho interesse!";
            const tituloFallback = versao.titulo || produtoData.nome || "Produto";
            
            const imagens = versao.imagens || [];
            const img1 = imagens[0] || `ImageP${pIndex + 1}.jpg`;

            slide.innerHTML = `
                <div class="modal-image">
                    <img src="./ImagensProduto/${img1}" 
                         onerror="this.src='./assets/placeholder.png'">
                </div>

                <div class="modal-text">
                    <h2>${tituloFallback}</h2>
                    <div>${versao.specs || ""}</div>

                    <div class="price">
                        ${isNaN(precoFallback) ? precoFallback : 'R$ ' + precoFallback}
                    </div>

                    <a href="https://api.whatsapp.com/send?phone=555185729132&text=${encodeURIComponent(zapFallback)}"
                       class="btn btn-buy"
                       target="_blank">
                       Falar no WhatsApp
                    </a>
                </div>
            `;
            modalCarousel.appendChild(slide);
        });

        setTimeout(() => {
            modalCarousel.scrollTo({ left: 0 });
            updateCarouselControls();
        }, 50);

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 🔥 CONTROLE INTELIGENTE DO CARROSSEL
    function updateCarouselControls() {
        const scrollLeft = modalCarousel.scrollLeft;
        const maxScroll = modalCarousel.scrollWidth - modalCarousel.clientWidth;

        prevCtrl.style.opacity = scrollLeft <= 5 ? '0' : '1';
        prevCtrl.style.pointerEvents = scrollLeft <= 5 ? 'none' : 'auto';

        nextCtrl.style.opacity = scrollLeft >= maxScroll - 5 ? '0' : '1';
        nextCtrl.style.pointerEvents = scrollLeft >= maxScroll - 5 ? 'none' : 'auto';
    }

    modalCarousel.addEventListener('scroll', updateCarouselControls);

    prevCtrl.addEventListener('click', () => {
        modalCarousel.scrollBy({ left: -modalCarousel.clientWidth, behavior: 'smooth' });
    });

    nextCtrl.addEventListener('click', () => {
        modalCarousel.scrollBy({ left: modalCarousel.clientWidth, behavior: 'smooth' });
    });

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // LOAD DATA
    if (window.location.protocol !== "file:") {
        fetch('./data/siteData.json?v=' + Date.now())
            .then(res => res.json())
            .then(data => {

                const grid = document.getElementById('produtos-grid');
                grid.innerHTML = '';

                data.produtos.forEach((prod, index) => {

                    const nomeProduto = prod.nome || `Produto ${index + 1}`;
                    const nomeFormatado = nomeProduto.toLowerCase().replace(/\s+/g, '');

                    const card = document.createElement('div');
                    card.className = 'product-card fade-in';
                    card.dataset.produto = nomeFormatado;

                    card.innerHTML = `
                        <h3>${nomeProduto}</h3>
                        <button class="open-modal-btn">Ver</button>
                    `;

                    grid.appendChild(card);

                    card.querySelector('.open-modal-btn')
                        .addEventListener('click', () => openModal(prod, index));

                    fadeObserver.observe(card);
                });

                initChatIA();
            });
    }

    bindSmoothScroll();
});


// ================= CHAT =================

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

    function responderIA(msg) {
        msg = msg.toLowerCase();

        const produtos = document.querySelectorAll('[data-produto]');

        function abrirPorNome(nome) {
            nome = nome.replace(/\s+/g, '');

            const alvo = Array.from(produtos).find(p =>
                p.dataset.produto.includes(nome)
            );

            if (alvo) {
                alvo.querySelector('.open-modal-btn')?.click();
                return true;
            }
            return false;
        }

        if (msg.includes("iphone")) {
            let modelo = msg.replace("iphone", "").trim();

            if (abrirPorNome(modelo)) {
                return "Boa escolha 👌";
            }

            abrirPorNome("11") || abrirPorNome("12");
            return "Esse modelo pode variar, mas olha essas opções 👇";
        }

        if (msg.includes("preço") || msg.includes("valor")) {
            abrirPorNome("11");
            return "Temos várias opções 💰";
        }

        if (msg.includes("câmera")) {
            abrirPorNome("pro");
            return "Linha Pro é a melhor 📸";
        }

        if (msg.includes("bateria")) {
            abrirPorNome("max");
            return "Esses duram mais 🔋";
        }

        return "Quer ajuda com preço, câmera ou bateria?";
    }

    function sendMsg() {
        const text = input.value.trim();
        if (!text) return;

        addMsg(text, "user");

        const resp = responderIA(text);

        setTimeout(() => addMsg(resp, "ia"), 300);

        input.value = "";
    }

    send.addEventListener("click", sendMsg);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") sendMsg();
    });

    // 👇 MENSAGEM LIMPA
    setTimeout(() => {
        addMsg("Olá, sou assistente de vendas. Como posso ajudar?", "ia");
    }, 500);
}


// ADMIN FUTURO
// const NOME_ATENDENTE = "Assistente";
// addMsg(`Olá! Sou ${NOME_ATENDENTE}. Como posso ajudar?`, "ia");
