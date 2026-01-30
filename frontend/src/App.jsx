import { useState, useEffect } from 'react'
import axios from 'axios' // Biblioteca para fazer requisições
import { Play, Plus, Trash2, Link as LinkIcon, Monitor, X } from 'lucide-react'

// URL do Backend
const API_URL = "https://saas-reels.onrender.com"
const WIDGET_ID = "wdg_teste_01" // Fixo para este teste

function App() {
  const [videos, setVideos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Estado do Formulário
  const [novoVideo, setNovoVideo] = useState({
    plataforma: 'youtube',
    video_id_externo: '',
    url_gatilho: '',
    link_botao: ''
  })

  // 1. BUSCAR VÍDEOS (Ao carregar a tela)
  const carregarVideos = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/widget/${WIDGET_ID}`)
      setVideos(response.data.playlist)
    } catch (error) {
      console.error("Erro ao buscar vídeos", error)
    }
  }

  useEffect(() => {
    carregarVideos()
  }, [])

  // 2. SALVAR VÍDEO
  const handleSalvar = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/api/videos`, {
        widget_id: WIDGET_ID,
        ...novoVideo
      })
      setIsModalOpen(false) // Fecha modal
      setNovoVideo({ plataforma: 'youtube', video_id_externo: '', url_gatilho: '', link_botao: '' }) // Limpa form
      carregarVideos() // Recarrega a lista
      alert("Vídeo adicionado com sucesso!")
    } catch (error) {
      alert("Erro ao salvar vídeo")
    }
  }

  // 3. DELETAR VÍDEO
  const handleDeletar = async (id) => {
    if(!confirm("Tem certeza que quer apagar este vídeo?")) return
    try {
      await axios.delete(`${API_URL}/api/videos/${id}`)
      carregarVideos()
    } catch (error) {
      alert("Erro ao deletar")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Play size={16} fill="white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Widget<span className="text-red-600">SaaS</span></span>
        </div>
        <div className="text-sm text-gray-500">Minha Loja Demo ({WIDGET_ID})</div>
      </nav>

      {/* CONTEÚDO */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Vídeos</h1>
            <p className="text-gray-500 mt-1">Gerencie a playlist da sua loja.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={20} /> Novo Vídeo
          </button>
        </div>

        {/* LISTA */}
        <div className="grid gap-4">
          {videos.length === 0 && <p className="text-gray-500">Nenhum vídeo cadastrado.</p>}
          
          {videos.map((video) => (
            <div key={video.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${video.plataforma === 'youtube' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Play size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">ID: {video.video_id_externo}</h3>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded uppercase text-xs font-bold">{video.plataforma}</span>
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><LinkIcon size={12} /> {video.url_gatilho}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleDeletar(video.id)} className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Adicionar Vídeo</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={novoVideo.plataforma}
                  onChange={e => setNovoVideo({...novoVideo, plataforma: e.target.value})}
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Vídeo (Ex: dQw4w9WgXcQ)</label>
                <input 
                  required
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  placeholder="Cole apenas o ID, não o link"
                  value={novoVideo.video_id_externo}
                  onChange={e => setNovoVideo({...novoVideo, video_id_externo: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gatilho (URL)</label>
                <input 
                  required
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  placeholder="Ex: /tenis ou GLOBAL"
                  value={novoVideo.url_gatilho}
                  onChange={e => setNovoVideo({...novoVideo, url_gatilho: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link do Botão Comprar</label>
                <input 
                  required
                  type="url" 
                  className="w-full border rounded-lg p-2"
                  placeholder="https://sualoja.com/produto"
                  value={novoVideo.link_botao}
                  onChange={e => setNovoVideo({...novoVideo, link_botao: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition">
                SALVAR VÍDEO
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default App