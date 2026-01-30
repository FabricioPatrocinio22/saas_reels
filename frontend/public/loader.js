(function() {
    console.log("🚀 Widget SaaS Iniciando...");

    // 1. Identifica o Widget ID
    const scriptTag = document.currentScript || document.querySelector('script[data-widget-id]');
    const widgetId = scriptTag ? scriptTag.getAttribute('data-widget-id') : null;

    if (!widgetId) return console.error("❌ Widget ID não informado!");

    const API_URL = `http://127.0.0.1:8000/api/widget/${widgetId}`;

    // 2. Inicia o Widget
    async function init() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Erro na API");
            const data = await response.json();
            
            // LÓGICA DE URL: Qual vídeo mostrar?
            const currentPath = window.location.pathname; // Ex: /tenis
            
            // ✅ AGORA (Comparação Inteligente)
            // Procura um vídeo que NÃO seja Global E que a URL atual CONTENHA o gatilho
            let videoParaTocar = data.playlist.find(v => 
                v.url_gatilho !== 'GLOBAL' && currentPath.includes(v.url_gatilho)
            );
            if (!videoParaTocar) {
                videoParaTocar = data.playlist.find(v => v.url_gatilho === 'GLOBAL');
            }

            // Se achou um vídeo, desenha o player
            if (videoParaTocar) {
                console.log("🎬 Vídeo selecionado para esta página:", videoParaTocar);
                setupWidget(data.config, videoParaTocar);
            } else {
                console.log("🔕 Nenhum vídeo configurado para esta URL.");
            }

        } catch (error) {
            console.error("Erro no Widget:", error);
        }
    }

    // 3. Constrói o Visual e os Eventos
    function setupWidget(config, video) {
        // --- A. INJETAR CSS ---
        const style = document.createElement('style');
        style.innerHTML = `
            .saas-mini-player {
                position: fixed;
                bottom: 20px;
                ${config.posicao === 'right' ? 'right: 20px;' : 'left: 20px;'}
                width: 120px; height: 120px;
                border-radius: 50%;
                border: 4px solid ${config.cor}; /* COR DO BANCO */
                box-shadow: 0 10px 25px rgba(0,0,0,0.4);
                cursor: pointer;
                z-index: 9999;
                overflow: hidden;
                transition: transform 0.3s ease;
                animation: pulse 2s infinite;
                background: black;
            }
            .saas-mini-player:hover { transform: scale(1.1); }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 ${config.cor}70; }
                70% { box-shadow: 0 0 0 10px transparent; }
                100% { box-shadow: 0 0 0 0 transparent; }
            }

            .saas-modal-overlay {
                display: none; /* Começa escondido */
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(5px);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .saas-modal-overlay.active { display: flex; opacity: 1; }

            .saas-modal-content {
                width: 90%; max-width: 400px; /* Tamanho de celular */
                aspect-ratio: 9/16;
                background: black;
                border-radius: 15px;
                position: relative;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                display: flex; flex-direction: column;
                overflow: hidden;
            }

            .saas-close-btn {
                position: absolute; top: 15px; right: 15px;
                color: white; background: rgba(0,0,0,0.5);
                width: 30px; height: 30px; border-radius: 50%;
                text-align: center; line-height: 30px; cursor: pointer;
                font-weight: bold; z-index: 10;
            }

            .saas-cta-btn {
                background: ${config.cor}; /* COR DO BANCO */
                color: white; text-decoration: none;
                padding: 15px; text-align: center; font-weight: bold;
                text-transform: uppercase; font-family: sans-serif;
                margin: 10px; border-radius: 8px;
            }
            .saas-cta-btn:hover { filter: brightness(1.1); }
        `;
        document.head.appendChild(style);

        // --- B. INJETAR HTML ---
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="saas-mini-player" id="saas-mini">
                <div id="saas-mini-iframe" style="width: 200%; height: 200%; margin-left: -50%; margin-top: -50%; pointer-events: none;">
                    ${getEmbedHTML(video, 'mini')}
                </div>
            </div>

            <div class="saas-modal-overlay" id="saas-modal">
                <div class="saas-modal-content">
                    <div class="saas-close-btn" id="saas-close">&times;</div>
                    <div id="saas-modal-video-container" style="flex:1; background:black;">
                        </div>
                    <a href="${video.link_botao}" target="_blank" class="saas-cta-btn">
                        ${video.titulo_botao}
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);

        // --- C. EVENTOS DE CLIQUE (A Correção!) ---
        const miniPlayer = document.getElementById('saas-mini');
        const modal = document.getElementById('saas-modal');
        const closeBtn = document.getElementById('saas-close');
        const modalVideoContainer = document.getElementById('saas-modal-video-container');

        // ABRIR
        miniPlayer.addEventListener('click', () => {
            modal.classList.add('active');
            // Injeta o vídeo grande COM SOM e AUTOPLAY
            modalVideoContainer.innerHTML = getEmbedHTML(video, 'full');
        });

        // FECHAR
        const fecharModal = () => {
            modal.classList.remove('active');
            // Remove o vídeo grande para parar o som
            modalVideoContainer.innerHTML = '';
        };

        closeBtn.addEventListener('click', fecharModal);
        modal.addEventListener('click', (e) => {
            if(e.target === modal) fecharModal(); // Fecha se clicar fora
        });
    }

    // 4. Gerador de IFRAME Inteligente
    function getEmbedHTML(video, mode) {
        const isMini = mode === 'mini';
        // Mini: Mudo, Loop, Sem Controles
        // Full: Som Ligado, Autoplay, Com Controles
        
        if (video.plataforma === 'youtube') {
            const params = isMini 
                ? `autoplay=1&mute=1&controls=0&loop=1&playlist=${video.video_id_externo}&showinfo=0&modestbranding=1`
                : `autoplay=1&mute=0&controls=1&rel=0&playsinline=1`;
            
            return `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${video.video_id_externo}?${params}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } 
        
        else if (video.plataforma === 'vimeo') {
            const params = isMini
                ? `background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`
                : `autoplay=1&title=0&byline=0`;

            return `<iframe src="https://player.vimeo.com/video/${video.video_id_externo}?${params}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        }
        return '';
    }

    // Start
    init();
})();