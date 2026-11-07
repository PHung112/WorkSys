import EditProjectModal from "./EditProjectModal";
import ConfirmDeleteProjectModal from "./ConfirmDeleteProjectModal";
import InviteMemberModal from "./InviteMemberModal";
import EditRoleModal from "./EditRoleModal";
import EditTaskModal from "./EditTaskModal";
import ConfirmLeaveModal from "./ConfirmLeaveModal";
import SubmitTaskModal from "./SubmitTaskModal";
import TransferAdminModal from "./TransferAdminModal";
import ConfirmModal from "../../common/ConfirmModal";

/**
 * Gom cụm hiển thị toàn bộ các Modal của màn hình Quản lý Dự án (ProjectsPage)
 */
export default function ProjectModals({
  modal,
  modalData,
  onClose,
  selectedProject,
  currentUser,
  members,
  formError,
  // Project form
  projectForm,
  setProjectForm,
  onEditProject,
  onDeleteProject,
  // Member form
  searchQuery,
  setSearchQuery,
  searchResults,
  searchLoading,
  invitedUserIds,
  onInviteMember,
  roleForm,
  setRoleForm,
  onUpdateRole,
  transferTarget,
  setTransferTarget,
  onAdminLeave,
  onRemoveMember,
  // Task form
  taskForm,
  setTaskForm,
  onEditTask,
  onDeleteTask,
  submitForm,
  setSubmitForm,
  onSubmitTask,
  onConfirmDownload,
}) {
  if (!modal) return null;

  return (
    <>
      {modal === "editProject" && (
        <EditProjectModal
          projectForm={projectForm}
          setProjectForm={setProjectForm}
          onSubmit={onEditProject}
          onClose={onClose}
          formError={formError}
        />
      )}

      {modal === "confirmDeleteProject" && (
        <ConfirmDeleteProjectModal
          projectName={selectedProject?.name}
          onConfirm={onDeleteProject}
          onClose={onClose}
        />
      )}

      {modal === "inviteMember" && (
        <InviteMemberModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onAdd={onInviteMember}
          onClose={onClose}
          formError={formError}
          invitedUserIds={invitedUserIds}
        />
      )}

      {modal === "editRole" && (
        <EditRoleModal
          roleForm={roleForm}
          setRoleForm={setRoleForm}
          onSubmit={onUpdateRole}
          onClose={onClose}
          formError={formError}
        />
      )}

      {modal === "editTask" && (
        <EditTaskModal
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          onSubmit={onEditTask}
          onClose={onClose}
          formError={formError}
        />
      )}

      {modal === "confirmLeave" && (
        <ConfirmLeaveModal
          projectName={selectedProject?.name}
          onConfirm={() => onRemoveMember(currentUser.id)}
          onClose={onClose}
        />
      )}

      {modal === "submitTask" && (
        <SubmitTaskModal
          submitForm={submitForm}
          setSubmitForm={setSubmitForm}
          onSubmit={onSubmitTask}
          onClose={onClose}
          formError={formError}
        />
      )}

      {modal === "transferAdmin" && (
        <TransferAdminModal
          members={members}
          currentUserId={currentUser.id}
          transferTarget={transferTarget}
          setTransferTarget={setTransferTarget}
          onSubmit={onAdminLeave}
          onClose={onClose}
          formError={formError}
        />
      )}

      {modal === "confirmKickMember" && (
        <ConfirmModal
          title="Kick thành viên"
          message={`Bạn có chắc chắn muốn xóa ${modalData.username ?? "thành viên này"} khỏi project?`}
          confirmLabel="Kick"
          onConfirm={() => {
            onClose();
            onRemoveMember(modalData.userId);
          }}
          onClose={onClose}
        />
      )}

      {modal === "confirmDeleteTask" && (
        <ConfirmModal
          title="Xóa task"
          message={`Bạn có chắc chắn muốn xóa task "${modalData.title ?? ""}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          onConfirm={() => {
            onClose();
            onDeleteTask(modalData.taskId);
          }}
          onClose={onClose}
        />
      )}

      {modal === "confirmDownload" && (
        <ConfirmModal
          title="Tải về bài nộp"
          message={`Bạn có muốn tải về bài nộp của task "${modalData.title ?? ""}"?`}
          confirmLabel="Tải về"
          danger={false}
          onConfirm={onConfirmDownload}
          onClose={onClose}
        />
      )}
    </>
  );
}
