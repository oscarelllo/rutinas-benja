/* =========================================================
   Manejo de localStorage: datos de rutinas + progreso diario
   ========================================================= */

const STORAGE_KEYS = {
  DATA: 'rutinasCAA_data_v1',
  PROGRESS: 'rutinasCAA_progress_v1',
};

function deepClone(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

const Storage = {
  /* ---------- Datos de rutinas (definición, personalización) ---------- */
  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DATA);
      if (!raw) {
        const initial = deepClone(DEFAULT_DATA);
        this.saveData(initial);
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.routines || !Array.isArray(parsed.routines)) {
        throw new Error('Formato inválido');
      }
      if (typeof parsed.soundEnabled !== 'boolean') parsed.soundEnabled = true;
      return parsed;
    } catch (e) {
      console.warn('No se pudo leer los datos guardados, se usan valores por defecto.', e);
      const initial = deepClone(DEFAULT_DATA);
      this.saveData(initial);
      return initial;
    }
  },

  saveData(data) {
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
  },

  /* ---------- Progreso diario (tareas completadas) ----------
     Se guarda por fecha (YYYY-MM-DD). Si cambia el día, la
     rutina vuelve a empezar sola (comportamiento esperado
     para un tablero de rutinas diarias). */
  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const parsed = raw ? JSON.parse(raw) : { date: this.todayKey(), routines: {} };
      if (parsed.date !== this.todayKey()) {
        return { date: this.todayKey(), routines: {} };
      }
      return parsed;
    } catch (e) {
      return { date: this.todayKey(), routines: {} };
    }
  },

  saveProgress(progress) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  },

  getCompletedTasks(routineId) {
    const progress = this.loadProgress();
    return progress.routines[routineId] || [];
  },

  setCompletedTasks(routineId, taskIds) {
    const progress = this.loadProgress();
    progress.routines[routineId] = taskIds;
    this.saveProgress(progress);
  },

  resetRoutineProgress(routineId) {
    this.setCompletedTasks(routineId, []);
  },
};
