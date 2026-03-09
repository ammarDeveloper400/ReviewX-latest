# API Contract Documentation - ReviewX Employee Review System

This document describes all API endpoints used by the React frontend, their request/response shapes, and auth requirements.

## Base URL
- Production: `https://reviewx-update.preview.emergentagent.com/api`
- Local Laravel: `http://localhost:8001/api`

## Authentication
All protected endpoints require JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer {jwt_token}
```

---

## Auth Endpoints

### POST /api/auth/login
**Description:** Authenticate user and receive JWT token  
**Auth:** Public  
**Request:**
```json
{
  "email": "string (email)",
  "password": "string"
}
```
**Response 200:**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "Admin|PM|Employee",
    "linked_employee_id": "uuid|null",
    "is_active": true,
    "last_login_at": "datetime|null",
    "created_at": "datetime"
  }
}
```

### POST /api/auth/register
**Description:** Register new user (Admin only)  
**Auth:** Admin  
**Request:**
```json
{
  "email": "string (email)",
  "password": "string",
  "role": "Admin|PM|Employee",
  "linked_employee_id": "uuid|null"
}
```
**Response 200:** UserResponse object

### GET /api/auth/me
**Description:** Get current authenticated user  
**Auth:** Any authenticated user  
**Response 200:** UserResponse object

---

## Employee Endpoints

### GET /api/employees
**Description:** List all employees  
**Auth:** Any authenticated user  
**Response 200:** Array of Employee objects

### GET /api/employees/active
**Description:** Get active employees for dropdowns  
**Auth:** Any authenticated user  
**Query Params:** `include_inactive: bool = false`  
**Response 200:** Array of Employee objects

### GET /api/employees/{employee_id}
**Description:** Get single employee  
**Auth:** Admin, PM, or Employee (own profile only)  
**Response 200:** Employee object

### POST /api/employees
**Description:** Create new employee  
**Auth:** Admin only  
**Request:**
```json
{
  "full_name": "string",
  "email": "string (email)",
  "phone": "string|null",
  "role_type": "Dev|QA|UI/UX|PM",
  "department": "string|null",
  "joining_date": "datetime",
  "base_salary": "number|null"
}
```
**Response 200:** Employee object

### PUT /api/employees/{employee_id}
**Description:** Update employee  
**Auth:** Admin only  
**Request:** Partial Employee fields  
**Response 200:** Employee object

### DELETE /api/employees/{employee_id}
**Description:** Delete employee  
**Auth:** Admin only  
**Response 200:** `{"message": "Employee deleted successfully"}`

### PUT /api/employees/{employee_id}/toggle-status
**Description:** Toggle employee Active/Inactive  
**Auth:** Admin only  
**Query Params:** `deactivate_linked_user: bool = true`  
**Response 200:**
```json
{
  "message": "Employee status changed to ...",
  "employee": { Employee object },
  "linked_user_deactivated": "email|null",
  "linked_user_activated": "email|null"
}
```

### GET /api/employees/{employee_id}/performance
**Description:** Get employee performance data with reviews  
**Auth:** Admin, PM, or Employee (own profile only)  
**Query Params:**
- `year: int` - Filter by year
- `start_month: int` - Custom range start month (1-12)
- `start_year: int` - Custom range start year
- `end_month: int` - Custom range end month (1-12)
- `end_year: int` - Custom range end year

**Response 200:**
```json
{
  "employee": { Employee object },
  "cumulative_score": 3.75,
  "bonus_bracket": {
    "multiplier": 1.0,
    "label": "1 salary",
    "min": 3.60,
    "max": 4.09
  },
  "total_reviews": 5,
  "monthly_finals": [ MonthlyFinalReview[] ],
  "internal_reviews": [ InternalReview[] (Admin/PM only) ],
  "warnings": [ Warning[] ],
  "warning_count": 0,
  "available_years": [2025, 2024],
  "selected_year": 2025,
  "custom_range": null | { start_month, start_year, end_month, end_year }
}
```

---

## User Management Endpoints

