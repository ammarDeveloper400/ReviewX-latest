# ReviewX - Employee Review System

A full-stack employee review system with role-based access control (RBAC), monthly reviews, SGPA/CGPA scoring, and bonus management.

## Tech Stack

### Backend (Laravel)
- **Framework**: Laravel 12.x (PHP 8.2)
- **Database**: MySQL/MariaDB
- **Authentication**: JWT (php-open-source-saver/jwt-auth)
- **API**: RESTful JSON API

### Frontend (React)
- **Framework**: React 19
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: React Context
- **HTTP Client**: Axios

## Quick Start

### Prerequisites
- PHP 8.2+
- Composer 2.x
- MySQL/MariaDB
- Node.js 18+ & Yarn

### Backend Setup

```bash
cd /app/backend-laravel

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Configure database in .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=reviewx
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Generate app key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret

# Run migrations
php artisan migrate

# Create storage link
php artisan storage:link

# Seed initial admin user
php artisan db:seed

# Start server
php artisan serve --host=0.0.0.0 --port=8001
```

### Frontend Setup

```bash
cd /app/frontend

# Install dependencies
yarn install

# Configure backend URL in .env
# REACT_APP_BACKEND_URL=http://localhost:8001

# Start development server
yarn start
```

### Seed Test Data

After starting the backend, seed test data by calling the API:

```bash
# Login as admin
TOKEN=$(curl -s http://localhost:8001/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@reviewsystem.com","password":"admin123"}' \
  | jq -r '.access_token')

# Seed test data
curl -s http://localhost:8001/api/admin/seed-data \
  -X POST -H "Authorization: Bearer $TOKEN"
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reviewsystem.com | admin123 |
| PM | pm@reviewsystem.com | pm123 |
| Employee | ali.hassan@company.com | employee123 |
| Employee | fatima.ahmed@company.com | employee123 |

## Environment Variables

### Backend (.env)
```
APP_NAME=ReviewX
APP_URL=http://localhost:8001
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=reviewx
DB_USERNAME=reviewx
DB_PASSWORD=your_password
JWT_SECRET=your-jwt-secret
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## API Documentation

See `/app/docs/API_CONTRACT.md` for complete API documentation.

## File Uploads

Uploaded files are stored in `/app/backend-laravel/storage/app/public/uploads/`.

Access them via `/storage/uploads/{filename}` after running `php artisan storage:link`.

Allowed file types: `.jpg, .jpeg, .png, .webp, .pdf, .docx`

## Business Rules

### Review System
1. **Self-Review Prevention**: PM cannot create/edit/delete reviews for their own employee profile
2. **Date Validation**: Cannot create internal reviews for previous months/years
3. **Evidence Requirement**: Evidence (URL + note) is mandatory when rating < 3.0
4. **PM Edit Restriction**: PM cannot edit published monthly final reviews
5. **Employee Privacy**: Employees cannot see reviewer identity (name/email)

### Warning System
- Monthly score < 3.10 creates a warning
- 3 warnings sets employee status to "Termination Recommended"

### Bonus System
| Score Range | Bonus |
|-------------|-------|
| 4.60 - 5.00 | 2 salaries |
| 4.10 - 4.59 | 1.5 salaries |
| 3.60 - 4.09 | 1 salary |
| 3.10 - 3.59 | Half salary |
| 0.00 - 3.09 | No bonus |

## QA Checklist

### Authentication
- [x] Admin login/logout
- [x] PM login/logout
- [x] Employee login/logout
- [x] JWT token validation
- [x] Role-based access control

### Employee Management (Admin)
- [x] Create employee
- [x] Update employee
- [x] Delete employee
- [x] Activate/Deactivate employee
- [x] Link user account to employee

### Internal Reviews (Admin/PM)
- [x] Create internal review
- [x] Edit internal review
- [x] Delete internal review
- [x] View internal review detail
- [x] List with filters
- [x] Evidence validation (required if rating < 3)
- [x] Self-review prevention for PM

### Monthly Final Reviews
- [x] Create draft
- [x] Edit draft
- [x] Publish final
- [x] View detail
- [x] PM cannot edit published
- [x] Aggregation from internal reviews

### Employee Portal
- [x] View own reviews only
- [x] NO reviewer identity visible
- [x] Year filter works
- [x] Custom date range filter works
- [x] Performance metrics displayed

### Dashboard
- [x] Stats display correctly
- [x] Year/month filters work
- [x] Top performers list
- [x] Average by role calculation

### Bonus & Salary
- [x] Bonus brackets CRUD
- [x] Salary payments list
- [x] Mark as paid
- [x] Multiplier calculation

## Known Issues

None currently.

## Migration Notes

This Laravel backend replaces the original FastAPI + MongoDB implementation.
- Data models are stored in MySQL with relational schema
- API contract is preserved for frontend compatibility
- JWT authentication maintained with same token format
- All RBAC rules implemented identically
