import { useState, useEffect, useCallback } from 'react';
import {
  getRamos, getRamo, createRamo, updateRamo, deleteRamo,
  getUnits, createUnit, updateUnit, deleteUnit,
  addEvaluationModule, updateEvaluationModule, removeEvaluationModule,
  addEvalItem, updateEvalItem, removeEvalItem,
  addAttendanceSession, updateAttendanceSession, removeAttendanceSession,
} from '../services/ramosService.js';
import { moduleAverage, weightedFinalGrade, totalWeight } from '../lib/grades.js';

export function useRamos() {
  const [ramos, setRamos]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRamos(await getRamos());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add    = async (ramo)        => { await createRamo(ramo);        await reload(); };
  const update = async (id, changes) => { await updateRamo(id, changes); await reload(); };
  const remove = async (id)          => { await deleteRamo(id);          await reload(); };

  return { ramos, loading, error, reload, add, update, remove };
}

export function useRamo(id) {
  const [ramo, setRamo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setRamo(await getRamo(id));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  return { ramo, loading, error, reload };
}

export function useUnits(ramoId) {
  const [units, setUnits]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const reload = useCallback(async () => {
    if (!ramoId) return;
    setLoading(true);
    try {
      setUnits(await getUnits(ramoId));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ramoId]);

  useEffect(() => { reload(); }, [reload]);

  const add    = async (unit)        => { await createUnit(unit);              await reload(); };
  const update = async (id, changes) => { await updateUnit(id, ramoId, changes); await reload(); };
  const remove = async (id)          => { await deleteUnit(id, ramoId);         await reload(); };

  return { units, loading, error, reload, add, update, remove };
}

export function useEvaluations(ramoId) {
  const { ramo, loading, reload } = useRamo(ramoId);
  const modules = ramo?.evaluationModules ?? [];

  const addModule = async (mod) => {
    await addEvaluationModule(ramoId, mod);
    await reload();
  };
  const updateModule = async (moduleId, changes) => {
    await updateEvaluationModule(ramoId, moduleId, changes);
    await reload();
  };
  const removeModule = async (moduleId) => {
    await removeEvaluationModule(ramoId, moduleId);
    await reload();
  };
  const addItem = async (moduleId, item) => {
    await addEvalItem(ramoId, moduleId, item);
    await reload();
  };
  const updateItem = async (moduleId, itemId, changes) => {
    await updateEvalItem(ramoId, moduleId, itemId, changes);
    await reload();
  };
  const removeItem = async (moduleId, itemId) => {
    await removeEvalItem(ramoId, moduleId, itemId);
    await reload();
  };

  const finalGrade  = weightedFinalGrade(modules);
  const weightTotal = totalWeight(modules);

  return {
    modules, loading,
    addModule, updateModule, removeModule,
    addItem, updateItem, removeItem,
    finalGrade, weightTotal,
    moduleAverage,
  };
}

export function useAttendance(ramoId) {
  const { ramo, loading, reload } = useRamo(ramoId);
  const sessions = ramo?.attendanceSessions ?? [];

  const addSession = async (session) => {
    await addAttendanceSession(ramoId, session);
    await reload();
  };
  const updateSession = async (sessionId, changes) => {
    await updateAttendanceSession(ramoId, sessionId, changes);
    await reload();
  };
  const removeSession = async (sessionId) => {
    await removeAttendanceSession(ramoId, sessionId);
    await reload();
  };

  const total   = sessions.length;
  const present = sessions.filter(s => s.status === 'present').length;
  const absent  = sessions.filter(s => s.status === 'absent').length;
  const late    = sessions.filter(s => s.status === 'late').length;
  const pct     = total > 0 ? Math.round(((present + late) / total) * 100) : null;

  return {
    sessions, loading,
    addSession, updateSession, removeSession,
    stats: { total, present, absent, late, pct },
  };
}
