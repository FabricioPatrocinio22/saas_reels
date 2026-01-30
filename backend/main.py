from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select, create_engine, SQLModel
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from jose import JWTError, jwt
from models import Usuario, Widget, VideoRule
from pydantic import BaseModel
import secrets # Para gerar IDs únicos de widget

# --- CONFIGURAÇÕES DE SEGURANÇA ---
SECRET_KEY = "SEGREDO_SUPER_SECRETO_DO_SAAS" # Em produção, use variável de ambiente
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

# Substitua a linha do pwd_context por esta:
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__ident="2b" # Força o uso do identificador 2b para evitar o erro de bytes
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- BANCO DE DADOS ---
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- SCHEMAS (VALIDAÇÃO DE DADOS) ---
class UserCreate(BaseModel):
    email: str
    password: str
    nome_site: str

class Token(BaseModel):
    access_token: str
    token_type: str

class VideoCreateSchema(BaseModel):
    # Não pedimos mais widget_id, o sistema descobre sozinho
    plataforma: str
    video_id_externo: str
    url_gatilho: str
    titulo_botao: str = "COMPRAR AGORA"
    link_botao: str

# --- FUNÇÕES DE SEGURANÇA (O COFRE) ---
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Função que descobre quem é o usuário pelo Token
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Login inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    with Session(engine) as session:
        statement = select(Usuario).where(Usuario.email == email)
        user = session.exec(statement).first()
        if user is None: raise credentials_exception
        return user

# --- ROTAS DE AUTENTICAÇÃO ---

@app.post("/auth/register", response_model=Token)
def register(user_data: UserCreate):
    with Session(engine) as session:
        # 1. Verifica se email existe
        if session.exec(select(Usuario).where(Usuario.email == user_data.email)).first():
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # 2. Cria Usuário
        hashed_password = get_password_hash(user_data.password)
        novo_user = Usuario(email=user_data.email, senha_hash=hashed_password)
        session.add(novo_user)
        session.commit()
        session.refresh(novo_user)
        
        # 3. Cria Widget Automático para ele
        widget_id_unico = f"wdg_{secrets.token_hex(3)}" # Ex: wdg_a1b2c3
        novo_widget = Widget(
            id=widget_id_unico,
            usuario_id=novo_user.id,
            nome_site=user_data.nome_site
        )
        session.add(novo_widget)
        session.commit()
        
        # 4. Faz login automático (gera token)
        access_token = create_access_token(data={"sub": novo_user.email})
        return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with Session(engine) as session:
        user = session.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
        if not user or not verify_password(form_data.password, user.senha_hash):
            raise HTTPException(status_code=400, detail="Email ou senha incorretos")
        
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}

# --- ROTAS DO DASHBOARD (PROTEGIDAS) ---

# Rota para o Dashboard saber quem sou eu e qual meu widget
@app.get("/api/me")
def ler_meus_dados(current_user: Usuario = Depends(get_current_user)):
    with Session(engine) as session:
        # Pega o primeiro widget do usuário
        # (Isso carrega as relações como 'widgets' automaticamente se configurado ou faz query extra)
        # Vamos fazer query direta para garantir
        widget = session.exec(select(Widget).where(Widget.usuario_id == current_user.id)).first()
        
        videos = session.exec(select(VideoRule).where(VideoRule.widget_id == widget.id)).all()
        
        return {
            "email": current_user.email,
            "widget_id": widget.id,
            "config": {"cor": widget.cor_borda, "posicao": widget.posicao},
            "playlist": videos
        }

@app.post("/api/videos")
def criar_video(dados: VideoCreateSchema, current_user: Usuario = Depends(get_current_user)):
    with Session(engine) as session:
        # Descobre o widget do usuário logado
        widget = session.exec(select(Widget).where(Widget.usuario_id == current_user.id)).first()
        
        novo_video = VideoRule(
            widget_id=widget.id, # USA O ID REAL DO USUÁRIO
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

@app.delete("/api/videos/{video_id}")
def deletar_video(video_id: int, current_user: Usuario = Depends(get_current_user)):
    with Session(engine) as session:
        widget = session.exec(select(Widget).where(Widget.usuario_id == current_user.id)).first()
        
        # Só deleta se o vídeo pertencer ao widget do usuário logado!
        video = session.exec(select(VideoRule).where(
            VideoRule.id == video_id, 
            VideoRule.widget_id == widget.id
        )).first()
        
        if not video: raise HTTPException(404, "Vídeo não encontrado ou acesso negado")
        
        session.delete(video)
        session.commit()
        return {"ok": True}

# --- ROTA PÚBLICA (MELHORADA COM FILTRO DE PÁGINA) ---
@app.get("/api/widget/{widget_id}")
def carregar_widget_publico(widget_id: str, url: str = "GLOBAL"):
    with Session(engine) as session:
        widget = session.get(Widget, widget_id)
        if not widget: raise HTTPException(404, "Widget inativo")
        
        # Pega todos os vídeos do widget
        todos_videos = session.exec(select(VideoRule).where(VideoRule.widget_id == widget_id)).all()
        
        # Lógica: Se o vídeo tiver um gatilho que bate com a URL atual, ele vem primeiro
        # Caso contrário, segue a ordem padrão.
        videos_ordenados = sorted(
            todos_videos, 
            key=lambda v: 0 if v.url_gatilho in url else 1
        )
        
        return {
            "config": {"cor": widget.cor_borda, "posicao": widget.posicao}, 
            "playlist": videos_ordenados
        }