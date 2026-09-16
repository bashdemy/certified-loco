# Data Integrity

## Principle
Certification results must be reproducible. An old assessment must not change when catalogue or regulatory data changes.

## Optimistic concurrency
Editable records have a monotonically increasing `version`. Updates include the version read by the client.

```sql
UPDATE certificate
SET manufacturer = $1,
    version = version + 1,
    updated_at = now()
WHERE id = $2 AND version = $3;
```

Zero rows means a concurrent edit occurred. The UI should let the user reconcile values.

## Transactions
Use transactions for atomic domain operations such as publishing a regulatory dataset, finalising an assessment, approving related requirements, or creating a certificate revision. Use row locks only for short operations that cannot safely run concurrently.

## Revisions
Certificates, regulatory datasets and important source documents are revisioned rather than overwritten. Assessments reference exact revisions.

## Regulatory publishing
Edits happen in a draft dataset:

`DRAFT -> PUBLISHED -> SUPERSEDED`

Assessments use only published datasets. Publishing validates references and changes state in one transaction.

## Audit
Material mutations record actor, timestamp, entity, action, before/after values, request ID and optional reason. Regulatory changes should require a reason.

## Deletion
Archive important records instead of hard deleting them. Source-document replacements create new revisions.
