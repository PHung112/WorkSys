import { useNavigate, useSearchParams } from "react-router-dom";
import { useProjectsManager } from "../hooks/useProjectsManager";

import ProjectSidebar from "../components/projects/ProjectSidebar";
import ProjectDetail from "../components/projects/ProjectDetail";
import MyTasksDetail from "../components/projects/MyTasksDetail";
import CreateProjectView from "../components/projects/CreateProjectView";
import ProjectModals from "../components/projects/modals/ProjectModals";

/**
 * Trang quản lý dự án (ProjectsPage):
 * - Tái cấu trúc theo kiến trúc sạch: useProjectsManager (Nghiệp vụ, Realtime, Cache)
 *   kết hợp các UI Subcomponents (Sidebar, Main Views, Modals)
 */
export default function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    currentUser,
    projects,
    selectedProject,
    setSelectedProject,
    members,
    tasks,
    archivedTasks,
    isInitialLoadingProjects,
    isLoadingDetails,
    activeTab,
    setActiveTab,
    showMyTasks,
    setShowMyTasks,
    isCreatingProject,
    setIsCreatingProject,
    sidebarOpen,
    setSidebarOpen,
    myRole,
    // Modals & forms
    modal,
    modalData,
    openModal,
    closeModal,
    projectForm,
    setProjectForm,
    roleForm,
    setRoleForm,
    taskForm,
    setTaskForm,
    submitForm,
    setSubmitForm,
    formError,
    transferTarget,
    setTransferTarget,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    invitedUserIds,
    // Operations
    loadProjects,
    selectProject,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
    handleInviteMember,
    handleRemoveMember,
    handleAdminLeave,
    handleUpdateRole,
    handleEditTask,
    handleDeleteTask,
    handleAcceptTask,
    handleDoSubmitTask,
    handleUnsubmitTask,
    handleConfirmDownload,
    handleLogout,
  } = useProjectsManager(navigate, searchParams, setSearchParams);

  if (!currentUser) return null;

  return (
    <div className="bg-background font-body-sm text-on-background flex-1 w-full flex">
      {/* Sidebar điều hướng danh sách dự án */}
      <ProjectSidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={(p) => selectProject(p, "members", true)}
        onOpenCreateProject={() => {
          setShowMyTasks(false);
          setSelectedProject(null);
          setIsCreatingProject(true);
        }}
        onOpenMyTasks={() => {
          setSelectedProject(null);
          setIsCreatingProject(false);
          setShowMyTasks(true);
        }}
        showMyTasks={showMyTasks}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onLogout={handleLogout}
        isLoading={isInitialLoadingProjects}
      />

      {/* Main Workspace Content */}
      <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-4rem)]">
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {showMyTasks ? (
            <MyTasksDetail
              currentUser={currentUser}
              onBack={() => {
                setShowMyTasks(false);
                if (projects.length > 0) {
                  selectProject(projects[0], "tasks", true);
                }
              }}
              onSelectProject={(projectId) => {
                const target = projects.find((p) => p.id === projectId);
                if (target) {
                  setShowMyTasks(false);
                  selectProject(target, "tasks", true);
                }
              }}
            />
          ) : isCreatingProject ? (
            <CreateProjectView
              projectForm={projectForm}
              setProjectForm={setProjectForm}
              onSubmit={handleCreateProject}
              onCancel={() => {
                setIsCreatingProject(false);
                if (projects.length > 0) selectProject(projects[0], "members", true);
              }}
              formError={formError}
            />
          ) : isInitialLoadingProjects ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full"></div>
              <p className="text-sm font-medium text-on-surface-variant">Đang tải dữ liệu dự án...</p>
            </div>
          ) : !selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full opacity-60 select-none pb-20">
              <span
                className="material-symbols-outlined text-[80px] text-surface-container-highest mb-4"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                folder_open
              </span>
              <p className="text-xl font-display font-semibold text-on-surface mb-2 tracking-tight">
                Chọn một dự án
              </p>
              <button
                onClick={() => {
                  setProjectForm({ name: "", description: "" });
                  setIsCreatingProject(true);
                }}
                className="text-sm font-label-md text-primary hover:text-primary-fixed hover:bg-primary/10 px-4 py-2 rounded-lg transition-all"
              >
                hoặc tạo dự án mới
              </button>
            </div>
          ) : (
            <ProjectDetail
              selectedProject={selectedProject}
              members={members}
              tasks={tasks}
              archivedTasks={archivedTasks}
              currentUser={currentUser}
              myRole={myRole}
              isLoading={isLoadingDetails}
              onOpenEditProject={() => {
                setProjectForm({
                  name: selectedProject.name,
                  description: selectedProject.description || "",
                });
                openModal("editProject");
              }}
              onOpenDeleteProject={() => openModal("confirmDeleteProject")}
              onOpenLeave={() => openModal("confirmLeave")}
              onOpenTransfer={() => {
                setTransferTarget("");
                openModal("transferAdmin");
              }}
              onOpenInviteMember={() => openModal("inviteMember")}
              onOpenConfirmKick={(userId, username) =>
                openModal("confirmKickMember", { userId, username })
              }
              onOpenEditRole={(userId, role) => {
                setRoleForm({ role });
                openModal("editRole", { userId });
              }}
              onOpenCreateTask={() => {
                navigate(`/projects/${selectedProject.id}/new-task`);
              }}
              onOpenEditTask={(task) => {
                setTaskForm({
                  title: task.title,
                  description: task.description || "",
                  deadline: task.deadline || "",
                  assignedToIds: [],
                });
                openModal("editTask", { taskId: task.id });
              }}
              onOpenConfirmDeleteTask={(taskId, title) =>
                openModal("confirmDeleteTask", { taskId, title })
              }
              onAcceptTask={handleAcceptTask}
              onOpenSubmitTask={(taskId) => {
                setSubmitForm({ link: "", file: null, taskId });
                openModal("submitTask");
              }}
              onOpenDownloadConfirm={(link, title) =>
                openModal("confirmDownload", { submissionLink: link, title })
              }
              onUnsubmitTask={handleUnsubmitTask}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <ProjectModals
        modal={modal}
        modalData={modalData}
        onClose={closeModal}
        selectedProject={selectedProject}
        currentUser={currentUser}
        members={members}
        formError={formError}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        invitedUserIds={invitedUserIds}
        onInviteMember={handleInviteMember}
        roleForm={roleForm}
        setRoleForm={setRoleForm}
        onUpdateRole={handleUpdateRole}
        transferTarget={transferTarget}
        setTransferTarget={setTransferTarget}
        onAdminLeave={handleAdminLeave}
        onRemoveMember={handleRemoveMember}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        submitForm={submitForm}
        setSubmitForm={setSubmitForm}
        onSubmitTask={handleDoSubmitTask}
        onConfirmDownload={handleConfirmDownload}
      />
    </div>
  );
}