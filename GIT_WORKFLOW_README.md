# Git Multi-Phase Workflow Automation

## 📋 Overview

This automation splits unstaged changes in a monorepo into **20 feature branches** (10 for client, 10 for server) across **two machines** to work around potential size/network limits.

## 🗂️ Files Created

1. **`push_changes_phase1.sh`** - Runs on Machine 1 (buckets 1-5)
2. **`push_changes_phase2.sh`** - Runs on Machine 2 (buckets 6-10)
3. **`next_user_instructions.txt`** - Auto-generated instructions for Machine 2

## 🚀 Usage

### Machine 1 (Phase 1)

```bash
# Make the script executable
chmod +x push_changes_phase1.sh

# Run Phase 1 (processes buckets 1-5)
./push_changes_phase1.sh
```

**What it does:**
- ✅ Detects all modified/untracked files
- ✅ Separates `client/` and `server/` files
- ✅ Creates 10 buckets for each group
- ✅ Processes buckets 1-5:
  - `feature/client-part-1` through `feature/client-part-5`
  - `feature/server-part-1` through `feature/server-part-5`
- ✅ Generates `next_user_instructions.txt`

### Machine 2 (Phase 2)

```bash
# Option A: Use the generated script (already provided)
chmod +x push_changes_phase2.sh
./push_changes_phase2.sh

# Option B: Follow instructions in next_user_instructions.txt
# (Copy the prompt and paste to Copilot Chat)
```

**What it does:**
- ✅ Processes the remaining unstaged changes
- ✅ Creates buckets 6-10:
  - `feature/client-part-6` through `feature/client-part-10`
  - `feature/server-part-6` through `feature/server-part-10`

## 📊 Branch Structure

After both phases complete, you'll have:

```
feature/client-part-1  ─┐
feature/client-part-2   │
feature/client-part-3   │
feature/client-part-4   ├─ Machine 1 (Phase 1)
feature/client-part-5   │
feature/server-part-1   │
feature/server-part-2   │
feature/server-part-3   │
feature/server-part-4   │
feature/server-part-5  ─┘

feature/client-part-6  ─┐
feature/client-part-7   │
feature/client-part-8   │
feature/client-part-9   ├─ Machine 2 (Phase 2)
feature/client-part-10  │
feature/server-part-6   │
feature/server-part-7   │
feature/server-part-8   │
feature/server-part-9   │
feature/server-part-10 ─┘
```

## ⚙️ How It Works

### File Detection
```bash
git status --porcelain | grep -E '^\s*M|^\?\?'
```
Finds all modified and untracked files.

### Grouping Logic
- Files starting with `client/` → `client_files[]`
- Files starting with `server/` → `server_files[]`

### Bucketing Algorithm
Each group is divided into 10 equal buckets using ceiling division:
```bash
bucket_size = (total_files + 9) / 10
```

### Branch Independence
Each branch is created from `main`:
```bash
git checkout main -q
git checkout -b feature/client-part-X
git add <bucket files>
git commit -m "feat(client): update part X"
git push -u origin feature/client-part-X
```

## 🛡️ Safety Features

- ✅ **File existence check**: Verifies files exist before committing
- ✅ **Empty bucket skip**: Skips buckets with no valid files
- ✅ **Branch isolation**: Returns to `main` between branches
- ✅ **Error handling**: Exits on error (`set -e`)
- ✅ **Colored output**: Clear visual feedback

## 🔄 Workflow Example

```bash
# Machine 1
cd /path/to/monorepo
./push_changes_phase1.sh

# Output:
# ✓ Processed CLIENT buckets 1-5
# ✓ Processed SERVER buckets 1-5
# ✓ Generated next_user_instructions.txt

# Machine 2 (on another computer)
cd /path/to/monorepo
git pull  # Get latest main
./push_changes_phase2.sh

# Output:
# ✓ Processed CLIENT buckets 6-10
# ✓ Processed SERVER buckets 6-10
# ✓ All 20 branches pushed!
```

## 📝 Post-Execution

After both phases complete:

1. **Review branches** on GitHub/GitLab
2. **Create Pull Requests** for each feature branch
3. **Merge sequentially** or in parallel
4. **Clean up local branches**:
   ```bash
   git branch | grep 'feature/client-part-\|feature/server-part-' | xargs git branch -D
   ```

## 🐛 Troubleshooting

**Problem**: "Cannot find main/master branch"
```bash
# Ensure you have a main branch
git checkout -b main
```

**Problem**: Branch already exists
```bash
# Delete existing branches
git branch -D feature/client-part-1
```

**Problem**: Files not found
```bash
# Ensure you're in the monorepo root
pwd  # Should show the monorepo directory
```

## 🎯 Use Cases

- 📦 Large batch updates across client and server
- 🌐 Network-limited environments (split work across machines)
- 👥 Collaborative refactoring (different devs handle different buckets)
- 🔍 Easier code review (smaller, focused PRs)

## ⚡ Advanced: Customize Bucket Count

Edit the scripts to change from 10 buckets to N buckets:

```bash
# Line ~56 in both scripts
local num_buckets=10  # Change to desired count
```

Then update the loop ranges accordingly.

---

**Created by**: Senior DevOps Engineer Workflow Automation
**Version**: 1.0
**Last Updated**: 2026-02-16
