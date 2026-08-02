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
    // Projects and tasks now come from the backend.
    // Remove any stale task or team data written by the old demo seed.
    localStorage.removeItem(KEYS.tasks);
    localStorage.removeItem(KEYS.team);
  }

  /* ── Projects CRUD ── */
  let projectsCache = null; // In-memory cache — populated by fetchProjects()

  // Synchronous read from cache (used by all UI rendering and getStats)
  function getProjects() {
    return projectsCache || [];
  }

  function getProject(id) {
    return getProjects().find(p => p.id === id) || null;
  }

  // Fetch all projects from the backend and populate the cache
  async function fetchProjects() {
    try {
      const response = await ApiClient.get('/projects?limit=100');
      // Response envelope: { success, data: { projects, total, ... } }
      // Guard: ensure projects is always an array regardless of response shape
      const raw      = response && response.data;
      const projects = Array.isArray(raw && raw.projects)
        ? raw.projects
        : Array.isArray(raw)
          ? raw
          : [];
      projectsCache = projects.map(_normaliseProject);
      return projectsCache;
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      throw err;
    }
  }

  // Create or update a project via the API
  async function saveProject(data) {
    const isUpdate = !!data.id;
    const endpoint = isUpdate ? `/projects/${data.id}` : '/projects';
    const method   = isUpdate ? 'put' : 'post';

    // Map frontend field names to backend field names
    const body = {
      name:        data.name,
      description: data.description || '',
      status:      data.status      || 'active',
      priority:    data.priority    || 'medium',
      dueDate:     data.deadline    || null,   // frontend uses 'deadline', backend uses 'dueDate'
    };

    const response  = await ApiClient[method](endpoint, body);
    // Response envelope: { success, data: { project } }
    const saved = (response.data && response.data.project) || response.data || response;

    // Normalise: expose dueDate as deadline so the rest of the UI works unchanged
    const normalised = _normaliseProject(saved);

    // Update cache
    if (projectsCache) {
      if (isUpdate) {
        const i = projectsCache.findIndex(p => p.id === normalised.id);
        if (i >= 0) projectsCache[i] = normalised;
        else projectsCache.unshift(normalised);
      } else {
        projectsCache.unshift(normalised);
      }
    }

    return normalised;
  }

  // Delete a project and remove its tasks from the task cache
  async function deleteProject(id) {
    await ApiClient.delete(`/projects/${id}`);

    // Remove from project cache
    if (projectsCache) {
      projectsCache = projectsCache.filter(p => p.id !== id);
    }

    // Purge tasks that belong to this project from the task cache
    if (tasksCache) {
      tasksCache = tasksCache.filter(t => t.projectId !== id);
      save(KEYS.tasks, tasksCache);
    }
  }

  // Normalise a SafeProject from the backend to match the frontend shape:
  //   backend uses 'dueDate' (ISO string) — frontend uses 'deadline' (YYYY-MM-DD)
  function _normaliseProject(p) {
    return {
      id:          p.id,
      name:        p.name,
      description: p.description || '',
      status:      p.status,
      priority:    p.priority,
      // Convert ISO dueDate → YYYY-MM-DD for the deadline field the UI expects
      deadline:    p.dueDate ? p.dueDate.slice(0, 10) : (p.deadline || ''),
      members:     p.members  || [],
      tags:        p.tags     || [],
      color:       p.color    || '#6C63FF',
      createdAt:   p.createdAt,
      updatedAt:   p.updatedAt,
    };
  }

  /* ── Tasks CRUD ── */
  let tasksCache = null; // Cache for tasks data

  function getTasks(projectId) {
    // Return cached data if available (synchronous behavior for UI)
    if (tasksCache) {
      return projectId ? tasksCache.filter(t => t.projectId === projectId) : tasksCache;
    }
    // Fallback to localStorage for initial load
    const all = load(KEYS.tasks) || [];
    return projectId ? all.filter(t => t.projectId === projectId) : all;
  }

  async function fetchTasks(projectId) {

    const reverseStatusMap = {
      todo: "todo",
      in_progress: "inprog",
      done: "done",
    };

    try {

      if (projectId) {

        const response = await ApiClient.get(`/projects/${projectId}/tasks`);

        const rawTasks = response && response.data;
        const fetched = (Array.isArray(rawTasks && rawTasks.tasks)
          ? rawTasks.tasks
          : Array.isArray(rawTasks)
            ? rawTasks
            : []
        ).map(task => ({
          ...task,
          projectId: task.project,
          status: reverseStatusMap[task.status] || task.status,
          deadline: task.dueDate ? task.dueDate.slice(0, 10) : (task.deadline || '')
        }));

        const existing = tasksCache || [];

        tasksCache = [
          ...existing.filter(t => t.projectId !== projectId),
          ...fetched
        ];

      } else {
        // No project filter — fetch tasks for every project the user has access to.
        // First ensure the project list is populated (may not be if the user navigated
        // directly to the Tasks view without visiting Projects first).
        let projects = getProjects();
        if (!projects.length) {
          projects = await fetchProjects();
        }

        if (!projects.length) {
          // User genuinely has no projects — return empty array, not stale localStorage data
          tasksCache = [];
          save(KEYS.tasks, tasksCache);
          return tasksCache;
        }

        const results = await Promise.all(
          projects.map(p =>
            ApiClient.get(`/projects/${p.id}/tasks`)
              .then(r => {
                const rawT = r && r.data;
                return (Array.isArray(rawT && rawT.tasks)
                  ? rawT.tasks
                  : Array.isArray(rawT)
                    ? rawT
                    : []
                ).map(task => ({
                  ...task,
                  projectId: task.project,
                  status: reverseStatusMap[task.status] || task.status,
                  deadline: task.dueDate ? task.dueDate.slice(0, 10) : (task.deadline || '')
                }));
              })
              .catch(() => [])
          )
        );

        tasksCache = results.flat();
      }

      save(KEYS.tasks, tasksCache);

      return tasksCache;

    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      tasksCache = tasksCache || [];
      return tasksCache;
    }
  }

  function getTask(id) {
    return getTasks().find(t => t.id === id) || null;
  }

  async function saveTask(data) {
    try {
      const isUpdate = !!data.id;
      const projectId = data.projectId;
      const endpoint = isUpdate
        ? `/projects/${projectId}/tasks/${data.id}`
        : `/projects/${projectId}/tasks`;
      const method = isUpdate ? 'put' : 'post';
      
      const statusMap = {
        todo: 'todo',
        inprog: 'in_progress',
        done: 'done',
      };

      const payload = {
        ...data,
        status: statusMap[data.status] || data.status,
      };

      const response = await ApiClient[method](endpoint, payload);

      // Response envelope: { success, data: { task } }
      const savedTask = (response.data && response.data.task) || response.data || response;
      savedTask.projectId = savedTask.project;

      // Convert backend status → frontend status
      const reverseStatusMap = {
        todo: "todo",
        in_progress: "inprog",
        done: "done",
      };
      savedTask.deadline = savedTask.dueDate
      ? savedTask.dueDate.slice(0, 10)
      : (savedTask.deadline || "");

      savedTask.status =
        reverseStatusMap[savedTask.status] || savedTask.status;

      // Update cache
      if (tasksCache) {
        if (isUpdate) {
          const i = tasksCache.findIndex(t => t.id === savedTask.id);
          if (i >= 0) tasksCache[i] = savedTask;
          else tasksCache.unshift(savedTask);
        } else {
          tasksCache.unshift(savedTask);
        }
        save(KEYS.tasks, tasksCache);
      }

      return savedTask;
    } catch (err) {
      console.error('Failed to save task:', err);
      // Fallback to localStorage-only mode
      const list = load(KEYS.tasks) || [];
      if (data.id) {
        const i = list.findIndex(t => t.id === data.id);
        if (i >= 0) list[i] = Object.assign({}, list[i], data);
        else list.unshift(data);
      } else {
        data.id = uid();
        data.createdAt = Date.now();
        list.unshift(data);
      }
      save(KEYS.tasks, list);
      tasksCache = list;
      return data;
    }
  }

  async function deleteTask(id) {
    try {
      const task = getTask(id);
      const projectId = task?.projectId;
      await ApiClient.delete(`/projects/${projectId}/tasks/${id}`);
      
      // Update cache
      if (tasksCache) {
        tasksCache = tasksCache.filter(t => t.id !== id);
        save(KEYS.tasks, tasksCache);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to delete task:', err);
      // Fallback to localStorage-only mode
      const list = (load(KEYS.tasks) || []).filter(t => t.id !== id);
      save(KEYS.tasks, list);
      tasksCache = list;
      return false;
    }
  }

  async function updateTaskStatus(id, status) {
    try {
      const task = getTask(id);
      const projectId = task?.projectId;
      // Backend has no PATCH route — use PUT with the full task body + new status
      const statusMap = {
        todo: "todo",
        inprog: "in_progress",
        done: "done",
      };

      const response = await ApiClient.put(
        `/projects/${projectId}/tasks/${id}`,
        {
          ...task,
          status: statusMap[status] || status,
        }
      );
      // Response envelope: { success, data: { task } }
      const updatedTask = (response.data && response.data.task) || response.data || response;
      updatedTask.projectId = updatedTask.project;
      // Convert backend status → frontend status
      const reverseStatusMap = {
        todo: "todo",
        in_progress: "inprog",
        done: "done",
      };

      updatedTask.status =
        reverseStatusMap[updatedTask.status] || updatedTask.status;

      updatedTask.deadline = updatedTask.dueDate
      ? updatedTask.dueDate.slice(0, 10)
      : (updatedTask.deadline || "");
      
      // Update cache
      if (tasksCache) {
        const i = tasksCache.findIndex(t => t.id === id);
        if (i >= 0) {
          tasksCache[i] = updatedTask;
          save(KEYS.tasks, tasksCache);
        }
      }

      return updatedTask;
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Fallback to localStorage-only mode
      const list = load(KEYS.tasks) || [];
      const t = list.find(t => t.id === id);
      if (t) {
        t.status = status;
        save(KEYS.tasks, list);
        tasksCache = list;
      }
      return t;
    }
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
    getProjects, getProject, saveProject, deleteProject, fetchProjects,
    getTasks, getTask, saveTask, deleteTask, updateTaskStatus, fetchTasks,
    getTeam, addMember, removeMember,
    getActivity, addActivity,
    getStats
  };
})();