### GET /api/users
**Description:** List all users with enriched employee data  
**Auth:** Admin only  
**Response 200:**
```json
[
  {
    "id": "uuid",
    "email": "string",
    "role": "Admin|PM|Employee",
    "is_active": true,
    "linked_employee_id": "uuid|null",
    "employee_name": "string|null",
    "employee_status": "Active|Inactive|...",
    "last_login_at": "datetime|null",
    "created_at": "datetime"
  }
]
```

### PUT /api/users/{user_id}/toggle-status
**Description:** Toggle user account Active/Inactive  
**Auth:** Admin only  
**Response 200:**
```json
{
  "message": "User account activated/deactivated",
  "user_id": "uuid",
  "is_active": true|false
}
```

---

## Category Endpoints

### GET /api/categories
**Description:** List categories  
**Auth:** Any authenticated user  
**Query Params:** `enabled_only: bool = false`  
**Response 200:** Array of Category objects

### GET /api/categories/{category_id}
**Description:** Get single category  
**Auth:** Any authenticated user  
**Response 200:** Category object

### POST /api/categories
**Description:** Create category  
**Auth:** Admin only  
**Request:**
```json
{
  "title": "string",
  "criteria_short_text": "string",
  "criteria_bullets": "string|null",
  "display_order": 0
}
```
**Response 200:** Category object

### PUT /api/categories/{category_id}
**Description:** Update category  
**Auth:** Admin only  
**Request:** Partial Category fields  
**Response 200:** Category object

### DELETE /api/categories/{category_id}
**Description:** Delete category (fails if used in reviews)  
**Auth:** Admin only  
**Response 200:** `{"message": "Category deleted successfully"}`

---

## Internal Review Endpoints

### GET /api/internal-reviews
**Description:** List internal reviews  
**Auth:** Admin, PM  
**Query Params:**
- `employee_id: string`
- `month: int`
- `year: int`
- `reviewer_id: string`

**Response 200:** Array of InternalReview objects

### GET /api/internal-reviews/aggregated
**Description:** Get aggregated data from all internal reviews for a period  
**Auth:** Admin, PM  
**Query Params:** `employee_id, month, year` (all required)  
**Validations:** PM cannot view their own employee profile (self-review restriction)  
**Response 200:**
```json
{
  "internal_reviews": [
    {
      ...InternalReview,
      "reviewer_email": "string",
      "reviewer_role": "string",
      "avg_score": 3.75
    }
  ],
  "aggregated_scores": {
    "category_id": {
      "avg_rating": 3.75,
      "ratings_count": 2,
      "individual_ratings": [3.5, 4.0],
      "category_title": "string",
      "criteria_text": "string",
      "criteria_bullets": "string"
    }
  },
  "all_comments": { "category_id": [{ comment, reviewer_id, reviewer_email, internal_review_id }] },
  "all_evidence": { "category_id": [{ evidence_url, evidence_note, reviewer_id, reviewer_email, internal_review_id }] },
  "all_general_feedback": [{ feedback, reviewer_id, reviewer_email, internal_review_id, created_at }],
  "overall_avg_score": 3.75
}
```

### GET /api/internal-reviews/{review_id}
**Description:** Get single internal review  
**Auth:** Admin, PM  
**Response 200:** InternalReview object

### GET /api/internal-reviews/{review_id}/detail
**Description:** Get detailed internal review with category info  
**Auth:** Admin, PM  
**Response 200:**
```json
{
  "id": "uuid",
  "review_type": "Internal",
  "employee": { id, full_name, email, role_type },
  "review_cycle_month": 1,
  "review_cycle_year": 2025,
  "reviewer": { id, email, role },
  "avg_score": 3.75,
  "category_details": {
    "category_id": {
      "category_id": "uuid",
      "category_title": "string",
      "criteria_text": "string",
      "criteria_bullets": "string",
      "rating": 3.5,
      "comment": "string|null",
      "evidence_url": "string|null",
      "evidence_note": "string|null"
    }
  },
  "general_feedback": "string",
  "private_note": "string|null",
  "created_at": "datetime",
  "updated_at": "datetime",
  "is_part_of_published_final": true,
  "monthly_final_id": "uuid|null"
}
```

