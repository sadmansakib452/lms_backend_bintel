# LMS Backend API Documentation
## Authentication & Authorization Module

---

**From:** Backend Team (Sadman Sakib)  
**To:** Ashraful Islam  
**Subject:** Complete API Documentation for Authentication & Authorization  
**Date:** May 10, 2026

---

## 📌 Introduction

This document provides complete API documentation for the LMS Backend Authentication and Authorization system. The frontend developer can use this document as a comprehensive guide to implement all authentication, RBAC (Role-Based Access Control), and user management features.

### What's Covered:
1. **Authentication Module** - User registration, login, password management, 2FA
2. **Permissions Module** - System-wide permission management
3. **Roles Module** - Role creation and permission assignment
4. **User Management Module** - Admin user CRUD operations
5. **Pagination Guide** - How to handle paginated responses

### How to Use This Document:
- Follow the **Development Order** section to build features in the correct sequence
- Each API section contains: Description, Request, Response, Frontend Usage
- Use provided **curl commands** for testing
- Reference **Error Codes** section for troubleshooting

---

## 🚀 Development Order (Start Here)

Build features in this order to ensure dependencies are met:

```
STEP 1: Authentication Foundation (REQUIRED)
       ↓
STEP 2: Permissions Module (RBAC Building Block)
       ↓
STEP 3: Roles Module (RBAC Core)
       ↓
STEP 4: User Management Module (Admin Panel)
```

### Why This Order?
- Auth module is required for all other features (JWT needed)
- Permissions must exist before creating Roles
- Roles must exist before assigning to Users
- User Management is the final admin feature

---

# STEP 1: AUTHENTICATION MODULE
**Base URL:** `/api/auth`

The authentication module handles all user identity operations. All endpoints except Register and Login require JWT authentication.

