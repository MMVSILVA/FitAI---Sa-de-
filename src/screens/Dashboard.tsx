import React, { useState, useEffect, useMemo } from 'react';
import { auth, logout, getUserProfile } from '../services/supabase';
import { getProjects, createProject, deleteProject, getAllProjects } from '../services/projetos';
import { createTask } from '../services/atividades';
import { generateProjectDescription, generateTasks } from '../services/ia';
import { Plus, Trash2, LogOut, Sparkles, FolderKanban, ArrowRight, Loader2, Search, FileText, Calendar as CalendarIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  professorPhoto?: string;
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
  createdAt?: any;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [turma, setTurma] = useState('');
  const [curso, setCurso] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [professorPhoto, setProfessorPhoto] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [viewAll, setViewAll] = useState(false);
  const navigate = useNavigate();

  const isAdmin = auth.currentUser?.email === 'mmvsilva@firjan.com.br' || 
                  auth.currentUser?.email === 'vasouza@firjan.com.br' || 
                  auth.currentUser?.email === 'marcio.s@docente.firjan.senai.br' ||
                  auth.currentUser?.email === 'marcio.v.silva@docente.firjan.senai.br';

  useEffect(() => {
    const unsubscribe = getProjects((projs) => {
      if (isAdmin && !viewAll) {
        setProjects(projs.filter(p => p.userId === auth.currentUser?.id));
      } else {
        setProjects(projs);
      }
    });
    
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const profile = await getUserProfile(auth.currentUser.id);
        setUserProfile(profile);
      }
    };
    fetchProfile();

    return () => unsubscribe();
  }, [viewAll, isAdmin]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !turma || !curso || !startDate || !endDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await createProject(newProjectName, "Projeto educacional em desenvolvimento.", turma, curso, startDate, endDate, professorPhoto, professorName);
      setNewProjectName('');
      setTurma('');
      setCurso('');
      setStartDate('');
      setEndDate('');
      setProfessorName('');
      setProfessorPhoto('');
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleCreateWithIA = async () => {
    if (!newProjectName.trim() || !turma || !curso || !startDate || !endDate) {
      alert('Por favor, preencha todos os campos obrigatórios para gerar com IA.');
      return;
    }
    setLoadingIA(true);

    try {
      const description = await generateProjectDescription(newProjectName);
      const projectId = await createProject(newProjectName, description, turma, curso, startDate, endDate, professorPhoto, professorName);
      
      if (projectId) {
        const tasks = await generateTasks(newProjectName);
        for (const task of tasks) {
          await createTask(projectId, task.title);
        }
        navigate(`/project/${projectId}`);
      }
    } catch (error) {
      console.error("IA Generation Error:", error);
    } finally {
      setLoadingIA(false);
    }
  };

  const generateGlobalReport = async () => {
    const allProjects = await getAllProjects() as Project[];
    if (!allProjects || allProjects.length === 0) {
      alert('Nenhum projeto encontrado para gerar o relatório.');
      return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Firjan SENAI';
    wb.created = new Date();

    // --- TAB 1: DASHBOARD ---
    const wsDash = wb.addWorksheet('Dashboard', { views: [{ showGridLines: false }] });

    // Set column widths for a grid layout
    wsDash.getColumn('A').width = 2;   // Spacer
    wsDash.getColumn('B').width = 30;  // Col 1
    wsDash.getColumn('C').width = 15;  // Col 2
    wsDash.getColumn('D').width = 2;   // Spacer
    wsDash.getColumn('E').width = 30;  // Col 3
    wsDash.getColumn('F').width = 15;  // Col 4
    wsDash.getColumn('G').width = 2;   // Spacer
    wsDash.getColumn('H').width = 30;  // Col 5
    wsDash.getColumn('I').width = 15;  // Col 6

    // Title
    wsDash.mergeCells('B2:I3');
    const titleCell = wsDash.getCell('B2');
    titleCell.value = 'ANÁLISE DE PROJETOS - DASHBOARD GERAL';
    titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002050' } }; // Power BI Dark Blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Metrics
    const totalProjects = allProjects.length;
    const approvedProfessor = allProjects.filter(p => p.approvalProfessor).length;
    const approvedBiblioteca = allProjects.filter(p => p.approvalBiblioteca).length;

    const createKPICard = (startCol: string, endCol: string, row: number, title: string, value: string | number, subtitle: string) => {
      wsDash.mergeCells(`${startCol}${row}:${endCol}${row}`);
      wsDash.mergeCells(`${startCol}${row+1}:${endCol}${row+2}`);
      wsDash.mergeCells(`${startCol}${row+3}:${endCol}${row+3}`);

      const titleC = wsDash.getCell(`${startCol}${row}`);
      const valC = wsDash.getCell(`${startCol}${row+1}`);
      const subC = wsDash.getCell(`${startCol}${row+3}`);

      titleC.value = title.toUpperCase();
      titleC.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      titleC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005099' } };
      titleC.alignment = { vertical: 'middle', horizontal: 'center' };

      valC.value = value;
      valC.font = { size: 24, bold: true, color: { argb: 'FF002050' } };
      valC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F6F8' } };
      valC.alignment = { vertical: 'middle', horizontal: 'center' };

      subC.value = subtitle;
      subC.font = { size: 9, bold: true, color: { argb: 'FF666666' } };
      subC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F6F8' } };
      subC.alignment = { vertical: 'middle', horizontal: 'center' };
    };

    createKPICard('B', 'C', 5, 'Total de Projetos', totalProjects, 'Todos os cursos e turmas');
    createKPICard('E', 'F', 5, 'Aprovados (Professor)', approvedProfessor, `${((approvedProfessor/totalProjects)*100).toFixed(1)}% do total`);
    createKPICard('H', 'I', 5, 'Aprovados (Biblioteca)', approvedBiblioteca, `${((approvedBiblioteca/totalProjects)*100).toFixed(1)}% do total`);

    // Data Processing
    const monthCounts: Record<string, number> = {};
    const courseCounts: Record<string, number> = {};
    const turmaData: Record<string, { total: number, aprovados: number, pendentes: number }> = {};

    allProjects.forEach(p => {
      // Month
      const date = p.createdAt ? new Date(p.createdAt) : new Date();
      const month = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;

      // Course
      courseCounts[p.curso] = (courseCounts[p.curso] || 0) + 1;

      // Turma
      if (!turmaData[p.turma]) turmaData[p.turma] = { total: 0, aprovados: 0, pendentes: 0 };
      turmaData[p.turma].total++;
      if (p.approvalProfessor) turmaData[p.turma].aprovados++;
      else turmaData[p.turma].pendentes++;
    });

    // Table 1: Projetos por Mês
    wsDash.mergeCells(`B10:C10`);
    const t1Cell = wsDash.getCell(`B10`);
    t1Cell.value = 'PROJETOS POR MÊS';
    t1Cell.font = { size: 12, bold: true, color: { argb: 'FF002050' } };
    
    wsDash.getCell(`B11`).value = 'Mês/Ano';
    wsDash.getCell(`C11`).value = 'Quantidade';
    ['B11', 'C11'].forEach(c => {
      wsDash.getCell(c).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsDash.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002050' } };
      wsDash.getCell(c).alignment = { horizontal: 'center' };
    });

    let r1 = 12;
    Object.entries(monthCounts).forEach(([m, count]) => {
      wsDash.getCell(`B${r1}`).value = m;
      wsDash.getCell(`B${r1}`).border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      wsDash.getCell(`C${r1}`).value = count;
      wsDash.getCell(`C${r1}`).alignment = { horizontal: 'center' };
      wsDash.getCell(`C${r1}`).border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      r1++;
    });

    // Table 2: Projetos por Curso
    wsDash.mergeCells(`E10:I10`);
    const t2Cell = wsDash.getCell(`E10`);
    t2Cell.value = 'PROJETOS POR CURSO';
    t2Cell.font = { size: 12, bold: true, color: { argb: 'FF002050' } };
    
    wsDash.mergeCells(`E11:H11`);
    wsDash.getCell(`E11`).value = 'Curso';
    wsDash.getCell(`I11`).value = 'Quantidade';
    ['E11', 'I11'].forEach(c => {
      wsDash.getCell(c).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsDash.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002050' } };
      wsDash.getCell(c).alignment = { horizontal: 'center' };
    });

    let r2 = 12;
    Object.entries(courseCounts).forEach(([c, count]) => {
      wsDash.mergeCells(`E${r2}:H${r2}`);
      wsDash.getCell(`E${r2}`).value = c;
      wsDash.getCell(`E${r2}`).border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      wsDash.getCell(`I${r2}`).value = count;
      wsDash.getCell(`I${r2}`).alignment = { horizontal: 'center' };
      wsDash.getCell(`I${r2}`).border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      r2++;
    });

    // Table 3: Detalhamento por Turma
    const startRowT3 = Math.max(r1, r2) + 2;
    wsDash.mergeCells(`B${startRowT3}:I${startRowT3}`);
    const t3Cell = wsDash.getCell(`B${startRowT3}`);
    t3Cell.value = 'DETALHAMENTO POR TURMA';
    t3Cell.font = { size: 12, bold: true, color: { argb: 'FF002050' } };
    
    const t3Headers = ['Turma', 'Total Projetos', 'Aprovados', 'Pendentes'];
    const headerRow = startRowT3 + 1;
    
    wsDash.mergeCells(`B${headerRow}:E${headerRow}`);
    wsDash.getCell(`B${headerRow}`).value = t3Headers[0];
    
    wsDash.getCell(`F${headerRow}`).value = t3Headers[1];
    wsDash.mergeCells(`G${headerRow}:H${headerRow}`);
    wsDash.getCell(`G${headerRow}`).value = t3Headers[2];
    wsDash.getCell(`I${headerRow}`).value = t3Headers[3];

    ['B', 'F', 'G', 'I'].forEach(col => {
      const hCell = wsDash.getCell(`${col}${headerRow}`);
      hCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002050' } };
      hCell.alignment = { horizontal: 'center' };
    });

    let r3 = headerRow + 1;
    Object.entries(turmaData).forEach(([t, d]) => {
      wsDash.mergeCells(`B${r3}:E${r3}`);
      const c1 = wsDash.getCell(`B${r3}`);
      c1.value = t;
      c1.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      
      const c2 = wsDash.getCell(`F${r3}`);
      c2.value = d.total;
      c2.alignment = { horizontal: 'center' };
      c2.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      
      wsDash.mergeCells(`G${r3}:H${r3}`);
      const c3 = wsDash.getCell(`G${r3}`);
      c3.value = d.aprovados;
      c3.alignment = { horizontal: 'center' };
      c3.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      
      const c4 = wsDash.getCell(`I${r3}`);
      c4.value = d.pendentes;
      c4.alignment = { horizontal: 'center' };
      c4.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      
      r3++;
    });

    // --- TAB 2: LISTA DE PROJETOS ---
    const wsData = wb.addWorksheet('Lista de Projetos');
    
    wsData.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome do Projeto', key: 'name', width: 40 },
      { header: 'Curso', key: 'curso', width: 30 },
      { header: 'Turma', key: 'turma', width: 15 },
      { header: 'Descrição', key: 'description', width: 60 },
      { header: 'Data Início', key: 'startDate', width: 15 },
      { header: 'Data Término', key: 'endDate', width: 15 },
      { header: 'Aprovação Prof.', key: 'appProf', width: 20 },
      { header: 'Aprovação Bib.', key: 'appBib', width: 20 },
      { header: 'Data de Criação', key: 'createdAt', width: 20 },
    ];

    // Style Headers
    wsData.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsData.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0055A4' } };
    wsData.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    wsData.autoFilter = 'A1:J1';

    // Add Data
    allProjects.forEach(p => {
      wsData.addRow({
        id: p.id.substring(0, 8) + '...',
        name: p.name,
        curso: p.curso,
        turma: p.turma,
        description: p.description,
        startDate: p.startDate,
        endDate: p.endDate,
        appProf: p.approvalProfessor ? 'SIM' : 'NÃO',
        appBib: p.approvalBiblioteca ? 'SIM' : 'NÃO',
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'
      });
    });

    // Add alternating row colors and borders
    wsData.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: {style:'thin', color: {argb:'FFDDDDDD'}},
          left: {style:'thin', color: {argb:'FFDDDDDD'}},
          bottom: {style:'thin', color: {argb:'FFDDDDDD'}},
          right: {style:'thin', color: {argb:'FFDDDDDD'}}
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      });
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
      }
    });

    // Generate and save file
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Relatorio_Projetos_Firjan_SENAI_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'approved' && p.approvalProfessor) || 
                          (statusFilter === 'pending' && !p.approvalProfessor);
    return matchesSearch && matchesStatus;
  });

  const projectsByCourse = useMemo(() => {
    const courseData = projects.reduce((acc, p) => {
      if (!acc[p.curso]) {
        acc[p.curso] = { name: p.curso, value: 0, professors: new Set<string>() };
      }
      acc[p.curso].value += 1;
      acc[p.curso].professors.add(p.professorName || 'Desconhecido');
      return acc;
    }, {} as Record<string, { name: string, value: number, professors: Set<string> }>);
    
    return Object.values(courseData).map(d => ({
      ...d,
      professorsList: Array.from(d.professors).join(', ')
    }));
  }, [projects]);

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-card border border-white/10 p-4 rounded-xl shadow-xl">
          <p className="font-bold text-white mb-2">{label}</p>
          <p className="text-sm text-gray-400 mb-1">
            <span className="font-bold text-neon-green">Quantidade:</span> {data.value}
          </p>
          <p className="text-sm text-gray-400">
            <span className="font-bold text-neon-purple">Professor(es):</span> {data.professorsList}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-card border border-white/10 p-4 rounded-xl shadow-xl">
          <p className="font-bold text-white mb-1">{data.name}</p>
          <p className="text-sm text-gray-400">
            <span className="font-bold" style={{ color: payload[0].fill }}>Quantidade:</span> {data.value}
          </p>
          <p className="text-xs text-gray-500 mt-2 italic">Clique para filtrar</p>
        </div>
      );
    }
    return null;
  };

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
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1 rounded flex items-center justify-center">
            <span className="text-[#005099] font-black text-2xl tracking-tighter leading-none">SENAI</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Project Hub Educacional <span className="text-neon-green">Senai - VR</span>
          </h1>
        </div>

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
          {(auth.currentUser?.email === 'mmvsilva@firjan.com.br' || auth.currentUser?.email === 'vasouza@firjan.com.br' || auth.currentUser?.email === 'marcio.s@docente.firjan.senai.br') && (
            <button 
              onClick={generateGlobalReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-bold"
            >
              <Download className="w-4 h-4 text-neon-green" />
              RELATÓRIO EXCEL
            </button>
          )}
          <button onClick={logout} className="p-2 hover:text-neon-purple transition-colors">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Create Project Section */}
        <section className="mb-16">
          <div className="bg-dark-card p-8 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 blur-[80px] -mr-32 -mt-32" />
            
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              Registro de <span className="text-neon-purple">Projetos</span>
            </h2>

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Nome do Projeto</label>
                  <input 
                    type="text" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ex: Sistema de Gestão Escolar"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Curso</label>
                  <input 
                    type="text" 
                    value={curso}
                    onChange={(e) => setCurso(e.target.value)}
                    placeholder="Ex: Desenvolvimento de Sistemas"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Turma</label>
                  <input 
                    type="text" 
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    placeholder="Ex: 2024.1-A"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Professor Responsável</label>
                  <input 
                    type="text" 
                    value={professorName}
                    onChange={(e) => setProfessorName(e.target.value)}
                    placeholder="Ex: Márcio Vinícius"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Início</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Término</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-neon-purple transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Criar Manual
                </button>

                <button 
                  type="button"
                  onClick={handleCreateWithIA}
                  disabled={loadingIA || !newProjectName.trim()}
                  className="neon-button flex items-center gap-2 px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingIA ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Gerar com IA
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Charts Section - Power BI Style */}
        {projects.length > 0 && (
          <section className="mb-12 bg-[#f4f6f8] p-6 rounded-3xl text-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-[#002050]">Análise de Projetos</h2>
              <div className="flex gap-4">
                <select className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005099]">
                  <option>Todos os Anos</option>
                  <option>2026</option>
                  <option>2025</option>
                </select>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-r from-[#002050] to-[#005099] p-6 rounded-2xl text-white shadow-lg flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <FolderKanban className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80 font-semibold uppercase tracking-wider">Total de Projetos</p>
                  <p className="text-3xl font-black">{projects.length}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#002050] to-[#005099] p-6 rounded-2xl text-white shadow-lg flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Sparkles className="w-8 h-8 text-[#00FF9D]" />
                </div>
                <div>
                  <p className="text-sm text-white/80 font-semibold uppercase tracking-wider">Aprovados (Prof)</p>
                  <p className="text-3xl font-black">{projects.filter(p => p.approvalProfessor).length}</p>
                  <p className="text-xs text-[#00FF9D] mt-1 font-bold">
                    {((projects.filter(p => p.approvalProfessor).length / projects.length) * 100).toFixed(1)}% do total
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#002050] to-[#005099] p-6 rounded-2xl text-white shadow-lg flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileText className="w-8 h-8 text-[#B026FF]" />
                </div>
                <div>
                  <p className="text-sm text-white/80 font-semibold uppercase tracking-wider">Aprovados (Bib)</p>
                  <p className="text-3xl font-black">{projects.filter(p => p.approvalBiblioteca).length}</p>
                  <p className="text-xs text-[#B026FF] mt-1 font-bold">
                    {((projects.filter(p => p.approvalBiblioteca).length / projects.length) * 100).toFixed(1)}% do total
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Bar Chart - Projetos por Mês */}
              <div className="bg-white p-6 rounded-2xl shadow-md lg:col-span-2">
                <h3 className="text-lg font-bold mb-4 text-[#002050]">Projetos Criados por Mês</h3>
                <div className="w-full" style={{ height: 250 }}>
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={
                      // Group projects by month
                      Object.values(projects.reduce((acc, p) => {
                        const date = p.createdAt ? new Date(p.createdAt) : new Date();
                        const month = date.toLocaleString('pt-BR', { month: 'short' });
                        if (!acc[month]) acc[month] = { name: month, value: 0 };
                        acc[month].value++;
                        return acc;
                      }, {} as Record<string, {name: string, value: number}>))
                    }>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f4f6f8'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="value" fill="#002050" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart - Status */}
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#002050]">Status de Aprovação</h3>
                <div className="relative w-full" style={{ height: 250 }}>
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Aprovados', value: projects.filter(p => p.approvalProfessor).length },
                          { name: 'Pendentes', value: projects.filter(p => !p.approvalProfessor).length }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#f59e0b" /> {/* Orange for Aprovados to match image style */}
                        <Cell fill="#002050" /> {/* Dark blue for Pendentes */}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-[#002050]">{projects.length}</span>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                    <span className="text-sm text-gray-600">Aprovados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#002050]"></div>
                    <span className="text-sm text-gray-600">Pendentes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Horizontal Bar Chart - Projetos por Curso */}
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#002050]">Projetos por Curso</h3>
                <div className="w-full" style={{ height: 250 }}>
                  <ResponsiveContainer width="99%" height="100%">
                    <BarChart data={projectsByCourse} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f4f6f8'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="value" fill="#002050" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table - Projetos por Turma */}
              <div className="bg-white p-6 rounded-2xl shadow-md overflow-hidden flex flex-col">
                <h3 className="text-lg font-bold mb-4 text-[#002050]">Detalhamento por Turma</h3>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="py-3 px-4 font-bold text-gray-600 text-sm">Turma</th>
                        <th className="py-3 px-4 font-bold text-gray-600 text-sm text-right">Total Projetos</th>
                        <th className="py-3 px-4 font-bold text-gray-600 text-sm text-right">Aprovados</th>
                        <th className="py-3 px-4 font-bold text-gray-600 text-sm text-right">Pendentes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(projects.reduce((acc, p) => {
                        if (!acc[p.turma]) acc[p.turma] = { turma: p.turma, total: 0, aprovados: 0, pendentes: 0 };
                        acc[p.turma].total++;
                        if (p.approvalProfessor) acc[p.turma].aprovados++;
                        else acc[p.turma].pendentes++;
                        return acc;
                      }, {} as Record<string, {turma: string, total: number, aprovados: number, pendentes: number}>)).map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-800">{row.turma}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.total}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.aprovados}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.pendentes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Projects List */}
        <section id="projects-list">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {viewAll ? 'Todos os Projetos' : 'Seus Projetos'}
                {statusFilter === 'approved' && <span className="ml-2 text-sm font-normal text-neon-green bg-neon-green/10 px-2 py-1 rounded-full">Filtrado: Aprovados</span>}
                {statusFilter === 'pending' && <span className="ml-2 text-sm font-normal text-neon-purple bg-neon-purple/10 px-2 py-1 rounded-full">Filtrado: Pendentes</span>}
              </h2>
              {isAdmin && (
                <button
                  onClick={() => setViewAll(!viewAll)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  {viewAll ? 'Ver Apenas Meus Projetos' : 'Ver Todos os Projetos'}
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-dark-card border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neon-green transition-all w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-dark-card p-6 rounded-2xl border border-white/5 hover:border-neon-purple/50 transition-all cursor-pointer relative"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-neon-purple/10 transition-colors overflow-hidden">
                      {project.professorPhoto ? (
                        <img src={project.professorPhoto} alt="Professor" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <FolderKanban className="w-6 h-6 text-gray-400 group-hover:text-neon-purple transition-colors" />
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-neon-purple transition-colors">{project.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6">
                    {project.description}
                  </p>

                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-600">
                    <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                    <div className="flex items-center gap-1 group-hover:text-neon-green transition-colors">
                      VER DETALHES <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-gray-500">Nenhum projeto encontrado. Crie um novo acima!</p>
              </div>
            )}
          </div>
        </section>
        {/* Footer */}
        <footer className="mt-20 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-600 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            By Márcio Vinícius
          </div>
          <div>© 2026 Project Hub Educacional - SENAI VR TODOS OS DIREITOS RESERVADOS</div>
        </footer>
      </main>
    </div>
  );
}