### POST /api/internal-reviews
**Description:** Create internal review  
**Auth:** Admin, PM  
**Validations:**
- PM cannot create review for their own employee profile
- Cannot create for previous month/year
- Evidence required if rating < 3

**Request:**
```json
{
  "employee_id": "uuid",
  "review_cycle_month": 1,
  "review_cycle_year": 2025,
  "category_ratings": {
    "category_id": {
      "rating": 3.5,
      "comment": "string|null",
      "evidence_url": "string|null",
      "evidence_note": "string|null"
    }
  },
  "general_feedback": "string",
  "private_note": "string|null"
}
```
**Response 200:** InternalReview object

### PUT /api/internal-reviews/{review_id}
**Description:** Update internal review  
**Auth:** Admin, PM  
**Validations:**
- PM can only edit their own reviews
- PM cannot edit if monthly final is published
- PM cannot edit their own employee profile review

**Request:** Same as create  
**Response 200:** InternalReview object

### DELETE /api/internal-reviews/{review_id}
**Description:** Delete internal review  
**Auth:** Admin, PM  
**Validations:** PM can only delete their own reviews  
**Response 200:** `{"message": "Internal review deleted successfully"}`

---

## Monthly Final Review Endpoints

### GET /api/monthly-finals
**Description:** List monthly final reviews  
**Auth:** Any authenticated user  
**Query Params:**
- `employee_id: string`
- `month: int`
- `year: int`
- `status: Draft|Published`

**Note:** Employees can only see their own Published finals  
**Response 200:** Array of MonthlyFinalReview objects

### GET /api/monthly-finals/{final_id}
**Description:** Get monthly final detail  
**Auth:** Admin, PM, Employee (own Published only)  
**Response 200:**
```json
{
  "id": "uuid",
  "employee": { id, full_name, email, role_type },
  "review_cycle_month": 1,
  "review_cycle_year": 2025,
  "monthly_score": 3.75,
  "cumulative_score_snapshot": 3.80,
  "published_at": "datetime|null",
  "status": "Draft|Published",
  "category_details": {
    "category_id": {
      "category_id": "uuid",
      "category_title": "string",
      "criteria_text": "string",
      "criteria_bullets": "string",
      "rating": 3.5,
      "comments": [{ comment, reviewer_id? }],
      "evidence": [{ evidence_url, evidence_note, reviewer_id? }]
    }
  },
  "general_feedback": [{ feedback, reviewer_id? }],
  "internal_reviews_count": 2,
  "reviewers": [{ id, email, role }]  // ONLY for Admin/PM, NOT for Employee
}
```

### POST /api/monthly-finals
**Description:** Create monthly final draft  
**Auth:** Admin, PM  
**Validations:** PM cannot create for their own employee profile  
**Request:**
```json
{
  "employee_id": "uuid",
  "review_cycle_month": 1,
  "review_cycle_year": 2025,
  "final_category_ratings": {
    "category_id": {
      "rating": 3.5,
      "comment": "string|null",
      "evidence_url": "string|null",
      "evidence_note": "string|null"
    }
  },
  "general_feedback": "string",
  "included_evidence": [],
  "internal_review_ids": []
}
```
**Response 200:**
```json
{
  "message": "Monthly final review draft created",
  "id": "uuid",
  "status": "Draft",
  "monthly_score": 3.75
}
```

### PUT /api/monthly-finals/{final_id}
**Description:** Update monthly final (Draft only for PM)  
**Auth:** Admin, PM  
**Validations:** PM cannot edit Published reviews  
**Request:**
```json
{
  "final_category_ratings": { ... },
  "general_feedback": "string|null",
  "included_evidence": []
}
```
**Response 200:** MonthlyFinalReview object

### POST /api/monthly-finals/{final_id}/publish
**Description:** Publish monthly final review  
**Auth:** Admin, PM  
**Validations:** PM cannot publish their own employee profile review  
**Side Effects:**
- Creates warning if monthly_score < 3.10
- Updates employee warning_count
- If warning_count >= 3, sets status to "Termination Recommended"
- Creates salary payment record

