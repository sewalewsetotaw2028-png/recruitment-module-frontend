# Backend Workforce Planning — backend-only TODOs

This file replaces any prior UI/client-side TODOs. Scope is **workforce planning backend only** (DB/Prisma → API contracts → validation → services → controllers/routes → tests → build).

## 1) Confirm workforce planning domain + API contract (backend)
- [ ] Identify the workforce planning endpoints that must exist (list, detail, create, update, delete/void, submit, approve, reject).
- [ ] Confirm required query params (pagination, filtering by department/status/date range).
- [ ] Confirm response envelope conventions used across this backend (e.g., `{ status: 'success', data }`, pagination shape, error shape).

## 2) Prisma schema: validate + finalize workforce planning models
- [ ] Review `recruitment-module-backend/prisma/schema.prisma` for workforce planning entities (plan header + plan lines/items) and related entities (department, employee/user, approvals/audit fields).
- [ ] Confirm status enum(s) and allowed transitions (draft → submitted → approved/rejected; plus any “cancelled/archived” state if required).
- [ ] Add/confirm constraints + indexes (unique keys, foreign keys, commonly queried fields like `departmentId`, `status`, `createdAt`).
- [ ] Generate migration(s) if schema changes are required; ensure seed data still runs.

## 3) Authorization: workforce-only access control
- [ ] Identify the correct auth middleware + role/permission model used in this backend.
- [ ] Enforce workforce-only permissions on all workforce planning routes (read vs write vs approve).
- [ ] Ensure createdBy/updatedBy/approvedBy fields are derived from the authenticated user (not trusted from request body).

## 4) DTOs/types: align request/response types with Prisma
- [ ] Locate/define Workforce Planning DTOs in `recruitment-module-backend/src`:
  - [ ] CreatePlanDto (header + lines)
  - [ ] UpdatePlanDto (partial updates, line updates semantics)
  - [ ] SubmitPlanDto / ApprovePlanDto / RejectPlanDto
  - [ ] PlanListItemDto / PlanDetailDto (including nested lines + audit fields)
- [ ] Ensure DTO field names and nullability match Prisma model fields (and what the API should expose).

## 5) Zod validation: strict input validation for workforce endpoints
- [ ] Create/update Zod schemas to match DTOs exactly (required vs optional, min/max, uuid/int validation).
- [ ] Add cross-field validations (e.g., `headcount > 0`, `rejectionReason` required only when rejecting).
- [ ] Ensure Zod validation errors map to consistent 400 responses (no internal leakage).

## 6) Service layer: Prisma operations + transactions
- [ ] Implement list + detail queries (including pagination, sorting, and consistent include/select usage).
- [ ] Implement create/update with correct nested writes for plan lines/items (use Prisma transactions where needed).
- [ ] Decide and enforce line update semantics (replace-all lines vs patch lines by id).
- [ ] Implement delete/void behavior (hard delete vs soft delete) consistently with the rest of the backend.

## 7) Workflow: status transitions + audit trail
- [ ] Implement/verify transitions:
  - [ ] draft → submitted (set `submittedAt`, `submittedBy`)
  - [ ] submitted → approved (set `approvedAt`, `approvedBy`)
  - [ ] submitted → rejected (set `rejectedAt`, `rejectedBy`, `rejectionReason`)
- [ ] Prevent invalid transitions (e.g., approved → draft; rejected → approved unless explicitly allowed).
- [ ] Ensure every transition updates audit fields consistently (`updatedAt`, `updatedBy`).

## 8) Controllers + routes: request parsing and response shaping
- [ ] Add/verify workforce planning routes in the router layer.
- [ ] Controllers must:
  - [ ] Parse `req.params` + `req.body` via Zod schemas
  - [ ] Call service layer only (no Prisma calls directly in controllers)
  - [ ] Return consistent success envelopes and correct HTTP codes
  - [ ] Handle not-found vs forbidden vs validation vs conflict errors explicitly

## 9) Tests (backend-only)
- [ ] Service unit tests for status transitions and invalid transitions.
- [ ] Route/controller integration tests for:
  - [ ] auth/permission enforcement
  - [ ] validation failures
  - [ ] happy paths (create → submit → approve/reject)

## 10) Build/typecheck gate
- [ ] Run `npm run build` in `recruitment-module-backend` and fix all workforce-planning-related TypeScript errors.
- [ ] Note (separately) any build failures outside workforce planning that still block CI, but do not add non-workforce tasks to this list.
