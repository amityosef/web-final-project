#!/bin/bash

# ============================================================================
# Multi-Phase Git Workflow Automation Script - PHASE 2
# Purpose: Process remaining buckets 6-10 for both client and server
# This runs on the second machine after Phase 1 is complete
# ============================================================================

set -e  # Exit on error

echo "=================================================="
echo "  Git Multi-Phase Workflow Automation"
echo "  Phase 2: Processing buckets 6-10"
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
echo -e "${BLUE}[Step 1/5]${NC} Analyzing working directory..."

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
echo -e "${BLUE}[Step 2/5]${NC} Grouping files by directory..."

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
echo -e "${BLUE}[Step 3/5]${NC} Dividing files into 10 buckets per group..."

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
echo -e "${YELLOW}Note: Skipping buckets 1-5 (already processed in Phase 1)${NC}"
echo ""

# ============================================================================
# Step 4: Prepare Git environment
# ============================================================================
echo -e "${BLUE}[Step 4/5]${NC} Preparing Git environment..."

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
# Step 5: Process CLIENT buckets 6-10 (Phase 2)
# ============================================================================
echo -e "${BLUE}[Step 5/5]${NC} Processing CLIENT buckets 6-10..."
echo ""

for i in {6..10}; do
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
# Step 6: Process SERVER buckets 6-10 (Phase 2)
# ============================================================================
echo -e "${BLUE}[Step 6/6]${NC} Processing SERVER buckets 6-10..."
echo ""

for i in {6..10}; do
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
# Summary
# ============================================================================
echo "=================================================="
echo -e "${GREEN}  PHASE 2 COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  - Processed CLIENT buckets 6-10"
echo "  - Processed SERVER buckets 6-10"
echo "  - All 20 feature branches are now pushed!"
echo ""
echo "Next Steps:"
echo "  1. Create Pull Requests for all branches"
echo "  2. Review and merge them as needed"
echo ""
echo -e "${BLUE}Current branch:${NC} $(git branch --show-current)"
echo ""
