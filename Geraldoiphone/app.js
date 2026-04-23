/**
 * app.js
 * Lógica Javascript para animações na Landing Page (Premium Store)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Fade-in on Scroll usando Intersection Observer
    const fadeElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Dispara quando 10% do elemento fica visível
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Adiciona a classe 'visible' que aciona a animação CSS
                entry.target.classList.add('visible');
                // Opcional: Descomente para que a animação ocorra apenas uma vez
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => {
        fadeObserver.observe(el);
    });

    // 2. Smooth Scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3. Sistema de Modal estilo Apple
    const modalOverlay = document.getElementById('product-modal');
    const modalClose = document.querySelector('.modal-close');
    const openBtns = document.querySelectorAll('.open-modal-btn');
    
    const modalCarousel = document.getElementById('modal-carousel-container');
    const prevCtrl = document.querySelector('.prev-control');
    const nextCtrl = document.querySelector('.next-control');

    function openModal(productId, title) {
        modalCarousel.innerHTML = '';
        
        // Máximo 4 versões: (ex: '', '-2', '-3', '-4')
        const suffixes = ['', '-2', '-3', '-4'];
        
        suffixes.forEach((suffix, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = `
                <div class="modal-image">
                    <img src="./ImagensProduto/ImageP${productId}${suffix}.jpg" alt="${title}" onerror="this.closest('.carousel-slide').remove(); window.updateCarouselControls();">
                </div>
                <div class="modal-text">
                    <h2 class="slide-title">${title}</h2>
                    <div class="specs-content" id="specs-${productId}${suffix}">
                        Carregando especificações...
                    </div>
                    <div style="margin-top: 24px;">
                        <a href="https://api.whatsapp.com/send?phone=SEUNUMERO&text=Olá,%20tenho%20interesse%20no%20iPhone%20${encodeURIComponent(title)}" class="btn btn-buy cta-btn" target="_blank" rel="noopener noreferrer">
                             <!-- Pode colocar icone SVG de whats aqui depois, caso queira -->
                             Falar no WhatsApp
                        </a>
                    </div>
                </div>
            `;
            modalCarousel.appendChild(slide);
            
            // Carregar texto dinâmico
            fetch(`./ImagensProduto/TextP${productId}${suffix}.txt`)
                .then(response => {
                    if (!response.ok) throw new Error("Arquivo não encontrado");
                    return response.text();
                })
                .then(text => {
                    const specs = slide.querySelector('.specs-content');
                    // Trocar \n por <br>
                    if(specs) specs.innerHTML = text.replace(/\n/g, "<br>");
                })
                .catch(error => {
                    console.log(`Falha ao carregar TXT (versão ${suffix || 'principal'}):`, error);
                    const specs = slide.querySelector('.specs-content');
                    if (specs) {
                        if (index === 0) {
                            specs.classList.add('error');
                            specs.textContent = "Ops! Especificações indisponíveis no momento.";
                        } else {
                            specs.textContent = ""; // fallback extra vazio se falhar texto mas tiver imagem
                        }
                    }
                });
        });

        // Resetar o scroll para a primeira posição e verificar exibição dos controles
        setTimeout(() => {
            modalCarousel.scrollTo({ left: 0, behavior: 'auto' });
            window.updateCarouselControls();
        }, 10);
        
        // Exibir modal e desabilitar scroll da página de fundo
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

    // Navegação manual (Setas)
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

    // Bind em todos os botoes "+"
    openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Evitar side-effects
            const productId = btn.getAttribute('data-product');
            const title = btn.getAttribute('data-title');
            openModal(productId, title);
        });
    });

    // Fechar pelo botão X
    modalClose.addEventListener('click', closeModal);

    // Fechar ao clicar no overlay de fundo escurecido
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Fechar usando o teclado (ESC)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

});
