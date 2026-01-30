from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

# 1. Tabela de Usuários
class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    senha_hash: str
    
    # Um usuário pode ter vários widgets (mas no nosso MVP será 1 só)
    widgets: List["Widget"] = Relationship(back_populates="dono")

# 2. Tabela de Widgets
class Widget(SQLModel, table=True):
    id: str = Field(primary_key=True) # Ex: 'wdg_abc123'
    usuario_id: int = Field(foreign_key="usuario.id")
    
    nome_site: str 
    cor_borda: str = "#b71c1c"
    posicao: str = "left"
    
    dono: Usuario = Relationship(back_populates="widgets")
    videos: List["VideoRule"] = Relationship(back_populates="widget")

# 3. Tabela de Regras de Vídeo
class VideoRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    widget_id: str = Field(foreign_key="widget.id")
    
    ordem: int = 0
    plataforma: str
    video_id_externo: str
    url_gatilho: str = "GLOBAL" 
    
    titulo_botao: str = "COMPRAR AGORA"
    link_botao: str 
    
    widget: Widget = Relationship(back_populates="videos")