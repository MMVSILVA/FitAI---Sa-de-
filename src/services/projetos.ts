import { supabase, auth } from './supabase';

export const createProject = async (name: string, description: string, turma: string, curso: string, startDate: string, endDate: string, professorPhoto: string = '', professorName: string = '') => {
  try {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    const { data, error } = await supabase.from('projects').insert([{
      name,
      description,
      turma,
      curso,
      startDate,
      endDate,
      professorPhoto,
      professorName,
      userId: auth.currentUser.id,
      createdAt: new Date().toISOString(),
      status: 'active',
      approvalProfessor: false,
      approvalBiblioteca: false,
      relatorio: '',
      banner: '',
      prototipo: '',
      pitch: ''
    }]).select();
    if (error) throw error;
    return data[0].id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProject = async (projectId: string, data: any) => {
  try {
    const { error } = await supabase.from('projects').update(data).eq('id', projectId);
    if (error) throw error;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const getAllProjects = async () => {
  try {
    const { data, error } = await supabase.from('projects').select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting all projects:", error);
    throw error;
  }
};

export const getProjects = (callback: (projects: any[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const adminEmails = ['mmvsilva@firjan.com.br', 'vasouza@firjan.com.br', 'marcio.s@docente.firjan.senai.br', 'marcio.v.silva@docente.firjan.senai.br'];
  const isAdmin = auth.currentUser.email && adminEmails.includes(auth.currentUser.email);
  
  const fetchProjects = async () => {
    let query = supabase.from('projects').select('*');
    if (!isAdmin) {
      query = query.eq('userId', auth.currentUser!.id);
    }
    const { data, error } = await query;
    if (!error && data) {
      callback(data);
    }
  };

  fetchProjects();

  const subscription = supabase
    .channel('projects_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
      fetchProjects();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const deleteProject = async (projectId: string) => {
  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};
