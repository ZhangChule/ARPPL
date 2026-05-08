# ARPPL Git Development Guide

This file records the Git/GitHub workflow for this project so future work can continue even without prior chat context.

## Repository

- Local path: `D:\PhD\ARPPL_code`
- GitHub owner: `ZhangChule`
- GitHub repository: `ARPPL`
- Remote URL: `https://github.com/ZhangChule/ARPPL.git`
- Local author name: `ZhangChule`
- Local author email: `zhangchule_2002@163.com`

Recorded on 2026-05-08. At this point the local directory already contains `.git`, but the current terminal cannot find the `git` executable. Based on `.git/refs/heads`, no local commits were found yet.

## First Setup On A New Machine

Do not store GitHub passwords or long-lived tokens in chat or in repository files. Prefer GitHub CLI authentication:

```powershell
gh auth login
```

Confirm Git is available:

```powershell
git --version
git status
git remote -v
```

If `git` is not available, install Git for Windows or add the Git installation directory to the system `PATH`.

## Remote Configuration

This project should use the following remote repository:

```powershell
git remote add origin https://github.com/ZhangChule/ARPPL.git
```

If `origin` already exists but points to the wrong URL:

```powershell
git remote set-url origin https://github.com/ZhangChule/ARPPL.git
```

Verify:

```powershell
git remote -v
```

## Recommended Branches

- `main`: stable code that can reproduce experiments or be demonstrated.
- `dev`: daily integration branch.
- `feature/<short-name>`: one feature or bug fix.
- `experiment/<short-name>`: temporary experiment or parameter exploration.

If the current default branch is still `master`, rename it before the first formal push:

```powershell
git branch -M main
```

## First Commit Suggestion

Check status before the first commit:

```powershell
git status
```

Commit code, configs, and documentation first. Avoid committing all generated experiment outputs in the initial commit:

```powershell
git add .gitignore GIT_DEVELOPMENT.md requirements.txt backend frontend
git commit -m "chore: initialize ARPPL project repository"
git push -u origin main
```

If raw test data under `testcase` must be committed, check file sizes first. GitHub has a hard 100 MB single-file limit. Large point clouds, images, and binary result files should usually use Git LFS or external data storage.

## Daily Workflow

Start a new task:

```powershell
git checkout dev
git pull
git checkout -b feature/<short-name>
```

Commit changes:

```powershell
git status
git diff
git add <files>
git commit -m "type: short description"
```

Push the branch:

```powershell
git push -u origin feature/<short-name>
```

Common commit types:

- `feat`: new feature.
- `fix`: bug fix.
- `test`: test changes.
- `docs`: documentation changes.
- `refactor`: behavior-preserving refactor.
- `chore`: build, dependency, config, or repository management.

## Verification Before Push

For backend-related changes, run at least:

```powershell
python backend/run_output3_tests.py
```

For frontend-related changes, run at least:

```powershell
cd frontend
npm run build
```

If a verification step is too slow or requires unavailable data, record exactly what was and was not tested in the commit or handoff note.

## Ignore Policy

The root `.gitignore` ignores:

- Python caches, virtual environments, and test caches.
- Frontend `node_modules`, `dist`, temporary folders, and logs.
- Backend runtime logs and `backend/records/`.
- Generated `testcase` result folders such as `output`, `output2`, `output3`, and `logs`.

Principle: source code, configs, reproducible scripts, and essential small fixtures belong in Git. Large generated results and rebuildable caches do not.

## Working With Codex

When asking Codex to manage versions, prefer this sequence:

1. Check `git status --short --branch`.
2. Check `git remote -v`.
3. Explain the intended file scope for the commit.
4. Generate a clear commit message.
5. Run `git commit` and `git push` only after confirmation.

Remote pushes need network permission, so Codex may ask for approval before running network commands. Do not send GitHub passwords or tokens directly to Codex. If authentication is needed, use `gh auth login` or Git Credential Manager on the local machine.

## Useful Recovery Commands

Show recent commits:

```powershell
git log --oneline -10
```

Unstage a file while keeping local edits:

```powershell
git restore --staged <file>
```

View changes for one file:

```powershell
git diff -- <file>
```

Show remote branches:

```powershell
git branch -r
```
