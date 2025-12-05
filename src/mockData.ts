import type { Requirement, UseCase, TestCase, Information, Link } from './types';

// Comprehensive mock data for a sample project
export const mockRequirements: Requirement[] = [
  // System Level Requirements
  {
    id: 'REQ-001',
    title: 'User Authentication',
    description: 'The system shall provide secure user authentication mechanisms.',
    text: 'All users must authenticate using email/password or OAuth providers (Google, GitHub). Multi-factor authentication (MFA) must be supported for enhanced security.',
    rationale: 'Security is paramount for protecting user data and preventing unauthorized access.',
    status: 'approved',
    priority: 'high',
    parentIds: [],
    author: 'John Smith',
    verificationMethod: 'Security audit and penetration testing',
    dateCreated: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    approvalDate: Date.now() - 25 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
    comments: 'Approved by security team',
  },
  {
    id: 'REQ-002',
    title: 'Password Security',
    description: 'Passwords must meet minimum security requirements.',
    text: 'Passwords must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters. Passwords must be hashed using bcrypt with a minimum cost factor of 12.',
    rationale: 'Strong password policies prevent brute force attacks and credential stuffing.',
    status: 'approved',
    priority: 'high',
    parentIds: ['REQ-001'],
    author: 'John Smith',
    verificationMethod: 'Code review and automated testing',
    dateCreated: Date.now() - 29 * 24 * 60 * 60 * 1000,
    approvalDate: Date.now() - 24 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-003',
    title: 'Session Management',
    description: 'User sessions must be securely managed.',
    text: 'Sessions must expire after 30 minutes of inactivity. Session tokens must be stored in httpOnly cookies with secure flag enabled.',
    rationale: 'Proper session management prevents session hijacking and unauthorized access.',
    status: 'implemented',
    priority: 'high',
    parentIds: ['REQ-001'],
    author: 'Sarah Johnson',
    verificationMethod: 'Integration testing',
    dateCreated: Date.now() - 28 * 24 * 60 * 60 * 1000,
    approvalDate: Date.now() - 23 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-004',
    title: 'OAuth Integration',
    description: 'Support third-party OAuth authentication.',
    text: 'Users can authenticate using Google OAuth 2.0 and GitHub OAuth. The system must request only necessary scopes (email and profile).',
    rationale: 'OAuth provides a convenient and secure authentication method.',
    status: 'verified',
    priority: 'medium',
    parentIds: ['REQ-001'],
    author: 'Mike Chen',
    verificationMethod: 'End-to-end testing',
    dateCreated: Date.now() - 27 * 24 * 60 * 60 * 1000,
    approvalDate: Date.now() - 22 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },

  // Data Management Requirements
  {
    id: 'REQ-005',
    title: 'Data Encryption',
    description: 'All sensitive data must be encrypted.',
    text: 'Data at rest must be encrypted using AES-256. Data in transit must use TLS 1.3 or higher. Encryption keys must be rotated quarterly.',
    rationale:
      'Encryption protects sensitive data from unauthorized access and meets compliance requirements.',
    status: 'approved',
    priority: 'high',
    parentIds: [],
    author: 'Emily Davis',
    verificationMethod: 'Security audit',
    comments: 'GDPR and SOC2 compliance requirement',
    dateCreated: Date.now() - 26 * 24 * 60 * 60 * 1000,
    approvalDate: Date.now() - 21 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-006',
    title: 'Database Encryption',
    description: 'Database must support encryption at rest.',
    text: 'Use database-level encryption for all tables containing PII. Implement field-level encryption for highly sensitive fields (SSN, credit card numbers).',
    rationale: 'Layered encryption approach provides defense in depth.',
    status: 'implemented',
    priority: 'high',
    parentIds: ['REQ-005'],
    author: 'Emily Davis',
    verificationMethod: 'Database configuration review',
    dateCreated: Date.now() - 25 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-007',
    title: 'Backup and Recovery',
    description: 'System must support automated backups.',
    text: 'Automated daily backups must be performed at 2 AM UTC. Backups must be encrypted and stored in geographically separate locations. Recovery Time Objective (RTO) must be less than 4 hours.',
    rationale: 'Regular backups ensure business continuity and data recovery capabilities.',
    status: 'approved',
    priority: 'high',
    parentIds: ['REQ-005'],
    author: 'David Wilson',
    verificationMethod: 'Disaster recovery testing',
    dateCreated: Date.now() - 24 * 24 * 60 * 60 * 1000,
    approvalDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },

  // User Interface Requirements
  {
    id: 'REQ-008',
    title: 'Responsive Design',
    description: 'Application must be fully responsive.',
    text: 'The UI must work seamlessly on desktop (1920x1080), tablet (768x1024), and mobile (375x667) devices. Touch targets must be at least 44x44 pixels on mobile.',
    rationale: 'Users access the application from various devices.',
    status: 'draft',
    priority: 'medium',
    parentIds: [],
    author: 'Lisa Anderson',
    verificationMethod: 'Cross-device testing',
    dateCreated: Date.now() - 23 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-009',
    title: 'Accessibility Standards',
    description: 'Application must meet WCAG 2.1 Level AA standards.',
    text: 'All interactive elements must be keyboard navigable. Color contrast must meet 4.5:1 ratio for normal text. Screen reader compatibility must be ensured.',
    rationale: 'Accessibility ensures all users can use the application effectively.',
    status: 'draft',
    priority: 'medium',
    parentIds: ['REQ-008'],
    author: 'Lisa Anderson',
    verificationMethod: 'Accessibility audit using WAVE and axe tools',
    dateCreated: Date.now() - 22 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-010',
    title: 'Dark Mode Support',
    description: 'Application must support dark mode.',
    text: 'Users can toggle between light and dark themes. Theme preference must be persisted. System theme preference should be respected by default.',
    rationale: 'Dark mode reduces eye strain and saves battery on OLED displays.',
    status: 'draft',
    priority: 'low',
    parentIds: ['REQ-008'],
    author: 'Lisa Anderson',
    verificationMethod: 'Visual testing',
    dateCreated: Date.now() - 21 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },

  // Performance Requirements
  {
    id: 'REQ-011',
    title: 'Page Load Performance',
    description: 'Pages must load quickly.',
    text: 'Initial page load must complete within 2 seconds on a 4G connection. Time to Interactive (TTI) must be under 3 seconds.',
    rationale: 'Fast load times improve user experience and SEO rankings.',
    status: 'approved',
    priority: 'high',
    parentIds: [],
    author: 'Robert Taylor',
    verificationMethod: 'Lighthouse performance testing',
    dateCreated: Date.now() - 20 * 24 * 60 * 60 * 1000,
    approvalDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-012',
    title: 'API Response Time',
    description: 'API endpoints must respond quickly.',
    text: 'All API endpoints must respond within 200ms for 95th percentile requests. Database queries must be optimized with proper indexing.',
    rationale: 'Fast API responses ensure responsive user interactions.',
    status: 'implemented',
    priority: 'high',
    parentIds: ['REQ-011'],
    author: 'Robert Taylor',
    verificationMethod: 'Load testing with Apache JMeter',
    dateCreated: Date.now() - 19 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },

  // Notification Requirements
  {
    id: 'REQ-013',
    title: 'Email Notifications',
    description: 'System must send email notifications.',
    text: 'Users receive email notifications for: account creation, password reset, important updates. Users can configure notification preferences.',
    rationale: 'Email notifications keep users informed of important events.',
    status: 'approved',
    priority: 'medium',
    parentIds: [],
    author: 'Jennifer Martinez',
    verificationMethod: 'Email delivery testing',
    dateCreated: Date.now() - 18 * 24 * 60 * 60 * 1000,
    approvalDate: Date.now() - 13 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'REQ-014',
    title: 'In-App Notifications',
    description: 'Display real-time in-app notifications.',
    text: 'Users see toast notifications for important events. Notification center shows history of all notifications. Unread count is displayed in the header.',
    rationale: 'In-app notifications provide immediate feedback without leaving the application.',
    status: 'draft',
    priority: 'low',
    parentIds: ['REQ-013'],
    author: 'Jennifer Martinez',
    verificationMethod: 'User acceptance testing',
    dateCreated: Date.now() - 17 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },

  // Audit and Logging
  {
    id: 'REQ-015',
    title: 'Audit Logging',
    description: 'All critical actions must be logged.',
    text: 'Log all authentication attempts, data modifications, and admin actions. Logs must include timestamp, user ID, IP address, and action details. Logs must be retained for 1 year.',
    rationale: 'Audit logs are essential for security monitoring and compliance.',
    status: 'implemented',
    priority: 'high',
    parentIds: [],
    author: 'Christopher Lee',
    verificationMethod: 'Log analysis and compliance review',
    dateCreated: Date.now() - 16 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
];

export const mockUseCases: UseCase[] = [
  {
    id: 'UC-001',
    title: 'User Registration',
    description: 'A new user creates an account in the system.',
    actor: 'Unregistered User',
    preconditions: 'User has a valid email address.',
    postconditions: 'User account is created and activation email is sent.',
    mainFlow: `1. User navigates to the registration page
2. User enters email, password, and confirms password
3. User accepts terms and conditions
4. System validates input (email format, password strength)
5. System creates user account with "pending" status
6. System sends activation email to user
7. System displays confirmation message`,
    alternativeFlows: `3a. User declines terms: Registration is cancelled
4a. Invalid email format: System displays error message
4b. Weak password: System displays password requirements
4c. Email already exists: System suggests password reset
6a. Email delivery fails: System logs error and notifies admin`,
    priority: 'high',
    status: 'approved',
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'UC-002',
    title: 'User Login',
    description: 'A registered user authenticates and accesses the system.',
    actor: 'Registered User',
    preconditions: 'User has an active account.',
    postconditions: 'User is authenticated and redirected to dashboard.',
    mainFlow: `1. User navigates to login page
2. User enters email and password
3. System validates credentials against database
4. System creates secure session token
5. System stores session in httpOnly cookie
6. System redirects user to dashboard
7. System logs successful login attempt`,
    alternativeFlows: `3a. Invalid credentials: System displays generic error message
3b. Account locked: System displays account locked message
3c. Account pending: System prompts user to check activation email
5a. Session creation fails: System displays error and logs incident`,
    priority: 'high',
    status: 'approved',
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'UC-003',
    title: 'Password Reset',
    description: 'User resets their forgotten password.',
    actor: 'Registered User',
    preconditions: 'User has a registered account.',
    postconditions: 'User password is updated and user is notified.',
    mainFlow: `1. User clicks "Forgot Password" on login page
2. User enters registered email address
3. System validates email exists in database
4. System generates secure reset token (valid for 24 hours)
5. System sends password reset email with link
6. User clicks reset link in email
7. System validates token and displays password reset form
8. User enters and confirms new password
9. System validates password strength
10. System updates password in database
11. System invalidates reset token
12. System sends confirmation email
13. System redirects to login page`,
    alternativeFlows: `3a. Email not found: System displays same message (security)
6a. Token expired: System displays error and offers new reset
9a. Weak password: System displays requirements and rejects`,
    priority: 'high',
    status: 'approved',
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'UC-004',
    title: 'OAuth Login',
    description: 'User authenticates using a third-party OAuth provider.',
    actor: 'User',
    preconditions: 'User has a Google or GitHub account.',
    postconditions: 'User is authenticated or new account is created.',
    mainFlow: `1. User clicks "Sign in with Google" or "Sign in with GitHub"
2. System redirects to OAuth provider
3. User authorizes application access
4. OAuth provider redirects back with authorization code
5. System exchanges code for access token
6. System retrieves user profile information
7a. If email exists: System logs user in
7b. If new user: System creates account automatically
8. System redirects to dashboard`,
    alternativeFlows: `3a. User denies authorization: System redirects to login with message
5a. Token exchange fails: System logs error and displays message
6a. Profile retrieval fails: System uses email as fallback`,
    priority: 'medium',
    status: 'verified',
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'UC-005',
    title: 'Update Profile',
    description: 'User updates their profile information.',
    actor: 'Authenticated User',
    preconditions: 'User is logged in.',
    postconditions: 'User profile is updated in the database.',
    mainFlow: `1. User navigates to profile settings
2. User modifies name, phone number, or avatar
3. User clicks "Save Changes"
4. System validates input
5. System updates database
6. System displays success message
7. System logs profile update`,
    alternativeFlows: `4a. Invalid phone format: System displays error
5a. Database error: System displays error and retries`,
    priority: 'medium',
    status: 'draft',
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'UC-006',
    title: 'Change Email',
    description: 'User changes their email address.',
    actor: 'Authenticated User',
    preconditions: 'User is logged in.',
    postconditions: 'Email is updated after verification.',
    mainFlow: `1. User navigates to account settings
2. User enters new email address
3. User enters current password for verification
4. System validates password
5. System sends verification email to new address
6. User clicks verification link in email
7. System updates email in database
8. System sends notification to old email
9. System displays success message`,
    alternativeFlows: `3a. New email already exists: System displays error
4a. Invalid password: System displays error
6a. Link expires: User must restart process`,
    priority: 'medium',
    status: 'draft',
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'UC-007',
    title: 'Enable Two-Factor Authentication',
    description: 'User enables MFA for enhanced security.',
    actor: 'Authenticated User',
    preconditions: 'User is logged in and has authenticator app.',
    postconditions: 'MFA is enabled on user account.',
    mainFlow: `1. User navigates to security settings
2. User clicks "Enable Two-Factor Authentication"
3. System generates QR code with secret
4. User scans QR code with authenticator app
5. User enters verification code from app
6. System validates code
7. System generates backup codes
8. User saves backup codes
9. System enables MFA on account
10. System displays success message`,
    alternativeFlows: `5a. Invalid code: User can retry up to 3 times
5b. Too many failures: Process is locked for 15 minutes`,
    priority: 'high',
    status: 'draft',
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'UC-008',
    title: 'View Audit Logs',
    description: 'Admin reviews system audit logs.',
    actor: 'System Administrator',
    preconditions: 'User has admin privileges.',
    postconditions: 'Audit logs are displayed.',
    mainFlow: `1. Admin navigates to audit log viewer
2. Admin selects date range
3. Admin applies filters (user, action type, IP address)
4. System queries audit log database
5. System displays paginated results
6. Admin can export logs to CSV`,
    alternativeFlows: `4a. Too many results: System limits to 10,000 and suggests refinement
6a. Export fails: System displays error`,
    priority: 'medium',
    status: 'implemented',
    lastModified: Date.now(),
    revision: '01',
  },
];

export const mockTestCases: TestCase[] = [
  {
    id: 'TC-001',
    title: 'Verify successful login with valid credentials',
    description: 'Test that a user can log in with correct email and password.',
    requirementIds: ['REQ-001', 'REQ-003'],
    status: 'passed',
    priority: 'high',
    author: 'QA Team',
    lastRun: Date.now() - 2 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 15 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-002',
    title: 'Verify login fails with invalid password',
    description: 'Test that login is rejected when password is incorrect.',
    requirementIds: ['REQ-001'],
    status: 'passed',
    priority: 'high',
    author: 'QA Team',
    lastRun: Date.now() - 2 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 15 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-003',
    title: 'Verify password complexity requirements',
    description: 'Test that weak passwords are rejected during registration.',
    requirementIds: ['REQ-002'],
    status: 'passed',
    priority: 'high',
    author: 'QA Team',
    lastRun: Date.now() - 3 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 14 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-004',
    title: 'Verify session expires after 30 minutes',
    description: 'Test that inactive sessions are automatically terminated.',
    requirementIds: ['REQ-003'],
    status: 'passed',
    priority: 'high',
    author: 'QA Team',
    lastRun: Date.now() - 4 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 13 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-005',
    title: 'Verify Google OAuth login flow',
    description: 'Test complete OAuth authentication flow with Google.',
    requirementIds: ['REQ-004'],
    status: 'passed',
    priority: 'medium',
    author: 'QA Team',
    lastRun: Date.now() - 1 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 12 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-006',
    title: 'Verify database encryption at rest',
    description: 'Confirm that sensitive data is encrypted in database.',
    requirementIds: ['REQ-006'],
    status: 'passed',
    priority: 'high',
    author: 'Security Team',
    lastRun: Date.now() - 5 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 11 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-007',
    title: 'Verify backup restoration process',
    description: 'Test that backups can be successfully restored.',
    requirementIds: ['REQ-007'],
    status: 'passed',
    priority: 'high',
    author: 'DevOps Team',
    lastRun: Date.now() - 7 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 10 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-008',
    title: 'Verify responsive design on mobile devices',
    description: 'Test UI rendering on various mobile screen sizes.',
    requirementIds: ['REQ-008'],
    status: 'failed',
    priority: 'medium',
    author: 'QA Team',
    lastRun: Date.now() - 1 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 9 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-009',
    title: 'Verify WCAG 2.1 compliance',
    description: 'Run automated accessibility tests using axe-core.',
    requirementIds: ['REQ-009'],
    status: 'blocked',
    priority: 'medium',
    author: 'QA Team',
    dateCreated: Date.now() - 8 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-010',
    title: 'Verify page load performance',
    description: 'Measure page load time and ensure it meets requirements.',
    requirementIds: ['REQ-011'],
    status: 'passed',
    priority: 'high',
    author: 'Performance Team',
    lastRun: Date.now() - 3 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 7 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-011',
    title: 'Verify API response times',
    description: 'Load test all API endpoints and measure 95th percentile.',
    requirementIds: ['REQ-012'],
    status: 'passed',
    priority: 'high',
    author: 'Performance Team',
    lastRun: Date.now() - 6 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 6 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-012',
    title: 'Verify email notification delivery',
    description: 'Test that users receive email notifications correctly.',
    requirementIds: ['REQ-013'],
    status: 'passed',
    priority: 'medium',
    author: 'QA Team',
    lastRun: Date.now() - 2 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 5 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-013',
    title: 'Verify audit log creation',
    description: 'Confirm that all critical actions are logged properly.',
    requirementIds: ['REQ-015'],
    status: 'passed',
    priority: 'high',
    author: 'Security Team',
    lastRun: Date.now() - 1 * 24 * 60 * 60 * 1000,
    dateCreated: Date.now() - 4 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-014',
    title: 'Verify dark mode toggle',
    description: 'Test switching between light and dark themes.',
    requirementIds: ['REQ-010'],
    status: 'draft',
    priority: 'low',
    author: 'QA Team',
    dateCreated: Date.now() - 3 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'TC-015',
    title: 'Verify notification preferences',
    description: 'Test that users can configure notification settings.',
    requirementIds: ['REQ-013', 'REQ-014'],
    status: 'draft',
    priority: 'low',
    author: 'QA Team',
    dateCreated: Date.now() - 2 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
];

export const mockInformation: Information[] = [
  {
    id: 'INFO-001',
    title: 'Security Review Meeting - March 2025',
    content: `# Security Review Meeting Notes

**Date:** March 15, 2025
**Attendees:** John Smith (Security Lead), Emily Davis (Data Team), Christopher Lee (DevOps)

## Key Decisions:
- Approved implementation of AES-256 encryption for all PII data
- MFA will be required for all admin accounts starting April 1st
- Quarterly security audits will be conducted by external vendor

## Action Items:
- [ ] John to finalize MFA implementation by March 30
- [ ] Emily to complete database encryption migration by April 15
- [ ] Christopher to set up automated security scanning pipeline

## Next Meeting:
April 15, 2025 @ 2:00 PM`,
    type: 'meeting',
    dateCreated: Date.now() - 10 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'INFO-002',
    title: 'Architecture Decision: Session Management',
    content: `# ADR-001: Session Management Strategy

## Status
Accepted

## Context
We need a secure and scalable session management solution for our authentication system.

## Decision
We will use JWT tokens stored in httpOnly cookies with the following characteristics:
- 30-minute expiration for active sessions
- Refresh tokens with 7-day expiration
- Secure flag enabled for production
- SameSite=Strict for CSRF protection

## Consequences
**Positive:**
- Stateless authentication enables horizontal scaling
- httpOnly cookies prevent XSS attacks
- Short expiration reduces security risk

**Negative:**
- Cannot revoke sessions without additional infrastructure
- Slightly more complex implementation

## Alternatives Considered
- Server-side sessions with Redis
- Local storage tokens (rejected due to XSS risk)`,
    type: 'decision',
    dateCreated: Date.now() - 20 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'INFO-003',
    title: 'Performance Optimization Notes',
    content: `# Performance Optimization Strategy

## Database Optimizations
- Added indexes on frequently queried columns (user_id, email, created_at)
- Implemented connection pooling (min: 5, max: 20)
- Enabled query caching for read-heavy operations

## Frontend Optimizations
- Implemented code splitting for route-based chunks
- Lazy loading for images and heavy components
- Service worker for offline caching

## Current Metrics
- Initial page load: 1.8s (target: <2s) ✅
- Time to Interactive: 2.7s (target: <3s) ✅
- API p95 response time: 180ms (target: <200ms) ✅

## Next Steps
- Implement CDN for static assets
- Add Redis caching layer for API responses
- Optimize bundle size (currently 240KB gzipped)`,
    type: 'note',
    dateCreated: Date.now() - 5 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'INFO-004',
    title: 'GDPR Compliance Checklist',
    content: `# GDPR Compliance Requirements

## Data Protection
- [x] Data encryption at rest (AES-256)
- [x] Data encryption in transit (TLS 1.3)
- [x] Regular security audits
- [ ] Data anonymization for analytics

## User Rights
- [x] Right to access (export user data)
- [x] Right to deletion (account deletion)
- [ ] Right to portability (data export in standard format)
- [ ] Right to rectification (data update)

## Privacy
- [x] Privacy policy published
- [x] Cookie consent banner
- [x] Data processing agreements with vendors
- [ ] Privacy impact assessment

## Documentation
- [x] Data processing registry
- [x] Breach notification procedures
- [ ] DPO appointment (required for >5000 users)`,
    type: 'other',
    dateCreated: Date.now() - 15 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
  {
    id: 'INFO-005',
    title: 'API Design Guidelines',
    content: `# API Design Guidelines

## RESTful Conventions
- Use nouns for resources: /users, /projects, /requirements
- Use HTTP verbs: GET, POST, PUT, DELETE, PATCH
- Use plural nouns for collections
- Use nested resources: /projects/:id/requirements

## Response Format
\`\`\`json
{
  "data": {},
  "meta": {
    "timestamp": "2025-03-15T10:30:00Z",
    "version": "1.0"
  },
  "errors": []
}
\`\`\`

## Error Handling
- Use appropriate HTTP status codes
- Include error codes and messages
- Provide helpful error descriptions

## Versioning
- Use URL versioning: /api/v1/users
- Maintain backward compatibility for one major version`,
    type: 'note',
    dateCreated: Date.now() - 25 * 24 * 60 * 60 * 1000,
    lastModified: Date.now(),
    revision: '01',
  },
];

export const mockLinks: Link[] = [
  // Authentication requirements links
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-002',
    targetId: 'REQ-003',
    type: 'relates_to',
    description: 'Password security and session management work together for authentication',
  },
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-003',
    targetId: 'REQ-004',
    type: 'relates_to',
    description: 'Both are authentication mechanisms',
  },

  // Data encryption links
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-006',
    targetId: 'REQ-007',
    type: 'relates_to',
    description: 'Backups must also be encrypted',
  },

  // UI requirements links
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-009',
    targetId: 'REQ-010',
    type: 'relates_to',
    description: 'Both are UI/UX requirements',
  },

  // Performance dependencies
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-012',
    targetId: 'REQ-011',
    type: 'depends_on',
    description: 'Fast API responses are required for good page load performance',
  },

  // Notification system
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-014',
    targetId: 'REQ-013',
    type: 'depends_on',
    description: 'In-app notifications complement email notifications',
  },

  // Security and audit
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-015',
    targetId: 'REQ-001',
    type: 'relates_to',
    description: 'Authentication events must be logged',
  },
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-015',
    targetId: 'REQ-005',
    type: 'relates_to',
    description: 'Data access must be logged',
  },

  // Potential conflicts
  {
    id: crypto.randomUUID(),
    sourceId: 'REQ-011',
    targetId: 'REQ-005',
    type: 'conflicts_with',
    description: 'Encryption overhead may impact performance targets',
  },
];
