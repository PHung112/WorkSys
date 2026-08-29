import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { STATUS_CFG } from "../common/statusConfig";
import MemberProfileModal from "./modals/MemberProfileModal";
import { triggerDownload } from "../../config/cloudinaryConfig";

export default function TaskDetailDrawer({
  isOpen,
  task,
  onClose,
  myRole,
  currentUser,
  projectName,
  members = [],
  tasks = [],
  onAcceptTask,
  onOpenSubmitTask,
  onUnsubmitTask,
  onOpenEditTask,
  onOpenConfirmDeleteTask,
  onOpenDownloadConfirm,
}) {
  const navigate = useNavigate();
  const [selectedProfileMember, setSelectedProfileMember] = useState(null);

  // Sắp xếp danh sách assignees: đưa user hiện tại lên đầu tiên
  const sortAssignees = (assignees) => {
    if (!assignees || !currentUser) return assignees || [];
    const hasCurrentUser = assignees.some((u) => u.id === currentUser.id);
    if (hasCurrentUser) {
      return [
        assignees.find((u) => u.id === currentUser.id),
        ...assignees.filter((u) => u.id !== currentUser.id),
      ];
    }
    return assignees;
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { label: "Không có", color: "text-on-surface-variant", bg: "bg-transparent border-transparent" };
    
    let deadlineDate;
    if (deadline.includes("T")) {
        deadlineDate = new Date(deadline.split("T")[0]);
    } else {
        deadlineDate = new Date(deadline);
    }
    
    // reset time for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Đã quá hạn", color: "text-error", bg: "bg-error/10 border-error/20" };
    }
    if (diffDays === 0) {
      return { label: "Hôm nay", color: "text-error", bg: "bg-error/10 border-error/20" };
    }
    if (diffDays === 1) {
      return { label: "Ngày mai", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" };
    }
    return { label: `Còn ${diffDays} ngày`, color: "text-primary", bg: "bg-primary/10 border-primary/20" };
  };

  const formatDateTime = (d) => {
    if (!d) return "";
    if (d.includes("T")) {
      const [datePart, timePart] = d.split("T");
      const [year, month, day] = datePart.split("-");
      return `${timePart.slice(0, 5)} - ${day}/${month}/${year}`;
    }
    if (d.includes("-")) {
      const [year, month, day] = d.split("-");
      return `${day}/${month}/${year}`;
    }
    return d;
  };

  const handleUserClick = (u) => {
    if (u.id === currentUser?.id) {
      navigate("/profile");
    } else {
      const foundMember = members.find((m) => (m.userId || m.id) === u.id) || {
        id: u.id,
        userId: u.id,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: "MEMBER",
      };
      setSelectedProfileMember(foundMember);
    }
  };

  if (!task) return null;

  const deadlineStatus = getDeadlineStatus(task.deadline);
  const sortedAssignees = sortAssignees(task.assignees);
  const isAssignee = task.assignees?.some((u) => u.id === currentUser?.id);
  const hasAccepted = task.acceptedUserIds?.includes(currentUser?.id);

  return (
    <>
      {/* Task Detail Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-[500px] bg-surface-container shadow-2xl transform transition-transform duration-300 ease-in-out z-[80] border-l border-outline-variant/20 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-stack-md border-b border-surface-container-highest shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-surface-container-high rounded border border-outline-variant/10 font-label-xs text-[10px] text-on-surface uppercase tracking-wider font-bold">
              {STATUS_CFG[task.status]?.label || task.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-stack-lg flex flex-col gap-stack-lg custom-scrollbar">
          {/* Header Area */}
          <div>
            <div className="flex items-center gap-1.5 text-primary mb-2">
                <span className="material-symbols-outlined text-[16px]">folder</span>
                <span className="font-label-xs text-xs font-semibold uppercase tracking-wider">{projectName}</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-on-background mb-4 tracking-tight leading-tight">
              {task.title}
            </h2>
            
            <div className="flex flex-col gap-4 text-sm font-body-sm bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
              
              {/* Deadline */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-[120px] shrink-0">
                  Hạn chót
                </span>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      calendar_today
                    </span>
                    {task.deadline ? formatDateTime(task.deadline) : "Không có"}
                  </div>
                  {task.deadline && task.status !== "DONE" && task.status !== "SUBMITTED" && (
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] border uppercase tracking-wider ${deadlineStatus.bg} ${deadlineStatus.color}`}>
                        {deadlineStatus.label}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Created At */}
              {task.createdAt && (
                <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-[120px] shrink-0">
                    Ngày tạo
                    </span>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-[18px]">
                        history
                    </span>
                    {formatDateTime(task.createdAt)}
                    </div>
                </div>
              )}

              {/* Assignees - Avatar đè lên nhau với hiệu ứng hover và click xem profile */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-[120px] shrink-0">
                  Người thực hiện
                </span>
                <div className="flex items-center flex-1">
                  {sortedAssignees.length > 0 ? (
                    <div className="flex items-center -space-x-2.5 py-1">
                      {sortedAssignees.map((u, index) => {
                        const isMe = u.id === currentUser?.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => handleUserClick(u)}
                            style={{ zIndex: sortedAssignees.length - index }}
                            className={`group relative flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-surface-container-low transition-all duration-200 cursor-pointer hover:scale-125 hover:!z-50 hover:shadow-xl ${
                              isMe
                                ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/60 shadow-sm shadow-yellow-500/20"
                                : "bg-surface-container-highest text-primary border border-outline-variant/30"
                            }`}
                          >
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.username}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="font-bold text-xs">
                                {u.username ? u.username.charAt(0).toUpperCase() : "U"}
                              </span>
                            )}

                            {/* Tooltip hiển thị tên khi hover */}
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-neutral-900/95 text-white text-[11px] font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[70] border border-white/10 flex items-center gap-1">
                              <span>{u.username}</span>
                              {isMe && <span className="text-yellow-400 font-bold">(Bạn)</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-on-surface-variant italic text-sm">
                      Chưa có người thực hiện
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3">
            <span className="text-[15px] font-bold text-on-surface uppercase tracking-wider border-b border-surface-container-highest pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                Mô tả chi tiết
            </span>
            <p className="text-[14px] text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container p-4 rounded-xl border border-outline-variant/10 min-h-[80px]">
              {task.description || "Chưa có mô tả chi tiết cho task này."}
            </p>
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-3">
            <span className="text-[15px] font-bold text-on-surface uppercase tracking-wider border-b border-surface-container-highest pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">attach_file</span>
                Tài liệu đính kèm
            </span>
            {task.attachmentUrl ? (
                <div className="p-3 bg-surface-container-high/60 border border-outline-variant/20 rounded-xl flex items-center justify-between group hover:bg-surface-container-highest/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">description</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium text-sm text-on-surface">Tài liệu chi tiết task</span>
                        <span className="text-xs text-on-surface-variant">Đính kèm bởi hệ thống</span>
                    </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={task.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 bg-surface-container-high hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/20"
                        title="Xem trực tiếp trên web"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </a>
                      <button
                        onClick={() => triggerDownload(task.attachmentUrl, `${task.title}_tai_lieu`)}
                        className="w-8 h-8 bg-surface-container-high hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-outline-variant/20"
                        title="Tải file về máy"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-surface-container border border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center text-on-surface-variant/70 text-sm">
                    Chưa có tài liệu đính kèm
                </div>
            )}
          </div>

          {/* Submission */}
          <div className="flex flex-col gap-3">
            <span className="text-[15px] font-bold text-on-surface uppercase tracking-wider border-b border-surface-container-highest pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
                Bài nộp
            </span>
            {task.submissionLink ? (
                <div className="p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-on-surface">Đã nộp bài</span>
                            {task.late && (
                                <span className="px-2 py-0.5 bg-error/15 text-error border border-error/30 rounded font-label-xs text-[11px] font-bold tracking-wide">
                                    Nộp muộn
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {task.submittedAt ? formatDateTime(task.submittedAt) : "Không rõ thời gian"}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={task.submissionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-surface-container-high hover:bg-tertiary/20 text-on-surface-variant hover:text-tertiary rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/20"
                        title="Xem trực tiếp trên web"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </a>
                      <button 
                          onClick={() => triggerDownload(task.submissionLink, `${task.title}_bai_nop`)} 
                          className="px-3.5 py-2 bg-tertiary text-on-tertiary rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-tertiary/90 transition-colors shrink-0 cursor-pointer shadow-sm"
                          title="Tải file về máy"
                      >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Tải về
                      </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-surface-container border border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center text-on-surface-variant/70 text-sm">
                    Chưa có bài nộp
                </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-8 flex flex-col gap-3">
            <div className="flex gap-3">
              {task.status === "TODO" && isAssignee && !hasAccepted && (
                <button
                  onClick={() => {
                    onAcceptTask(task.id);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                  Nhận Task
                </button>
              )}
              {task.status === "IN_PROGRESS" && isAssignee && (
                <button
                  onClick={() => {
                    onOpenSubmitTask(task.id);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-tertiary text-on-tertiary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">publish</span>
                  Nộp bài
                </button>
              )}
              {task.status === "SUBMITTED" && isAssignee && (
                <button
                  onClick={() => {
                    onUnsubmitTask(task.id);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">undo</span>
                  Hủy nộp
                </button>
              )}
              {(!task.assignees || task.assignees.length === 0) &&
                (myRole === "ADMIN" || myRole === "MANAGER") && (
                  <button
                    onClick={() => {
                      onOpenEditTask(task);
                      onClose();
                    }}
                    className="flex-1 py-3 bg-surface-container-high text-on-surface border border-outline-variant/20 rounded-xl font-semibold text-sm hover:bg-surface-container-highest transition-colors cursor-pointer"
                  >
                    Sửa Task
                  </button>
                )}
              {myRole === "ADMIN" && (
                <button
                  onClick={() => {
                    onOpenConfirmDeleteTask(task.id, task.title);
                    onClose();
                  }}
                  className="px-5 py-3 bg-error/10 text-error rounded-xl font-semibold text-sm hover:bg-error/20 transition-colors border border-error/20 flex items-center justify-center cursor-pointer"
                  title="Xóa Task"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-[70] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      {/* Modal xem hồ sơ thành viên khi click vào avatar */}
      <MemberProfileModal
        isOpen={Boolean(selectedProfileMember)}
        onClose={() => setSelectedProfileMember(null)}
        member={selectedProfileMember}
        tasks={tasks}
        currentUser={currentUser}
      />
    </>
  );
}
