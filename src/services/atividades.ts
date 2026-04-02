import { supabase, auth } from './supabase';

export const createTask = async (projectId: string, title: string) => {
  try {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    const { data, error } = await supabase.from('tasks').insert([{
      projectId,
      title,
      completed: false,
      status: 'todo',
      userId: auth.currentUser.id,
      createdAt: new Date().toISOString(),
    }]).select();
    if (error) throw error;
    return data[0].id;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  try {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
    if (error) throw error;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

export const getTasks = (projectId: string, callback: (tasks: any[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').eq('projectId', projectId);
    if (!error && data) {
      callback(data);
    }
  };

  fetchTasks();

  const subscription = supabase
    .channel(`tasks_changes_${projectId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `projectId=eq.${projectId}` }, () => {
      fetchTasks();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const toggleTask = async (taskId: string, completed: boolean) => {
  try {
    const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', taskId);
    if (error) throw error;
  } catch (error) {
    console.error("Error toggling task:", error);
    throw error;
  }
};

export const updateTaskTitle = async (taskId: string, title: string) => {
  try {
    const { error } = await supabase.from('tasks').update({ title }).eq('id', taskId);
    if (error) throw error;
  } catch (error) {
    console.error("Error updating task title:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};
