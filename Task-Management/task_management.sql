-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 29, 2026 at 05:25 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `task_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `invite_role` varchar(20) DEFAULT NULL,
  `message` varchar(500) NOT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `status` enum('ACCEPTED','DECLINED','PENDING') DEFAULT NULL,
  `type` enum('DEADLINE_REMINDER','INVITE','JOIN','TASK_ACCEPTED','TASK_ASSIGNED') NOT NULL,
  `recipient_id` bigint(20) NOT NULL,
  `sender_id` bigint(20) DEFAULT NULL,
  `task_id` bigint(20) DEFAULT NULL,
  `task_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `created_at`, `invite_role`, `message`, `project_id`, `project_name`, `is_read`, `status`, `type`, `recipient_id`, `sender_id`, `task_id`, `task_name`) VALUES
(1, '2026-03-11 20:52:36.000000', 'MEMBER', 'Bạn được mời vào project \"a\" bởi phi', 13, 'a', b'1', 'ACCEPTED', 'INVITE', 9, 6, NULL, NULL),
(2, '2026-03-11 20:52:46.000000', NULL, 'abc đã tham gia vào project \"a\"', 13, 'a', b'1', NULL, 'JOIN', 6, 9, NULL, NULL),
(3, '2026-03-12 20:14:25.000000', 'MANAGER', 'Bạn được mời vào project \"abc\" bởi abc', 5, 'abc', b'1', 'ACCEPTED', 'INVITE', 13, 9, NULL, NULL),
(4, '2026-03-12 20:14:44.000000', NULL, 'phihung đã tham gia vào project \"abc\"', 5, 'abc', b'1', NULL, 'JOIN', 9, 13, NULL, NULL),
(5, '2026-03-12 20:27:53.000000', NULL, 'Bạn có 1 task mới được giao từ abc ở project \"abc\": d', 5, 'abc', b'1', NULL, 'TASK_ASSIGNED', 13, 9, 11, 'd'),
(6, '2026-03-12 20:44:21.000000', NULL, 'Bạn có 1 task mới được giao từ abc ở project \"abc\": a', 5, 'abc', b'1', NULL, 'TASK_ASSIGNED', 13, 9, 12, 'a'),
(7, '2026-03-12 20:47:00.000000', NULL, 'phihung đã nhận task \"a\" ở project \"abc\"', 5, 'abc', b'1', NULL, 'TASK_ACCEPTED', 9, 13, 12, 'a'),
(8, '2026-03-12 21:05:51.000000', NULL, 'Bạn có 1 task mới được giao từ abc ở project \"abc\": a', 5, 'abc', b'0', NULL, 'TASK_ASSIGNED', 13, 9, 13, 'a'),
(9, '2026-03-16 10:43:00.000000', 'MANAGER', 'Bạn được mời vào project \"abc toi\" bởi TM Phoenix', 14, 'abc toi', b'0', 'PENDING', 'INVITE', 10, 14, NULL, NULL),
(10, '2026-03-16 12:07:02.000000', 'MEMBER', 'Bạn được mời vào project \"abc\" bởi abc', 5, 'abc', b'1', 'ACCEPTED', 'INVITE', 14, 9, NULL, NULL),
(11, '2026-03-16 12:07:24.000000', NULL, 'TM Phoenix đã tham gia vào project \"abc\"', 5, 'abc', b'1', NULL, 'JOIN', 9, 14, NULL, NULL),
(12, '2026-03-17 10:18:02.000000', 'MEMBER', 'Bạn được mời vào project \"a\" bởi phi', 13, 'a', b'1', 'ACCEPTED', 'INVITE', 9, 6, NULL, NULL),
(13, '2026-03-18 20:50:56.000000', NULL, 'abc đã tham gia vào project \"a\"', 13, 'a', b'1', NULL, 'JOIN', 6, 9, NULL, NULL),
(14, '2026-03-18 20:51:23.000000', NULL, 'Bạn có 1 task mới được giao từ abc ở project \"abc\": tesst', 5, 'abc', b'1', NULL, 'TASK_ASSIGNED', 6, 9, 14, 'tesst'),
(15, '2026-03-18 20:51:37.000000', NULL, 'phi đã nhận task \"tesst\" ở project \"abc\"', 5, 'abc', b'1', NULL, 'TASK_ACCEPTED', 9, 6, 14, 'tesst'),
(16, '2026-03-18 20:56:20.000000', NULL, 'Bạn có 1 task mới được giao từ phi ở project \"a\": acv', 13, 'a', b'1', NULL, 'TASK_ASSIGNED', 9, 6, 15, 'acv'),
(17, '2026-03-19 09:12:41.000000', NULL, 'Bạn có 1 task mới được giao từ phi ở project \"a\": a', 16, 'a', b'1', NULL, 'TASK_ASSIGNED', 6, 6, 16, 'a'),
(18, '2026-03-19 09:13:21.000000', NULL, 'phi đã nhận task \"a\" ở project \"a\"', 16, 'a', b'1', NULL, 'TASK_ACCEPTED', 6, 6, 16, 'a');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `created_by` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `created_at`, `description`, `name`, `created_by`) VALUES
(1, '2026-03-06 14:51:25.000000', 'Xây dựng ứng dụng quản lý công việc bằng React và Spring Boot', 'Dự án Task Management', 1),
(2, '2026-03-06 14:51:25.000000', 'Phát triển hệ thống thương mại điện tử', 'Website Bán Hàng', 1),
(3, '2026-03-06 21:33:37.000000', 'Demoeeee', 'Demo', 5),
(5, '2026-03-09 15:08:24.000000', '123', 'abc', 9),
(6, '2026-03-10 13:11:29.000000', '123', 'New', 10),
(8, '2026-03-10 13:33:00.000000', 'a', 'abccc', 10),
(10, '2026-03-10 13:44:55.000000', 'a', 'avcd', 10),
(12, '2026-03-11 14:51:01.000000', 'ew', 'bew', 6),
(13, '2026-03-11 20:52:28.000000', 'vb', 'a', 6),
(14, '2026-03-16 10:42:51.000000', 'new', 'abc toi', 14),
(15, '2026-03-16 12:05:44.000000', 'c', 'avc', 14),
(16, '2026-03-19 09:12:12.000000', 'aaaaaaa', 'a', 6);

