// Cache lưu trữ danh sách và chi tiết dự án kết hợp cả in-memory (cho SPA) và sessionStorage (cho F5 reload)
const memoryCache = {
  projects: null,
  selectedProjectId: null,
  selectedProject: null,
  details: {}, // { [projectId]: { members, tasks, archivedTasks } }
};

export const getCachedProjects = () => {
  if (Array.isArray(memoryCache.projects) && memoryCache.projects.length > 0) {
    return memoryCache.projects;
  }
  try {
    const raw = sessionStorage.getItem("projectsPage_cachedProjects");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryCache.projects = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading cached projects:", err);
  }
  return [];
};

export const setCachedProjects = (projects) => {
  if (!Array.isArray(projects)) return;
  memoryCache.projects = projects;
  try {
    sessionStorage.setItem("projectsPage_cachedProjects", JSON.stringify(projects));
  } catch (err) {
    console.error("Error writing cached projects:", err);
  }
};

export const getCachedSelectedProjectId = () => {
  if (memoryCache.selectedProjectId) {
    return memoryCache.selectedProjectId;
  }
  try {
    const raw = sessionStorage.getItem("projectsPage_selectedProjectId");
    if (raw) {
      memoryCache.selectedProjectId = raw;
      return raw;
    }
  } catch {}
  return null;
};

export const setCachedSelectedProjectId = (id) => {
  const strId = id ? String(id) : null;
  memoryCache.selectedProjectId = strId;
  try {
    if (strId) {
      sessionStorage.setItem("projectsPage_selectedProjectId", strId);
    } else {
      sessionStorage.removeItem("projectsPage_selectedProjectId");
    }
  } catch {}
};

export const getCachedSelectedProject = () => {
  if (memoryCache.selectedProject) {
    return memoryCache.selectedProject;
  }
  try {
    const raw = sessionStorage.getItem("projectsPage_cachedSelectedProject");
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.selectedProject = parsed;
      return parsed;
    }
  } catch {}
  return null;
};

export const setCachedSelectedProject = (project) => {
  memoryCache.selectedProject = project;
  if (project?.id) {
    setCachedSelectedProjectId(project.id);
  }
  try {
    if (project) {
      sessionStorage.setItem("projectsPage_cachedSelectedProject", JSON.stringify(project));
    } else {
      sessionStorage.removeItem("projectsPage_cachedSelectedProject");
    }
  } catch {}
};

export const getCachedProjectDetails = (projectId) => {
  if (!projectId) return null;
  const strId = String(projectId);
  if (memoryCache.details[strId]) {
    return memoryCache.details[strId];
  }
  try {
    const membersRaw = sessionStorage.getItem(`projectsPage_cachedMembers_${strId}`);
    const tasksRaw = sessionStorage.getItem(`projectsPage_cachedTasks_${strId}`);
    const archivedRaw = sessionStorage.getItem(`projectsPage_cachedArchived_${strId}`);

    if (membersRaw || tasksRaw || archivedRaw) {
      const details = {
        members: membersRaw ? JSON.parse(membersRaw) : [],
        tasks: tasksRaw ? JSON.parse(tasksRaw) : [],
        archivedTasks: archivedRaw ? JSON.parse(archivedRaw) : [],
      };
      memoryCache.details[strId] = details;
      return details;
    }
  } catch {}
  return null;
};

export const setCachedProjectDetails = (projectId, { members, tasks, archivedTasks }) => {
  if (!projectId) return;
  const strId = String(projectId);
  const existing = memoryCache.details[strId] || {};
  const updated = {
    members: members !== undefined ? members : (existing.members || []),
    tasks: tasks !== undefined ? tasks : (existing.tasks || []),
    archivedTasks: archivedTasks !== undefined ? archivedTasks : (existing.archivedTasks || []),
  };
  memoryCache.details[strId] = updated;

  try {
    if (members !== undefined) {
      sessionStorage.setItem(`projectsPage_cachedMembers_${strId}`, JSON.stringify(members));
    }
    if (tasks !== undefined) {
      sessionStorage.setItem(`projectsPage_cachedTasks_${strId}`, JSON.stringify(tasks));
    }
    if (archivedTasks !== undefined) {
      sessionStorage.setItem(`projectsPage_cachedArchived_${strId}`, JSON.stringify(archivedTasks));
    }
  } catch {}
};

export const clearProjectsCache = () => {
  memoryCache.projects = null;
  memoryCache.selectedProjectId = null;
  memoryCache.selectedProject = null;
  memoryCache.details = {};
};
