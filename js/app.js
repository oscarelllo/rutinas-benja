/* =========================================================
   Lógica principal de la app: navegación entre pantallas,
   render de tarjetas, interacción de tareas y modo configuración
   ========================================================= */

(() => {
  'use strict';

  let appData = Storage.loadData();
  let currentRoutineId = null;   // rutina activa en el tablero
  let editingRoutineId = null;   // rutina que se está editando en modo padre
  let emojiPickerTarget = null;  // callback del selector de emoji

  /* ---------------- Referencias DOM ---------------- */
  const screenHome = document.getElementById('screen-home');
  const screenBoard = document.getElementById('screen-board');
  const screenSettings = document.getElementById('screen-settings');

  const routineCardsEl = document.getElementById('routine-cards');
  const boardTitleEl = document.getElementById('board-title');
  const taskGridEl = document.getElementById('task-grid');

  const btnSettings = document.getElementById('btn-settings');
  const btnBackHome = document.getElementById('btn-back-home');
  const btnResetRoutine = document.getElementById('btn-reset-routine');
  const btnCloseSettings = document.getElementById('btn-close-settings');

  const settingsRoutineList = document.getElementById('settings-routine-list');
  const settingsRoutineEdit = document.getElementById('settings-routine-edit');
  const routineManageList = document.getElementById('routine-manage-list');
  const taskManageList = document.getElementById('task-manage-list');
  const btnAddRoutine = document.getElementById('btn-add-routine');
  const btnAddTask = document.getElementById('btn-add-task');
  const btnBackToRoutines = document.getElementById('btn-back-to-routines');
  const btnSaveRoutine = document.getElementById('btn-save-routine');
  const btnDeleteRoutine = document.getElementById('btn-delete-routine');
  const inputRoutineName = document.getElementById('input-routine-name');
  const inputRoutineIcon = document.getElementById('input-routine-icon');
  const chkSound = document.getElementById('chk-sound');
  const emojiPickerEl = document.getElementById('emoji-picker');
  const btnRoutinePhoto = document.getElementById('btn-routine-photo');
  const btnRoutineRemovePhoto = document.getElementById('btn-routine-remove-photo');
  const routinePhotoPreview = document.getElementById('routine-photo-preview');
  const routinePhotoPreviewImg = document.getElementById('routine-photo-preview-img');

  /* ---------------- Fotos reales (cámara / galería) ---------------- */
  let hiddenPhotoInput = null;
  let photoInputCallback = null;

  function getPhotoInput() {
    if (hiddenPhotoInput) return hiddenPhotoInput;
    hiddenPhotoInput = document.createElement('input');
    hiddenPhotoInput.type = 'file';
    hiddenPhotoInput.accept = 'image/*';
    hiddenPhotoInput.capture = 'environment';
    hiddenPhotoInput.style.display = 'none';
    document.body.appendChild(hiddenPhotoInput);
    hiddenPhotoInput.addEventListener('change', async () => {
      const file = hiddenPhotoInput.files && hiddenPhotoInput.files[0];
      hiddenPhotoInput.value = '';
      if (!file || !photoInputCallback) return;
      try {
        const dataUrl = await compressImageFile(file, 480, 0.75);
        photoInputCallback(dataUrl);
      } catch (e) {
        console.warn('No se pudo procesar la foto.', e);
        window.alert('No se pudo cargar esa foto. Probá con otra imagen.');
      }
    });
    return hiddenPhotoInput;
  }

  function pickPhoto(onSelected) {
    photoInputCallback = onSelected;
    getPhotoInput().click();
  }

  function compressImageFile(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Imagen inválida'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round(height * (maxDim / width));
              width = maxDim;
            } else {
              width = Math.round(width * (maxDim / height));
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* Genera el marcado del ícono de una tarjeta: foto real si existe, si no el emoji */
  function visualMarkup(entity, cssClass) {
    if (entity.photo) {
      return `<img class="${cssClass} photo-visual" src="${entity.photo}" alt="">`;
    }
    return `<span class="${cssClass}" aria-hidden="true">${entity.icon || '⭐'}</span>`;
  }

  /* ---------------- Navegación entre pantallas ---------------- */
  function showScreen(name) {
    screenHome.classList.toggle('hidden', name !== 'home');
    screenBoard.classList.toggle('hidden', name !== 'board');
    screenSettings.classList.toggle('hidden', name !== 'settings');
  }

  /* ---------------- PANTALLA HOME ---------------- */
  function renderHome() {
    routineCardsEl.innerHTML = '';
    appData.routines.forEach((routine, idx) => {
      const completed = Storage.getCompletedTasks(routine.id);
      const total = routine.tasks.length;
      const done = routine.tasks.filter(t => completed.includes(t.id)).length;

      const card = document.createElement('button');
      card.className = `routine-card color-${idx % COLOR_CLASS_COUNT}`;
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        ${visualMarkup(routine, 'routine-icon')}
        <span class="routine-name">${escapeHtml(routine.name)}</span>
        <span class="routine-progress">${total ? `${done} / ${total} completadas` : 'Sin tareas'}</span>
      `;
      card.addEventListener('click', () => openRoutine(routine.id));
      routineCardsEl.appendChild(card);
    });
  }

  function openRoutine(routineId) {
    currentRoutineId = routineId;
    renderBoard();
    showScreen('board');
  }

  /* ---------------- TABLERO DE RUTINA ---------------- */
  function getCurrentRoutine() {
    return appData.routines.find(r => r.id === currentRoutineId);
  }

  function renderBoard() {
    const routine = getCurrentRoutine();
    if (!routine) { showScreen('home'); return; }

    boardTitleEl.textContent = `${routine.icon} ${routine.name}`;
    const completed = Storage.getCompletedTasks(routine.id);

    taskGridEl.innerHTML = '';
    routine.tasks.forEach(task => {
      const isDone = completed.includes(task.id);
      const card = document.createElement('button');
      card.className = 'task-card' + (isDone ? ' done' : '');
      card.setAttribute('role', 'listitem');
      card.dataset.taskId = task.id;
      card.innerHTML = `
        <span class="task-check" aria-hidden="true">✅</span>
        ${visualMarkup(task, 'task-icon')}
        <span class="task-name">${escapeHtml(task.text)}</span>
      `;
      card.addEventListener('click', () => toggleTask(routine.id, task.id, card));
      taskGridEl.appendChild(card);
    });
  }

  function toggleTask(routineId, taskId, cardEl) {
    let completed = Storage.getCompletedTasks(routineId);
    const wasDone = completed.includes(taskId);

    cardEl.classList.add('flipping');
    setTimeout(() => cardEl.classList.remove('flipping'), 500);

    if (wasDone) {
      completed = completed.filter(id => id !== taskId);
      cardEl.classList.remove('done');
    } else {
      completed = [...completed, taskId];
      cardEl.classList.add('done');
      Celebration.playTapSound && appData.soundEnabled && Celebration.playTapSound();
    }
    Storage.setCompletedTasks(routineId, completed);

    const routine = appData.routines.find(r => r.id === routineId);
    if (!wasDone && routine.tasks.length > 0 && completed.length === routine.tasks.length) {
      setTimeout(() => Celebration.show(appData.soundEnabled), 300);
    }
  }

  function resetCurrentRoutine() {
    if (!currentRoutineId) return;
    Storage.resetRoutineProgress(currentRoutineId);
    renderBoard();
  }

  /* ---------------- MODO CONFIGURACIÓN: acceso protegido ---------------- */
  let holdTimer = null;
  btnSettings.addEventListener('pointerdown', () => {
    btnSettings.style.transition = 'none';
    holdTimer = setTimeout(() => {
      enterSettings();
    }, 900);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt => {
    btnSettings.addEventListener(evt, () => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    });
  });
  // Fallback simple para navegadores sin pointer events / accesibilidad con teclado
  btnSettings.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') enterSettings();
  });

  function enterSettings() {
    chkSound.checked = appData.soundEnabled !== false;
    renderRoutineManageList();
    showEditPanel(false);
    showScreen('settings');
  }

  /* ---------------- MODO CONFIGURACIÓN: lista de rutinas ---------------- */
  function renderRoutineManageList() {
    routineManageList.innerHTML = '';
    appData.routines.forEach(routine => {
      const item = document.createElement('div');
      item.className = 'manage-item';
      item.innerHTML = `
        ${visualMarkup(routine, 'manage-emoji')}
        <span class="manage-label">${escapeHtml(routine.name)}</span>
        <span class="manage-sub">${routine.tasks.length} tareas</span>
        <button class="icon-btn" aria-label="Editar rutina">✏️</button>
      `;
      item.querySelector('button').addEventListener('click', () => openRoutineEditor(routine.id));
      routineManageList.appendChild(item);
    });
  }

  btnAddRoutine.addEventListener('click', () => {
    const newRoutine = {
      id: 'r-' + Date.now(),
      name: 'Nueva rutina',
      icon: '⭐',
      tasks: [],
    };
    appData.routines.push(newRoutine);
    Storage.saveData(appData);
    openRoutineEditor(newRoutine.id);
  });

  chkSound.addEventListener('change', () => {
    appData.soundEnabled = chkSound.checked;
    Storage.saveData(appData);
  });

  /* ---------------- MODO CONFIGURACIÓN: editor de rutina ---------------- */
  function showEditPanel(show) {
    settingsRoutineList.classList.toggle('hidden', show);
    settingsRoutineEdit.classList.toggle('hidden', !show);
  }

  function openRoutineEditor(routineId) {
    editingRoutineId = routineId;
    const routine = appData.routines.find(r => r.id === routineId);
    inputRoutineName.value = routine.name;
    inputRoutineIcon.value = routine.icon;
    refreshRoutinePhotoPreview();
    renderTaskManageList();
    showEditPanel(true);
  }

  btnBackToRoutines.addEventListener('click', () => {
    renderRoutineManageList();
    showEditPanel(false);
  });

  inputRoutineIcon.addEventListener('click', () => {
    openEmojiPicker((emoji) => { inputRoutineIcon.value = emoji; });
  });

  function getEditingRoutine() {
    return appData.routines.find(r => r.id === editingRoutineId);
  }

  function refreshRoutinePhotoPreview() {
    const routine = getEditingRoutine();
    if (routine && routine.photo) {
      routinePhotoPreviewImg.src = routine.photo;
      routinePhotoPreview.classList.remove('hidden');
      btnRoutineRemovePhoto.classList.remove('hidden');
    } else {
      routinePhotoPreview.classList.add('hidden');
      btnRoutineRemovePhoto.classList.add('hidden');
    }
  }

  btnRoutinePhoto.addEventListener('click', () => {
    pickPhoto((dataUrl) => {
      const routine = getEditingRoutine();
      routine.photo = dataUrl;
      Storage.saveData(appData);
      refreshRoutinePhotoPreview();
    });
  });

  btnRoutineRemovePhoto.addEventListener('click', () => {
    const routine = getEditingRoutine();
    delete routine.photo;
    Storage.saveData(appData);
    refreshRoutinePhotoPreview();
  });

  function renderTaskManageList() {
    const routine = getEditingRoutine();
    taskManageList.innerHTML = '';
    routine.tasks.forEach((task, idx) => {
      const item = document.createElement('div');
      item.className = 'manage-item task-manage-item';
      item.innerHTML = `
        <div class="manage-item-top">
          <button class="thumb-btn" data-action="emoji" aria-label="Elegir emoji">
            ${visualMarkup(task, 'thumb-visual')}
          </button>
          <input type="text" class="text-input manage-task-input" value="${escapeAttr(task.text)}">
        </div>
        <div class="manage-item-toolbar">
          <button class="icon-btn small" data-action="photo" aria-label="Usar foto">📷</button>
          <button class="icon-btn small danger${task.photo ? '' : ' hidden'}" data-action="remove-photo" aria-label="Quitar foto">✕ foto</button>
          <span class="toolbar-spacer"></span>
          <button class="icon-btn small" data-action="up" aria-label="Subir" ${idx === 0 ? 'disabled style="opacity:.3"' : ''}>⬆️</button>
          <button class="icon-btn small" data-action="down" aria-label="Bajar" ${idx === routine.tasks.length - 1 ? 'disabled style="opacity:.3"' : ''}>⬇️</button>
          <button class="icon-btn small danger" data-action="delete" aria-label="Eliminar tarea">🗑️</button>
        </div>
      `;

      const textInput = item.querySelector('.manage-task-input');
      textInput.addEventListener('input', () => { task.text = textInput.value; });
      textInput.addEventListener('blur', () => { Storage.saveData(appData); });

      item.querySelector('[data-action="emoji"]').addEventListener('click', () => {
        openEmojiPicker((emoji) => {
          task.icon = emoji;
          Storage.saveData(appData);
          renderTaskManageList();
        });
      });
      item.querySelector('[data-action="photo"]').addEventListener('click', () => {
        pickPhoto((dataUrl) => {
          task.photo = dataUrl;
          Storage.saveData(appData);
          renderTaskManageList();
        });
      });
      item.querySelector('[data-action="remove-photo"]').addEventListener('click', () => {
        delete task.photo;
        Storage.saveData(appData);
        renderTaskManageList();
      });
      item.querySelector('[data-action="up"]').addEventListener('click', () => {
        if (idx === 0) return;
        [routine.tasks[idx - 1], routine.tasks[idx]] = [routine.tasks[idx], routine.tasks[idx - 1]];
        Storage.saveData(appData);
        renderTaskManageList();
      });
      item.querySelector('[data-action="down"]').addEventListener('click', () => {
        if (idx === routine.tasks.length - 1) return;
        [routine.tasks[idx + 1], routine.tasks[idx]] = [routine.tasks[idx], routine.tasks[idx + 1]];
        Storage.saveData(appData);
        renderTaskManageList();
      });
      item.querySelector('[data-action="delete"]').addEventListener('click', () => {
        routine.tasks.splice(idx, 1);
        Storage.saveData(appData);
        renderTaskManageList();
      });

      taskManageList.appendChild(item);
    });
  }

  btnAddTask.addEventListener('click', () => {
    const routine = getEditingRoutine();
    routine.tasks.push({ id: 't-' + Date.now(), text: 'Nueva tarea', icon: '⭐' });
    Storage.saveData(appData);
    renderTaskManageList();
  });

  btnSaveRoutine.addEventListener('click', () => {
    const routine = getEditingRoutine();
    routine.name = inputRoutineName.value.trim() || 'Rutina';
    routine.icon = inputRoutineIcon.value.trim() || '⭐';
    Storage.saveData(appData);
    renderRoutineManageList();
    showEditPanel(false);
  });

  btnDeleteRoutine.addEventListener('click', () => {
    const routine = getEditingRoutine();
    const ok = window.confirm(`¿Eliminar la rutina "${routine.name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    appData.routines = appData.routines.filter(r => r.id !== editingRoutineId);
    Storage.saveData(appData);
    renderRoutineManageList();
    showEditPanel(false);
  });

  btnCloseSettings.addEventListener('click', () => {
    renderHome();
    showScreen('home');
  });

  /* ---------------- Selector rápido de emoji ---------------- */
  function openEmojiPicker(onSelect) {
    emojiPickerTarget = onSelect;
    emojiPickerEl.innerHTML = '';
    EMOJI_CHOICES.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        if (emojiPickerTarget) emojiPickerTarget(emoji);
        closeEmojiPicker();
      });
      emojiPickerEl.appendChild(btn);
    });
    emojiPickerEl.classList.remove('hidden');
  }
  function closeEmojiPicker() {
    emojiPickerEl.classList.add('hidden');
    emojiPickerTarget = null;
  }
  document.addEventListener('click', (e) => {
    if (!emojiPickerEl.classList.contains('hidden') &&
        !emojiPickerEl.contains(e.target) &&
        e.target.id !== 'input-routine-icon' &&
        !e.target.closest('[data-action="emoji"]')) {
      closeEmojiPicker();
    }
  });

  /* ---------------- Navegación general ---------------- */
  btnBackHome.addEventListener('click', () => {
    currentRoutineId = null;
    renderHome();
    showScreen('home');
  });
  btnResetRoutine.addEventListener('click', () => {
    const ok = window.confirm('¿Reiniciar esta rutina? Se desmarcarán todas las tareas.');
    if (ok) resetCurrentRoutine();
  });

  /* ---------------- Utilidades ---------------- */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  /* ---------------- Registro del Service Worker ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('No se pudo registrar el Service Worker:', err);
      });
    });
  }

  /* ---------------- Arranque ---------------- */
  renderHome();
  showScreen('home');
})();
