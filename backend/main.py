from fastapi import FastAPI, HTTPException
from sqlmodel import Session, select, create_engine, SQLModel
from fastapi.middleware.cors import CORSMiddleware
from models import Usuario, Widget, VideoRule
from pydantic import BaseModel # Para validar os dados que chegam

# Configuração do Banco
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI()

# Permite acesso do Frontend (Porta 5173) e do Widget
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"], # Agora permitimos POST e DELETE
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- MODELOS DE DADOS PARA RECEBER DO FRONTEND ---
class VideoCreateSchema(BaseModel):
    widget_id: str
    plataforma: str
    video_id_externo: str
    url_gatilho: str
    titulo_botao: str = "COMPRAR AGORA"
    link_botao: str

# --- ROTAS ---

# 1. SETUP INICIAL (Aquele de sempre)
@app.post("/setup-teste")
def setup_teste():
    with Session(engine) as session:
        if session.get(Widget, "wdg_teste_01"): return {"msg": "Já existe"}
        user = Usuario(email="admin@teste.com", senha_hash="123")
        session.add(user)
        session.commit()
        session.refresh(user)
        widget = Widget(id="wdg_teste_01", usuario_id=user.id, nome_site="Loja Demo")
        session.add(widget)
        session.commit()
        return {"msg": "Setup OK!"}

# 2. LER CONFIGURAÇÃO (Para o Widget e Dashboard)
@app.get("/api/widget/{widget_id}")
def ler_widget(widget_id: str):
    with Session(engine) as session:
        widget = session.get(Widget, widget_id)
        if not widget: raise HTTPException(404, "Widget não encontrado")
        videos = session.exec(select(VideoRule).where(VideoRule.widget_id == widget_id)).all()
        return {"config": {"cor": widget.cor_borda, "posicao": widget.posicao}, "playlist": videos}

# 3. CRIAR NOVO VÍDEO (Novo!)
@app.post("/api/videos")
def criar_video(dados: VideoCreateSchema):
    with Session(engine) as session:
        novo_video = VideoRule(
            widget_id=dados.widget_id,
            plataforma=dados.plataforma,
            video_id_externo=dados.video_id_externo,
            url_gatilho=dados.url_gatilho,
            link_botao=dados.link_botao,
            titulo_botao=dados.titulo_botao
        )
        session.add(novo_video)
        session.commit()
        session.refresh(novo_video)
        return novo_video

# 4. DELETAR VÍDEO (Novo!)
@app.delete("/api/videos/{video_id}")
def deletar_video(video_id: int):
    with Session(engine) as session:
        video = session.get(VideoRule, video_id)
        if not video: raise HTTPException(404, "Vídeo não encontrado")
        session.delete(video)
        session.commit()
        return {"ok": True}