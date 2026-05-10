-- CreateTable
CREATE TABLE `projects` (
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `stack` TEXT NULL,
    `devops` TEXT NULL,

    UNIQUE INDEX `projects_name_key`(`name`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `summaries` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `tags` VARCHAR(191) NULL,
    `sdr_ids` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `summaries_project_id_tags_idx`(`project_id`, `tags`),
    FULLTEXT INDEX `summaries_content_tags_idx`(`content`, `tags`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sdr_col` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spec_id` INTEGER NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `que_paso` TEXT NULL,
    `que_senti` TEXT NULL,
    `que_aprendi` TEXT NULL,
    `que_quiero_lograr` TEXT NULL,
    `que_presupongo` TEXT NULL,
    `conceptos_clave` TEXT NULL,
    `ejemplos` TEXT NULL,
    `contraejemplos` TEXT NULL,
    `dudas_pendientes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    FULLTEXT INDEX `sdr_col_que_paso_que_aprendi_conceptos_clave_idx`(`que_paso`, `que_aprendi`, `conceptos_clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `steps` INTEGER NOT NULL,
    `current_step` INTEGER NOT NULL,
    `percentage` INTEGER NOT NULL,
    `status` ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    `context` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `steps_spec` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spec_id` INTEGER NOT NULL,
    `step_number` INTEGER NOT NULL,
    `depends_id` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `meta` TEXT NULL,
    `context` TEXT NULL,
    `status` ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    `sdr` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_specs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spec_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `issues_found` TEXT NULL,
    `fix_plan` TEXT NULL,
    `fixed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `summaries` ADD CONSTRAINT `summaries_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sdr_col` ADD CONSTRAINT `sdr_col_spec_id_fkey` FOREIGN KEY (`spec_id`) REFERENCES `specs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sdr_col` ADD CONSTRAINT `sdr_col_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specs` ADD CONSTRAINT `specs_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `steps_spec` ADD CONSTRAINT `steps_spec_spec_id_fkey` FOREIGN KEY (`spec_id`) REFERENCES `specs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `steps_spec` ADD CONSTRAINT `steps_spec_depends_id_fkey` FOREIGN KEY (`depends_id`) REFERENCES `steps_spec`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_specs` ADD CONSTRAINT `audit_specs_spec_id_fkey` FOREIGN KEY (`spec_id`) REFERENCES `specs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
