#!/bin/bash

# ============================================================================
# Multi-Phase Git Workflow Automation Script
# Purpose: Split unstaged changes across 20 feature branches (10 client, 10 server)
# Phase 1: Handles parts 1-5 on current machine
# Phase 2: Generates instructions for parts 6-10 on another machine
# ============================================================================

set -e  # Exit on error

echo "=================================================="
echo "  Git Multi-Phase Workflow Automation"
echo "  Phase 1: Processing buckets 1-5"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Step 1: Detect all modified and untracked files
# ============================================================================
echo -e "${BLUE}[Step 1/6]${NC} Analyzing working directory..."

# Get all modified and untracked files
all_files=($(git status --porcelain | grep -E '^\s*M|^\?\?' | awk '{print $2}'))

if [ ${#all_files[@]} -eq 0 ]; then
    echo -e "${RED}No unstaged changes detected. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}Found ${#all_files[@]} modified/untracked files${NC}"
echo ""

# ============================================================================
# Step 2: Separate files into client and server groups
# ============================================================================
echo -e "${BLUE}[Step 2/6]${NC} Grouping files by directory..."

client_files=()
server_files=()

for file in "${all_files[@]}"; do
    if [[ "$file" == client/* ]]; then
        client_files+=("$file")
    elif [[ "$file" == server/* ]]; then
        server_files+=("$file")
    else
        echo -e "${YELLOW}Warning: Skipping file outside client/server: $file${NC}"
    fi
done

echo -e "${GREEN}Client files: ${#client_files[@]}${NC}"
echo -e "${GREEN}Server files: ${#server_files[@]}${NC}"
echo ""

# ============================================================================
# Step 3: Divide files into 10 buckets each
# ============================================================================
echo -e "${BLUE}[Step 3/6]${NC} Dividing files into 10 buckets per group..."

# Function to split array into N buckets
split_into_buckets() {
    local -n arr=$1
    local -n bucket_ref=$2
    local num_buckets=10
    local total=${#arr[@]}
    local bucket_size=$(( (total + num_buckets - 1) / num_buckets ))  # Ceiling division
    
    for ((i=0; i<num_buckets; i++)); do
        local start=$((i * bucket_size))
        local end=$((start + bucket_size))
        if [ $end -gt $total ]; then
            end=$total
        fi
        bucket_ref[$i]="${arr[@]:$start:$((end - start))}"
    done
}

# Create buckets
declare -A client_buckets
declare -A server_buckets

split_into_buckets client_files client_buckets
split_into_buckets server_files server_buckets

echo -e "${GREEN}Buckets created successfully${NC}"
echo ""

# ============================================================================
# Step 4: Save current branch and ensure we're on main
# ============================================================================
echo -e "${BLUE}[Step 4/6]${NC} Preparing Git environment..."

current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

# Ensure we start from main
if [ "$current_branch" != "main" ]; then
    echo "Switching to main branch..."
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || {
        echo -e "${RED}Cannot find main/master branch${NC}"
        exit 1
    }
fi

echo ""

# ============================================================================
# Step 5: Process CLIENT buckets 1-5 (Phase 1)
# ============================================================================
echo -e "${BLUE}[Step 5/6]${NC} Processing CLIENT buckets 1-5..."
echo ""

for i in {1..5}; do
    bucket_files=(${client_buckets[$((i-1))]})
    
    if [ ${#bucket_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}Bucket client-part-$i is empty, skipping...${NC}"
        continue
    fi
    
    branch_name="feature/client-part-$i"
    echo -e "${GREEN}▶ Creating branch: $branch_name${NC}"
    echo "   Files in bucket: ${#bucket_files[@]}"
    
    # Return to main before creating new branch
    git checkout main -q
    
    # Create and checkout new branch
    git checkout -b "$branch_name" 2>/dev/null || git checkout "$branch_name"
    
    # Add files from this bucket
    files_added=0
    for file in "${bucket_files[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            git add "$file"
            files_added=$((files_added + 1))
        else
            echo -e "${YELLOW}   Warning: File not found: $file${NC}"
        fi
    done
    
    if [ $files_added -eq 0 ]; then
        echo -e "${YELLOW}   No valid files to commit, skipping branch${NC}"
        git checkout main -q
        git branch -D "$branch_name" 2>/dev/null
        continue
    fi
    
    # Commit changes
    git commit -m "feat(client): update part $i" -q
    echo -e "${GREEN}   ✓ Committed $files_added files${NC}"
    
    # Push to origin
    git push -u origin "$branch_name" -q
    echo -e "${GREEN}   ✓ Pushed to origin${NC}"
    echo ""
done

# ============================================================================
# Step 6: Process SERVER buckets 1-5 (Phase 1)
# ============================================================================
echo -e "${BLUE}[Step 6/6]${NC} Processing SERVER buckets 1-5..."
echo ""

for i in {1..5}; do
    bucket_files=(${server_buckets[$((i-1))]})
    
    if [ ${#bucket_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}Bucket server-part-$i is empty, skipping...${NC}"
        continue
    fi
    
    branch_name="feature/server-part-$i"
    echo -e "${GREEN}▶ Creating branch: $branch_name${NC}"
    echo "   Files in bucket: ${#bucket_files[@]}"
    
    # Return to main before creating new branch
    git checkout main -q
    
    # Create and checkout new branch
    git checkout -b "$branch_name" 2>/dev/null || git checkout "$branch_name"
    
    # Add files from this bucket
    files_added=0
    for file in "${bucket_files[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            git add "$file"
            files_added=$((files_added + 1))
        else
            echo -e "${YELLOW}   Warning: File not found: $file${NC}"
        fi
    done
    
    if [ $files_added -eq 0 ]; then
        echo -e "${YELLOW}   No valid files to commit, skipping branch${NC}"
        git checkout main -q
        git branch -D "$branch_name" 2>/dev/null
        continue
    fi
    
    # Commit changes
    git commit -m "feat(server): update part $i" -q
    echo -e "${GREEN}   ✓ Committed $files_added files${NC}"
    
    # Push to origin
    git push -u origin "$branch_name" -q
    echo -e "${GREEN}   ✓ Pushed to origin${NC}"
    echo ""
done

# Return to main
git checkout main -q

# ============================================================================
# Step 7: Generate instructions for Phase 2 (buckets 6-10)
# ============================================================================
echo ""
echo -e "${BLUE}[Phase 2 Prep]${NC} Generating next_user_instructions.txt..."

cat > next_user_instructions.txt << 'INSTRUCTIONS_EOF'
================================================
INSTRUCTIONS FOR SECOND MACHINE (Phase 2)
================================================

Copy the text below and paste it into GitHub Copilot Chat on your other machine:

---BEGIN PROMPT---

Act as a Senior DevOps Engineer. I need a Bash script (for Git Bash) that processes the REMAINING unstaged changes in my monorepo.

**Context:**
- Phase 1 has already been completed on another machine, which processed buckets 1-5 for both `client/` and `server/` files.
- I now need to process buckets 6-10 for the remaining unstaged files.

**Requirements:**
1. Analyze all current modified/untracked files in the working directory
2. Separate files into `client_files` and `server_files`
3. Divide each group into 10 buckets (same logic as Phase 1)
4. Process buckets 6-10 ONLY:
   - For CLIENT: Create branches `feature/client-part-6` through `feature/client-part-10`
   - For SERVER: Create branches `feature/server-part-6` through `feature/server-part-10`
5. For each branch:
   - Start from `main` branch
   - Add the specific files for that bucket
   - Commit with message "feat(client): update part X" or "feat(server): update part X"
   - Push to origin
6. Verify files exist before committing
7. Use `git checkout main` between branches to ensure independence

**Important:** Skip buckets 1-5 entirely, as they were already processed in Phase 1.

---END PROMPT---

After receiving the script from Copilot, save it as `push_changes_phase2.sh` and run it with:
    chmod +x push_changes_phase2.sh
    ./push_changes_phase2.sh

INSTRUCTIONS_EOF

echo -e "${GREEN}✓ Instructions saved to: next_user_instructions.txt${NC}"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "=================================================="
echo -e "${GREEN}  PHASE 1 COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  - Processed CLIENT buckets 1-5"
echo "  - Processed SERVER buckets 1-5"
echo "  - Generated instructions for Phase 2"
echo ""
echo "Next Steps:"
echo "  1. Open 'next_user_instructions.txt'"
echo "  2. Copy the prompt section"
echo "  3. Paste into GitHub Copilot Chat on your other machine"
echo "  4. Run the generated Phase 2 script there"
echo ""
echo -e "${BLUE}Current branch:${NC} $(git branch --show-current)"
echo ""
