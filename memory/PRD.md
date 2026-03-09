# ReviewX - Employee Review System PRD

## Original Problem Statement
Build an Employee Review System (ReviewX) with features for:
- Admin, PM, and Employee roles
- Internal reviews by PM/Admin
- Monthly Final reviews aggregated from internal reviews
- Performance tracking and bonus calculations
- User account management

## Technology Stack
- **Backend:** Laravel (PHP) + MySQL
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Auth:** JWT-based authentication

## Current Status: Phase 2 Complete

### Phase 1 (Completed)
- PM "My Reviews" Flow
- Multi-Admin Support
- Annual Anniversary-Based Bonus Calculation
- Backend Migration from FastAPI/MongoDB to Laravel/MySQL

### Phase 2 (Completed - January 2025)

#### Feature 1: Employee/User Creation with Password ✅
- Added Password and Confirm Password fields to Create Employee form
- Backend validation (min 8 chars, confirmation match)
- User account created with bcrypt hashed password
- PM role assigned for PM employees, Employee role for others

#### Feature 2: Admin Password Reset Flow ✅
- POST /api/users/{id}/reset-password endpoint
- Returns new password once for admin to copy (Option A - secure)
- Audit log entry for PASSWORD_RESET
- Frontend dialog shows password with copy button

#### Feature 3: Enhanced Employee Dropdowns ✅
- All dropdowns show "Employee Name (Role)" format
- Applied to: Internal Reviews, Monthly Finals, filters

#### Feature 4: Branding Update ✅
- Changed "ReviewStar" to "ReviewX" everywhere
- Updated: Sidebar, Login page, Browser title

#### Feature 5: Monthly Final Review UI Fix ✅
- Right panel (Internal Reviews Reference) now expands naturally
- Removed scrollbar, removed max-height constraint

#### Feature 6: PM Review Restrictions ✅
- Backend validation prevents PM from reviewing PM or self
- Frontend filters out PM employees from dropdown for PM users

#### Feature 7: Rating Criteria Display ✅
- Added "View Rating Criteria" accordion to category cards
- Shows criteria_bullets from category configuration

### Bug Fixes (January 2025)

#### Employee/User Account Mismatch Bug ✅
- **Problem:** User Accounts page showed fewer users than Employees page
- **Root Cause:** Seeder only created admin user, not employee accounts
- **Solution:**
  - Employees API now returns `has_account` and `account_status` fields
  - Added "Account" column to Employees table
  - Added "Create Account" button for employees without accounts
  - POST /api/employees/{id}/create-account endpoint

#### View Password Once Feature ✅
- Implemented Option A (secure approach)
- Password shown once after creation/reset in dialog
- Copy button with security warning
- Audit logging for all password actions

## API Endpoints

### Authentication
- POST /api/auth/login
- GET /api/auth/me

### Employees (Admin only for write)
- GET /api/employees (includes has_account, account_status)
- GET /api/employees/active
- POST /api/employees (with password fields)
- POST /api/employees/{id}/create-account (new)
- PUT /api/employees/{id}
- DELETE /api/employees/{id}
- PUT /api/employees/{id}/toggle-status

### Users (Admin only)
- GET /api/users
- PUT /api/users/{id}/toggle-status
- POST /api/users/{id}/reset-password (returns new_password)

### Reviews
- GET/POST /api/internal-reviews
- GET/POST /api/monthly-finals
- GET /api/internal-reviews/aggregated

## Test Credentials
- **Admin:** admin@reviewsystem.com / admin123
- **PM:** pm@reviewsystem.com / pm123
- **Employee:** ali.hassan@company.com / employee123

## Database Schema

### Key Tables
- users: id, email, password, role, is_active, linked_employee_id
- employees: id, full_name, email, role_type, status, joining_date
- internal_reviews: id, employee_id, reviewer_user_id, items (JSON)
- monthly_final_reviews: id, employee_id, status, monthly_score
- audit_logs: id, user_id, action, subject_type, data (JSON)

## Future/Backlog Tasks
- Export functionality (CSV/PDF) for reports
- Advanced analytics dashboard
- Dark mode support
- Email notifications for reviews
