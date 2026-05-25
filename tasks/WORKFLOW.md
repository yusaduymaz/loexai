# Agent Workflow

## Purpose

This project uses the following default workflow for non-trivial engineering work. The goal is to keep execution structured, verifiable, and low-noise.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for any non-trivial task with 3 or more steps or architectural decisions.
- If execution goes sideways, stop and re-plan immediately.
- Use plan mode for verification steps, not only implementation.
- Write detailed specs up front when ambiguity is likely.

### 2. Subagent Strategy

- Use subagents liberally to keep the main context focused.
- Offload research, exploration, and parallel analysis when it reduces context pressure.
- For complex problems, prefer more focused subagents over one overloaded thread.
- Keep one task per subagent.

### 3. Self-Improvement Loop

- After any user correction, update `tasks/lessons.md`.
- Record the mistake pattern and the prevention rule.
- Refine lessons until the same mistake stops recurring.
- Review relevant lessons at the start of future sessions.

### 4. Verification Before Done

- Do not mark work complete without evidence.
- Diff behavior before and after changes when relevant.
- Ask whether the result meets staff-engineer review quality.
- Run tests, inspect logs, and demonstrate correctness where possible.

### 5. Demand Elegance

- For non-trivial changes, pause and check for a simpler or more coherent design.
- If a fix feels hacky, prefer the more elegant implementation once the real constraints are clear.
- Do not over-engineer simple fixes.

### 6. Autonomous Bug Fixing

- When given a bug report, move directly to diagnosis and repair.
- Use logs, failing tests, and concrete evidence to identify root cause.
- Avoid pushing context-switching work back to the user when the answer is discoverable in the repo.

## Task Management

### Required Files

- `tasks/todo.md`: active task plan and review notes
- `tasks/lessons.md`: mistakes, corrections, and prevention rules

### Process

1. Write the plan in `tasks/todo.md` with checkable items.
2. Verify the plan before implementation starts.
3. Mark progress in `tasks/todo.md` while working.
4. Summarize high-level changes during execution.
5. Add a review section with outcomes, verification, and residual risks.
6. If the user corrected something, update `tasks/lessons.md`.

## Core Principles

- Simplicity first. Touch the minimum code necessary.
- No lazy fixes. Find root causes and avoid temporary patches.
- Minimal impact. Reduce regression risk and avoid unrelated edits.
- Verification is mandatory before completion claims.

## Usage Notes

- This file is the persistent workflow contract.
- `tasks/todo.md` is the per-task execution tracker.
- `tasks/lessons.md` is append-only unless an older lesson is being refined.
