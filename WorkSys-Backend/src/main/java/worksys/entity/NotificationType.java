package worksys.entity;

public enum NotificationType {
    INVITE, // lời mời vào project
    JOIN, // xác nhận đã tham gia
    TASK_ASSIGNED, // admin/manager giao task cho member
    TASK_ACCEPTED, // member đã nhận task
    DEADLINE_REMINDER // nhắc nhở deadline sắp đến
}
