import { useState, useEffect, useCallback } from 'react';
import {
  getSchedule,
  updateScheduleEntry,
  deleteScheduleEntry,
} from '../services/scheduleService.js';

export function useSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setSchedule(await getSchedule());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const update = async (id, changes) => { await updateScheduleEntry(id, changes); await reload(); };
  const remove = async (id)          => { await deleteScheduleEntry(id);           await reload(); };

  return { schedule, loading, error, reload, update, remove };
}
