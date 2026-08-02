/* ============================================================
   TASKLUNE — Dashboard Application JavaScript
   Single-page hash-router inside dashboard.html
   Depends on: auth-state.js, app-store.js
   ============================================================ */

(function () {
  'use strict';

  /* ── Theme init ── */
  if (typeof FlowsyncTheme !== 'undefined') {
    FlowsyncTheme.init();
    const topbarThemeToggle = document.getElementById('topbarThemeToggle');
    if (topbarThemeToggle) FlowsyncTheme.injectToggle(topbarThemeToggle);
  }

  /* ── Auth guard ── */
  if (!FlowsyncAuth.isSignedIn()) {
    window.location.replace('signin.html');
    return;
  }

  const user = FlowsyncAuth.getUser();

  /* ══════════════════════════════════════════
     UTILITIES
  ══════════════════════════════════════════ */
  function el(id) { return document.getElementById(id); }

  function toast(msg, type = 'success') {
    const t = el('appToast');
    t.className = `app-toast ${type}`;
    el('appToastMsg').textContent = msg;
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  function fmtDate(iso) {
    if (!iso) return '—';

    const d = new Date(iso);

    if (isNaN(d.getTime())) return '—';

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function relTime(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1)  return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24)  return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  }

  function isOverdue(iso) {
    if (!iso) return false;
    return new Date(iso + 'T23:59:59') < new Date();
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function statusLabel(s) {
    return s === 'todo' ? 'To Do' : s === 'inprog' ? 'In Progress' : 'Done';
  }

  /* ══════════════════════════════════════════
     SIDEBAR — user footer drop-up
  ══════════════════════════════════════════ */
  // Populate user data from auth state
  el('sidebarAvatar').textContent = user.initials;
  el('sidebarName').textContent   = user.name;
  el('popupAvatar').textContent   = user.initials;
  el('popupName').textContent     = user.name;
  el('popupEmail').textContent    = user.email;

  const sidebarUserBtn = el('sidebarUserBtn');
  const userPopup      = el('userPopup');
  const sidebarChevron = el('sidebarChevron');

  function openUserPopup() {
    // Position the fixed popup above the trigger card using getBoundingClientRect
    // This works regardless of the sidebar's overflow:auto clipping context
    const rect = sidebarUserBtn.getBoundingClientRect();
    const GAP  = 8;
    userPopup.style.left   = rect.left + 'px';
    userPopup.style.width  = rect.width + 'px';
    // Start position below the trigger (will move up via transform), then correct to sit above
    userPopup.style.top    = (rect.top - GAP) + 'px';
    // After measuring popup height, adjust so bottom aligns with top of trigger
    // Use requestAnimationFrame so the popup is in the DOM before measuring
    requestAnimationFrame(() => {
      const popupH = userPopup.offsetHeight;
      userPopup.style.top = (rect.top - popupH - GAP) + 'px';
      userPopup.classList.add('open');
      sidebarChevron.classList.add('open');
      sidebarUserBtn.setAttribute('aria-expanded', 'true');
      userPopup.setAttribute('aria-hidden', 'false');
    });
  }

  function closeUserPopup() {
    userPopup.classList.remove('open');
    sidebarChevron.classList.remove('open');
    sidebarUserBtn.setAttribute('aria-expanded', 'false');
    userPopup.setAttribute('aria-hidden', 'true');
  }

  function isPopupOpen() {
    return userPopup.classList.contains('open');
  }

  // Click on trigger card — toggle
  sidebarUserBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isPopupOpen() ? closeUserPopup() : openUserPopup();
  });

  // Keyboard: Enter/Space opens, Escape closes
  sidebarUserBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isPopupOpen() ? closeUserPopup() : openUserPopup();
    }
  });

  // Click outside closes
  document.addEventListener('click', (e) => {
    if (isPopupOpen() && !userPopup.contains(e.target) && !sidebarUserBtn.contains(e.target)) {
      closeUserPopup();
    }
  });

  // Escape key closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPopupOpen()) {
      closeUserPopup();
      sidebarUserBtn.focus();
    }
  });

  // Close when any menu item is activated (navigation or action)
  userPopup.querySelectorAll('.popup-item').forEach(item => {
    item.addEventListener('click', () => closeUserPopup());
  });

  // Re-position if window resizes while open (e.g. orientation change on mobile)
  window.addEventListener('resize', () => {
    if (isPopupOpen()) {
      closeUserPopup();
    }
  });

  // Logout
  el('sidebarLogoutBtn').addEventListener('click', () => {
    FlowsyncAuth.signOut();
    window.location.href = 'signin.html';
  });

  /* ── Mobile sidebar toggle ── */
  const appSidebar    = el('appSidebar');
  const sidebarOverlay = el('sidebarOverlay');
  el('sidebarToggle').addEventListener('click', () => {
    appSidebar.classList.toggle('mobile-open');
    sidebarOverlay.classList.toggle('active');
  });
  sidebarOverlay.addEventListener('click', () => {
    appSidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
  });

  /* ══════════════════════════════════════════
     ROUTER — hash-based SPA navigation
  ══════════════════════════════════════════ */
  const VIEWS = ['dashboard','projects','tasks','timeline','reports','team'];
  const TITLES = {
    dashboard: 'Dashboard', projects: 'Projects', tasks: 'Tasks',
    timeline: 'Timeline',  reports: 'Reports',   team: 'Team'
  };
  const NEW_ACTIONS = {
    projects: { label: 'New Project', fn: () => openProjectModal() },
    tasks:    { label: 'New Task',    fn: () => openTaskModal() },
    team:     { label: 'Invite Member', fn: () => openModal('inviteModal') }
  };

  function nav(view) {
    if (!VIEWS.includes(view)) view = 'dashboard';
    // Update URL hash
    history.replaceState(null, '', '#' + view);

    // Activate view
    VIEWS.forEach(v => {
      el('view-' + v).classList.toggle('active', v === view);
      el('nav-' + v)?.classList.toggle('active', v === view);
    });

    // Topbar title
    el('topbarTitle').textContent = TITLES[view] || view;

    // Topbar new button
    const topbarNewBtn   = el('topbarNewBtn');
    const topbarNewLabel = el('topbarNewLabel');
    if (NEW_ACTIONS[view]) {
      topbarNewBtn.style.display = 'inline-flex';
      topbarNewLabel.textContent = NEW_ACTIONS[view].label;
      topbarNewBtn.onclick = NEW_ACTIONS[view].fn;
    } else {
      topbarNewBtn.style.display = 'none';
    }

    // Render view content
    const renders = { dashboard: renderDashboard, projects: renderProjects,
      tasks: renderTasks, timeline: renderTimeline, reports: renderReports, team: renderTeam };
    renders[view]?.();

    // Close mobile sidebar
    appSidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
  }

  // Wire nav buttons
  document.querySelectorAll('.app-nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => nav(btn.dataset.view));
  });

  // Boot from hash or default
  const initView = (location.hash.slice(1) || 'dashboard');
  nav(VIEWS.includes(initView) ? initView : 'dashboard');

  // Expose nav for inline onclick
  window.App = { nav };


  /* ══════════════════════════════════════════
     MODALS
  ══════════════════════════════════════════ */
  function openModal(id) {
    el(id).classList.add('open');
    // Focus first input
    setTimeout(() => { const f = el(id).querySelector('input,textarea,select'); if (f) f.focus(); }, 120);
  }
  function closeModal(id) { el(id).classList.remove('open'); }

  // Close buttons (data-close attribute)
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  // Click outside modal to close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(o => closeModal(o.id));
  });

  /* ══════════════════════════════════════════
     DASHBOARD HOME
  ══════════════════════════════════════════ */

  // Skeleton placeholder while the API call is in-flight
  function renderDashboardSkeleton() {
    el('dashStats').innerHTML = [1,2,3,4,5,6].map(() =>
      `<div class="stat-card" style="opacity:.45;">
        <div class="stat-card-label" style="background:var(--border);border-radius:4px;height:12px;width:60%;margin-bottom:10px;"></div>
        <div class="stat-card-value" style="background:var(--border);border-radius:6px;height:32px;width:40%;margin-bottom:8px;"></div>
        <div class="stat-card-meta" style="background:var(--border);border-radius:4px;height:10px;width:50%;"></div>
      </div>`
    ).join('');
    el('dashActivity').innerHTML =
      '<div style="padding:20px;color:var(--text-sub);font-size:13px;text-align:center;">Loading activity…</div>';
  }

  function renderDashboardStats(data) {
    el('dashStats').innerHTML = `
      <div class="stat-card accent-violet">
        <div class="stat-card-label">Total Projects</div>
        <div class="stat-card-value">${data.totalProjects}</div>
        <div class="stat-card-meta">all projects</div>
      </div>
      <div class="stat-card accent-blue">
        <div class="stat-card-label">Total Tasks</div>
        <div class="stat-card-value">${data.totalTasks}</div>
        <div class="stat-card-meta">across all projects</div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-card-label">Completed</div>
        <div class="stat-card-value">${data.completedTasks}</div>
        <div class="stat-card-meta">${data.completionPercentage}% done</div>
      </div>
      <div class="stat-card accent-amber">
        <div class="stat-card-label">Pending</div>
        <div class="stat-card-value">${data.pendingTasks}</div>
        <div class="stat-card-meta">not yet completed</div>
      </div>
      <div class="stat-card accent-amber">
        <div class="stat-card-label">Overdue</div>
        <div class="stat-card-value">${data.overdueTasks}</div>
        <div class="stat-card-meta">past due date</div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-card-label">Completion</div>
        <div class="stat-card-value">${data.completionPercentage}%</div>
        <div class="stat-card-meta">overall rate</div>
      </div>
    `;
  }

  function renderDashboardActivity(items) {
    el('dashActivity').innerHTML = items.length
      ? items.map(a => `
          <div class="activity-item">
            <div class="activity-dot"></div>
            <div class="activity-text">${escHtml(a.text)}</div>
            <div class="activity-time">${relTime(new Date(a.time).getTime())}</div>
          </div>`).join('')
      : '<div style="padding:20px;color:var(--text-sub);font-size:13px;text-align:center;">No recent activity.</div>';
  }

  async function renderDashboard() {

    // Greeting according to Indian Standard Time (IST)
    const hr = Number(
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        hourCycle: 'h23'
      }).format(new Date())
    );

    let greet;

    if (hr >= 5 && hr < 12) {
      greet = 'Good Morning';
    } else if (hr >= 12 && hr < 17) {
      greet = 'Good Afternoon';
    } else {
      greet = 'Good Evening';
    }

    // Capitalize first name
    const firstName = user.name.split(' ')[0];
    const displayName =
      firstName.charAt(0).toUpperCase() + firstName.slice(1);

    el('dashGreeting').textContent = `${greet}, ${displayName}!`;

    // Show skeleton while API call is in-flight
    renderDashboardSkeleton();

    // Fetch dashboard summary from backend
    try {
      const response = await ApiClient.get('/dashboard');
      const data = response.data || response;

      renderDashboardStats(data);
      renderDashboardActivity(data.recentActivity || []);
    } catch (err) {
      // Fallback: derive stats from local store on API failure
      console.warn('Dashboard API unavailable, falling back to local data:', err.message);

      const gs = FlowsyncStore.getStats();
      renderDashboardStats({
        totalProjects:        FlowsyncStore.getProjects().length,
        totalTasks:           gs.total,
        completedTasks:       gs.done,
        pendingTasks:         gs.total - gs.done,
        overdueTasks:         FlowsyncStore.getTasks().filter(t =>
                                t.status !== 'done' && isOverdue(t.dueDate)
                              ).length,
        completionPercentage: gs.pct,
      });
      const localActs = FlowsyncStore.getActivity().slice(0, 6);
      renderDashboardActivity(
        localActs.map(a => ({ text: a.text, time: new Date(a.time).toISOString() }))
      );
    }

    // Active project card — always from local store (not changed)
    const activeProjects = FlowsyncStore.getProjects().filter(p => p.status === 'active');
    const proj = activeProjects[0];
    if (proj) {
      const ps = FlowsyncStore.getStats(proj.id);
      el('dashProjectBody').innerHTML = `
        <div style="font-size:16px;font-weight:700;color:var(--white);margin-bottom:6px;">${escHtml(proj.name)}</div>
        <div style="font-size:13px;color:var(--text-sub);margin-bottom:16px;">${escHtml(proj.description)}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-sub);margin-bottom:6px;">
          <span>Progress</span><span>${ps.pct}%</span>
        </div>
        <div class="project-progress-bar"><div class="project-progress-fill" style="width:${ps.pct}%"></div></div>
        <div style="display:flex;gap:16px;margin-top:14px;flex-wrap:wrap;">
          <span style="font-size:12px;color:var(--text-sub);">📋 ${ps.total} tasks</span>
          <span style="font-size:12px;color:var(--green);">✓ ${ps.done} done</span>
          <span style="font-size:12px;color:var(--amber);">⏳ ${ps.inprog} in progress</span>
          <span style="font-size:12px;color:var(--text-sub);">📅 Due ${fmtDate(proj.deadline)}</span>
        </div>
      `;
    } else {
      el('dashProjectBody').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><h3>No active projects</h3><p>Create a project to get started.</p></div>';
    }

    // Mini kanban — always from local store (not changed)
    const allTasks = FlowsyncStore.getTasks();
    const todo   = allTasks.filter(t => t.status === 'todo').slice(0, 3);
    const inprog = allTasks.filter(t => t.status === 'inprog').slice(0, 3);
    const done   = allTasks.filter(t => t.status === 'done').slice(0, 3);
    function miniCol(label, cls, items) {
      const cards = items.map(t => {
        const proj = FlowsyncStore.getProject(t.projectId);
        return `<div class="task-card">
          <div class="task-card-title">${escHtml(t.title)}</div>
          <div class="task-card-meta">
            <span class="task-priority ${t.priority}">${t.priority}</span>
            ${proj ? `<span class="task-project-tag">${escHtml(proj.name)}</span>` : ''}
          </div>
        </div>`;
      }).join('');
      return `<div class="kanban-col">
        <div class="kanban-col-header">
          <div class="kanban-col-label"><div class="kanban-dot ${cls}"></div>${label}</div>
          <div class="kanban-count">${items.length}</div>
        </div>
        <div class="kanban-tasks">${cards || '<div style="font-size:12px;color:var(--text-sub);padding:8px 0;">No tasks</div>'}</div>
      </div>`;
    }
    el('dashKanban').innerHTML =
      miniCol('To Do','todo',todo) +
      miniCol('In Progress','inprog',inprog) +
      miniCol('Done','done',done);
  }

  /* ══════════════════════════════════════════
     PROJECTS
  ══════════════════════════════════════════ */
  let editingProjectId = null;

  async function renderProjects() {
    el('projectsGrid').innerHTML = '<div style="padding:32px;color:var(--text-sub);font-size:13px;text-align:center;grid-column:1/-1">Loading projects…</div>';
    try {
      await FlowsyncStore.fetchProjects();
    } catch (err) {
      el('projectsGrid').innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><h3>Could not load projects</h3><p>Check your connection and try again.</p></div>`;
      return;
    }
    _renderProjectsFromCache();
  }

  function _renderProjectsFromCache() {
    const projects = FlowsyncStore.getProjects();
    if (!projects.length) {
      el('projectsGrid').innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📁</div><h3>No projects yet</h3><p>Click "New Project" to create your first project.</p></div>`;
      return;
    }
    el('projectsGrid').innerHTML = projects.map(p => {
      const ps = FlowsyncStore.getStats(p.id);
      const od = p.deadline && isOverdue(p.deadline) && p.status !== 'completed';
      return `<div class="project-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <div class="project-card-name">${escHtml(p.name)}</div>
          <div style="display:flex;gap:4px;flex-shrink:0;">
            <button class="btn-icon" title="Edit" onclick="App.editProject('${p.id}')">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 1.5l3 3L4 12H1v-3L8.5 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn-icon danger" title="Delete" onclick="App.deleteProject('${p.id}')">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 3h11M4 3V2h5v1M5 6v4M8 6v4M2 3l1 9h7l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
        <div class="project-card-desc">${escHtml(p.description || 'No description.')}</div>
        <div class="project-progress-wrap">
          <div class="project-progress-label"><span>${ps.done}/${ps.total} tasks</span><span>${ps.pct}%</span></div>
          <div class="project-progress-bar"><div class="project-progress-fill" style="width:${ps.pct}%"></div></div>
        </div>
        <div class="project-card-footer">
          <span class="project-status ${p.status}">${p.status}</span>
          <span class="project-deadline" style="${od?'color:#EF4444':''}">
            ${od ? '⚠️ ' : ''}${p.deadline ? fmtDate(p.deadline) : 'No deadline'}
          </span>
        </div>
      </div>`;
    }).join('');
  }

  function openProjectModal(id) {
    editingProjectId = id || null;
    el('projectModalTitle').textContent = id ? 'Edit Project' : 'New Project';
    const p = id ? FlowsyncStore.getProject(id) : null;
    el('pName').value     = p ? p.name        : '';
    el('pDesc').value     = p ? (p.description||'') : '';
    el('pDeadline').value = p ? (p.deadline||'')    : '';
    el('pStatus').value   = p ? p.status      : 'active';
    openModal('projectModal');
  }

  el('newProjectBtn').addEventListener('click', () => openProjectModal());
  el('saveProjectBtn').addEventListener('click', async () => {
    const name = el('pName').value.trim();
    if (!name) { el('pName').focus(); toast('Project name is required.', 'error'); return; }
    const data = { id: editingProjectId||undefined, name,
      description: el('pDesc').value.trim(),
      deadline: el('pDeadline').value || '',
      status:   el('pStatus').value };
    const saveBtn = el('saveProjectBtn');
    saveBtn.disabled = true;
    try {
      await FlowsyncStore.saveProject(data);
      FlowsyncStore.addActivity(`Project "${name}" ${editingProjectId ? 'updated' : 'created'}.`);
      closeModal('projectModal');
      toast(editingProjectId ? 'Project updated.' : 'Project created.');
      _renderProjectsFromCache();
    } catch (err) {
      const msg = err.status === 409
        ? 'A project with this name already exists.'
        : err.message || 'Failed to save project. Please try again.';
      toast(msg, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  App.editProject   = (id) => openProjectModal(id);
  App.deleteProject = async (id) => {
    const p = FlowsyncStore.getProject(id);
    if (!p) return;
    if (!confirm(`Delete "${p.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await FlowsyncStore.deleteProject(id);
      FlowsyncStore.addActivity(`Project "${p.name}" deleted.`);
      toast('Project deleted.');
      _renderProjectsFromCache();
    } catch (err) {
      const msg = err.status === 403
        ? 'Only the project owner can delete this project.'
        : err.status === 404
          ? 'Project not found — it may have already been deleted.'
          : 'Failed to delete project. Please try again.';
      toast(msg, 'error');
    }
  };


  /* ══════════════════════════════════════════
     TASKS
  ══════════════════════════════════════════ */
  let editingTaskId = null;

  function populateProjectSelects() {
    const projects = FlowsyncStore.getProjects();
    const opts = projects.length
      ? projects.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('')
      : '<option value="">No projects yet</option>';
    el('tProject').innerHTML = opts;
    // Filter dropdown in tasks view
    const filterOpts = '<option value="">All projects</option>' +
      projects.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
    el('taskProjectFilter').innerHTML = filterOpts;
  }

  function renderTasksFromCache() {
    populateProjectSelects();
    const filterPid = el('taskProjectFilter').value;
    const allTasks  = FlowsyncStore.getTasks(filterPid || undefined);

    function col(status, label, dot) {
      const items = allTasks.filter(t => t.status === status);
      const cards = items.map(t => {
        const proj = FlowsyncStore.getProject(t.projectId);
        const od = isOverdue(t.dueDate) && t.status !== 'done';
        return `<div class="task-card" onclick="App.editTask('${t.id}')">
          <div class="task-card-title">${escHtml(t.title)}</div>
          <div class="task-card-meta">
            <span class="task-priority ${t.priority}">${t.priority}</span>
            ${t.dueDate ? `<span class="task-due ${od?'overdue':''}">${od?'⚠️ ':''}${fmtDate(t.dueDate)}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
            ${proj ? `<span class="task-project-tag">${escHtml(proj.name)}</span>` : '<span></span>'}
            <div style="display:flex;gap:2px;" onclick="event.stopPropagation()">
              ${status !== 'todo'   ? `<button class="btn-icon" title="Move to To Do" onclick="App.moveTask('${t.id}','todo')"><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 1H1v9h9V4M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}
              ${status !== 'inprog'? `<button class="btn-icon" title="Move to In Progress" onclick="App.moveTask('${t.id}','inprog')"><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5h9M5.5 1l4.5 4.5L5.5 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}
              ${status !== 'done'  ? `<button class="btn-icon" title="Mark Done" onclick="App.moveTask('${t.id}','done')"><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="var(--green)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}
              <button class="btn-icon danger" title="Delete" onclick="App.deleteTask('${t.id}')"><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 2.5h9M4 2.5V2h3v.5M3 2.5l.5 7h4l.5-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </div>
        </div>`;
      }).join('');
      return `<div class="kanban-col">
        <div class="kanban-col-header">
          <div class="kanban-col-label"><div class="kanban-dot ${dot}"></div>${label}</div>
          <div class="kanban-count">${items.length}</div>
        </div>
        <div class="kanban-tasks">${cards || '<div style="font-size:12px;color:var(--text-sub);padding:8px 0;">No tasks</div>'}</div>
      </div>`;
    }

    el('tasksKanban').innerHTML =
      col('todo','To Do','todo') +
      col('inprog','In Progress','inprog') +
      col('done','Done','done');
  }

  async function renderTasks() {
    // Show a lightweight loading state while fetching
    el('tasksKanban').innerHTML = '<div style="padding:32px;color:var(--text-sub);font-size:13px;text-align:center;">Loading tasks…</div>';
    const filterPid = el('taskProjectFilter').value;
    try {
      await FlowsyncStore.fetchTasks(filterPid || undefined);
      renderTasksFromCache();
    } catch (err) {
      el('tasksKanban').innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">⚠️</div>
          <h3>Could not load tasks</h3>
          <p>Check your connection and try again.</p>
          <button class="btn-sm-outline" style="margin-top:12px;" onclick="renderTasks()">Retry</button>
        </div>`;
    }
  }

  el('taskProjectFilter').addEventListener('change', renderTasks);

  function openTaskModal(id) {
    editingTaskId = id || null;
    populateProjectSelects();
    el('taskModalTitle').textContent = id ? 'Edit Task' : 'New Task';
    const t = id ? FlowsyncStore.getTask(id) : null;
    el('tTitle').value    = t ? t.title       : '';
    el('tProject').value  = t ? (t.projectId||'')  : (FlowsyncStore.getProjects()[0]?.id || '');
    el('tStatus').value   = t ? t.status      : 'todo';
    el('tPriority').value = t ? t.priority    : 'medium';
    el('tDue').value      = t ? (t.dueDate||'')    : '';
    openModal('taskModal');
  }

  el('newTaskBtn').addEventListener('click', () => openTaskModal());
  el('saveTaskBtn').addEventListener('click', async () => {
    const title = el('tTitle').value.trim();
    if (!title)              { el('tTitle').focus(); toast('Task title is required.', 'error'); return; }
    if (!el('tProject').value) { toast('Please select a project.', 'error'); return; }
    const data = { id: editingTaskId||undefined, title,
      projectId: el('tProject').value,
      status:    el('tStatus').value,
      priority:  el('tPriority').value,
      dueDate:   el('tDue').value || '' };
    const saveBtn = el('saveTaskBtn');
    saveBtn.disabled = true;
    try {
      await FlowsyncStore.saveTask(data);
      FlowsyncStore.addActivity(`Task "${title}" ${editingTaskId ? 'updated' : 'created'}.`);
      closeModal('taskModal');
      toast(editingTaskId ? 'Task updated.' : 'Task created.');
      renderTasksFromCache();
    } catch (err) {
      toast('Failed to save task. Please try again.', 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  App.editTask   = (id) => openTaskModal(id);
  App.deleteTask = async (id) => {
    const t = FlowsyncStore.getTask(id);
    if (!t) return;
    if (!confirm(`Delete task "${t.title}"?`)) return;
    try {
      await FlowsyncStore.deleteTask(id);
      toast('Task deleted.');
      renderTasksFromCache();
    } catch (err) {
      const msg = err.status === 403
        ? 'You don\'t have permission to delete this task.'
        : err.status === 404
          ? 'Task not found — it may have already been deleted.'
          : 'Failed to delete task. Please try again.';
      toast(msg, 'error');
    }
  };
  App.moveTask   = async (id, status) => {
    const t = FlowsyncStore.getTask(id);
    try {
      await FlowsyncStore.updateTaskStatus(id, status);
      FlowsyncStore.addActivity(`Task "${t?.title}" moved to ${statusLabel(status)}.`);
      toast(`Moved to ${statusLabel(status)}.`);
      renderTasksFromCache();
    } catch (err) {
      const msg = err.status === 403
        ? 'You don\'t have permission to update this task.'
        : err.status === 404
          ? 'Task not found — it may have been deleted.'
          : `Failed to move task. Please try again.`;
      toast(msg, 'error');
    }
  };


  /* ══════════════════════════════════════════
     TIMELINE
  ══════════════════════════════════════════ */
  function renderTimeline() {
    const tasks = FlowsyncStore.getTasks()
      .filter(t => t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    if (!tasks.length) {
      el('timelineList').innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No deadlines yet</h3><p>Add due dates to tasks to see them here.</p></div>`;
      return;
    }

    // Group by date
    const groups = {};
    tasks.forEach(t => {
      const d = t.deadline;
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });

    const html = Object.entries(groups).map(([date, items], gi, arr) => {
      const d   = new Date(date + 'T00:00:00');
      const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isLast = gi === arr.length - 1;

      return items.map((t, ti) => {
        const proj   = FlowsyncStore.getProject(t.projectId);
        const od     = isOverdue(t.dueDate) && t.status !== 'done';
        const cirCls = t.status === 'done' ? 'done' : od ? 'overdue' : '';
        const stCls  = od && t.status !== 'done' ? 'overdue' : t.status;
        const stLbl  = od && t.status !== 'done' ? 'Overdue' : statusLabel(t.status);
        const showDate = ti === 0;
        return `<div class="timeline-item">
          <div class="timeline-date-col">${showDate ? `<div class="timeline-date">${fmt}</div><div class="timeline-dow">${dow}</div>` : ''}</div>
          <div class="timeline-line-col">
            <div class="timeline-circle ${cirCls}"></div>
            ${(!isLast || ti < items.length-1) ? '<div class="timeline-vline"></div>' : ''}
          </div>
          <div class="timeline-content">
            <div class="timeline-task-name">${escHtml(t.title)}</div>
            ${proj ? `<div class="timeline-project-name">${escHtml(proj.name)}</div>` : ''}
            <div class="timeline-badges">
              <span class="timeline-status ${stCls}">${stLbl}</span>
              <span class="task-priority ${t.priority}">${t.priority}</span>
            </div>
          </div>
        </div>`;
      }).join('');
    }).join('');
    el('timelineList').innerHTML = html;
  }

  /* ══════════════════════════════════════════
     REPORTS
  ══════════════════════════════════════════ */
  function renderReports() {
    const gs = FlowsyncStore.getStats();
    el('reportStats').innerHTML = `
      <div class="stat-card accent-violet"><div class="stat-card-label">Total Tasks</div><div class="stat-card-value">${gs.total}</div><div class="stat-card-meta">all projects</div></div>
      <div class="stat-card accent-green"><div class="stat-card-label">Completed</div><div class="stat-card-value">${gs.done}</div><div class="stat-card-meta">${gs.pct}% done</div></div>
      <div class="stat-card accent-amber"><div class="stat-card-label">In Progress</div><div class="stat-card-value">${gs.inprog}</div><div class="stat-card-meta">currently active</div></div>
      <div class="stat-card accent-blue"><div class="stat-card-label">To Do</div><div class="stat-card-value">${gs.todo}</div><div class="stat-card-meta">not started</div></div>
    `;

    // Per-project bars
    const projects = FlowsyncStore.getProjects();
    el('reportBars').innerHTML = projects.length ? projects.map(p => {
      const ps = FlowsyncStore.getStats(p.id);
      return `
        <div class="report-bar-row">
          <div class="report-bar-label" style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHtml(p.name)}">${escHtml(p.name)}</div>
          <div class="report-bar-track"><div class="report-bar-fill violet" style="width:${ps.pct}%"></div></div>
          <div class="report-bar-pct">${ps.pct}%</div>
        </div>`;
    }).join('') : '<div style="padding:16px;color:var(--text-sub);font-size:13px;">No projects yet.</div>';

    // Overall donut-style summary
    el('reportOverall').innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:52px;font-weight:800;background:linear-gradient(135deg,var(--violet),var(--blue));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;">${gs.pct}%</div>
        <div style="font-size:13px;color:var(--text-sub);margin-top:6px;">Overall completion rate</div>
      </div>
      <div class="report-bar-row"><div class="report-bar-label">Done</div><div class="report-bar-track"><div class="report-bar-fill green" style="width:${gs.total?Math.round(gs.done/gs.total*100):0}%"></div></div><div class="report-bar-pct">${gs.done}</div></div>
      <div class="report-bar-row"><div class="report-bar-label">In Progress</div><div class="report-bar-track"><div class="report-bar-fill amber" style="width:${gs.total?Math.round(gs.inprog/gs.total*100):0}%"></div></div><div class="report-bar-pct">${gs.inprog}</div></div>
      <div class="report-bar-row"><div class="report-bar-label">To Do</div><div class="report-bar-track"><div class="report-bar-fill blue" style="width:${gs.total?Math.round(gs.todo/gs.total*100):0}%"></div></div><div class="report-bar-pct">${gs.todo}</div></div>
    `;
  }

  /* ══════════════════════════════════════════
     TEAM
  ══════════════════════════════════════════ */
  function renderTeam() {
    const workspaceName = user.name.split(' ')[0] + "'s Workspace";
    el('teamWorkspaceName').textContent = 'Workspace: ' + workspaceName;

    const members = FlowsyncStore.getTeam();
    if (!members.length) {
      el('teamGrid').innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><h3>No team members</h3><p>Invite your first team member to get started.</p></div>`;
      return;
    }
    el('teamGrid').innerHTML = members.map(m => `
      <div class="team-row">
        <div class="team-avatar" style="background:${avatarColor(m.email)}">${escHtml(m.avatar||'?')}</div>
        <div class="team-info">
          <div class="team-name">${escHtml(m.name)}</div>
          <div class="team-email">${escHtml(m.email)}</div>
        </div>
        <span class="team-role ${m.role.toLowerCase()}">${escHtml(m.role)}</span>
        <button class="btn-icon danger" title="Remove" onclick="App.removeMember('${m.id}','${escHtml(m.name).replace(/'/g,"\\'")}')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1l11 11M12 1L1 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>`).join('');
  }

  function avatarColor(email) {
    const colors = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EC4899','#8B5CF6'];
    let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
  }

  el('inviteMemberBtn').addEventListener('click', () => openModal('inviteModal'));
  el('saveInviteBtn').addEventListener('click', () => {
    const email = el('inviteEmail').value.trim();
    const name  = el('inviteName').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      el('inviteEmail').focus(); toast('Please enter a valid email address.', 'error'); return;
    }
    const m = FlowsyncStore.addMember({ name, email, role: el('inviteRole').value });
    if (!m) { toast('That email is already in the team.', 'error'); return; }
    FlowsyncStore.addActivity(`${name || email} was invited to the workspace.`);
    closeModal('inviteModal');
    el('inviteName').value = ''; el('inviteEmail').value = '';
    toast('Team member added successfully.');
    renderTeam();
  });

  App.removeMember = (id, name) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    FlowsyncStore.removeMember(id);
    toast('Team member removed.');
    renderTeam();
  };

})(); // end IIFE
