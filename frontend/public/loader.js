(function() {
    const scriptTag = document.currentScript;
    const widgetId = scriptTag.getAttribute('data-widget-id');
    const currentPath = window.location.pathname;
    // CERTIFICA-TE QUE ESTA URL APONTA PARA O TEU RENDER
    const API_BASE_URL = "https://saas-reels.onrender.com"; 
    const API_URL = `${API_BASE_URL}/api/widget/${widgetId}?url=${currentPath}`;

    let playlist = [];
    let currentIndex = 0;
    let configGlobal = {};

    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            playlist = data.playlist;
            configGlobal = data.config;
            if (playlist.length > 0) renderWidget(data.config);
        })
        .catch(err => console.error("Erro ao carregar widget:", err));

    function renderWidget(config) {
        const container = document.createElement('div');
        container.id = 'saas-reels-container';
        container.style.cssText = `position: fixed; bottom: 20px; ${config.posicao}: 20px; z-index: 999999;`;

        const bubble = document.createElement('div');
        bubble.style.cssText = `
            width: 85px; height: 85px; border-radius: 50%; border: 4px solid ${config.cor};
            background: #000; cursor: pointer; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.3s;
        `;
        bubble.innerHTML = `<img src="https://img.youtube.com/vi/${playlist[0].video_id_externo}/0.jpg" style="width:100%; height:100%; object-fit:cover;">`;
        
        // 1. O VÍDEO COMEÇA AO CLICAR NA BOLINHA
        bubble.onclick = () => {
            playerModal.style.display = 'flex';
            updatePlayer(); 
        };

        const playerModal = document.createElement('div');
        playerModal.style.cssText = `
            display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.95);
            justify-content: center; align-items: center; z-index: 1000000;
        `;

        const playerContent = document.createElement('div');
        playerModal.appendChild(playerContent);

        const updatePlayer = () => {
            const video = playlist[currentIndex];
            // 2. PARÂMETROS DO YOUTUBE: autoplay=1 e mute=0 (tenta tocar com som)
            playerContent.innerHTML = `
                <div style="position:relative; width: 100%; max-width: 400px; height: 90vh; background:#000; border-radius:20px; overflow:hidden;">
                    
                    <div style="position:absolute; top:15px; left:15px; right:15px; display:flex; gap:5px; z-index:110;">
                        ${playlist.map((_, i) => `<div style="height:3px; flex:1; background:${i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)'}; border-radius:2px;"></div>`).join('')}
                    </div>

                    <iframe id="video-iframe" 
                            src="https://www.youtube.com/embed/${video.video_id_externo}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3" 
                            style="width:100%; height:100%; border:none;" allow="autoplay"></iframe>

                    <button id="close-widget" style="position:absolute; top:20px; right:20px; background:rgba(0,0,0,0.5); border:none; color:#fff; font-size:24px; cursor:pointer; z-index:120; width:40px; height:40px; border-radius:50%;">✕</button>

                    <div id="prev-video" style="position:absolute; top:50%; left:10px; transform:translateY(-50%); z-index:115; color:#fff; font-size:30px; cursor:pointer; background:rgba(0,0,0,0.2); padding:10px; border-radius:50%; opacity:0.7;">❮</div>
                    <div id="next-video" style="position:absolute; top:50%; right:10px; transform:translateY(-50%); z-index:115; color:#fff; font-size:30px; cursor:pointer; background:rgba(0,0,0,0.2); padding:10px; border-radius:50%; opacity:0.7;">❯</div>

                    <div style="position:absolute; bottom:30px; left:20px; right:20px; z-index:115;">
                        <a href="${video.link_botao}" target="_blank" style="display:block; background:${config.cor}; color:#fff; text-align:center; padding:16px; border-radius:12px; text-decoration:none; font-weight:bold;">
                            ${video.titulo_botao || 'COMPRAR AGORA'}
                        </a>
                    </div>
                </div>
            `;

            // EVENTO FECHAR (Para o som)
            playerContent.querySelector('#close-widget').onclick = () => {
                playerContent.innerHTML = ""; // 2. LIMPA O CONTEÚDO (PARA O SOM)
                playerModal.style.display = 'none';
            };

            // NAVEGAÇÃO
            playerContent.querySelector('#next-video').onclick = () => {
                currentIndex = (currentIndex + 1) % playlist.length;
                updatePlayer();
            };
            playerContent.querySelector('#prev-video').onclick = () => {
                currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
                updatePlayer();
            };
        };

        container.appendChild(bubble);
        document.body.appendChild(container);
        document.body.appendChild(playerModal);
    }
})();