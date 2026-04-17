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
    
    const modalImg1 = document.getElementById('modal-img-1');
    const modalImg2 = document.getElementById('modal-img-2');
    const modalImg3 = document.getElementById('modal-img-3');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');

    function openModal(productId, title, desc) {
        // Setar informações
        modalTitle.textContent = title;
        modalDesc.textContent = desc;
        
        // Ajustar caminhos das imagens
        modalImg1.src = `ImagensProduto/imagemP${productId}.jpg`;
        modalImg2.src = `ImagensProduto/imagemP${productId}-2.jpg`;
        modalImg3.src = `ImagensProduto/imagemP${productId}-3.jpg`;
        
        // Exibir modal e desabilitar scroll da página de fundo
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

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
            const desc = btn.getAttribute('data-desc');
            openModal(productId, title, desc);
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
