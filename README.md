# Youth Sanad - Backend API

REST API for a youth programs platform. Supervisors publish programs, young people apply for a seat, and an admin accepts or rejects applications. Accepted applicants get access to the program materials.

**Stack:** NestJS, Prisma 7, PostgreSQL, JWT auth, Multer (file uploads), Throttler (rate limiting), cache.

## Setup

```bash
npm install
```

Create a `.env` file in the project root (use the same variable names your project already uses):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sanad"
JWT_SECRET="change-me"
```

Prepare the database, then start the server:

```bash
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

The API runs on `http://localhost:3000`.

## Roles

| Role | What they can do |
|---|---|
| `YOUTH` (default) | Browse programs, apply, cancel own application, view announcements, view materials of programs they were **accepted** into |
| `SUPERVISOR` | Create programs, and manage sessions, image and materials of **their own** programs only |
| `ADMIN` | Accept or reject applications, and manage any program |

A new account is always created as `YOUTH`. Roles are enforced by `AuthGuard` + `RolesGuard`; program ownership is enforced by `assertOwner` in `ProgramsService`.

## Endpoints

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `name`, `email`, `password` (stored hashed, never returned) |
| POST | `/auth/login` | returns `accessToken`; send it as `Authorization: Bearer <token>` |

### Programs
| Method | Path | Access |
|---|---|---|
| POST | `/programs` | Supervisor, Admin |
| GET | `/programs` | Any user (pagination + search) |
| GET | `/programs/:id` | Any user. Includes supervisor (`id`, `name` only) and sessions |
| POST | `/programs/:id/image` | Owner supervisor, Admin. `multipart/form-data`, field `image` |

### Sessions
| Method | Path | Access |
|---|---|---|
| POST | `/programs/:programId/sessions` | Owner supervisor, Admin. Needs `startsAt` and a `location` or a `link` |
| GET | `/programs/:programId/sessions` | Any user |

### Applications
| Method | Path | Access |
|---|---|---|
| POST | `/applications/:programId` | Youth. Optional CV as `multipart/form-data`, field `cv` (PDF) |
| GET | `/applications/me` | Youth |
| PATCH | `/applications/:id/cancel` | Youth (own application) |
| PATCH | `/applications/:id/accept` | Admin |
| PATCH | `/applications/:id/reject` | Admin |

### Materials
| Method | Path | Access |
|---|---|---|
| POST | `/programs/:programId/materials` | Owner supervisor, Admin. Fields: `title` + `file` |
| GET | `/programs/:programId/materials` | Admin, owner supervisor, or youth with an **ACCEPTED** application |
| GET | `/materials/:id/download` | Same rule as above |

### Announcements
| Method | Path | Notes |
|---|---|---|
| POST | `/announcements` | Create an announcement (general or for one program) |
| GET | `/announcements` | List announcements (cached) |

## Key design decisions

**Seat booking is race-safe.** Applying runs inside a database transaction. The seat is taken with a conditional update (`availableSeats > 0` then decrement), so two people applying for the last seat at the same time cannot both succeed. Cancelling or rejecting gives the seat back.

**Files are stored on disk, the database stores only the path.** Uploaded files go to `./uploads` with a random UUID name. The database keeps paths such as `uploads/xxxx.jpg` (`Program.imageUrl`, `Application.cvUrl`, `Material.fileUrl`).

| Upload | Allowed types | Max size |
|---|---|---|
| Program image | jpeg, png, webp | 2 MB |
| CV | pdf | 2 MB |
| Material | pdf, jpeg, png, webp | 10 MB |

**Materials are not served statically.** They can only be downloaded through `/materials/:id/download`, which checks that the user is allowed to see them.

**No sensitive data in responses.** Relations that return a user use `select` (for example the supervisor only exposes `id` and `name`), so `password` and `email` are never leaked.

**Rate limiting.** Global limit of 60 requests per minute (`@nestjs/throttler`), with a stricter limit on authentication routes.

## Error codes used

| Code | Meaning |
|---|---|
| 400 | Invalid data or file type not allowed |
| 401 | Missing or invalid token |
| 403 | Wrong role, not the program owner, or not an accepted applicant |
| 404 | Program, application or material not found |
| 409 | Program is full, or already applied |
| 413 | File too large |
| 429 | Too many requests |

## Database diagram

```mermaid
erDiagram
    User ||--o{ Program : "supervises"
    User ||--o{ Application : "applies"
    User ||--o{ Announcement : "writes"
    Program ||--o{ Session : "has"
    Program ||--o{ Application : "receives"
    Program ||--o{ Material : "has"
    Program |o--o{ Announcement : "about (optional)"

    User {
        int id PK
        string name
        string email UK
        string password
        Role role
        datetime createdAt
    }
    Program {
        int id PK
        string title
        string description
        string imageUrl
        int totalSeats
        int availableSeats
        int supervisorId FK
    }
    Session {
        int id PK
        int programId FK
        datetime startsAt
        string location
        string link
    }
    Application {
        int id PK
        int userId FK
        int programId FK
        ApplicationStatus status
        string cvUrl
        datetime createdAt
    }
    Announcement {
        int id PK
        string title
        string body
        int authorId FK
        int programId FK
        datetime createdAt
    }
    Material {
        int id PK
        int programId FK
        string title
        string fileUrl
    }
```

`Role`: `YOUTH`, `SUPERVISOR`, `ADMIN`. `ApplicationStatus`: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`. An application is unique per `(userId, programId)`, so nobody can apply twice.

## Last-seat demo (concurrent requests)

`seat-test.mjs` creates a program with **one seat**, registers 10 young users, and sends all 10 applications at the same moment. Expected result: one `201`, the rest `409`, and `availableSeats` stays `0`.

```bash
node seat-test.mjs <supervisor-email> <supervisor-password>
```

The server must be running. Authentication routes are rate limited, so the script waits between account creations.
