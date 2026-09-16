# Assessment Engine

## Purpose

Given a certificate/product, determine tests to consider for certification using the regulatory dataset effective on the assessment date.

## Flow

```text
Certificate
    |
extract + confirm
    |
classify product
    |
+-----------------------+
|                       |
historical programmes   current requirements
|                       |
+-----------+-----------+
            |
           diff
            |
        assessment
```

## Steps

1. Extract and confirm certificate metadata.
2. Resolve product category.
3. Find comparable historical test programmes.
4. Resolve the published regulatory dataset for the assessment date.
5. Resolve regulations, provisions, standards and test requirements.
6. Diff historical tests against current requirements.
7. Persist an immutable assessment with evidence.

## Result states

- `required`: supported by current requirements.
- `additional`: currently required but absent historically.
- `changed`: historical/current requirement differs.
- `historical_only`: historical evidence without current mapping.
- `review`: insufficient evidence for a deterministic result.

## AI boundary

LLMs may assist extraction, terminology normalisation, candidate classification and candidate requirement extraction. They do not make the final regulatory decision.

AI-extracted regulatory mappings remain `pending_review` until approved.

## Provenance

Every recommendation should expose:

`product -> regulation/version -> provision -> standard/version -> clause -> test requirement`
