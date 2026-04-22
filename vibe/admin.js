document.addEventListener('DOMContentLoaded', () => {

    const tabs = document.querySelectorAll('.menu-item');
    const contents = document.querySelectorAll('.tab-content');
    
    // Tab Navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
        });
    });

    let siteData = {
        config: {
            nomeLoja: "Vibe Store iPhone",
            titulo: "A nova era",
            tema: "dark",
            corPrimaria: "#ffffff",
            textoBusca: "Não encontrou o que deseja?"
        },
        produtos: []
    };

    // DOM Elements
    const formConfig = {
        nomeLoja: document.getElementById('cfg-nomeLoja'),
        titulo: document.getElementById('cfg-titulo'),
        corPrimaria: document.getElementById('cfg-corPrimaria'),
        tema: document.getElementById('cfg-tema'),
        textoBusca: document.getElementById('cfg-textoBusca')
    };

    const productsContainer = document.getElementById('products-list-container');
    const btnAddProduct = document.getElementById('btn-add-product');
    const btnSave = document.getElementById('btn-save');

    // Load Initial JSON
    fetch('./data/siteData.json')
        .then(res => res.json())
        .then(data => {
            siteData = data;
            if(!siteData.produtos) siteData.produtos = [];
            renderAll();
        })
        .catch(err => {
            console.error("No JSON found or JSON broken, using blank state", err);
            renderAll();
        });

    function renderAll() {
        // Configs
        formConfig.nomeLoja.value = siteData.config.nomeLoja || '';
        formConfig.titulo.value = siteData.config.titulo || '';
        formConfig.corPrimaria.value = siteData.config.corPrimaria || '#ffffff';
        formConfig.tema.value = siteData.config.tema || 'dark';
        formConfig.textoBusca.value = siteData.config.textoBusca || '';

        // Products
        const scrollPos = productsContainer.scrollTop;
        productsContainer.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        siteData.produtos.forEach((prod, pIndex) => renderProduct(prod, pIndex, fragment));
        productsContainer.appendChild(fragment);
        
        productsContainer.scrollTop = scrollPos;
    }

    function renderProduct(prod, pIndex, container = productsContainer) {
        const template = document.getElementById('tpl-product').content.cloneNode(true);
        const prodNode = template.querySelector('.product-item');
        prodNode.dataset.prodIndex = pIndex;

        // Populate basic
        const expectedMainImageName = `imagem${pIndex + 1}.jpg`;
        prodNode.querySelector('.prod-title-display').textContent = prod.nome || `Produto ${pIndex + 1}`;
        prodNode.querySelector('.prod-nome').value = prod.nome || '';
        prodNode.querySelector('.prod-descricao').value = prod.descricao || '';
        prodNode.querySelector('.prod-imagem').value = prod.imagem || expectedMainImageName;

        // Remove btn
        prodNode.querySelector('.btn-remove-prod').addEventListener('click', () => {
            if(confirm('Tem certeza que deseja excluir esse produto?')) {
                siteData.produtos.splice(pIndex, 1);
                renderAll();
            }
        });

        // Cover Upload Preview Logic
        const prodFileInput = prodNode.querySelector('.prod-file');
        const prodImgPreview = prodNode.querySelector('.img-preview');
        const prodImgHidden = prodNode.querySelector('.prod-imagem');
        
        // Show current image
        if(prod.imagem) {
            prodImgPreview.src = `./ImagensProduto/${prod.imagem}`;
            prodImgPreview.onerror = () => { prodImgPreview.src = "./assets/placeholder.png"; };
            prodImgPreview.style.display = 'block';
        }

        prodFileInput.addEventListener('change', (e) => {
            if(e.target.files && e.target.files[0]) {
                const url = URL.createObjectURL(e.target.files[0]);
                prodImgPreview.src = url;
                prodImgPreview.style.display = 'block';
                prodImgHidden.value = e.target.files[0].name;
                autoSaveMemory();
            }
        });

        // Live memory sync setup
        prodNode.querySelectorAll('input, select, textarea').forEach(inp => {
            inp.addEventListener('input', autoSaveMemory);
            inp.addEventListener('change', autoSaveMemory);
        });

        // Setup Versions
        const vContainer = prodNode.querySelector('.versions-list');
        const vBtnAdd = prodNode.querySelector('.btn-add-version');
        
        if(prod.versoes) {
            prod.versoes.forEach((vers, vIndex) => renderVersion(vers, vIndex, pIndex, vContainer));
        }

        vBtnAdd.addEventListener('click', () => {
            if(!siteData.produtos[pIndex].versoes) siteData.produtos[pIndex].versoes = [];
            if(siteData.produtos[pIndex].versoes.length >= 4) {
                alert('O limite máximo de versão do Pop-Up é 4.');
                return;
            }
            
            const vIndex = siteData.produtos[pIndex].versoes.length;
            const newVers = {
                titulo: "", specs: "", preco: "", imagens: ["", "", ""]
            };
            siteData.produtos[pIndex].versoes.push(newVers);
            
            const prodBody = prodNode.querySelector('.prod-body');
            const scrollPos = prodBody ? prodBody.scrollTop : 0;
            
            const fragment = document.createDocumentFragment();
            renderVersion(newVers, vIndex, pIndex, fragment);
            vContainer.appendChild(fragment);
            
            if (prodBody) prodBody.scrollTop = scrollPos;
        });

        container.appendChild(prodNode);
    }

    function renderVersion(vers, vIndex, pIndex, container) {
        const template = document.getElementById('tpl-version').content.cloneNode(true);
        const versNode = template.querySelector('.version-item');
        versNode.dataset.versIndex = vIndex;

        // Logic naming rules for versions
        let suffix = vIndex === 0 ? "" : `-${vIndex+1}`;
        let expectedImageName = `ImageP${pIndex+1}${suffix}.jpg`;

        versNode.querySelector('.vers-num').textContent = vIndex + 1;
        versNode.querySelector('.vers-titulo').value = vers.titulo || '';
        versNode.querySelector('.vers-preco').value = vers.preco || '';
        versNode.querySelector('.vers-specs').value = vers.specs || '';
        
        // Version preview upload
        const fileInputs = versNode.querySelectorAll('.vers-img-file');
        const hiddenInputs = versNode.querySelectorAll('.vers-img-hidden');
        const imgPreviews = versNode.querySelectorAll('.img-preview-mini');
        
        fileInputs.forEach((fileInput, i) => {
            // Restore hidden inputs
            if (vers.imagens && vers.imagens[i]) {
                hiddenInputs[i].value = vers.imagens[i];
                imgPreviews[i].src = `./ImagensProduto/${vers.imagens[i]}`;
                imgPreviews[i].onerror = () => { imgPreviews[i].src = "./assets/placeholder.png"; };
                imgPreviews[i].style.display = 'block';
            }

            fileInput.addEventListener('change', (e) => {
                if(e.target.files && e.target.files[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    imgPreviews[i].src = url;
                    imgPreviews[i].style.display = 'block';
                    hiddenInputs[i].value = e.target.files[0].name;
                    autoSaveMemory();
                }
            });
        });

        versNode.querySelector('.btn-remove-vers').addEventListener('click', () => {
             siteData.produtos[pIndex].versoes.splice(vIndex, 1);
             renderAll();
        });

        versNode.querySelectorAll('input, select, textarea').forEach(inp => {
            inp.addEventListener('input', autoSaveMemory);
            inp.addEventListener('change', autoSaveMemory);
        });

        container.appendChild(versNode);
    }

    btnAddProduct.addEventListener('click', () => {
        const pIndex = siteData.produtos.length;
        const newProd = {
            nome: "Novo Produto",
            descricao: "",
            imagem: `capa.jpg`,
            versoes: []
        };
        siteData.produtos.push(newProd);
        
        const scrollPos = productsContainer.scrollTop;
        
        const fragment = document.createDocumentFragment();
        renderProduct(newProd, pIndex, fragment);
        productsContainer.appendChild(fragment);
        
        productsContainer.scrollTop = scrollPos;
    });

    function autoSaveMemory() {
        // Collect Global Config
        siteData.config.nomeLoja = formConfig.nomeLoja.value;
        siteData.config.titulo = formConfig.titulo.value;
        siteData.config.corPrimaria = formConfig.corPrimaria.value;
        siteData.config.tema = formConfig.tema.value;
        siteData.config.textoBusca = formConfig.textoBusca.value;

        // Collect Products Iteration
        const prodNodes = document.querySelectorAll('.product-item');
        prodNodes.forEach((pNode, pIndex) => {
            // Guarantee obj array structure
            if(!siteData.produtos[pIndex]) return;

            siteData.produtos[pIndex].nome = pNode.querySelector('.prod-nome').value;
            // Also realtime display
            pNode.querySelector('.prod-title-display').textContent = siteData.produtos[pIndex].nome || 'Título Vazio';
            siteData.produtos[pIndex].descricao = pNode.querySelector('.prod-descricao').value;
            siteData.produtos[pIndex].imagem = pNode.querySelector('.prod-imagem').value;

            // Collect Versions
            if(!siteData.produtos[pIndex].versoes) {
                siteData.produtos[pIndex].versoes = [];
            }
            
            const versNodes = pNode.querySelectorAll('.version-item');
            versNodes.forEach((vNode, vIndex) => {
                if(!siteData.produtos[pIndex].versoes[vIndex]) {
                    siteData.produtos[pIndex].versoes[vIndex] = { imagens: ["", "", ""] };
                }
                const v = siteData.produtos[pIndex].versoes[vIndex];
                v.titulo = vNode.querySelector('.vers-titulo').value;
                v.preco = vNode.querySelector('.vers-preco').value;
                v.specs = vNode.querySelector('.vers-specs').value;
                
                // Collect images
                const hiddenInputs = vNode.querySelectorAll('.vers-img-hidden');
                v.imagens = [
                    hiddenInputs[0] ? hiddenInputs[0].value : "",
                    hiddenInputs[1] ? hiddenInputs[1].value : "",
                    hiddenInputs[2] ? hiddenInputs[2].value : ""
                ];
            });
        });
    }

    Object.values(formConfig).forEach(input => {
        input.addEventListener('input', autoSaveMemory);
        input.addEventListener('change', autoSaveMemory);
    });

    btnSave.addEventListener('click', () => {
        autoSaveMemory(); 
        console.log("Exportando JSON de configurações:", siteData);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(siteData, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", "siteData.json");
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        
        alert('Configurações Empacotadas com Sucesso!\nMova e substitua o arquivo siteData.json baixado para a pasta /data/ do seu novo sistema.');
    });

});
