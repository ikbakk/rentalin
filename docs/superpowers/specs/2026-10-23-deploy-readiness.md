# Rentalin deploy readiness

Requested scope: priorities 1, 3, 5, 6, 7, 8 from the repository audit, with Cloudflare R2 storage and deployment environment examples. The user explicitly requested immediate implementation after the proposed private-storage design.

Build on the unmerged environment stack (#13–#15); do not merge or deploy.

## Storage

Convex owns authorization and file metadata. Private R2 holds new inspection images. Only authenticated active members may reserve an upload. Reserve a tenant/user-bound key before issuing a short-lived PUT URL. Validate actual size, MIME and file signature before promoting a staging object to an immutable final object. The browser never receives a PUT URL for the final key. Inspection completion attaches ready uploads transactionally; reject cross-tenant, foreign-user, expired, deleted or reused references. Signed reads require active membership and expire in five minutes. Delete abandoned uploads after 24 hours, retry failed cleanup, and never expire attached inspection evidence automatically. Legacy attached Convex images remain readable; disable new first-claim uploads.

## Other release preparation

Make landing login links configurable for separate app hosting. Add email-code password recovery using Convex Auth and Resend, preserving existing password login and twelve-character minimum. Public inquiries require server-verified Cloudflare Turnstile, with transactional phone/business limits after verification. Add safe environment examples, storage CORS/lifecycle examples, health/error visibility and tested backup tooling/procedures. No external services or real credentials are configured by this change. Business-data deletion remains owner-reviewed until retention policy is agreed; do not silently delete financial history.

## Verification

Test authorization, upload state transitions, invalid image metadata/bytes, deletion/attachment races, retry safety, anti-spam enforcement and recovery configuration. Run backend tests/typecheck, frontend checks/build and landing tests/build. Live R2/email/Turnstile and backup restore must be verified in an isolated environment with actual credentials before accepting customers.
