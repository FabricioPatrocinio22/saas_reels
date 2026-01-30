# WidgetSaaS — Vídeo Widget para Lojas

Sistema SaaS que permite embutir um **widget de vídeo** em qualquer site. O visitante vê um mini player (YouTube ou Vimeo) no canto da tela; ao clicar, abre um modal com o vídeo em tela cheia e um botão de CTA (ex: "Comprar agora") configurável por vídeo.

Ideal para lojas que querem exibir reels/produtos em vídeo com gatilhos por URL (ex: vídeo A na página `/tenis`, vídeo B na página `/sapatos`, ou um vídeo global em todas as páginas).

---

## Estrutura do Projeto

```
saas-video-widget/
├── backend/          # API FastAPI + SQLite
│   ├── main.py       # Rotas e lógica da API
│   ├── models.py     # Usuario, Widget, VideoRule
│   └── requirements.txt
├── frontend/         # Dashboard React (Vite + Tailwind)
│   └── src/
│       └── App.jsx   # CRUD de vídeos do widget
├── widget/           # Página de exemplo que usa o widget
│   └── index.html
└── frontend/public/
    └── loader.js     # Script embarcável (injeta o widget no site do cliente)
```

---

## Tecnologias

| Parte      | Stack |
|-----------|--------|
| **Backend**  | Python, FastAPI, SQLModel, SQLite, Uvicorn |
| **Frontend** | React 19, Vite 7, Tailwind CSS, Axios, Lucide React |
| **Widget**   | JavaScript vanilla (loader.js), embarcável em qualquer site |

---

## Como rodar localmente

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload
```

A API sobe em **http://localhost:8000**. Documentação: http://localhost:8000/docs

### 2. Frontend (Dashboard)

```bash
cd frontend
npm install
npm run dev
```

O dashboard sobe em **http://localhost:5173**.

### 3. Dados iniciais (opcional)

Para criar um usuário e widget de teste:

```bash
curl -X POST http://localhost:8000/setup-teste
```

Isso cria o widget `wdg_teste_01` usado pelo frontend e pelo exemplo em `widget/index.html`.

### 4. Testar o widget em um site

Abra `widget/index.html` no navegador (ou sirva a pasta `widget` por um servidor local). O script do widget está configurado para carregar de um host remoto; para testar localmente, você pode apontar o `src` do script para o `loader.js` do frontend (ex: após `npm run dev`, usar `http://localhost:5173/loader.js`) e manter `data-widget-id="wdg_teste_01"`.

---

## Como embutir o widget no site do cliente

No HTML do site onde o widget deve aparecer:

```html
<script 
    src="https://SEU-DOMINIO/loader.js" 
    data-widget-id="wdg_teste_01"
></script>
```

- **src**: URL pública do `loader.js` (ex: Vercel, Netlify, CDN).
- **data-widget-id**: ID do widget cadastrado no backend (ex: `wdg_teste_01`).

O script busca a configuração e a playlist em `GET /api/widget/{widget_id}` e exibe o vídeo conforme a URL da página (gatilho).

---

## API (resumo)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST   | `/setup-teste` | Cria usuário e widget de teste |
| GET    | `/api/widget/{widget_id}` | Config do widget + playlist (usado pelo loader e pelo dashboard) |
| POST   | `/api/videos` | Cria nova regra de vídeo |
| DELETE | `/api/videos/{video_id}` | Remove uma regra de vídeo |

---

## Conceitos principais

- **Widget**: agrupamento de configuração (cor da borda, posição esquerda/direita) e lista de vídeos.
- **VideoRule**: cada “vídeo” é uma regra com:
  - **Plataforma**: YouTube ou Vimeo
  - **ID do vídeo**: ID na plataforma (ex: `dQw4w9WgXcQ`)
  - **URL gatilho**: `GLOBAL` (todas as páginas) ou path específico (ex: `/tenis`) — o widget escolhe o vídeo cujo gatilho bate com a URL atual
  - **Botão CTA**: título (ex: "Comprar agora") e link

O **loader.js** lê a URL atual, encontra a regra correspondente (primeiro por gatilho específico, depois GLOBAL) e monta o mini player + modal com o embed (YouTube/Vimeo) e o botão configurado.

---

## Licença

Uso livre para estudo e projetos próprios.
