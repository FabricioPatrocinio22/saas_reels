import { useState, useEffect } from 'react'
import axios from 'axios'
import { Play, Plus, Trash2, Link as LinkIcon, Monitor, X, LogOut, UserPlus, LogIn } from 'lucide-react'

const API_URL = "https://saas-reels.onrender.com" // Use Localhost para testar o login novo

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  
  // Estados para formulários
  const [authForm, setAuthForm] = useState({ email: '', password: '', nome_site: '' })
  const [novoVideo, setNovoVideo] = useState({ plataforma: 'youtube', video_id_externo: '', url_gatilho: 'GLOBAL', link_botao: '' })

  // 1. EFEITO: Sempre que o token mudar, busca os dados do usuário
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      carregarDados()
    } else {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [token])

  const carregarDados = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
      setVideos(res.data.playlist)
    } catch (err) {
      setToken(null) // Token expirado ou inválido
    }
  }

  // 2. FUNÇÕES DE AUTENTICAÇÃO
  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      const url = isRegister ? `${API_URL}/auth/register` : `${API_URL}/token`
      
      let res;
      if (isRegister) {
        res = await axios.post(url, authForm)
      } else {
        // O login padrão do FastAPI usa Form Data
        const formData = new FormData()
        formData.append('username', authForm.email)
        formData.append('password', authForm.password)
        res = await axios.post(url, formData)
      }
      
      setToken(res.data.access_token)
      alert(isRegister ? "Conta criada!" : "Bem-vindo de volta!")
    } catch (err) {
      alert(err.response?.data?.detail || "Erro na autenticação")
    }
  }

  // 3. FUNÇÕES DO DASHBOARD
  const addVideo = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/api/videos`, novoVideo, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsModalOpen(false)
      carregarDados()
    } catch (err) { alert("Erro ao salvar") }
  }

  const deleteVideo = async (id) => {
    if (!confirm("Apagar vídeo?")) return
    try {
      await axios.delete(`${API_URL}/api/videos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      carregarDados()
    } catch (err) { alert("Erro ao deletar") }
  }

  // --- TELA DE LOGIN / REGISTRO ---
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white"><Play fill="white" /></div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">{isRegister ? 'Criar sua conta' : 'Entrar no SaaS'}</h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <input type="text" placeholder="Nome da sua Loja" className="w-full border p-3 rounded-lg" required
                onChange={e => setAuthForm({...authForm, nome_site: e.target.value})} />
            )}
            <input type="email" placeholder="Seu Email" className="w-full border p-3 rounded-lg" required
              onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <input type="password" placeholder="Sua Senha" className="w-full border p-3 rounded-lg" required
              onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            
            <button className="w-full bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700 transition">
              {isRegister ? 'CADASTRAR' : 'ENTRAR'}
            </button>
          </form>

          <button onClick={() => setIsRegister(!isRegister)} className="w-full text-sm text-gray-500 mt-4 hover:underline">
            {isRegister ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    )
  }

  // --- TELA DO DASHBOARD (LOGADO) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 font-bold text-xl"><Play size={20} className="text-red-600" /> SaaS Reels</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
          <button onClick={() => setToken(null)} className="text-gray-400 hover:text-red-600"><LogOut size={20}/></button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {/* Card do Script */}
        <div className="bg-gray-900 text-white p-6 rounded-2xl mb-8">
          <h3 className="font-bold mb-2 flex items-center gap-2 text-green-400"><Monitor size={16}/> Seu Script de Instalação</h3>
          <p className="text-xs text-gray-400 mb-4">Copie e cole no seu site:</p>
          <code className="bg-black p-3 rounded block text-xs text-yellow-500 break-all">
            {`<script src="https://saas-reels.vercel.app/loader.js" data-widget-id="${user?.widget_id}"></script>`}
          </code>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meus Vídeos</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18}/> Novo</button>
        </div>

        <div className="grid gap-4">
          {videos.map(v => (
            <div key={v.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-red-600"><Play size={18}/></div>
                <div>
                  <div className="font-bold">ID: {v.video_id_externo}</div>
                  <div className="text-xs text-gray-400 flex gap-2"><span>{v.plataforma}</span> • <span>{v.url_gatilho}</span></div>
                </div>
              </div>
              <button onClick={() => deleteVideo(v.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={20}/></button>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL ADICIONAR COM LABELS E DICAS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={addVideo} className="bg-white p-8 rounded-2xl w-full max-w-md space-y-5 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold text-xl text-gray-900">Configurar Novo Vídeo</h3>
              <button type="button" onClick={()=>setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Plataforma</label>
              <select className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-red-500 outline-none transition" 
                onChange={e => setNovoVideo({...novoVideo, plataforma: e.target.value})}>
                <option value="youtube">YouTube (Recomendado)</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ID do Vídeo</label>
              <input required placeholder="Ex: dQw4w9WgXcQ" className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-red-500 outline-none transition" 
                onChange={e => setNovoVideo({...novoVideo, video_id_externo: e.target.value})} />
              <p className="text-[10px] text-gray-400 mt-1">Apenas o código final que aparece na URL do vídeo.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gatilho (Página Específica)</label>
              <input required placeholder="Ex: /terno-slim ou GLOBAL" className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-red-500 outline-none transition" 
                value={novoVideo.url_gatilho} onChange={e => setNovoVideo({...novoVideo, url_gatilho: e.target.value})} />
              <p className="text-[10px] text-gray-400 mt-1">Use <b>GLOBAL</b> para todas as páginas ou <b>/link-da-pagina</b> para um produto específico.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Link de Destino do Botão</label>
              <input required placeholder="https://sua-loja.com/checkout/..." className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-red-500 outline-none transition" 
                onChange={e => setNovoVideo({...novoVideo, link_botao: e.target.value})} />
            </div>

            <button className="w-full bg-red-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95">
              CADASTRAR VÍDEO
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App