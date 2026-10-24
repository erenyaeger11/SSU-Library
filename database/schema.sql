CREATE DATABASE IF NOT EXISTS library_visitors
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE library_visitors;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  password_reset_required TINYINT(1) NOT NULL DEFAULT 0,
  role ENUM('Admin', 'Staff') NOT NULL DEFAULT 'Staff',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_username (username),
  UNIQUE KEY uq_admins_email (email),
  KEY idx_admins_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(40) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  program VARCHAR(120) NOT NULL,
  year_level VARCHAR(30) NOT NULL,
  qr_identifier VARCHAR(80) NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_student_id (student_id),
  UNIQUE KEY uq_students_qr_identifier (qr_identifier),
  KEY idx_students_name (full_name),
  KEY idx_students_program (program),
  KEY idx_students_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visitor_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  student_code VARCHAR(40) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  program VARCHAR(120) NOT NULL,
  year_level VARCHAR(30) NOT NULL,
  purpose ENUM('Study', 'Borrow Book') NOT NULL,
  visit_date DATE NOT NULL,
  time_in TIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_visits_date_created (visit_date, created_at),
  KEY idx_visits_student_created (student_id, created_at),
  KEY idx_visits_program_date (program, visit_date),
  KEY idx_visits_purpose_date (purpose, visit_date),
  CONSTRAINT fk_visits_student FOREIGN KEY (student_id) REFERENCES students (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
