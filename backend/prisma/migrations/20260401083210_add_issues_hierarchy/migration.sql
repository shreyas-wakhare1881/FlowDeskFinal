-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('EPIC', 'STORY', 'TASK');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "issueKey" TEXT NOT NULL,
    "type" "IssueType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'TODO',
    "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "parentId" TEXT,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "reporterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issues_issueKey_key" ON "issues"("issueKey");

-- CreateIndex
CREATE INDEX "issues_projectId_idx" ON "issues"("projectId");

-- CreateIndex
CREATE INDEX "issues_parentId_idx" ON "issues"("parentId");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- CreateIndex
CREATE INDEX "issues_type_idx" ON "issues"("type");

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
