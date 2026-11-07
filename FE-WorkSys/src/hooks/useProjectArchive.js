import { useState, useEffect, useMemo, useCallback } from "react";
import projectApi from "../api/projectApi";
import {
  getCachedProjects,
  setCachedProjects,
  getCachedProjectDetails,
  setCachedProjectDetails,
  getCachedSelectedProject,
} from "../utils/projectsCache";

/**
 * Custom Hook quản lý dữ liệu kho lưu trữ nhiệm vụ (Archive)
 */
export function useProjectArchive(projectId, initialTasks = null) {
  const [project, setProject] = useState(() => {
    if (!projectId) return null;
    const found = getCachedProjects().find((p) => String(p.id) === String(projectId));
    if (found) return found;
    const selected = getCachedSelectedProject();
    if (selected && String(selected.id) === String(projectId)) return selected;
    return null;
  });

  const [archivedTasks, setArchivedTasks] = useState(() => {
    if (initialTasks) return initialTasks;
    if (!projectId) return [];
    return getCachedProjectDetails(projectId)?.archivedTasks || [];
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (initialTasks) return false;
    if (!projectId) return true;
    const cached = getCachedProjectDetails(projectId);
    return !(cached?.archivedTasks?.length > 0);
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Load project details and archived tasks
  const loadData = useCallback(async () => {
    if (!projectId || initialTasks) return;
    if (archivedTasks.length === 0) setIsLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        projectApi.getMyProjects(),
        projectApi.getArchivedTasks(projectId),
      ]);
      const currentProj = pRes.data.find((p) => String(p.id) === String(projectId));
      setProject(currentProj || null);
      setArchivedTasks(aRes.data || []);
      setCachedProjects(pRes.data);
      setCachedProjectDetails(projectId, {
        archivedTasks: aRes.data || [],
      });
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [projectId, initialTasks, archivedTasks.length]);

  useEffect(() => {
    if (!initialTasks) {
      loadData();
    } else {
      setArchivedTasks(initialTasks);
    }
  }, [loadData, initialTasks]);

  // Extract unique months (MM/YYYY)
  const availableMonths = useMemo(() => {
    const months = new Set();
    archivedTasks.forEach((task) => {
      if (task.archivedAt) {
        const date = new Date(task.archivedAt);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();
        months.add(`${mm}/${yyyy}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [archivedTasks]);

  // Extract unique assignees
  const availableAssignees = useMemo(() => {
    const assigneesMap = new Map();
    archivedTasks.forEach((task) => {
      task.assignees?.forEach((u) => {
        if (!assigneesMap.has(u.id)) {
          assigneesMap.set(u.id, u);
        }
      });
    });
    return Array.from(assigneesMap.values());
  }, [archivedTasks]);

  // Filter tasks based on search, month, and assignee
  const filteredTasks = useMemo(() => {
    return archivedTasks.filter((task) => {
      const matchQuery =
        !searchQuery.trim() ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchMonth = true;
      if (monthFilter !== "ALL" && task.archivedAt) {
        const date = new Date(task.archivedAt);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();
        matchMonth = `${mm}/${yyyy}` === monthFilter;
      } else if (monthFilter !== "ALL") {
        matchMonth = false;
      }

      let matchAssignee = true;
      if (assigneeFilter !== "ALL") {
        matchAssignee = task.assignees?.some((u) => String(u.id) === String(assigneeFilter));
      }

      return matchQuery && matchMonth && matchAssignee;
    });
  }, [archivedTasks, searchQuery, monthFilter, assigneeFilter]);

  return {
    project,
    archivedTasks,
    isLoading,
    searchQuery,
    setSearchQuery,
    monthFilter,
    setMonthFilter,
    assigneeFilter,
    setAssigneeFilter,
    availableMonths,
    availableAssignees,
    filteredTasks,
    loadData,
  };
}
