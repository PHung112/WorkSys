import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import projectApi from "../../../api/projectApi";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";

/**
 * Modal điều chỉnh chuyên môn của thành viên trong dự án.
 * Hỗ trợ chọn từ danh sách chuẩn + danh sách riêng của dự án,
 * và cho phép thêm chuyên môn mới (chỉ lưu riêng cho dự án hiện tại).
 */
export default function EditPositionModal({
  projectId,
  member,
  onSubmit,
  onClose,
  formError,
}) {
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(member?.position || "");
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tải danh sách chuyên môn khả dụng của dự án (mặc định + custom của project này)
  useEffect(() => {
    let isMounted = true;
    if (!projectId) return;

    setIsLoadingPositions(true);
    projectApi
      .getProjectPositions(projectId)
      .then((res) => {
        if (isMounted) {
          const list = res.data || [];
          setPositions(list);
          if (member?.position && !list.includes(member.position)) {
            setPositions((prev) => [...prev, member.position]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg("Không thể tải danh sách chuyên môn");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPositions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, member?.position]);

  // Thêm chuyên môn mới vào riêng dự án này
  const handleAddNewPosition = async (e) => {
    e.preventDefault();
    const trimmed = newPositionName.trim();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập tên chuyên môn đầy đủ");
      return;
    }

    setIsSubmittingNew(true);
    setErrorMsg("");
    try {
      const res = await projectApi.addProjectPosition(projectId, trimmed);
      const updatedList = res.data || [];
      setPositions(updatedList);
      setSelectedPosition(trimmed);
      setNewPositionName("");
      setIsAddingNew(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Không thể thêm chuyên môn mới");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const targetUserId = member?.userId || member?.id;
    onSubmit(targetUserId, selectedPosition);
  };

  return (
    <Modal title="Điều chỉnh chuyên môn" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Thông tin thành viên */}
        <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/15">
          <div className="w-10 h-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm ring-1 ring-outline-variant/20">
            {member?.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
            ) : (
              member?.username?.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-on-surface font-semibold text-sm truncate">{member?.username}</span>
            <span className="text-on-surface-variant text-xs truncate">{member?.email || "Chưa có email"}</span>
          </div>
        </div>

        {/* Droplist chọn chuyên môn */}
        <div>
          <label className={labelCls}>Chọn chuyên môn trong dự án</label>
          {isLoadingPositions ? (
            <div className="h-10 bg-surface-container-high rounded-lg animate-pulse flex items-center px-3 text-xs text-on-surface-variant">
              Đang tải danh sách chuyên môn...
            </div>
          ) : (
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className={`${inputCls} bg-surface-container-high cursor-pointer`}
            >
              <option value="">-- Chưa thiết lập chuyên môn --</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          )}

          {/* Gợi ý vị trí hiện tại */}
          {member?.position && (
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Chuyên môn hiện tại: <span className="font-semibold text-primary">{member.position}</span>
            </p>
          )}
        </div>

        {/* Khung thêm chuyên môn mới (Scoped riêng cho project này) */}
        {!isAddingNew ? (
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(true);
              setErrorMsg("");
            }}
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Thêm chuyên môn mới (chỉ lưu riêng cho dự án này)</span>
          </button>
        ) : (
          <div className="p-3.5 bg-surface-container-highest/60 rounded-xl border border-primary/20 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">new_label</span>
                Tạo chuyên môn mới
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewPositionName("");
                  setErrorMsg("");
                }}
                className="text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div>
              <input
                type="text"
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                placeholder="Ví dụ: AI Specialist, Game Developer, Smart Contract Dev..."
                className={`${inputCls} text-xs py-2`}
                autoFocus
              />
              <p className="text-[11px] text-amber-400/90 mt-1.5 italic">
                *(Vui lòng viết rõ ràng tên đầy đủ, hạn chế viết tắt để các thành viên trong dự án dễ nhận biết)*
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewPositionName("");
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddNewPosition}
                disabled={isSubmittingNew || !newPositionName.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-primary hover:bg-primary/90 text-on-primary font-medium disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                {isSubmittingNew && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>}
                Thêm vào dự án
              </button>
            </div>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {(errorMsg || formError) && (
          <p className="text-error text-xs font-medium">{errorMsg || formError}</p>
        )}

        {/* Nút hành động */}
        <div className="flex gap-3 pt-2 border-t border-outline-variant/10">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button type="submit" className={btnPrimary}>
            Cập nhật chuyên môn
          </button>
        </div>
      </form>
    </Modal>
  );
}

