/* Tugas, catatan, dan modal dasar (kode awal TeacherFlow). */
        /* ================= STATE MANAGEMENT ================= */
        let state = {
            agendas: [],
            tasks: [],
            notes: []
        };

        

        /* ================= INITIALIZATION ================= */
        



        function getTodayAtHour(hour) {
            const n = new Date(); n.setHours(hour, 0, 0, 0);
            return dstr(n) + 'T' + p2(n.getHours()) + ':00';
        }

        /* ================= LIVE CLOCK & DATE ================= */




        /* ================= FOCUS CARD & COUNTDOWN LOGIC ================= */
        let currentFocusAgenda = null;



        /* ================= RENDER TIMELINE HARIAN ================= */





        function editAgenda(id) {
            openAgendaModal(id);
        }

        /* ================= RENDER TUGAS & DEADLINE ================= */
        function renderTasks() {
            if (typeof renderHomeTasks === 'function') renderHomeTasks();
            const container = document.getElementById('tasks-list');
            const prioFilter = document.getElementById('task-filter-priority').value;
            const statusFilter = document.getElementById('task-filter-status').value;
            container.innerHTML = '';

            let filteredTasks = state.tasks.filter(t => {
                const matchPrio = prioFilter === 'ALL' || t.priority === prioFilter;
                const matchStatus = statusFilter === 'ALL' || 
                    (statusFilter === 'PENDING' && !t.completed) || 
                    (statusFilter === 'COMPLETED' && t.completed);
                return matchPrio && matchStatus;
            });

            // Update Badge Count
            const pendingCount = state.tasks.filter(t => !t.completed).length;
            document.getElementById('task-badge-count').innerText = pendingCount;

            if (filteredTasks.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel p-8 text-center rounded-2xl text-slate-400">
                        <i class="fa-solid fa-clipboard-check text-3xl mb-2 text-slate-500"></i>
                        <p class="text-sm font-medium">Tidak ada daftar tugas atau deadline saat ini.</p>
                    </div>
                `;
                return;
            }

            filteredTasks.forEach(task => {
                let prioBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                if (task.priority === 'Sedang') prioBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                if (task.priority === 'Rendah') prioBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

                // Format Deadline String
                const dDate = new Date(task.deadline);
                const dFormatted = isNaN(dDate.getTime()) ? task.deadline : `${tfDMY(dDate)} - ${String(dDate.getHours()).padStart(2,'0')}:${String(dDate.getMinutes()).padStart(2,'0')}`;

                const card = document.createElement('div');
                card.className = `tf-task glass-panel p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    task.completed ? 'opacity-50 line-through border-slate-800' : 'border-white/10 hover:border-slate-600'
                }`;

                card.innerHTML = `
                    <div class="flex items-start gap-3.5 w-full sm:w-auto">
                        <button onclick="toggleTaskComplete('${task.id}')" class="mt-1 text-lg text-slate-500 hover:text-emerald-400 transition-all">
                            <i class="${task.completed ? 'fa-solid fa-square-check text-emerald-400' : 'fa-regular fa-square'}"></i>
                        </button>
                        <div class="space-y-1 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${prioBadge}">
                                    Prioritas ${task.priority}
                                </span>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                    ${esc(task.category || 'Administrasi')}
                                </span>
                                <span class="text-xs text-rose-400 font-mono font-medium">
                                    <i class="fa-regular fa-clock"></i> Batas: ${dFormatted}
                                </span>
                            </div>
                            <h4 class="text-base font-bold text-slate-100 ${task.completed ? 'line-through' : ''}">${esc(task.title)}</h4>
                            ${task.desc ? `<p class="text-xs text-slate-300 ${task.completed ? 'line-through' : ''}">${esc(task.desc)}</p>` : ''}
                        </div>
                    </div>

                    <div class="flex items-center gap-2 self-end sm:self-center">
                        <button onclick="editTask('${task.id}')" class="p-2 text-xs rounded-lg glass-card text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-all">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="deleteTask('${task.id}')" class="p-2 text-xs rounded-lg glass-card text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function toggleTaskComplete(id) {
            const index = state.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                state.tasks[index].completed = !state.tasks[index].completed;
                saveStateToStorage();
                renderTasks();
                triggerVibration(50);
            }
        }

        function deleteTask(id) {
            const idx = state.tasks.findIndex(t => t.id === id); if (idx < 0) return;
            const it = state.tasks[idx];
            state.tasks.splice(idx, 1); saveStateToStorage(); renderTasks(); updateStats();
            showToast('Tugas dihapus.', 'info', 7000, {label: 'Batalkan', fn: () => {
                state.tasks.splice(Math.min(idx, state.tasks.length), 0, it); saveStateToStorage(); renderTasks(); updateStats(); showToast('Tugas dikembalikan.', 'success');
            }});
        }


        function openTaskModal(editId = null) {
            const modal = document.getElementById('modal-task');
            const form = document.getElementById('form-task');
            form.reset();
            document.getElementById('task-id').value = '';

            // Default deadline set to today at 17:00
            document.getElementById('task-deadline').value = getTodayAtHour(17);

            if (editId) {
                const item = state.tasks.find(t => t.id === editId);
                if (item) {
                    document.getElementById('task-id').value = item.id;
                    document.getElementById('task-title').value = item.title;
                    document.getElementById('task-priority').value = item.priority;
                    document.getElementById('task-category').value = item.category || 'Administrasi';
                    document.getElementById('task-deadline').value = item.deadline;
                    document.getElementById('task-desc').value = item.desc || '';
                    document.getElementById('modal-task-title-text').innerHTML = `<i class="fa-solid fa-pen-to-square text-blue-400"></i> Edit Tugas & Deadline`;
                }
            } else {
                document.getElementById('modal-task-title-text').innerHTML = `<i class="fa-solid fa-tasks text-blue-400"></i> Tambah Tugas & Deadline`;
            }
            modal.classList.remove('hidden');
        }

        function saveTask(e) {
            e.preventDefault();
            const id = document.getElementById('task-id').value;
            const title = document.getElementById('task-title').value;
            const priority = document.getElementById('task-priority').value;
            const category = document.getElementById('task-category').value;
            const deadline = document.getElementById('task-deadline').value;
            const desc = document.getElementById('task-desc').value;

            if (id) {
                const idx = state.tasks.findIndex(t => t.id === id);
                if (idx !== -1) {
                    state.tasks[idx] = { ...state.tasks[idx], title, priority, category, deadline, desc };
                }
            } else {
                const newTask = {
                    id: Date.now().toString(),
                    title, priority, category, deadline, desc, completed: false
                };
                state.tasks.push(newTask);
            }

            saveStateToStorage();
            renderTasks();
            closeModal('modal-task');
            showToast("Tugas berhasil disimpan!", "success");
        }

        function editTask(id) {
            openTaskModal(id);
        }

        /* ================= RENDER CATATAN CEPAT (QUICK NOTES) ================= */
        function renderNotes() {
            const container = document.getElementById('notes-grid');
            const searchQuery = document.getElementById('note-search').value.toLowerCase();
            const scope = (document.getElementById('note-scope') || {}).value || 'ALL';
            const tagFilter = document.getElementById('note-filter-tag').value;
            container.innerHTML = '';

            let filteredNotes = state.notes.filter(n => {
                const matchTag = tagFilter === 'ALL' || n.tag === tagFilter;
                const matchSearch = n.title.toLowerCase().includes(searchQuery) || n.content.toLowerCase().includes(searchQuery);
                const matchDay = scope !== 'day' || noteDs(n) === calSel;
                return matchTag && matchSearch && matchDay;
            });

            // Sort pinned first
            filteredNotes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

            const nb = document.getElementById('note-badge-count'); if (nb) nb.innerText = state.notes.length;

            if (filteredNotes.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full glass-panel p-8 text-center rounded-2xl text-slate-400">
                        <i class="fa-solid fa-note-sticky text-3xl mb-2 text-slate-500"></i>
                        <p class="text-sm font-medium">${scope === 'day' ? 'Belum ada catatan pada tanggal ini.' : 'Belum ada catatan atau observasi tersimpan.'}</p>
                    </div>
                `;
                return;
            }

            filteredNotes.forEach(note => {
                const card = document.createElement('div');
                card.className = `glass-panel p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative ${
                    note.pinned ? 'border-purple-500/40 bg-purple-950/20' : 'border-white/10 hover:border-slate-600'
                }`;

                card.innerHTML = `
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                ${esc(note.tag)}
                            </span>
                            <button onclick="togglePinNote('${note.id}')" class="text-xs ${note.pinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}">
                                <i class="fa-solid fa-thumbtack"></i>
                            </button>
                        </div>
                        <h4 class="text-base font-bold text-slate-100">${esc(note.title)}</h4>
                        <p class="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">${esc(note.content)}</p>
                    </div>

                    <div class="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span><i class="fa-regular fa-clock"></i> ${note.date || 'Hari ini'}</span>
                        <div class="flex items-center gap-1">
                            <button onclick="copyNoteById('${note.id}')" class="p-1.5 hover:text-slate-100 rounded bg-slate-800" title="Salin Catatan">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button onclick="editNote('${note.id}')" class="p-1.5 hover:text-slate-100 rounded bg-slate-800" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteNote('${note.id}')" class="p-1.5 text-rose-400 hover:text-rose-300 rounded bg-slate-800" title="Hapus">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function copyNoteById(id){const n=state.notes.find(x=>x.id===id);if(n)tfCopy(n.title+'\n'+n.content,'Catatan disalin ke clipboard.')}
        function togglePinNote(id) {
            const index = state.notes.findIndex(n => n.id === id);
            if (index !== -1) {
                state.notes[index].pinned = !state.notes[index].pinned;
                saveStateToStorage();
                renderNotes();
            }
        }

        function deleteNote(id) {
            const idx = state.notes.findIndex(n => n.id === id); if (idx < 0) return;
            const it = state.notes[idx];
            state.notes.splice(idx, 1); saveStateToStorage(); renderNotes(); updateStats();
            showToast('Catatan dihapus.', 'info', 7000, {label: 'Batalkan', fn: () => {
                state.notes.splice(Math.min(idx, state.notes.length), 0, it); saveStateToStorage(); renderNotes(); updateStats(); showToast('Catatan dikembalikan.', 'success');
            }});
        }


        function openNoteModal(editId = null) {
            const modal = document.getElementById('modal-note');
            const form = document.getElementById('form-note');
            form.reset();
            document.getElementById('note-id').value = '';

            if (editId) {
                const item = state.notes.find(n => n.id === editId);
                if (item) {
                    document.getElementById('note-id').value = item.id;
                    document.getElementById('note-title').value = item.title;
                    document.getElementById('note-tag').value = item.tag;
                    document.getElementById('note-content').value = item.content;
                    document.getElementById('note-pinned').checked = item.pinned;
                    document.getElementById('modal-note-title-text').innerHTML = `<i class="fa-solid fa-pen-to-square text-purple-400"></i> Edit Catatan`;
                }
            } else {
                document.getElementById('modal-note-title-text').innerHTML = `<i class="fa-solid fa-note-sticky text-purple-400"></i> Catatan &middot; ${esc(calLabel(calSel))}`;
            }
            modal.classList.remove('hidden');
        }

        function saveNote(e) {
            e.preventDefault();
            const id = document.getElementById('note-id').value;
            const title = document.getElementById('note-title').value;
            const tag = document.getElementById('note-tag').value;
            const content = document.getElementById('note-content').value;
            const pinned = document.getElementById('note-pinned').checked;
            const date = tfDMY(calDate(calSel));

            if (id) {
                const idx = state.notes.findIndex(n => n.id === id);
                if (idx !== -1) {
                    state.notes[idx] = { ...state.notes[idx], title, tag, content, pinned };
                }
            } else {
                const newNote = {
                    id: Date.now().toString(),
                    title, tag, content, pinned, date, ds: calSel
                };
                state.notes.push(newNote);
            }

            saveStateToStorage();
            renderNotes();
            closeModal('modal-note');
            showToast(id ? "Catatan tersimpan!" : "Catatan tersimpan pada tanggal " + date + ".", "success");
            renderCalendar(); renderNotes();
        }

        function editNote(id) {
            openNoteModal(id);
        }





        /* ================= TAB SWITCHING ================= */

        /* ================= HELPER UTILITIES & ALERTS ================= */
        function closeModal(id) {
            document.getElementById(id).classList.add('hidden');
        }

        // Web Audio API Beep Generator
        function triggerAudioBeep(freq = 587.33) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } catch (e) {
                // Ignore audio restriction blocks
            }
        }

        // Vibration API
        function triggerVibration(pattern = 50) {
            if ("vibrate" in navigator) {
                navigator.vibrate(pattern);
            }
        }

        // Custom Toast Notification System
    
