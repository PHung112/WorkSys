import { useParams, useNavigate } from "react-router-dom";
import { useProjectMembers } from "../hooks/useProjectMembers";
import { useMemberActionMenu } from "../hooks/useMemberActionMenu";

// Subcomponents
import MembersHeader from "../components/projects/members/MembersHeader";
import MembersFilterBar from "../components/projects/members/MembersFilterBar";
import MembersTable from "../components/projects/members/MembersTable";
import MemberFloatingMenu from "../components/projects/members/MemberFloatingMenu";

// Modals
import EditRoleModal from "../components/projects/modals/EditRoleModal";
import InviteMemberModal from "../components/projects/modals/InviteMemberModal";
import MemberProfileModal from "../components/projects/modals/MemberProfileModal";
import ConfirmModal from "../components/common/ConfirmModal";

/**
 * Trang toàn màn hình độc lập (/projects/:projectId/members) quản lý danh sách thành viên dự án
 * Đã được refactor tách biệt: Custom Hooks (Business Logic) + Subcomponents (UI Components)
 */
export default function ProjectMembersPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // 1. Custom Hook quản lý dữ liệu và logic nghiệp vụ
  const {
    currentUser,
    project,
    members,
    tasks,
    isLoading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filteredMembers,
    myRole,
    getMemberTaskCount,
    // Modals
    modal,
    modalData,
    roleForm,
    setRoleForm,
    profileMember,
    setProfileMember,
    formError,
    searchMemberQuery,
    setSearchMemberQuery,
    searchMemberResults,
    searchMemberLoading,
    invitedUserIds,
    openInviteModal,
    openEditRoleModal,
    openPromoteModal,
    openKickModal,
    closeModal,
    // API Actions
    handleInviteMember,
    handleUpdateRole,
    handleRemoveMember,
  } = useProjectMembers(projectId, navigate);

  // 2. Custom Hook quản lý vị trí và tương tác Floating Menu
  const {
    activeMenuMemberId,
    activeMember,
    menuCoords,
    menuRef,
    handleToggleMenu,
    handleCloseMenu,
  } = useMemberActionMenu();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background font-body-sm text-on-background flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full"></div>
            <p className="text-on-surface-variant font-body-sm">Đang tải dữ liệu thành viên...</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Header Breadcrumb & Actions */}
        <MembersHeader
          project={project}
          membersCount={members.length}
          canInvite={myRole === "ADMIN" || myRole === "MANAGER"}
          onBack={() => navigate(projectId ? `/projects?goto=${projectId}` : "/projects")}
          onOpenInvite={openInviteModal}
        />

        {/* Thanh tìm kiếm & Lọc vai trò */}
        <MembersFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
        />

        {/* Bảng danh sách thành viên */}
        <MembersTable
          members={filteredMembers}
          currentUser={currentUser}
          getMemberTaskCount={getMemberTaskCount}
          activeMenuMemberId={activeMenuMemberId}
          onToggleMenu={handleToggleMenu}
        />
      </div>

      {/* Dropdown Menu nổi toàn cục (Tự động canh vị trí trên/dưới & chiều cao vừa vặn) */}
      <MemberFloatingMenu
        menuRef={menuRef}
        activeMember={activeMember}
        menuCoords={menuCoords}
        myRole={myRole}
        currentUser={currentUser}
        onViewProfile={setProfileMember}
        onEditRole={openEditRoleModal}
        onPromoteManager={openPromoteModal}
        onKickMember={openKickModal}
        onClose={handleCloseMenu}
      />

      {/* Modals */}
      {modal === "invite" && (
        <InviteMemberModal
          searchQuery={searchMemberQuery}
          setSearchQuery={setSearchMemberQuery}
          searchResults={searchMemberResults}
          searchLoading={searchMemberLoading}
          onAdd={handleInviteMember}
          onClose={closeModal}
          formError={formError}
          invitedUserIds={invitedUserIds}
        />
      )}

      {modal === "editRole" && (
        <EditRoleModal
          roleForm={roleForm}
          setRoleForm={setRoleForm}
          onSubmit={handleUpdateRole}
          onClose={closeModal}
          formError={formError}
        />
      )}

      {modal === "confirmKick" && (
        <ConfirmModal
          title="Kick thành viên"
          message={`Bạn có chắc chắn muốn xóa "${modalData.username || "thành viên này"}" khỏi project?`}
          confirmLabel="Xóa khỏi dự án"
          onConfirm={() => {
            closeModal();
            handleRemoveMember(modalData.userId);
          }}
          onClose={closeModal}
        />
      )}

      <MemberProfileModal
        isOpen={Boolean(profileMember)}
        onClose={() => setProfileMember(null)}
        member={profileMember}
        tasks={tasks}
        currentUser={currentUser}
      />
    </div>
  );
}