## 1.1 User Registration
**Create a new user account**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/register` |
| **Auth Required** | No |
| **Permission Required** | None |

### Request Body
```json
{
  "name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Response - Success (201)
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email."
}
```

### Response - Error (400)
```json
{
  "success": false,
  "message": "Email already exist"
}
```

### Frontend Usage
- **Page:** Registration Page (`/register`)
- **Flow:** User fills form → Submit → Show success message → Redirect to login

---

## 1.2 User Login
**Authenticate user and receive JWT tokens**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/login` |
| **Auth Required** | No (uses Basic Auth) |
| **Permission Required** | None |

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "authorization": {
    "type": "Bearer",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

> **Note:** Refresh token is set as an HTTP-only cookie (`refresh_token`) valid for 7 days.

### Response - Error (401)
```json
{
  "success": false,
  "message": {
    "message": "Invalid credentials",
    "error": "Unauthorized",
    "statusCode": 401
  }
}
```

### Frontend Usage
- **Page:** Login Page (`/login`)
- **Flow:** User enters email/password → Submit → Store access_token in memory → Redirect to dashboard
- **Token Storage:** Access token in memory (not localStorage for security), refresh token in cookie

### Test Curl
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

---

## 1.3 Get Current User
**Get authenticated user's profile**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/auth/me` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Request Headers
```
Authorization: Bearer <access_token>
```

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "avatar.png",
    "type": "user",
    "status": "active",
    "role_users": [
      {
        "role": {
          "id": "role_123",
          "name": "student",
          "title": "Student"
        }
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Frontend Usage
- **Page:** Header/Dashboard (after login)
- **Flow:** On app load, call this API → Display user name/avatar in header
- **Error Handling:** If 401, redirect to login page

---

## 1.4 Update Profile
**Update user's own profile information**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `PATCH /api/auth/update` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Request Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body (All fields optional)
```json
{
  "name": "John Doe Updated",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "country": "USA",
  "state": "California",
  "city": "Los Angeles",
  "address": "123 Main St",
  "zip_code": "12345",
  "gender": "male",
  "date_of_birth": "1990-01-01"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### Frontend Usage
- **Page:** Profile Settings Page (`/profile`)
- **Flow:** User edits form → Submit → Show success → Update local state

---

## 1.5 Change Password
**User changes their own password (requires old password)**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/change-password` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Request Headers
```
Authorization: Bearer <access_token>
```

### Request Body
```json
{
  "old_password": "currentPassword123",
  "new_password": "newPassword456"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Response - Error (401)
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

### Frontend Usage
- **Page:** Change Password Page (`/profile/change-password`)
- **Flow:** User enters old + new password → Submit → Show success/error

---

## 1.6 Forgot Password
**Request password reset email**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/forgot-password` |
| **Auth Required** | No |
| **Permission Required** | None |

### Request Body
```json
{
  "email": "john@example.com"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### Frontend Usage
- **Page:** Login Page ("Forgot Password?" link)
- **Flow:** User enters email → Submit → Show message to check email

---

## 1.7 Reset Password
**Reset password using token from email**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/reset-password` |
| **Auth Required** | No |
| **Permission Required** | None |

### Request Body
```json
{
  "email": "john@example.com",
  "token": "reset_token_from_email",
  "password": "newPassword123"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Frontend Usage
- **Page:** Reset Password Page (link from email)
- **Flow:** User clicks email link → Enter new password → Submit → Redirect to login

---

## 1.8 Verify Email
**Verify user's email address**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/verify-email` |
| **Auth Required** | No |
| **Permission Required** | None |

### Request Body
```json
{
  "email": "john@example.com",
  "token": "verification_token_from_email"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

## 1.9 Resend Verification Email
**Resend email verification link**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/resend-verification-email` |
| **Auth Required** | No |
| **Permission Required** | None |

### Request Body
```json
{
  "email": "john@example.com"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

## 1.10 Request Email Change
**Request to change email address**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/request-email-change` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Request Body
```json
{
  "email": "newemail@example.com"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Verification link sent to new email"
}
```

---

## 1.11 Confirm Email Change
**Confirm email change with token**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/change-email` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Request Body
```json
{
  "email": "newemail@example.com",
  "token": "confirmation_token"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Email changed successfully"
}
```

---

## 1.12 Two-Factor Authentication (2FA)

### 1.12.1 Generate 2FA Secret
**Generate QR code for 2FA setup**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/generate-2fa-secret` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

### Frontend Usage
- **Page:** Security Settings → Enable 2FA
- **Flow:** Call API → Display QR code → User scans with authenticator app

---

### 1.12.2 Verify 2FA Token
**Verify 2FA token from authenticator app**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/verify-2fa` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Request Body
```json
{
  "token": "123456"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "Token verified successfully"
}
```

---

### 1.12.3 Enable 2FA
**Enable 2FA after verification**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/enable-2fa` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Response - Success (200)
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

---

### 1.12.4 Disable 2FA
**Disable Two-Factor Authentication**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/disable-2fa` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Response - Success (200)
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

## 1.13 Refresh Token
**Get new access token using refresh token**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/refresh-token` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Request Body
```json
{
  "refresh_token": "cookie_refresh_token"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "authorization": {
    "type": "Bearer",
    "access_token": "new_access_token...",
    "expires_in": 3600
  }
}
```

### Frontend Usage
- **Trigger:** When access_token expires (before API call)
- **Flow:** Call refresh endpoint → Update stored token → Retry original request

---

## 1.14 Logout
**Revoke refresh token**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/auth/logout` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | None |

### Response - Success (200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Frontend Usage
- **Trigger:** User clicks logout button
- **Flow:** Call logout → Clear token from memory → Redirect to login

---

# STEP 2: PERMISSIONS MODULE
**Base URL:** `/api/admin/permissions`

Permission is the smallest unit of access control. Each permission combines an **action** (create, read, update, delete, manage) with a **subject** (courses, users, roles, etc.).

## 2.1 List Permissions
**Get all system permissions with pagination**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/admin/permissions` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `read:permissions` |

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | string | No | Page number (default: 1) | `?page=1` |
| `limit` | string | No | Items per page (default: 10, max: 100) | `?limit=10` |
| `type` | string | No | Pagination type: `offset` or `cursor` | `?type=offset` |
| `cursor` | string | No | Cursor for cursor pagination | `?cursor=perm_123` |
| `subject` | string | No | Filter by subject | `?subject=courses` |
| `action` | string | No | Filter by action | `?action=create` |

### Response - Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "perm_123",
      "action": "create",
      "subject": "courses",
      "title": "Create Courses",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "perm_124",
      "action": "read",
      "subject": "courses",
      "title": "Read Courses",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  },
  "links": {
    "first": "/api/admin/permissions?page=1",
    "last": "/api/admin/permissions?page=5",
    "next": "/api/admin/permissions?page=2",
    "previous": null
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → Role Builder → Permission Selector
- **Flow:** Admin selects "Create Role" → Show all permissions in checkboxes → Admin selects permissions → Save role
- **Note:** This endpoint is for building/assigning permissions to roles, not for checking user permissions

### Test Curl
```bash
curl -X GET "http://localhost:3000/api/admin/permissions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2.2 Create Permission
**Create a new permission in the system**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/admin/permissions` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `create:permissions` |

### Request Body
```json
{
  "action": "moderate",
  "subject": "comments",
  "title": "Moderate Comments",
  "description": "Can moderate and manage user-submitted comments"
}
```

### Response - Success (201)
```json
{
  "success": true,
  "data": {
    "id": "perm_125",
    "action": "moderate",
    "subject": "comments",
    "title": "Moderate Comments",
    "description": "Can moderate and manage user-submitted comments",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Response - Error (400)
```json
{
  "success": false,
  "message": "Permission with action 'moderate' and subject 'comments' already exists"
}
```

### Frontend Usage
- **Page:** Admin Panel → Settings → Permissions → Add New
- **Flow:** Admin fills form → Submit → Show in permission list

---

## 2.3 Get Single Permission
**Get detailed information about a specific permission**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/admin/permissions/:id` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `read:permissions` |

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "id": "perm_123",
    "action": "create",
    "subject": "courses",
    "title": "Create Courses",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Response - Error (404)
```json
{
  "statusCode": 404,
  "message": "Permission with ID perm_123 not found",
  "error": "Not Found"
}
```

---

## 2.4 Update Permission
**Update permission title and description**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `PUT /api/admin/permissions/:id` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `update:permissions` |

### Request Body
```json
{
  "title": "Create Courses - Updated",
  "description": "Can create new courses and manage content"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "id": "perm_123",
    "action": "create",
    "subject": "courses",
    "title": "Create Courses - Updated",
    "description": "Can create new courses and manage content",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:20:00Z"
  }
}
```

---

## 2.5 Delete Permission
**Soft delete a permission**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `DELETE /api/admin/permissions/:id` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `delete:permissions` |

### Response - Success (200)
```json
{
  "success": true,
  "message": "Permission perm_123 deleted successfully"
}
```

---

# STEP 3: ROLES MODULE
**Base URL:** `/api/admin/roles`

A Role is a collection of permissions. Users are assigned roles, and roles determine what actions users can perform.

## 3.1 List Roles
**Get all roles with pagination**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/admin/roles` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `read:roles` |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | string | No | Page number (default: 1) |
| `limit` | string | No | Items per page (default: 10) |

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role_123",
        "name": "admin",
        "title": "Administrator",
        "permissionCount": 15,
        "userCount": 3,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "role_124",
        "name": "instructor",
        "title": "Instructor",
        "permissionCount": 8,
        "userCount": 12,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5
    }
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → Roles Management → Role List
- **Flow:** Admin views all roles → Can click to view details or edit

### Test Curl
```bash
curl -X GET "http://localhost:3000/api/admin/roles?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 3.2 Create Role
**Create a new role**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/admin/roles` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `create:roles` |

### Request Body
```json
{
  "name": "content_moderator",
  "title": "Content Moderator",
  "description": "Can moderate and manage user-generated content"
}
```

### Response - Success (201)
```json
{
  "success": true,
  "data": {
    "id": "role_125",
    "name": "content_moderator",
    "title": "Content Moderator",
    "description": "Can moderate and manage user-generated content",
    "permissionCount": 0,
    "userCount": 0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → Roles Management → Create Role Button
- **Flow:** Admin clicks "Create Role" → Fills form → Submit → Redirect to role list

---

## 3.3 Get Single Role
**Get role details with all assigned permissions**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/admin/roles/:roleId` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `read:roles` |

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "id": "role_123",
    "name": "admin",
    "title": "Administrator",
    "description": "Full system access",
    "permissionCount": 15,
    "userCount": 3,
    "permissions": [
      {
        "id": "perm_123",
        "action": "create",
        "subject": "courses",
        "title": "Create Courses",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → Roles Management → Click on Role
- **Flow:** Shows role details with all assigned permissions

---

## 3.4 Update Role
**Update role title and description**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `PUT /api/admin/roles/:roleId` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `update:roles` |

### Request Body
```json
{
  "title": "Super Administrator",
  "description": "Full system access with all permissions"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "id": "role_123",
    "name": "admin",
    "title": "Super Administrator",
    "description": "Full system access with all permissions",
    "permissionCount": 15,
    "userCount": 3,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:20:00Z"
  }
}
```

---

## 3.5 Delete Role
**Soft delete a role**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `DELETE /api/admin/roles/:roleId` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `delete:roles` |

### Response - Success (200)
```json
{
  "success": true,
  "message": "Role role_123 deleted successfully"
}
```

---

## 3.6 Assign Permissions to Role
**Assign one or more permissions to a role**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/admin/roles/:roleId/permissions` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `manage:roles` |

### Request Body
```json
{
  "permission_ids": ["perm_123", "perm_124", "perm_125"]
}
```

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "id": "role_125",
    "name": "content_moderator",
    "title": "Content Moderator",
    "permissionCount": 3,
    "userCount": 0,
    "permissions": [
      {
        "id": "perm_123",
        "action": "create",
        "subject": "courses",
        "title": "Create Courses"
      },
      {
        "id": "perm_124",
        "action": "read",
        "subject": "courses",
        "title": "Read Courses"
      },
      {
        "id": "perm_125",
        "action": "moderate",
        "subject": "comments",
        "title": "Moderate Comments"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:20:00Z"
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → Role Details → "Assign Permissions" Button
- **Flow:** Show list of all permissions (checkboxes) → Select permissions → Submit → Update role

---

## 3.7 Get User Roles
**Get all roles assigned to a specific user**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/admin/roles/users/:userId/roles` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `read:users` |

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "roles": [
      {
        "id": "role_124",
        "name": "instructor",
        "title": "Instructor",
        "permissionCount": 8,
        "userCount": 12,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## 3.8 Assign Role to User
**Assign a role to a specific user**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/admin/roles/users/:userId/roles` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `manage:users` |

### Request Body
```json
{
  "role_id": "role_124"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "roles": [
      {
        "id": "role_124",
        "name": "instructor",
        "title": "Instructor"
      }
    ]
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → User Management → User Details → "Assign Role"
- **Flow:** Show list of available roles → Select role → Submit → User now has new permissions

---

## 3.9 Remove Role from User
**Remove a role from a specific user**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `DELETE /api/admin/roles/users/:userId/roles/:roleId` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `manage:users` |

### Response - Success (200)
```json
{
  "success": true,
  "message": "Role role_124 removed from user user_123"
}
```

---

# STEP 4: USER MANAGEMENT MODULE
**Base URL:** `/api/admin/user`

Admin module for managing users in the system.

## 4.1 List Users
**Get all users with search, filter, pagination, and dynamic field selection**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/admin/user` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `read:users` |

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | string | No | Page number (default: 1) | `?page=1` |
| `limit` | string | No | Items per page (default: 10) | `?limit=10` |
| `q` | string | No | Search by name or email | `?q=john` |
| `approved` | string | No | Filter: `active` or `pending` | `?approved=active` |
| `fields` | string | No | Select specific fields | `?fields=id,name,email` |

### Dynamic Field Selection
- `fields=*` - Returns all fields (except password)
- `fields=id,name,email` - Returns only specified fields
- Default: Returns safe fields (id, name, email, avatar, status, approved_at, created_at, updated_at, roles)

### Response - Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar.png",
      "status": "active",
      "approved_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "role_users": [
        {
          "role": {
            "id": "role_124",
            "name": "instructor",
            "title": "Instructor"
          }
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "links": {
    "first": "/api/admin/user?page=1",
    "last": "/api/admin/user?page=5",
    "next": "/api/admin/user?page=2",
    "previous": null
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → Users → User List
- **Features:**
  - Search bar (searches name and email)
  - Filter dropdown (All/Active/Pending)
  - Pagination controls
  - Columns can be customized via `fields` param
  - Click user row to view details

### Test Curl
```bash
# Default fields
curl -X GET "http://localhost:3000/api/admin/user?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search users
curl -X GET "http://localhost:3000/api/admin/user?q=john&approved=active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Custom fields
curl -X GET "http://localhost:3000/api/admin/user?fields=id,name,email,status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 4.2 Create User
**Create a new user (admin creates)**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/admin/user` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `create:users` |

### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role_id": "role_124"
}
```

### Response - Success (201)
```json
{
  "success": true,
  "message": "User created successfully"
}
```

### Response - Error (400)
```json
{
  "success": false,
  "message": "Email already exist"
}
```

### Frontend Usage
- **Page:** Admin Panel → Users → "Add User" Button
- **Flow:** Admin fills form → Submit → User created → Shown in user list

---

## 4.3 Get Single User
**Get detailed information about a specific user**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/admin/user/:id` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `read:users` |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | No | Select specific fields |

### Response - Success (200)
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "avatar.png",
    "type": "user",
    "phone_number": "+1234567890",
    "status": "active",
    "approved_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "billing_id": "bill_123",
    "role_users": [
      {
        "role": {
          "id": "role_124",
          "name": "instructor",
          "title": "Instructor"
        }
      }
    ]
  }
}
```

### Frontend Usage
- **Page:** Admin Panel → Users → Click on User
- **Flow:** Shows all user details including assigned roles

---

## 4.4 Update User
**Update user details including password (admin direct change - no verification needed)**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `PATCH /api/admin/user/:id` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `update:users` |

### Request Body (All fields optional)
```json
{
  "name": "John Doe Updated",
  "email": "john.new@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "country": "USA",
  "state": "California",
  "city": "Los Angeles",
  "address": "123 Main St",
  "zip_code": "12345",
  "gender": "male",
  "date_of_birth": "1990-01-01",
  "role_id": "role_124",
  "password": "newPassword123"
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

### Response - Error (400)
```json
{
  "success": false,
  "message": "Email already exist"
}
```

### Important Notes:
- **Admin password change:** Admin can directly set new password without knowing current password
- **Email update:** If updating email to existing email, it will fail (unless it's the user's own email)
- **Role update:** Changing role will invalidate user's permission cache

### Frontend Usage
- **Page:** Admin Panel → Users → Edit User Button
- **Flow:** Admin edits fields → Submit → Show success → Update user list

### Test Curl
```bash
curl -X PATCH http://localhost:3000/api/admin/user/user_123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "role_id": "role_124",
    "password": "newPassword123"
  }'
```

---

## 4.5 Delete User
**Delete a user from the system**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `DELETE /api/admin/user/:id` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `delete:users` |

### Response - Success (200)
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Frontend Usage
- **Page:** Admin Panel → Users → Delete Button (with confirmation modal)
- **Flow:** Admin clicks delete → Confirmation modal → Confirm → User removed

---

## 4.6 Ban User
**Ban a user (blocks login)**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/admin/user/:id/ban` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `delete:users` |

### Request Body
```json
{
  "reason": "Violation of terms and conditions",
  "send_email": true
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "User banned successfully"
}
```

### Response - Error (400)
```json
{
  "success": false,
  "message": "Cannot ban super admin"
}
```

### What Happens:
- User's `approved_at` is set to `null` (blocks login)
- `ban_reason` is stored
- Email notification sent (if `send_email: true`)
- User's permission cache is invalidated

### Frontend Usage
- **Page:** Admin Panel → Users → User Actions → "Ban User"
- **Flow:** Admin clicks ban → Enters reason → Confirm → User cannot login

---

## 4.7 Unban User
**Unban a user (restores login)**

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/admin/user/:id/unban` |
| **Auth Required** | Yes (Bearer Token) |
| **Permission Required** | `update:users` |

### Request Body
```json
{
  "reason": "Appeal accepted",
  "send_email": true
}
```

### Response - Success (200)
```json
{
  "success": true,
  "message": "User unbanned successfully"
}
```

### What Happens:
- User's `approved_at` is set to current timestamp (allows login)
- `ban_reason` is cleared
- Email notification sent (if `send_email: true`)

### Frontend Usage
- **Page:** Admin Panel → Users → Banned Users → "Unban User"
- **Flow:** Admin clicks unban → Optional reason → Confirm → User can login again

---

# PAGINATION GUIDE

The backend supports two types of pagination:

## Offset Pagination
**Best for:** Admin dashboards, pages with page numbers, when total count matters

### How It Works:
- Uses `page` and `limit` parameters
- Returns `total` count and `totalPages`
- Supports `first`, `last`, `next`, `previous` links

### Request:
```
GET /api/admin/user?page=2&limit=10
```

### Response Includes:
```json
{
  "meta": {
    "page": 2,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "links": {
    "first": "/api/admin/user?page=1",
    "last": "/api/admin/user?page=5",
    "next": "/api/admin/user?page=3",
    "previous": "/api/admin/user?page=1"
  }
}
```

---

## Cursor Pagination
**Best for:** Infinite scroll, real-time feeds, large datasets

### How It Works:
- Uses `cursor` parameter (last item's ID)
- Returns `hasMore` boolean
- No total count (more efficient for large datasets)

### Request:
```
GET /api/admin/permissions?type=cursor&limit=20&cursor=perm_lastId
```

### Response Includes:
```json
{
  "data": [...],
  "meta": {
    "hasMore": true,
    "nextCursor": "perm_abc123"
  }
}
```

### Frontend Implementation:
```javascript
// For infinite scroll
let cursor = null;
let hasMore = true;

async function loadMore() {
  const url = cursor 
    ? `/api/admin/permissions?type=cursor&limit=20&cursor=${cursor}`
    : '/api/admin/permissions?type=cursor&limit=20';
  
  const response = await fetch(url, { headers: authHeaders });
  const result = await response.json();
  
  cursor = result.meta.nextCursor;
  hasMore = result.meta.hasMore;
  
  return result.data;
}
```

---

# ERROR CODES REFERENCE

## Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|----------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 500 | Internal Error | Server error |

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Email already exist" | Email already registered | Use different email |
| "Password not matched" | Wrong password | Check password |
| "Invalid credentials" | Wrong email/password | Verify credentials |
| "Token expired" | JWT expired | Refresh token |
| "User not found" | User ID doesn't exist | Check user ID |
| "Permission denied" | No permission | Check user role |
| "Cannot ban super admin" | Cannot ban su_admin | Cannot override |

---

# FRONTEND IMPLEMENTATION CHECKLIST

## Phase 1: Authentication (Start Here)
- [ ] Login Page (`/login`) - POST /auth/login
- [ ] Register Page (`/register`) - POST /auth/register
- [ ] Forgot Password Page - POST /auth/forgot-password
- [ ] Reset Password Page - POST /auth/reset-password
- [ ] Token Management - Store access token, handle refresh

## Phase 2: Profile & Security
- [ ] Profile Page (`/profile`) - GET /auth/me, PATCH /auth/update
- [ ] Change Password - POST /auth/change-password
- [ ] 2FA Setup - POST /auth/generate-2fa-secret, verify-2fa, enable-2fa

## Phase 3: RBAC (Permissions & Roles)
- [ ] Role List Page (`/admin/roles`) - GET /admin/roles
- [ ] Create Role Modal - POST /admin/roles
- [ ] Role Details/Edit - GET/PUT /admin/roles/:id
- [ ] Assign Permissions to Role - POST /admin/roles/:id/permissions
- [ ] Permission List for selection - GET /admin/permissions

## Phase 4: User Management
- [ ] User List Page (`/admin/users`) - GET /admin/user
- [ ] Search & Filter - q, approved parameters
- [ ] Pagination UI - page, limit parameters
- [ ] Create User - POST /admin/user
- [ ] Edit User - PATCH /admin/user/:id
- [ ] Delete User - DELETE /admin/user/:id
- [ ] Ban/Unban User - POST /admin/user/:id/ban, /unban
- [ ] Assign Role to User - POST /admin/roles/users/:userId/roles

---

# BASE URL CONFIGURATION

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

**End of Documentation**

*For questions or clarifications, contact the Backend Team.*