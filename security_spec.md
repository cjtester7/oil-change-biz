# Security Specification - Jiffy Lube Franchise Optimizer

## Data Invariants
1. **Customer Ownership**: Only the customer (via their UID) or an authorized staff member can read/write their own profile.
2. **Visit Integrity**: A visit record MUST be linked to a valid customer.
3. **Store Isolation**: Franchise settings are global for the store but should only be modifiable by authorized IDs.
4. **Immutable Timestamps**: `createdAt` on any document cannot be changed after creation.
5. **Role-Based Access**: Reactivation status and service updates follow a strict workflow.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create a customer document where `uid` does not match `request.auth.uid`.
2. **PII Leak**: Authenticated User A tries to `get` the email/phone of User B.
3. **Orphaned Visit**: Update a visit record to point to a non-existent `customerId`.
4. **Timestamp Fraud**: Update the `createdAt` field on a visit to 2 years ago.
5. **Ghost Field Injection**: Add `isAdmin: true` to a customer document during creation.
6. **State Shortcut**: Move a visit status from `pending` directly to `reactivation-sent` without it being `completed` (or appropriate status).
7. **Size Attack**: Inject a 1.5MB base64 string into the `vehicle` field.
8. **ID Poisoning**: Attempt to create a document with a 1024-character ID containing special symbols.
9. **Query Scrape**: Authenticated user attempts to list *all* customers without a `where` clause filtering by their own `uid`.
10. **Store Config Tampering**: Random user attempts to change `isDigitalIntakeActive` to `false`.
11. **Negative Billing**: Attempt to set a visit `amount` to `-500.00`.
12. **Future Dating**: Set `date` of a visit to a time in the future (e.g., 2030).

## Test Implementation
*Implementation moved to firestore.rules.test.ts during development.*
