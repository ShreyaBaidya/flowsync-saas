/* ============================================================
   FLOWSYNC — App Data Store
   localStorage-backed store for projects, tasks, and team.
   Seeded with realistic demo data on first load.
   ============================================================ */

const FlowsyncStore = (function () {
  'use strict';

  const KEYS = {
    projects: 'flowsync_projects',
    tasks:    'flowsync_tasks',
    team:     'flowsync_team',
    activity: 'flowsync_activity'
  };

  /* ── helpers ── */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }
  function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  /* ── seed demo data on first use ── */
  function seed() {
    if (load(KEYS.projects)) return; // already seeded

    const now = Date.now();
    const day = 86400000;

    const p1 = uid(), p2 = uid(), p3 = uid();

    const projects = [
      { id: p1, name: 'Q3 Product Launch', description: 'End-to-end launch of the new dashboard feature set.',
        status: 'active', deadline: new Date(now + 18 * day).toISOString().slice(0,10), createdAt: now - 10*day },
      { id: p2, name: 'Mobile App Redesign', description: 'Refresh the iOS and Android apps to match the new brand.',
        status: 'active', deadline: new Date(now + 35 * day).toISOString().slice(0,10), createdAt: now - 5*day },
      { id: p3, name: 'API v2 Migration', description: 'Migrate all internal services to the new REST API.',
        status: 'completed', deadline: new Date(now - 3 * day).toISOString().slice(0,10), createdAt: now - 30*day }
    ];

    const tasks = [
      { id: uid(), projectId: p1, title: 'Research competitors', status: 'done',     priority: 'medium', dueDate: new Date(now - 5*day).toISOString().slice(0,10),  createdAt: now - 9*day },
      { id: uid(), projectId: p1, title: 'Define user personas',  status: 'done',     priority: 'high',   dueDate: new Date(now - 3*day).toISOString().slice(0,10),  createdAt: now - 8*day },
      { id: uid(), projectId: p1, title: 'Design landing page',   status: 'inprog',   priority: 'high',   dueDate: new Date(now + 2*day).toISOString().slice(0,10),  createdAt: now - 4*day },
      { id: uid(), projectId: p1, title: 'Write API docs',        status: 'inprog',   priority: 'medium', dueDate: new Date(now + 4*day).toISOString().slice(0,10),  createdAt: now - 3*day },
      { id: uid(), projectId: p1, title: 'Set up CI/CD pipeline', status: 'done',     priority: 'high',   dueDate: new Date(now - 7*day).toISOString().slice(0,10),  createdAt: now - 9*day },
      { id: uid(), projectId: p1, title: 'Write blog post',       status: 'todo',     priority: 'low',    dueDate: new Date(now + 8*day).toISOString().slice(0,10),  createdAt: now - 1*day },
      { id: uid(), projectId: p1, title: 'Record demo video',     status: 'todo',     priority: 'medium', dueDate: new Date(now + 10*day).toISOString().slice(0,10), createdAt: now - 1*day },
      { id: uid(), projectId: p2, title: 'Wireframe new nav',     status: 'done',     priority: 'high',   dueDate: new Date(now - 2*day).toISOString().slice(0,10),  createdAt: now - 5*day },
      { id: uid(), projectId: p2, title: 'Redesign home screen',  status: 'inprog',   priority: 'high',   dueDate: new Date(now + 6*day).toISOString().slice(0,10),  createdAt: now - 4*day },
      { id: uid(), projectId: p2, title: 'User testing sessions', status: 'todo',     priority: 'medium', dueDate: new Date(now + 14*day).toISOString().slice(0,10), createdAt: now - 2*day },
      { id: uid(), projectId: p3, title: 'Audit existing API',    status: 'done',     priority: 'high',   dueDate: new Date(now - 20*day).toISOString().slice(0,10), createdAt: now - 30*day },
      { id: uid(), projectId: p3, title: 'Write migration guide', status: 'done',     priority: 'medium', dueDate: new Date(now - 10*day).toISOString().slice(0,10), createdAt: now - 20*day },
      { id: uid(), projectId: p3, title: 'Deprecate v1 endpoints',status: 'done',     priority: 'high',   dueDate: new Date(now - 4*day).toISOString().slice(0,10),  createdAt: now - 15*day }
    ];

    const team = [
      { id: uid(), name: 'Sarah Mitchell', email: 'sarah@nexlayer.io',   role: 'Admin',   avatar: 'SM', addedAt: now - 20*day },
      { id: uid(), name: 'James Kwon',     email: 'james@nexlayer.io',   role: 'Member',  avatar: 'JK', addedAt: now - 15*day },
      { id: uid(), name: 'Aisha Larson',   email: 'aisha@nexlayer.io',   role: 'Member',  avatar: 'AL', addedAt: now - 10*day }
    ];

    const activity = [
      { id: uid(), text: 'James Kwon completed "Audit existing API"',       time: now - 2 * 3600000 },
      { id: uid(), text: 'Aisha Larson moved "Design landing page" to In Progress', time: now - 5 * 3600000 },
      { id: uid(), text: 'Sarah Mitchell created project "Mobile App Redesign"', time: now - 1 * day },
      { id: uid(), text: 'James Kwon added task "User testing sessions"',   time: now - 2 * day },
      { id: uid(), text: 'API v2 Migration marked as completed',            time: now - 3 * day }
    ];

    save(KEYS.projects, projects);
    save(KEYS.tasks, tasks);
    save(KEYS.team, team);
    save(KEYS.activity, activity);
  }

  /* ── Projects CRUD ── */
  function getProjects()    { return load(KEYS.projects) || []; }
  function getProject(id)   { return getProjects().find(p => p.id === id) || null; }
  function saveProject(data) {
    const list = getProjects();
    if (data.id) {
      const i = list.findIndex(p => p.id === data.id);
      if (i >= 0) list[i] = Object.assign({}, list[i], data);
      else list.unshift(data);
    } else {
      data.id = uid(); data.createdAt = Date.now();
      list.unshift(data);
    }
    save(KEYS.projects, list);
    return data;
  }
  function deleteProject(id) {
    save(KEYS.projects, getProjects().filter(p => p.id !== id));
    save(KEYS.tasks, getTasks().filter(t => t.projectId !== id));
  }

  /* ── Tasks CRUD ── */
  function getTasks(projectId) {
    const all = load(KEYS.tasks) || [];
    return projectId ? all.filter(t => t.projectId === projectId) : all;
  }
  function getTask(id)   { return getTasks().find(t => t.id === id) || null; }
  function saveTask(data) {
    const list = getTasks();
    if (data.id) {
      const i = list.findIndex(t => t.id === data.id);
      if (i >= 0) list[i] = Object.assign({}, list[i], data);
      else list.unshift(data);
    } else {
      data.id = uid(); data.createdAt = Date.now();
      list.unshift(data);
    }
    save(KEYS.tasks, list);
    return data;
  }
  function deleteTask(id) { save(KEYS.tasks, getTasks().filter(t => t.id !== id)); }
  function updateTaskStatus(id, status) {
    const list = getTasks();
    const t = list.find(t => t.id === id);
    if (t) { t.status = status; save(KEYS.tasks, list); }
  }

  /* ── Team CRUD ── */
  function getTeam()  { return load(KEYS.team) || []; }
  function addMember(data) {
    const list = getTeam();
    if (list.find(m => m.email.toLowerCase() === data.email.toLowerCase())) return null;
    const member = { id: uid(), name: data.name || data.email.split('@')[0],
      email: data.email, role: data.role || 'Member',
      avatar: FlowsyncAuth.getInitials(data.name || data.email), addedAt: Date.now() };
    list.push(member);
    save(KEYS.team, list);
    return member;
  }
  function removeMember(id) { save(KEYS.team, getTeam().filter(m => m.id !== id)); }

  /* ── Activity ── */
  function getActivity() { return load(KEYS.activity) || []; }
  function addActivity(text) {
    const list = getActivity();
    list.unshift({ id: uid(), text, time: Date.now() });
    save(KEYS.activity, list.slice(0, 20)); // keep last 20
  }

  /* ── Stats helpers ── */
  function getStats(projectId) {
    const tasks = getTasks(projectId);
    const total    = tasks.length;
    const done     = tasks.filter(t => t.status === 'done').length;
    const inprog   = tasks.filter(t => t.status === 'inprog').length;
    const todo     = tasks.filter(t => t.status === 'todo').length;
    const pct      = total ? Math.round((done / total) * 100) : 0;
    return { total, done, inprog, todo, pct };
  }

  /* Boot */
  seed();

  return {
    uid,
    getProjects, getProject, saveProject, deleteProject,
    getTasks, getTask, saveTask, deleteTask, updateTaskStatus,
    getTeam, addMember, removeMember,
    getActivity, addActivity,
    getStats
  };
})();
