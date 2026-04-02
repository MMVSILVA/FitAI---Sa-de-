import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, getUserProfile, supabase } from '../services/supabase';
import { getTasks, createTask, updateTaskStatus, deleteTask, updateTaskTitle } from '../services/atividades';
import { updateProject } from '../services/projetos';
import { generateTasks, generateCanvas, generateReport, generateBannerContent, generatePitchScript } from '../services/ia';
import { ArrowLeft, Plus, Trash2, Sparkles, Calendar, Loader2, Rocket, LayoutDashboard, CheckCircle2, Clock, Play, FileText, Image as ImageIcon, Box, Presentation, ShieldCheck, Download, MessageCircle, Mail, Save, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ProjectBanner } from '../components/ProjectBanner';

type TabType = 'kanban' | 'canvas' | 'relatorio' | 'banner' | 'prototipo' | 'pitch' | 'aprovacao';

interface Project {
  id: string;
  name: string;
  description: string;
  turma: string;
  curso: string;
  startDate: string;
  endDate: string;
  approvalProfessor: boolean;
  approvalBiblioteca: boolean;
  userId: string;
  // Canvas Fields
  canvasParceiros?: string;
  canvasAtividades?: string;
  canvasRecursos?: string;
  canvasProposta?: string;
  canvasRelacionamento?: string;
  canvasCanais?: string;
  canvasSegmentos?: string;
  canvasCustos?: string;
  canvasReceitas?: string;
  relatorio?: string;
  banner?: string;
  prototipo?: string;
  pitch?: string;
  professorPhoto?: string;
  createdAt?: any;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  status: 'todo' | 'doing' | 'done';
  createdAt?: any;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('kanban');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingIA, setLoadingIA] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [professorProfile, setProfessorProfile] = useState<any>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');

  // Form states for sections
  const [canvasData, setCanvasData] = useState({
    parceiros: '',
    atividades: '',
    recursos: '',
    proposta: '',
    relacionamento: '',
    canais: '',
    segmentos: '',
    custos: '',
    receitas: ''
  });
  const [relatorio, setRelatorio] = useState('');
  const [banner, setBanner] = useState('');
  const [prototipo, setPrototipo] = useState('');
  const [pitch, setPitch] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const { data: docSnap, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (error) throw error;
        if (docSnap) {
          const data = { id: docSnap.id, ...docSnap } as Project;
          setProject(data);
          if (data) {
            setEditingDescription(data.description || '');
            setCanvasData({
              parceiros: data.canvasParceiros || '',
              atividades: data.canvasAtividades || '',
              recursos: data.canvasRecursos || '',
              proposta: data.canvasProposta || '',
              relacionamento: data.canvasRelacionamento || '',
              canais: data.canvasCanais || '',
              segmentos: data.canvasSegmentos || '',
              custos: data.canvasCustos || '',
              receitas: data.canvasReceitas || ''
            });
            setRelatorio(data.relatorio || '');
            setBanner(data.banner || '');
            setPrototipo(data.prototipo || '');
            setPitch(data.pitch || '');

            if (data.userId) {
              const profProfile = await getUserProfile(data.userId);
              setProfessorProfile(profProfile);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      }
      setLoading(false);
    };

    const fetchProfile = async () => {
      if (auth.currentUser) {
        const profile = await getUserProfile(auth.currentUser.id);
        setUserProfile(profile);
      }
    };

    fetchProject();
    fetchProfile();
    if (id) {
      const unsubscribe = getTasks(id, setTasks);
      return () => unsubscribe();
    }
  }, [id]);

  const handleSaveSection = async (field: string, value: string) => {
    if (!id) return;
    try {
      await updateProject(id, { [field]: value });
      setProject({ ...project, [field]: value });
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
    }
  };

  const handleNotifyValeria = (type: 'whatsapp' | 'email') => {
    if (!project) return;
    
    const message = `*NOVO PROJETO APROVADO!* 🎉\n\n` +
                    `Olá Valéria, o projeto abaixo foi aprovado e está pronto para registro na biblioteca:\n\n` +
                    `📚 *Projeto:* ${project.name}\n` +
                    `👨‍🏫 *Professor:* ${project.professorName || 'Não informado'}\n` +
                    `🎓 *Curso:* ${project.curso || 'Não informado'}\n` +
                    `👥 *Turma:* ${project.turma || 'Não informado'}\n\n` +
                    `📝 *Descrição:*\n${project.description || 'Sem descrição'}\n\n` +
                    `Por favor, providenciar os próximos passos.`;
    
    if (type === 'whatsapp') {
      const phone = '5524999847737'; // Valéria's number
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      const email = 'vasouza@firjan.com.br';
      window.open(`mailto:${email}?subject=Aprovação de Projeto: ${project.name}&body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleNotifyProfessor = () => {
    if (!project || !professorProfile || !professorProfile.telefone) {
      alert('Telefone do professor não encontrado.');
      return;
    }
    const message = `Olá Professor ${professorProfile.name}, o projeto "${project.name}" teve alterações recentes no Hub. Por favor, verifique as atualizações.`;
    const phone = professorProfile.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleApproval = async (type: 'Professor' | 'Biblioteca') => {
    if (!id || !project) return;
    const field = type === 'Professor' ? 'approvalProfessor' : 'approvalBiblioteca';
    
    // Logic: Biblioteca can only approve if Professor already approved
    if (type === 'Biblioteca' && !project.approvalProfessor) {
      alert('A aprovação do Professor é necessária antes da Biblioteca.');
      return;
    }

    // Email restrictions
    const userEmail = auth.currentUser?.email;
    const isOwner = auth.currentUser?.id === project.userId;
    const isProfessor = userEmail === 'mmvsilva@firjan.com.br' || userEmail === 'marcio.s@docente.firjan.senai.br' || userEmail === 'marcio.v.silva@docente.firjan.senai.br' || isOwner;
    const isBiblioteca = userEmail === 'vasouza@firjan.com.br';

    if (type === 'Professor' && !isProfessor) {
      alert('Apenas o Professor Orientador (ou o criador do projeto) pode aprovar esta etapa.');
      return;
    }
    if (type === 'Biblioteca' && !isBiblioteca) {
      alert('Apenas a Valéria (Biblioteca) pode aprovar esta etapa.');
      return;
    }

    try {
      const isApproving = !project[field];
      await updateProject(id, { [field]: isApproving });
      setProject({ ...project, [field]: isApproving });

      // Automate WhatsApp message to Valéria when Professor approves
      if (type === 'Professor' && isApproving) {
        handleNotifyValeria('whatsapp');
      }
    } catch (error) {
      console.error(`Error updating ${type} approval:`, error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;
    await createTask(id, newTaskTitle);
    setNewTaskTitle('');
  };

  const handleSuggestTasks = async () => {
    if (!project || !id) return;
    setLoadingIA(true);
    try {
      const suggestedTasks = await generateTasks(project.name);
      for (const task of suggestedTasks) {
        await createTask(id, task.title);
      }
    } catch (error) {
      console.error("Error suggesting tasks:", error);
    } finally {
      setLoadingIA(false);
    }
  };

  const handleGenerateCanvasIA = async () => {
    if (!project || !id) return;
    setLoadingIA(true);
    try {
      const canvas = await generateCanvas(project.name, project.description);
      const newCanvasData = {
        parceiros: canvas.parceiros_chave,
        atividades: canvas.atividades_chave,
        recursos: canvas.recursos_chave,
        proposta: canvas.proposta_valor,
        relacionamento: canvas.relacionamento_cliente,
        canais: canvas.canais,
        segmentos: canvas.segmentos_clientes,
        custos: canvas.estrutura_custos,
        receitas: canvas.fluxo_receitas
      };
      setCanvasData(newCanvasData);
      await updateProject(id, {
        canvasParceiros: newCanvasData.parceiros,
        canvasAtividades: newCanvasData.atividades,
        canvasRecursos: newCanvasData.recursos,
        canvasProposta: newCanvasData.proposta,
        canvasRelacionamento: newCanvasData.relacionamento,
        canvasCanais: newCanvasData.canais,
        canvasSegmentos: newCanvasData.segmentos,
        canvasCustos: newCanvasData.custos,
        canvasReceitas: newCanvasData.receitas
      });
    } catch (error) {
      console.error("Error generating canvas:", error);
    } finally {
      setLoadingIA(false);
    }
  };

  const handleGenerateReportIA = async () => {
    if (!project || !id) return;
    
    let baseDescription = project.description;
    if (!baseDescription || baseDescription === "Projeto educacional em desenvolvimento.") {
      const userInput = window.prompt("Por favor, forneça mais detalhes sobre o projeto para gerar um resumo mais preciso:");
      if (userInput) {
        baseDescription += "\nDetalhes adicionais: " + userInput;
      }
    }

    setLoadingIA(true);
    try {
      const content = await generateReport(project.name, baseDescription);
      setRelatorio(content);
      await updateProject(id, { relatorio: content });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoadingIA(false);
    }
  };

  const handleGenerateBannerIA = async () => {
    if (!project || !id) return;
    setLoadingIA(true);
    try {
      const content = await generateBannerContent(project.name, project.description);
      setBanner(content);
      await updateProject(id, { banner: content });
    } catch (error) {
      console.error("Error generating banner:", error);
    } finally {
      setLoadingIA(false);
    }
  };

  const handleGeneratePitchIA = async () => {
    if (!project || !id) return;
    setLoadingIA(true);
    try {
      const content = await generatePitchScript(project.name, project.description, relatorio);
      setPitch(content);
      await updateProject(id, { pitch: content });
    } catch (error) {
      console.error("Error generating pitch:", error);
    } finally {
      setLoadingIA(false);
    }
  };

  const handleSaveCanvas = async () => {
    if (!id) return;
    try {
      await updateProject(id, {
        canvasParceiros: canvasData.parceiros,
        canvasAtividades: canvasData.atividades,
        canvasRecursos: canvasData.recursos,
        canvasProposta: canvasData.proposta,
        canvasRelacionamento: canvasData.relacionamento,
        canvasCanais: canvasData.canais,
        canvasSegmentos: canvasData.segmentos,
        canvasCustos: canvasData.custos,
        canvasReceitas: canvasData.receitas
      });
      alert('Canvas salvo com sucesso!');
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  };

  const generateProjectReport = async () => {
    if (!project) return;
    
    // We will use the hidden ProjectBanner component to generate the PDF
    const bannerElement = document.getElementById('project-banner-export');
    if (!bannerElement) {
      alert('Erro ao gerar o banner. Elemento não encontrado.');
      return;
    }

    try {
      // Temporarily make it visible for html2canvas
      bannerElement.style.position = 'relative';
      bannerElement.style.left = '0';
      bannerElement.style.top = '0';

      const canvas = await html2canvas(bannerElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Hide it again
      bannerElement.style.position = 'absolute';
      bannerElement.style.left = '-9999px';
      bannerElement.style.top = '-9999px';

      const imgData = canvas.toDataURL('image/png');
      
      // A4 size in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Banner_${project.name.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ocorreu um erro ao gerar o banner em PDF.');
      // Ensure it's hidden even if error occurs
      bannerElement.style.position = 'absolute';
      bannerElement.style.left = '-9999px';
      bannerElement.style.top = '-9999px';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-neon-purple animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Projeto não encontrado</h1>
      <button onClick={() => navigate('/')} className="neon-button">Voltar ao Dashboard</button>
    </div>
  );

  const kanbanColumns = [
    { id: 'todo', title: 'A Fazer', icon: <Clock className="w-4 h-4" />, color: 'text-gray-400' },
    { id: 'doing', title: 'Em Andamento', icon: <Play className="w-4 h-4" />, color: 'text-neon-purple' },
    { id: 'done', title: 'Concluído', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-neon-green' },
  ];

  const getDisplayName = (profile: any, email: string | undefined) => {
    if (profile?.name) return profile.name;
    if (email === 'mmvsilva@firjan.com.br' || email === 'marcio.s@docente.firjan.senai.br' || email === 'marcio.v.silva@docente.firjan.senai.br') return 'Márcio Vinícius';
    if (email === 'vasouza@firjan.com.br') return 'V. Souza';
    return email?.split('@')[0] || 'Usuário';
  };

  const getDisplayMatricula = (profile: any, email: string | undefined) => {
    if (profile?.matricula) return profile.matricula;
    if (email === 'mmvsilva@firjan.com.br' || email === 'marcio.s@docente.firjan.senai.br' || email === 'marcio.v.silva@docente.firjan.senai.br') return '00001';
    if (email === 'vasouza@firjan.com.br') return '00002';
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <ProjectBanner project={project} />
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2 px-4 py-3 bg-dark-card rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neon-purple shadow-[0_0_15px_rgba(0,80,153,0.3)]">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-neon-purple/20 flex items-center justify-center text-neon-purple text-xl font-bold uppercase">
                    {getDisplayName(userProfile, auth.currentUser?.email).charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white leading-none">{getDisplayName(userProfile, auth.currentUser?.email)}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Mat: {getDisplayMatricula(userProfile, auth.currentUser?.email)}</span>
              </div>
            </div>
            <button 
              onClick={generateProjectReport}
              className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-xl hover:bg-neon-green/20 transition-all font-bold text-sm"
            >
              <Download className="w-4 h-4" />
              GERAR RESUMO DO PROJETO
            </button>
          </div>
        </div>

        {/* Project Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {project.professorPhoto && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-neon-purple/30 mr-2">
                    <img src={project.professorPhoto} alt="Professor" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="px-3 py-1 bg-neon-purple/20 text-neon-purple text-xs font-bold rounded-full border border-neon-purple/30 uppercase tracking-widest">
                  {project.curso}
                </div>
                <div className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-full border border-white/10 uppercase tracking-widest">
                  Turma: {project.turma}
                </div>
                <span className="text-gray-600 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {project.startDate} - {project.endDate}
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter mb-4">{project.name}</h1>
              {isEditingDescription ? (
                <div className="flex flex-col gap-2 max-w-3xl">
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-neon-purple transition-all resize-none text-gray-300 leading-relaxed"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await handleSaveSection('description', editingDescription);
                        setIsEditingDescription(false);
                      }}
                      className="px-4 py-2 bg-neon-purple text-white rounded-lg text-sm font-bold hover:bg-neon-purple/80 transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditingDescription(project.description);
                        setIsEditingDescription(false);
                      }}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/20 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative max-w-3xl">
                  <p className="text-gray-400 text-lg leading-relaxed">
                    {project.description}
                  </p>
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="absolute -right-8 top-0 p-2 text-gray-600 hover:text-neon-purple transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {professorProfile && professorProfile.telefone && auth.currentUser?.id !== project.userId && (
                <button 
                  onClick={handleNotifyProfessor}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all font-bold text-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  Notificar Professor
                </button>
              )}
              <button 
                onClick={handleSuggestTasks}
                disabled={loadingIA}
                className="neon-button flex items-center gap-2 px-6 py-3"
              >
                {loadingIA ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Sugerir Tarefas com IA
              </button>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-8 border-b border-white/5 pb-4 no-scrollbar scroll-smooth">
          {[
            { id: 'kanban', label: 'Kanban', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'relatorio', label: 'Resumo Expandido', icon: <FileText className="w-4 h-4" /> },
            { id: 'canvas', label: 'BM Canvas', icon: <FileText className="w-4 h-4" /> },
            { id: 'banner', label: 'Banner', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'prototipo', label: 'Protótipo', icon: <Box className="w-4 h-4" /> },
            { id: 'pitch', label: 'Pitch', icon: <Presentation className="w-4 h-4" /> },
            { id: 'aprovacao', label: 'Aprovação', icon: <ShieldCheck className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.3)]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'kanban' && (
            <div className="space-y-8">
              <form onSubmit={handleAddTask} className="flex gap-3 max-w-2xl">
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Adicionar nova tarefa ao Kanban..."
                  className="flex-1 bg-dark-card border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-neon-purple transition-all"
                />
                <button type="submit" className="neon-button p-3">
                  <Plus className="w-6 h-6" />
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kanbanColumns.map((col) => (
                  <div key={col.id} className="bg-black/20 rounded-2xl p-4 border border-white/5 min-h-[400px]">
                    <div className={`flex items-center gap-2 mb-6 font-bold uppercase tracking-widest text-xs ${col.color}`}>
                      {col.icon}
                      {col.title}
                      <span className="ml-auto bg-white/5 px-2 py-0.5 rounded-full text-[10px]">
                        {tasks.filter(t => t.status === col.id).length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <AnimatePresence>
                        {tasks
                          .filter(t => t.status === col.id || (!t.status && col.id === 'todo'))
                          .map((task) => (
                            <motion.div
                              key={task.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="bg-dark-card p-4 rounded-xl border border-white/5 hover:border-white/10 group relative"
                            >
                              {editingTaskId === task.id ? (
                                <div className="flex items-center gap-2 mb-4">
                                  <input
                                    type="text"
                                    value={editingTaskTitle}
                                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-neon-purple"
                                    autoFocus
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                        await updateTaskTitle(task.id, editingTaskTitle);
                                        setEditingTaskId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingTaskId(null);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={async () => {
                                      await updateTaskTitle(task.id, editingTaskTitle);
                                      setEditingTaskId(null);
                                    }}
                                    className="p-1 text-neon-green hover:bg-neon-green/10 rounded"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <p 
                                  className="text-sm mb-4 cursor-pointer hover:text-neon-purple transition-colors"
                                  onClick={() => {
                                    setEditingTaskId(task.id);
                                    setEditingTaskTitle(task.title);
                                  }}
                                >
                                  {task.title}
                                </p>
                              )}
                              <div className="flex justify-between items-center">
                                <div className="flex gap-1">
                                  {kanbanColumns.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => updateTaskStatus(task.id, c.id)}
                                      className={`w-2 h-2 rounded-full transition-all ${
                                        (task.status || 'todo') === c.id ? 'scale-125 ring-2 ring-white/20' : 'opacity-20 hover:opacity-50'
                                      } ${
                                        c.id === 'todo' ? 'bg-gray-400' : c.id === 'doing' ? 'bg-neon-purple' : 'bg-neon-green'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button 
                                    onClick={() => {
                                      setEditingTaskId(task.id);
                                      setEditingTaskTitle(task.title);
                                    }}
                                    className="p-1 text-gray-600 hover:text-neon-purple transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(task.id);
                                    }}
                                    className="p-1 text-gray-600 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'canvas' && (
            <div className="bg-dark-card p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-neon-purple" />
                  Business Model Canvas
                </h2>
                <div className="flex gap-3">
                  <button 
                    onClick={handleGenerateCanvasIA}
                    disabled={loadingIA}
                    className="neon-button flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {loadingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar com IA
                  </button>
                  <button 
                    onClick={handleSaveCanvas}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Canvas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[600px]">
                {/* Parceiros Chave */}
                <div className="md:row-span-2 border border-white/10 rounded-xl p-4 bg-black/20">
                  <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Parceiros-Chave</label>
                  <textarea 
                    value={canvasData.parceiros}
                    onChange={(e) => setCanvasData({...canvasData, parceiros: e.target.value})}
                    className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                    placeholder="Quem são nossos parceiros?"
                  />
                </div>

                {/* Atividades e Recursos */}
                <div className="md:col-span-1 space-y-4">
                  <div className="h-1/2 border border-white/10 rounded-xl p-4 bg-black/20">
                    <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Atividades-Chave</label>
                    <textarea 
                      value={canvasData.atividades}
                      onChange={(e) => setCanvasData({...canvasData, atividades: e.target.value})}
                      className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                      placeholder="O que fazemos?"
                    />
                  </div>
                  <div className="h-1/2 border border-white/10 rounded-xl p-4 bg-black/20">
                    <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Recursos-Chave</label>
                    <textarea 
                      value={canvasData.recursos}
                      onChange={(e) => setCanvasData({...canvasData, recursos: e.target.value})}
                      className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                      placeholder="O que precisamos?"
                    />
                  </div>
                </div>

                {/* Proposta de Valor */}
                <div className="md:row-span-2 border border-white/10 rounded-xl p-4 bg-black/20">
                  <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Proposta de Valor</label>
                  <textarea 
                    value={canvasData.proposta}
                    onChange={(e) => setCanvasData({...canvasData, proposta: e.target.value})}
                    className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                    placeholder="Qual valor entregamos?"
                  />
                </div>

                {/* Relacionamento e Canais */}
                <div className="md:col-span-1 space-y-4">
                  <div className="h-1/2 border border-white/10 rounded-xl p-4 bg-black/20">
                    <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Relacionamento</label>
                    <textarea 
                      value={canvasData.relacionamento}
                      onChange={(e) => setCanvasData({...canvasData, relacionamento: e.target.value})}
                      className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                      placeholder="Como interagimos?"
                    />
                  </div>
                  <div className="h-1/2 border border-white/10 rounded-xl p-4 bg-black/20">
                    <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Canais</label>
                    <textarea 
                      value={canvasData.canais}
                      onChange={(e) => setCanvasData({...canvasData, canais: e.target.value})}
                      className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                      placeholder="Como chegamos ao cliente?"
                    />
                  </div>
                </div>

                {/* Segmentos de Clientes */}
                <div className="md:row-span-2 border border-white/10 rounded-xl p-4 bg-black/20">
                  <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Segmentos de Clientes</label>
                  <textarea 
                    value={canvasData.segmentos}
                    onChange={(e) => setCanvasData({...canvasData, segmentos: e.target.value})}
                    className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                    placeholder="Para quem criamos valor?"
                  />
                </div>

                {/* Custos e Receitas */}
                <div className="md:col-span-2 border border-white/10 rounded-xl p-4 bg-black/20">
                  <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Estrutura de Custos</label>
                  <textarea 
                    value={canvasData.custos}
                    onChange={(e) => setCanvasData({...canvasData, custos: e.target.value})}
                    className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                    placeholder="Quais são os custos?"
                  />
                </div>
                <div className="md:col-span-3 border border-white/10 rounded-xl p-4 bg-black/20">
                  <label className="text-[10px] font-bold text-neon-purple uppercase tracking-widest mb-2 block">Fluxo de Receitas</label>
                  <textarea 
                    value={canvasData.receitas}
                    onChange={(e) => setCanvasData({...canvasData, receitas: e.target.value})}
                    className="w-full h-[calc(100%-20px)] bg-transparent focus:outline-none text-sm text-gray-300 resize-none"
                    placeholder="Como ganhamos dinheiro?"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relatorio' && (
            <div className="bg-dark-card p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-neon-green" />
                  Resumo Expandido do Projeto
                </h2>
                <div className="flex gap-3">
                  <label className="neon-button flex items-center gap-2 px-4 py-2 text-sm cursor-pointer bg-white/5 hover:bg-white/10">
                    <ImageIcon className="w-4 h-4" />
                    Enviar Arquivo (.txt)
                    <input 
                      type="file" 
                      accept=".txt" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const text = await file.text();
                          setRelatorio(text);
                          handleSaveSection('relatorio', text);
                        }
                      }}
                    />
                  </label>
                  <button 
                    onClick={() => {
                      const blob = new Blob([relatorio], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Resumo_Expandido_${project.name.replace(/\s+/g, '_')}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    disabled={!relatorio}
                    className="neon-button flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button 
                    onClick={handleGenerateReportIA}
                    disabled={loadingIA}
                    className="neon-button flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {loadingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar com IA
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Conteúdo do Resumo Expandido</label>
                  <textarea 
                    value={relatorio}
                    onChange={(e) => setRelatorio(e.target.value)}
                    onBlur={() => handleSaveSection('relatorio', relatorio)}
                    placeholder="Escreva o resumo expandido detalhado do projeto (600 a 700 palavras)..."
                    className="w-full h-[200px] bg-black/30 border border-white/10 rounded-xl p-6 focus:outline-none focus:border-neon-green transition-all resize-none text-gray-300 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'banner' && (
            <div className="bg-dark-card p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-neon-purple" />
                  Banner do Projeto
                </h2>
                <button 
                  onClick={handleGenerateBannerIA}
                  disabled={loadingIA}
                  className="neon-button flex items-center gap-2 px-4 py-2 text-sm"
                >
                  {loadingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Gerar com IA
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Link do Arquivo (Anexo)</label>
                  <input 
                    type="text"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    onBlur={() => handleSaveSection('banner', banner)}
                    placeholder="Link para o banner (Google Drive, Dropbox, etc)..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                  />
                </div>
                {banner && banner.match(/\.(jpeg|jpg|gif|png)$/) && (
                  <div className="aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10">
                    <img src={banner} alt="Banner Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'prototipo' && (
            <div className="bg-dark-card p-8 rounded-2xl border border-white/5">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Box className="w-6 h-6 text-neon-green" />
                Protótipo
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Link do Protótipo (YouTube ou Foto)</label>
                  <input 
                    type="text"
                    value={prototipo}
                    onChange={(e) => setPrototipo(e.target.value)}
                    onBlur={() => handleSaveSection('prototipo', prototipo)}
                    placeholder="Link do vídeo no YouTube ou link da foto..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-green transition-all"
                  />
                </div>
                {prototipo && (
                  <div className="aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                    {prototipo.includes('youtube.com') || prototipo.includes('youtu.be') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <Play className="w-12 h-12 text-red-500" />
                        <span className="text-sm font-bold text-gray-400">Vídeo do YouTube Detectado</span>
                        <a href={prototipo} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-green hover:underline">Abrir Vídeo</a>
                      </div>
                    ) : prototipo.match(/\.(jpeg|jpg|gif|png)$/) ? (
                      <img src={prototipo} alt="Protótipo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <p className="text-gray-600 text-sm">Link adicionado: {prototipo}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pitch' && (
            <div className="bg-dark-card p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Presentation className="w-6 h-6 text-neon-purple" />
                  Pitch
                </h2>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const blob = new Blob([pitch], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Pitch_${project.name.replace(/\s+/g, '_')}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    disabled={!pitch}
                    className="neon-button flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button 
                    onClick={handleGeneratePitchIA}
                    disabled={loadingIA}
                    className="neon-button flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {loadingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar Roteiro com IA
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Roteiro do Pitch</label>
                  <textarea 
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    onBlur={() => handleSaveSection('pitch', pitch)}
                    placeholder="Escreva o roteiro do pitch aqui..."
                    className="w-full h-[200px] bg-black/30 border border-white/10 rounded-xl p-6 focus:outline-none focus:border-neon-purple transition-all resize-none text-gray-300 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Link do Vídeo no YouTube</label>
                  <input 
                    type="text"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    onBlur={() => handleSaveSection('pitch', pitch)}
                    placeholder="Link do vídeo do pitch no YouTube..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                  />
                </div>
                {pitch && (pitch.includes('youtube.com') || pitch.includes('youtu.be')) && (
                  <div className="aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10 flex flex-col items-center justify-center gap-4">
                    <Play className="w-12 h-12 text-red-500" />
                    <span className="text-sm font-bold text-gray-400">Vídeo do Pitch Detectado</span>
                    <a href={pitch} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-purple hover:underline">Abrir Vídeo</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'aprovacao' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className={`p-8 rounded-2xl border transition-all ${project.approvalProfessor ? 'bg-neon-green/10 border-neon-green/30' : 'bg-dark-card border-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">1. Aprovação do Professor</h3>
                    <p className="text-sm text-gray-500">Validação técnica e pedagógica do projeto.</p>
                  </div>
                  <button 
                    onClick={() => handleApproval('Professor')}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                      project.approvalProfessor 
                        ? 'bg-neon-green text-black' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {project.approvalProfessor ? 'APROVADO' : 'APROVAR'}
                  </button>
                </div>
              </div>

              <div className={`p-8 rounded-2xl border transition-all ${project.approvalBiblioteca ? 'bg-neon-green/10 border-neon-green/30' : 'bg-dark-card border-white/5'} ${!project.approvalProfessor ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">2. Valéria - Biblioteca</h3>
                    <p className="text-sm text-gray-500">Registro e arquivamento no acervo da biblioteca.</p>
                  </div>
                  <div className="flex gap-2">
                    {project.approvalProfessor && !project.approvalBiblioteca && (
                      <div className="flex gap-2 mr-4">
                        <button 
                          onClick={() => handleNotifyValeria('whatsapp')}
                          className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-all"
                          title="Notificar via WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleNotifyValeria('email')}
                          className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-all"
                          title="Notificar via E-mail"
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => handleApproval('Biblioteca')}
                      disabled={!project.approvalProfessor}
                      className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                        project.approvalBiblioteca 
                          ? 'bg-neon-green text-black' 
                          : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {project.approvalBiblioteca ? 'APROVADO' : 'APROVAR'}
                    </button>
                  </div>
                </div>
                {!project.approvalProfessor && (
                  <p className="text-xs text-red-500 mt-4 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" /> Aguardando aprovação do Professor
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <footer className="mt-20 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-600 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            By Márcio Vinícius
          </div>
          <div>© 2026 Project Hub Educacional - SENAI VR TODOS OS DIREITOS RESERVADOS</div>
        </footer>
      </div>
    </div>
  );
}
