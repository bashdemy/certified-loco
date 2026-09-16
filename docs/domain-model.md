# Domain Model

## Product Category

Regulatory classification of a railway part. Categories may be hierarchical, e.g. `Wheelset -> Wagon` and `Wheelset -> Locomotive`. Classification must be specific enough to determine requirements.

## Certificate

Conformity certificate metadata plus a reference to its immutable source document. Store number, applicant, manufacturer, product/category, dates, scheme, regulation, standards and test protocols. Edits create revisions.

## Regulation / Standard

Both are versioned by effective date. Requirements reference the exact applicable version and, where possible, clause.

## Requirement

Connects a product category to a regulatory provision, standard clause and test requirement. It has validity dates and evidence.

## Test

Reusable test/test method. Parameters such as temperature, sample count or operating conditions are structured data.

## Test Programme

Set of tests associated with a historical certificate or assessment. Historical programmes are evidence, not authority over current legislation.

## Evidence

Records source document/URL, page/section/clause, extraction method and review state.

## Initial scope

Start with `ТР ТС 001/2011`.

First categories:

1. locomotive wheelsets;
2. wagon wheelsets;
3. brake discs.
