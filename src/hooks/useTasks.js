import { useState, useEffect, useCallback } from 'react';
import {
  getTasks, getTasksByMonth, getUpcomingTasks,
  createTask, updateTask, toggleTask, deleteTask,
} from '../services/tasksService.js';

export function useTasks() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await getTasks());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add    = async (task)        => { const created = await createTask(task); await reload(); return created; };
  const update = async (id, changes) => { await updateTask(id, changes); await reload(); };
  const toggle = async (id)          => { await toggleTask(id);          await reload(); };
  const remove = async (id)          => { await deleteTask(id);          await reload(); };

  return { tasks, loading, error, reload, add, update, toggle, remove };
}

export function useUpcomingTasks(days = 14) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try   { setTasks(await getUpcomingTasks(days)); }
    catch { setTasks([]); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { reload(); }, [reload]);

  const toggle = async (id)          => { await toggleTask(id);          await reload(); };
  const update = async (id, changes) => { await updateTask(id, changes); await reload(); };
  const remove = async (id)          => { await deleteTask(id);          await reload(); };

  return { tasks, loading, reload, toggle, update, remove };
}

export function useTasksByMonth(year, month) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try   { setTasks(await getTasksByMonth(year, month)); }
    catch { setTasks([]); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { reload(); }, [reload]);

  const add    = async (task)        => { const created = await createTask(task); await reload(); return created; };
  const update = async (id, changes) => { await updateTask(id, changes); await reload(); };
  const toggle = async (id)          => { await toggleTask(id);          await reload(); };
  const remove = async (id)          => { await deleteTask(id);          await reload(); };

  return { tasks, loading, reload, add, update, toggle, remove };
}