**Response 200:**
```json
{
  "message": "Monthly final review published successfully",
  "id": "uuid",
  "monthly_score": 3.75,
  "cumulative_score": 3.80
}
```

### DELETE /api/monthly-finals/{final_id}
**Description:** Delete monthly final  
**Auth:** Admin only  
**Response 200:** `{"message": "Monthly final deleted successfully"}`

### POST /api/monthly-finals/publish (Legacy)
**Description:** Auto-publish by aggregating internal reviews  
**Auth:** Admin, PM  
**Query Params:** `employee_id, month, year`  
**Response 200:**
```json
{
  "message": "Monthly final published successfully",
  "monthly_final_id": "uuid",
  "monthly_score": 3.75,
  "internal_reviews_count": 2
}
```

---

## Bonus Bracket Endpoints

### GET /api/bonus-brackets
**Description:** List bonus brackets  
**Auth:** Any authenticated user  
**Response 200:** Array of BonusBracket objects

### POST /api/bonus-brackets
**Description:** Create bonus bracket  
**Auth:** Admin only  
**Request:**
```json
{
  "min_rating": 3.10,
  "max_rating": 3.59,
  "bonus_multiplier": 0.5,
  "label": "Half salary"
}
```
**Response 200:** BonusBracket object

### PUT /api/bonus-brackets/{bracket_id}
**Description:** Update bonus bracket  
**Auth:** Admin only  
**Request:** Same as create  
**Response 200:** BonusBracket object

### DELETE /api/bonus-brackets/{bracket_id}
**Description:** Delete bonus bracket  
**Auth:** Admin only  
**Response 200:** `{"message": "Bonus bracket deleted successfully"}`

---

## Salary Payment Endpoints

### GET /api/salary-payments
**Description:** List salary payments  
**Auth:** Admin only  
**Query Params:**
- `month: int`
- `year: int`
- `payment_status: Unpaid|Paid`
- `role_type: Dev|QA|UI/UX|PM`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "employee_id": "uuid",
    "employee_name": "string",
    "employee_role": "Dev|QA|UI/UX|PM",
    "month": 1,
    "year": 2025,
    "monthly_score": 3.75,
    "bonus_multiplier": 1.0,
    "base_salary": 50000,
    "bonus_amount": 50000,
    "payment_status": "Unpaid|Paid",
    "paid_date": "datetime|null",
    "notes": "string|null",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

### PUT /api/salary-payments/{payment_id}
**Description:** Update salary payment (mark as paid)  
**Auth:** Admin only  
**Request:**
```json
{
  "payment_status": "Paid",
  "paid_date": "datetime",
  "notes": "string|null"
}
```
**Response 200:** `{"message": "Salary payment updated successfully"}`

---

## Dashboard Stats Endpoint

### GET /api/dashboard/stats
**Description:** Get dashboard statistics  
**Auth:** Admin, PM  
**Query Params:**
- `month: int`
- `year: int`
- `period: current_month|previous_month|this_year|custom`

**Response 200:**
```json
{
  "total_employees": 10,
  "active_employees": 8,
  "inactive_employees": 2,
  "internal_reviews_count": 25,
  "monthly_finals_count": 20,
  "draft_finals_count": 5,
  "pending_finals": 3,
  "employees_with_warnings": 2,
  "top_performers": [
    { "employee_name": "string", "employee_id": "uuid", "role_type": "Dev", "monthly_score": 4.75 }
  ],
  "avg_score_by_role": { "Dev": 3.8, "QA": 4.1, "UI/UX": 3.9, "PM": 4.2 },
  "total_bonus_payable": 500000,
  "unpaid_bonuses_count": 5,
  "paid_bonuses_count": 15,
  "period_month": 1,
  "period_year": 2025
}
```

---

## Warnings Endpoint

### GET /api/warnings/{employee_id}
**Description:** Get employee warnings  
**Auth:** Admin, PM, Employee (own only)  
**Response 200:** Array of Warning objects

---

## Notes Endpoints

### POST /api/notes
**Description:** Create employee note  
**Auth:** Admin, PM  
**Request:**
```json
{
  "employee_id": "uuid",
  "note_text": "string"
}
```
**Response 200:** EmployeeNote object

