# Mockline Enhancements Implementation Plan

Date: 2026-03-11

## Scope

Resolve these issues end-to-end:

1. Mocky reliability issues.
2. Backend run error related to missing `main.py` in generated output.
3. ZIP downloads missing files.
4. Replace non-realtime `feathersClient` requests with server actions; keep realtime on `feathersClient` only.
5. Add `loading.tsx` with morph loading for app routes.
6. Improve project creation UX with morph loading and progress visibility.
7. Always enhance prompt before create project; add backend service to infer name/description from enhanced prompt.

## Implementation Phases

### Phase 1: Backend generation reliability

- Harden JSON parsing in generation worker.
- Enforce required files in generated file plan (`main.py`, `requirements.txt`).
- Improve generation error diagnostics.

### Phase 2: ZIP completeness

- Add retry for file fetch when zipping project/snapshot.
- Fail ZIP generation when any file cannot be fetched after retries.

### Phase 3: Server action migration

- Create/adjust server actions to return typed data directly and throw errors.
- Refactor hooks to use server actions for CRUD requests.
- Keep realtime listeners/channels on `feathersClient` only.

### Phase 4: Loading UX

- Add route-level `loading.tsx` files in Next app tree.
- Reuse morph loading component for route transitions.

### Phase 5: Prompt preprocessing + meta inference

- Add backend `infer-project-meta` service.
- Add frontend server action for meta inference.
- Update initial screen flow:
    - typing dots while enhancing + inferring
    - morph loading/progress while project creation starts
    - then workspace generation progress.

## Verification

- Generation includes required files and reaches `ready`.
- ZIP contains all files or returns explicit failure.
- Hooks no longer use non-realtime `feathersClient` CRUD calls.
- Route transitions show morph loader via `loading.tsx`.
- Create flow sequence: typing dots -> infer meta -> morph loader/progress -> workspace.