-- --------------------------------------------------------

--
-- Table structure for table `project_members`
--

CREATE TABLE `project_members` (
  `id` bigint(20) NOT NULL,
  `role` enum('ADMIN','MANAGER','MEMBER','VIEWER') NOT NULL,
  `project_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_members`
--

INSERT INTO `project_members` (`id`, `role`, `project_id`, `user_id`) VALUES
(1, 'ADMIN', 1, 1),
(2, 'MEMBER', 1, 2),
(3, 'VIEWER', 1, 3),
(6, 'ADMIN', 3, 5),
(8, 'ADMIN', 5, 9),
(10, 'MEMBER', 6, 1),
(17, 'ADMIN', 10, 10),
(30, 'MEMBER', 5, 6),
(31, 'ADMIN', 13, 6),
(33, 'MANAGER', 5, 13),
(34, 'ADMIN', 14, 14),
(35, 'ADMIN', 15, 14),
(36, 'MEMBER', 5, 14),
(37, 'MEMBER', 13, 9),
(38, 'ADMIN', 16, 6);

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` bigint(20) NOT NULL,
  `deadline` date DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('TODO','ASSIGNED','IN_PROGRESS','SUBMITTED','DONE') NOT NULL DEFAULT 'TODO',
  `title` varchar(255) NOT NULL,
  `assigned_to` bigint(20) NOT NULL,
  `project_id` bigint(20) NOT NULL,
  `submission_link` varchar(512) DEFAULT NULL,
  `submitted_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `deadline`, `description`, `status`, `title`, `assigned_to`, `project_id`, `submission_link`, `submitted_at`) VALUES