### GET /api/notes/{employee_id}
**Description:** Get employee notes  
**Auth:** Admin, PM  
**Response 200:** Array of EmployeeNote objects

---

## File Upload Endpoint

### POST /api/upload
**Description:** Upload file  
**Auth:** Any authenticated user  
**Request:** Multipart form data with `file` field  
**Allowed Extensions:** `.jpg, .jpeg, .png, .webp, .pdf, .docx`  
**Response 200:**
```json
{
  "file_url": "/uploads/filename.ext",
  "filename": "original_filename.ext"
}
```

---

## Admin Seed Data Endpoint

### POST /api/admin/seed-data
**Description:** Seed test data  
**Auth:** Admin only  
**Response 200:**
```json
{
  "message": "Test data seeded successfully",
  "created": {
    "internal_reviews": 47,
    "monthly_finals": 30,
    "salary_payments": 25
  }
}
```

---

## Data Models

### Employee
```json
{
  "id": "uuid",
  "full_name": "string",
  "email": "string",
  "phone": "string|null",
  "role_type": "Dev|QA|UI/UX|PM",
  "department": "string|null",
  "status": "Active|Inactive|Termination Recommended|Terminated",
  "joining_date": "datetime",
  "profile_photo": "string|null",
  "base_salary": "number|null",
  "warning_count": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Category
```json
{
  "id": "uuid",
  "title": "string",
  "criteria_short_text": "string",
  "criteria_bullets": "string|null",
  "is_enabled": true,
  "display_order": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### InternalReview
```json
{
  "id": "uuid",
  "employee_id": "uuid",
  "review_cycle_month": 1,
  "review_cycle_year": 2025,
  "reviewer_user_id": "uuid",
  "category_ratings": {
    "category_id": {
      "rating": 3.5,
      "comment": "string|null",
      "evidence_url": "string|null",
      "evidence_note": "string|null"
    }
  },
  "general_feedback": "string",
  "private_note": "string|null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### MonthlyFinalReview
```json
{
  "id": "uuid",
  "employee_id": "uuid",
  "review_cycle_month": 1,
  "review_cycle_year": 2025,
  "created_by_user_id": "uuid",
  "published_by_user_id": "uuid|null",
  "status": "Draft|Published",
  "final_category_ratings": { CategoryRating map },
  "final_category_averages": { "category_id": 3.5 },
  "monthly_score": 3.75,
  "cumulative_score_snapshot": 3.80,
  "general_feedback": "string",
  "included_evidence": [],
  "internal_review_ids": [],
  "published_at": "datetime|null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### BonusBracket
```json
{
  "id": "uuid",
  "min_rating": 3.10,
  "max_rating": 3.59,
  "bonus_multiplier": 0.5,
  "label": "Half salary",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### SalaryPayment
```json
{
  "id": "uuid",
  "employee_id": "uuid",
  "month": 1,
  "year": 2025,
  "monthly_score": 3.75,
  "bonus_multiplier": 1.0,
  "base_salary": 50000,
  "bonus_amount": 50000,
  "payment_status": "Unpaid|Paid",
  "paid_date": "datetime|null",
  "notes": "string|null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Warning
```json
{
  "id": "uuid",
  "employee_id": "uuid",
  "monthly_final_review_id": "uuid",
  "warning_date": "datetime",
  "reason": "string",
  "monthly_score": 2.8,
  "created_by": "uuid"
}
```

---

## Business Rules Summary

1. **Self-Review Prevention:** PM cannot create/edit/delete reviews for their own linked employee profile
2. **Date Validation:** Cannot create internal reviews for previous months/years
3. **Evidence Requirement:** Evidence (URL + note) is mandatory when rating < 3.0
4. **PM Edit Restriction:** PM cannot edit published monthly final reviews
5. **Employee Privacy:** Employees cannot see reviewer identity (name/email) in any response
6. **Warning System:** Monthly score < 3.10 creates warning; 3 warnings sets status to "Termination Recommended"
7. **Category Protection:** Cannot delete categories that are used in existing reviews
8. **Unique Constraint:** Only one monthly final review per employee per month/year
