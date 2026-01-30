(function() {
    const scriptTag = document.currentScript;
    const widgetId = scriptTag.getAttribute('data-widget-id');
    const currentPath = window.location.pathname; // Detecta em qual página o cliente está
    const API_URL = `https://saas-reels.vercel.app/api/widget/${widgetId}?url=${currentPath}`;

    let playlist = [];
    let currentIndex = 0;

    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            playlist = data.playlist;
            if (playlist.length > 0) renderWidget(data.config);
        });

    function renderWidget(config) {
        const container = document.createElement('div');
        container.id = 'saas-reels-container';
        container.style.cssText = `
            position: fixed; bottom: 20px; ${config.posicao}: 20px;
            z-index: 999999; font-family: sans-serif;
        `;

        // Bolinha (Bubble) estilo Story
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            width: 80px; height: 80px; border-radius: 50%;
            border: 3px solid ${config.cor}; background: #000;
            cursor: pointer; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        bubble.innerHTML = `<img src="https://img.youtube.com/vi/${playlist[0].video_id_externo}/0.jpg" style="width:100%; height:100%; object-fit:cover;">`;
        bubble.onclick = () => playerModal.style.display = 'flex';
        bubble.onmouseenter = () => bubble.style.transform = 'scale(1.1)';
        bubble.onmouseleave = () => bubble.style.transform = 'scale(1)';

        // Modal do Player Estilo Story
        const playerModal = document.createElement('div');
        playerModal.style.cssText = `
            display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9);
            justify-content: center; align-items: center; z-index: 1000000;
        `;

        const updatePlayer = () => {
            const video = playlist[currentIndex];
            playerContent.innerHTML = `
                <div style="position:relative; width: 100%; max-width: 400px; height: 90vh; background:#000; border-radius:20px; overflow:hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    
                    <div style="position:absolute; top:15px; left:15px; right:15px; display:flex; gap:5px; z-index:100;">
                        ${playlist.map((_, i) => `
                            <div style="height:3px; flex:1; background:${i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)'}; border-radius:2px; transition: 0.3s;"></div>
                        `).join('')}
                    </div>
                    
                    <iframe src="https://www.youtube.com/embed/${video.video_id_externo}?autoplay=1&controls=0&modestbranding=1&rel=0" 
                            style="width:100%; height:100%; border:none; pointer-events: none;" allow="autoplay"></iframe>
                    
                    <button id="close-widget" style="position:absolute; top:25px; right:20px; background:rgba(0,0,0,0.5); border:none; color:#fff; font-size:20px; cursor:pointer; z-index:110; width:40px; height:40px; border-radius:50%;">✕</button>
                    
                    <div id="prev-video" style="position:absolute; top:0; left:0; width:40%; height:80%; cursor:pointer; z-index:105;"></div>
                    <div id="next-video" style="position:absolute; top:0; right:0; width:40%; height:80%; cursor:pointer; z-index:105;"></div>

                    <div style="position:absolute; bottom:0; left:0; right:0; padding:30px 20px; background:linear-gradient(transparent, rgba(0,0,0,0.8)); z-index:110;">
                        <a href="${video.link_botao}" target="_blank" style="display:block; background:${config.cor}; color:#fff; text-align:center; padding:16px; border-radius:14px; text-decoration:none; font-weight:bold; font-size:16px; transition: transform 0.2s active:scale(0.95);">
                            ${video.titulo_botao || 'COMPRAR AGORA'}
                        </a>
                    </div>
                </div>
            `;

            // Reatribui os eventos após renderizar o HTML
            playerContent.querySelector('#close-widget').onclick = (e) => {
                e.stopPropagation();
                playerModal.style.display = 'none';
            };

            playerContent.querySelector('#next-video').onclick = (e) => {
                e.stopPropagation();
                if (currentIndex < playlist.length - 1) {
                    currentIndex++;
                    updatePlayer();
                } else {
                    // Se for o último, volta pro primeiro (loop)
                    currentIndex = 0;
                    updatePlayer();
                }
            };

            playerContent.querySelector('#prev-video').onclick = (e) => {
                e.stopPropagation();
                if (currentIndex > 0) {
                    currentIndex--;
                    updatePlayer();
                }
            };
        };

        const playerContent = document.createElement('div');
        playerModal.appendChild(playerContent);
        updatePlayer();

        container.appendChild(bubble);
        document.body.appendChild(container);
        document.body.appendChild(playerModal);
    }
})();