(1, '2026-03-10', 'Thiết kế các bảng users, projects, tasks', 'SUBMITTED', 'Thiết kế Database', 1, 1, NULL, NULL),
(2, '2026-03-15', 'Hoàn thiện UserController và UserService', 'IN_PROGRESS', 'Viết API User', 2, 1, NULL, NULL),
(8, '2026-03-19', 'b', 'SUBMITTED', 'a', 6, 5, '/api/files/889a5329-89c0-4ae3-83aa-d1c6f0e4369c_New_Text_Document.txt', NULL),
(10, '2026-03-27', '`123', 'IN_PROGRESS', 'cho phihung', 13, 5, NULL, NULL),
(11, '2026-03-23', 'd', 'TODO', 'd', 13, 5, NULL, NULL),
(12, '2026-03-04', 'b', 'IN_PROGRESS', 'a', 13, 5, NULL, NULL),
(13, NULL, 'b', 'TODO', 'a', 13, 5, NULL, NULL),
(14, '2026-03-19', '123', 'IN_PROGRESS', 'tesst', 6, 5, NULL, NULL),
(15, '2026-03-20', 'd', 'TODO', 'acv', 9, 13, NULL, NULL),
(16, '2026-03-26', 'aaaa', 'IN_PROGRESS', 'a', 6, 16, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `username`, `google_id`, `avatar_url`) VALUES
(1, 'haha@gmail.com', 'Demo@123', 'Phi Hung', NULL, NULL),
(2, 'nguyenvana@gmail.com', 'Pass123', 'Nguyen Van A', NULL, NULL),
(3, 'lethib@gmail.com', 'Pass123', 'Le Thi B', NULL, NULL),
(4, 'tranc@gmail.com', 'Pass123', 'Tran Van C', NULL, NULL),
(5, 'demo@gmail.com', '$2a$10$zxNDz7/Ruoe3FRX.CkmlH.MhDbJjTORKTwr56OGZltNMQWIOZy85a', 'demo', NULL, NULL),
(6, 'alo@gmail.com', '$2a$10$oKCwKLk4TbN54BkwCM3m8uZHqpyStszs3z556dSo3T/2gBGAioXUm', 'phi', NULL, NULL),
(7, 'hhihi@gmail.com', '$2a$10$jWp/qU26ABW3dyOvQ2DQ1u0Gx9R8CjJHmfGmazwC3ZB.YJk3WN/n6', 'huhu', NULL, NULL),
(9, 'hahaa@gmail.com', '$2a$10$kbAt3vdMAsC8BOHF/aS2L.JfDnReH2oQS3qp6yuoDKK/3wkUFDOUm', 'abc', NULL, NULL),
(10, 'hkoko@gmail.com', '$2a$10$NKZ7ilB1udM.O/YWwhIS9uY/Q4SQUIxT8ZVQiz2381cPxKZ5xZTbm', 'haaaa', NULL, NULL),
(13, 'demo1@gmail.com', '$2a$10$Ih79M/YkaNy9KEk3.OWANuj8qZIfEgl6Di3cuE73P4Adq2mc2Plyi', 'phihung', NULL, NULL),
(14, 'toanvari5@gmail.com', '', 'TM Phoenix', '114064456229195678286', 'https://res.cloudinary.com/dud6jryis/image/upload/v1773717707/qh5l50yrbvbkhuf7vxnc.png');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKqqnsjxlwleyjbxlmm213jaj3f` (`recipient_id`),
  ADD KEY `FK13vcnq3ukas06ho1yrbc5lrb5` (`sender_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKf1ph00os6khfle3ub9b50x594` (`created_by`);

--
-- Indexes for table `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKaydweb1re2g5786xaugww4u0` (`project_id`,`user_id`),
  ADD KEY `FKgul2el0qjk5lsvig3wgajwm77` (`user_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK2vjo8mbre3rvpbd6e7976b54m` (`assigned_to`),
  ADD KEY `FKsfhn82y57i3k9uxww1s007acc` (`project_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  ADD UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  ADD UNIQUE KEY `UKovh8xmu9ac27t18m56gri58i1` (`google_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `FK13vcnq3ukas06ho1yrbc5lrb5` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `FKqqnsjxlwleyjbxlmm213jaj3f` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `FKf1ph00os6khfle3ub9b50x594` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `project_members`
--
ALTER TABLE `project_members`
  ADD CONSTRAINT `FKdki1sp2homqsdcvqm9yrix31g` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `FKgul2el0qjk5lsvig3wgajwm77` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `FK2vjo8mbre3rvpbd6e7976b54m` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `FKsfhn82y57i3k9uxww1s007acc` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
