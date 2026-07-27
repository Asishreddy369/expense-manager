#!/bin/bash
#
# deploy.sh — automates: local branch -> dev -> test -> main
# See DEPLOY_GUIDE.md for full command reference and explanations.

set -euo pipefail

# ==================================================================
# PASSWORD PROTECTION
# ==================================================================
hash_string() {
  printf '%s' "$1" | sha256sum | awk '{print $1}'
}

set_password() {
  local pw1 pw2
  read -r -s -p "Set a new password for deploy.sh: " pw1
  echo ""
  read -r -s -p "Confirm password: " pw2
  echo ""
  if [ -z "$pw1" ]; then
    echo "Password cannot be empty. Aborting."
    exit 1
  fi
  if [ "$pw1" != "$pw2" ]; then
    echo "Passwords didn't match. Try again."
    exit 1
  fi
  git config deploy.pwhash "$(hash_string "$pw1")"
  echo "Password set successfully. Future runs will require it."
}

check_password() {
  local stored_hash entered_pw entered_hash
  stored_hash=$(git config deploy.pwhash 2>/dev/null || true)
  if [ -z "$stored_hash" ]; then
    echo "No password set yet for this repo. Set one first with:"
    echo "  ./deploy.sh setpassword"
    exit 1
  fi
  read -r -s -p "Enter deploy password: " entered_pw
  echo ""
  entered_hash=$(hash_string "$entered_pw")
  if [ "$entered_hash" != "$stored_hash" ]; then
    echo "Incorrect password. Exiting."
    exit 1
  fi
}

# ==================================================================
# STATE HELPERS (stored in .git/config — never in the working tree)
# ==================================================================
stage_index() {
  case "$1" in
    local) echo 0 ;;
    dev) echo 1 ;;
    test) echo 2 ;;
    main) echo 3 ;;
    *) echo -1 ;;
  esac
}

save_state() {
  git config deploy.local-branch "$LOCAL_BRANCH"
  git config deploy.msg "$MSG"
  git config deploy.stage "$1"
  git config deploy.commit-hash "${COMMIT_HASH:-}"
  git config --unset-all deploy.files >/dev/null 2>&1 || true
  for f in "${CHANGED_FILES[@]}"; do
    git config --add deploy.files "$f"
  done
}

clear_state() {
  git config --unset deploy.local-branch >/dev/null 2>&1 || true
  git config --unset deploy.msg >/dev/null 2>&1 || true
  git config --unset deploy.stage >/dev/null 2>&1 || true
  git config --unset deploy.commit-hash >/dev/null 2>&1 || true
  git config --unset-all deploy.files >/dev/null 2>&1 || true
}

# ==================================================================
# DISPLAY HELPERS
# ==================================================================
print_pushed_summary() {
  local env_name="$1"
  echo ""
  echo "=================================================="
  echo "  PUSHED TO: $env_name"
  echo "  Files:"
  if [ "${#CHANGED_FILES[@]}" -eq 0 ]; then
    echo "    (no individual files tracked - full merge)"
  else
    for f in "${CHANGED_FILES[@]}"; do
      echo "    - $f"
    done
  fi
  echo "=================================================="
  echo ""
}

confirm_push() {
  local env_name="$1"
  echo ""
  echo "--------------------------------------------------"
  echo "  ABOUT TO PUSH TO: $env_name"
  echo "  Files:"
  if [ "${#CHANGED_FILES[@]}" -eq 0 ]; then
    echo "    (full merge - no individual file list)"
  else
    for f in "${CHANGED_FILES[@]}"; do
      echo "    - $f"
    done
  fi
  echo "--------------------------------------------------"
  read -r -p "Press ENTER to push to $env_name, or type anything + ENTER to cancel: " confirm_input
  if [ -n "$confirm_input" ]; then
    echo ""
    echo "Cancelled. Nothing was pushed to $env_name."
    echo "Your commit is saved locally on this branch if you want to push it manually later."
    git checkout "$LOCAL_BRANCH" >/dev/null 2>&1 || true
    exit 1
  fi
}

confirm_destructive() {
  # $1 = warning lines (already echoed by caller before this)
  read -r -p "Press ENTER to proceed, or type anything + ENTER to cancel: " confirm_input
  if [ -n "$confirm_input" ]; then
    echo "Cancelled. No changes made."
    exit 1
  fi
}

detect_other_changes() {
  local from_branch="$1"
  local to_branch="$2"

  OTHER_FILES=()
  git fetch origin "$from_branch" "$to_branch" >/dev/null 2>&1 || true

  local diff_files=()
  while IFS= read -r line; do
    [ -n "$line" ] && diff_files+=("$line")
  done < <(git diff --name-only "origin/$to_branch" "origin/$from_branch" 2>/dev/null || true)

  for f in "${diff_files[@]}"; do
    local is_mine=false
    for cf in "${CHANGED_FILES[@]}"; do
      if [ "$f" == "$cf" ]; then
        is_mine=true
        break
      fi
    done
    if [ "$is_mine" == false ]; then
      OTHER_FILES+=("$f")
    fi
  done
}

print_other_changes_warning() {
  if [ "${#OTHER_FILES[@]}" -eq 0 ]; then
    return
  fi
  echo ""
  echo "--------------------------------------------------"
  echo "  NOTE: $1 also has changes from OTHER teammates"
  echo "  that are NOT part of this push (they will stay"
  echo "  out of $2 for now):"
  for f in "${OTHER_FILES[@]}"; do
    echo "    - $f"
  done
  echo "  Only YOUR files (listed below) will be pushed to $2."
  echo "--------------------------------------------------"
  echo ""
}

# Detects if a teammate modified one of YOUR files on $1 (e.g. dev) AFTER
# your own commit was made. Populates SHARED_CONFLICT_FILES.
check_shared_file_conflicts() {
  local from_branch="$1"
  SHARED_CONFLICT_FILES=()
  if [ -z "${COMMIT_HASH:-}" ]; then
    return
  fi
  git fetch origin "$from_branch" >/dev/null 2>&1 || true
  local f mine remote
  for f in "${CHANGED_FILES[@]}"; do
    mine=$(git rev-parse "$COMMIT_HASH:$f" 2>/dev/null || echo "")
    remote=$(git rev-parse "origin/$from_branch:$f" 2>/dev/null || echo "")
    if [ -n "$mine" ] && [ -n "$remote" ] && [ "$mine" != "$remote" ]; then
      SHARED_CONFLICT_FILES+=("$f")
    fi
  done
}

# ==================================================================
# STAGE FUNCTIONS
# ==================================================================
do_dev() {
  echo "==> Merging '$LOCAL_BRANCH' into dev"
  git checkout dev
  git pull origin dev
  git merge "$LOCAL_BRANCH" -m "Merge $LOCAL_BRANCH into dev: $MSG"
  confirm_push "DEV"
  git push origin dev
  git config deploy.last-commit-dev "$(git rev-parse HEAD)"
  save_state dev
  print_pushed_summary "DEV"
}

do_test() {
  if [ "$FOLDER_MODE" == true ]; then
    echo "==> Folder mode: promoting entire folder(s) from dev into test:"
    for fo in "${FOLDERS[@]}"; do echo "    - $fo"; done
    echo ""

    git fetch origin dev test >/dev/null 2>&1 || true
    local folder_files=()
    for fo in "${FOLDERS[@]}"; do
      while IFS= read -r line; do
        [ -n "$line" ] && folder_files+=("$line")
      done < <(git diff --name-only origin/test origin/dev -- "$fo" 2>/dev/null || true)
    done

    if [ "${#folder_files[@]}" -eq 0 ]; then
      echo "No differences found between dev and test in the specified folder(s). Nothing to push."
      git checkout "$LOCAL_BRANCH" >/dev/null 2>&1 || true
      exit 0
    fi

    echo "Files that will be promoted (yours + teammates' changes in these folders):"
    for f in "${folder_files[@]}"; do
      echo "  - $f"
    done
    echo ""

    git checkout test
    git pull origin test
    for fo in "${FOLDERS[@]}"; do
      git checkout dev -- "$fo"
    done
    git add -- "${folder_files[@]}"
    git commit -m "$MSG"
    CHANGED_FILES=("${folder_files[@]}")
    confirm_push "TEST"
    git push origin test
    git config deploy.last-commit-test "$(git rev-parse HEAD)"
    save_state test
    print_pushed_summary "TEST"
    return
  fi

  if [ "${#CHANGED_FILES[@]}" -eq 0 ]; then
    echo "No changed files recorded. Cannot promote to test."
    exit 1
  fi

  detect_other_changes "dev" "test"
  print_other_changes_warning "dev" "test"

  check_shared_file_conflicts "dev"
  if [ "${#SHARED_CONFLICT_FILES[@]}" -gt 0 ]; then
    echo ""
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "  STOPPED: a teammate also modified the same"
    echo "  file(s) you're promoting, after your commit."
    echo "  Review these before proceeding:"
    for f in "${SHARED_CONFLICT_FILES[@]}"; do
      echo "    - $f"
    done
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    git checkout "$LOCAL_BRANCH" >/dev/null 2>&1 || true
    exit 1
  fi

  echo "==> Preparing files for test"
  git checkout test
  git pull origin test
  git checkout dev -- "${CHANGED_FILES[@]}"
  git add -- "${CHANGED_FILES[@]}"
  git commit -m "$MSG"
  confirm_push "TEST"
  git push origin test
  git config deploy.last-commit-test "$(git rev-parse HEAD)"
  save_state test
  print_pushed_summary "TEST"
}

do_main() {
  if [ "$FOLDER_MODE" == true ]; then
    echo "==> Folder mode: promoting entire folder(s) from test into main:"
    for fo in "${FOLDERS[@]}"; do echo "    - $fo"; done
    echo ""

    git fetch origin test main >/dev/null 2>&1 || true
    local folder_files=()
    for fo in "${FOLDERS[@]}"; do
      while IFS= read -r line; do
        [ -n "$line" ] && folder_files+=("$line")
      done < <(git diff --name-only origin/main origin/test -- "$fo" 2>/dev/null || true)
    done

    if [ "${#folder_files[@]}" -eq 0 ]; then
      echo "No differences found between test and main in the specified folder(s). Nothing to push."
      git checkout "$LOCAL_BRANCH" >/dev/null 2>&1 || true
      exit 0
    fi

    echo "Files that will be promoted (yours + teammates' changes in these folders):"
    for f in "${folder_files[@]}"; do
      echo "  - $f"
    done
    echo ""

    git checkout main
    git pull origin main
    for fo in "${FOLDERS[@]}"; do
      git checkout test -- "$fo"
    done
    git add -- "${folder_files[@]}"
    git commit -m "$MSG"
    CHANGED_FILES=("${folder_files[@]}")
    confirm_push "MAIN (PRODUCTION)"
    git push origin main
    git config deploy.last-commit-main "$(git rev-parse HEAD)"
    save_state main
    print_pushed_summary "MAIN (PRODUCTION)"
    return
  fi

  if [ "${#CHANGED_FILES[@]}" -eq 0 ]; then
    echo "No changed files recorded. Cannot promote to main."
    exit 1
  fi

  detect_other_changes "test" "main"
  print_other_changes_warning "test" "main"

  check_shared_file_conflicts "test"
  if [ "${#SHARED_CONFLICT_FILES[@]}" -gt 0 ]; then
    echo ""
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "  STOPPED: a teammate also modified the same"
    echo "  file(s) you're promoting, after your commit."
    echo "  Review these before proceeding:"
    for f in "${SHARED_CONFLICT_FILES[@]}"; do
      echo "    - $f"
    done
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    git checkout "$LOCAL_BRANCH" >/dev/null 2>&1 || true
    exit 1
  fi

  echo "==> Preparing files for main"
  git checkout main
  git pull origin main
  git checkout test -- "${CHANGED_FILES[@]}"
  git add -- "${CHANGED_FILES[@]}"
  git commit -m "$MSG"
  confirm_push "MAIN (PRODUCTION)"
  git push origin main
  git config deploy.last-commit-main "$(git rev-parse HEAD)"
  save_state main
  print_pushed_summary "MAIN (PRODUCTION)"
}

# ==================================================================
# REVERT
# ==================================================================
do_revert() {
  local env="${1:-}"
  case "$env" in
    dev|test|main) ;;
    *)
      echo "Usage: ./deploy.sh revert <dev|test|main>"
      exit 1
      ;;
  esac

  local commit_hash
  commit_hash=$(git config "deploy.last-commit-$env" 2>/dev/null || true)
  if [ -z "$commit_hash" ]; then
    echo "No recorded script push found for '$env'. Nothing to auto-revert."
    echo "Manual option:"
    echo "  git checkout $env && git pull origin $env && git revert <commit-hash> && git push origin $env"
    exit 1
  fi

  local starting_branch
  starting_branch=$(git rev-parse --abbrev-ref HEAD)

  echo "==> Preparing to revert last script push on '$env'"
  echo "  Commit to revert: $commit_hash"
  git checkout "$env"
  git pull origin "$env"

  local parent_count
  parent_count=$(git cat-file -p "$commit_hash" | grep -c '^parent ' || true)

  if [ "$parent_count" -gt 1 ]; then
    git revert --no-edit -m 1 "$commit_hash"
  else
    git revert --no-edit "$commit_hash"
  fi

  echo ""
  echo "--------------------------------------------------"
  echo "  ABOUT TO PUSH A REVERT TO: $env"
  echo "--------------------------------------------------"
  read -r -p "Press ENTER to push this revert to $env, or type anything + ENTER to cancel: " confirm_input
  if [ -n "$confirm_input" ]; then
    echo "Cancelled. Revert commit created locally but NOT pushed."
    git checkout "$starting_branch" >/dev/null 2>&1 || true
    exit 1
  fi

  git push origin "$env"
  git checkout "$starting_branch"
  echo "Done. Reverted the last script push on '$env'."
}

# ==================================================================
# HARD RESET (dev -> test, or test -> main) — for major releases
# ==================================================================
do_hardreset() {
  local target="${1:-}"
  local source_branch=""
  case "$target" in
    test) source_branch="dev" ;;
    main) source_branch="test" ;;
    *)
      echo "Usage: ./deploy.sh hardreset <test|main>"
      echo "  hardreset test  -> makes test an exact copy of dev"
      echo "  hardreset main  -> makes main an exact copy of test"
      exit 1
      ;;
  esac

  local starting_branch
  starting_branch=$(git rev-parse --abbrev-ref HEAD)

  echo "==> Fetching latest '$source_branch' and '$target'"
  git fetch origin "$source_branch" "$target"

  echo ""
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "  DESTRUCTIVE ACTION"
  echo "  '$target' will become an EXACT COPY of '$source_branch'."
  echo "  Commits on '$target' not present on '$source_branch'"
  echo "  will be PERMANENTLY REMOVED once this is pushed."
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  confirm_destructive

  git checkout "$target"
  git reset --hard "origin/$source_branch"
  git push origin "$target" --force

  git checkout "$starting_branch"
  echo "Done. '$target' now exactly matches '$source_branch'."
}

# ==================================================================
# HARD PULL — reset local branch to match a given environment
# ==================================================================
do_hardpull() {
  local env="${1:-}"
  case "$env" in
    dev|test|main) ;;
    *)
      echo "Usage: ./deploy.sh hardpull <dev|test|main>"
      exit 1
      ;;
  esac

  local current_branch
  current_branch=$(git rev-parse --abbrev-ref HEAD)

  echo "==> Fetching latest '$env'"
  git fetch origin "$env"

  echo ""
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "  DESTRUCTIVE ACTION"
  echo "  '$current_branch' will discard ALL local changes"
  echo "  and commits not present on '$env', becoming an"
  echo "  exact copy of '$env'."
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  confirm_destructive

  git reset --hard "origin/$env"
  echo "Done. '$current_branch' now exactly matches '$env'."
}

# ==================================================================
# RUNTIME: parse global --folder flag from anywhere in the arguments
# ==================================================================
FOLDER_ARG=""
ARGS_COPY=("$@")
for ((i=0; i<${#ARGS_COPY[@]}; i++)); do
  if [ "${ARGS_COPY[$i]}" == "--folder" ]; then
    FOLDER_ARG="${ARGS_COPY[$((i+1))]:-}"
  fi
done
FOLDER_MODE=false
FOLDERS=()
if [ -n "$FOLDER_ARG" ]; then
  FOLDER_MODE=true
  IFS=',' read -ra FOLDERS <<< "$FOLDER_ARG"
fi

CMD="${1:-}"

if [ "$CMD" == "setpassword" ]; then
  set_password
  exit 0
fi

check_password

case "$CMD" in
  revert)
    do_revert "${2:-}"
    exit 0
    ;;
  hardreset)
    do_hardreset "${2:-}"
    exit 0
    ;;
  hardpull)
    do_hardpull "${2:-}"
    exit 0
    ;;
esac

if [ "$CMD" == "continue" ]; then
  TARGET="${2:-}"
  if [ -z "$TARGET" ]; then
    echo "Usage: ./deploy.sh continue <dev|test|main> [--folder path1,path2]"
    exit 1
  fi

  LOCAL_BRANCH=$(git config deploy.local-branch || true)
  MSG=$(git config deploy.msg || true)
  LAST_STAGE=$(git config deploy.stage || true)
  COMMIT_HASH=$(git config deploy.commit-hash || true)

  if [ -z "$LOCAL_BRANCH" ] || [ -z "$LAST_STAGE" ]; then
    echo "No previous deploy found. Start one first with:"
    echo "  ./deploy.sh \"commit message\" <target>"
    exit 1
  fi

  CHANGED_FILES=()
  while IFS= read -r line; do
    [ -n "$line" ] && CHANGED_FILES+=("$line")
  done < <(git config --get-all deploy.files 2>/dev/null || true)

  echo "Resuming deploy '$MSG' (last completed stage: $LAST_STAGE) -> $TARGET"
else
  MSG="$CMD"
  TARGET="${2:-local}"

  if [ -z "$MSG" ]; then
    echo "Usage: ./deploy.sh \"commit message\" [local|dev|test|main] [--folder path1,path2]"
    echo "   or: ./deploy.sh continue <dev|test|main> [--folder path1,path2]"
    echo "   or: ./deploy.sh revert <dev|test|main>"
    echo "   or: ./deploy.sh hardreset <test|main>"
    echo "   or: ./deploy.sh hardpull <dev|test|main>"
    exit 1
  fi

  LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$LOCAL_BRANCH" == "dev" || "$LOCAL_BRANCH" == "test" || "$LOCAL_BRANCH" == "main" ]]; then
    echo "You're currently on '$LOCAL_BRANCH'. Please run this from your feature/local branch."
    exit 1
  fi

  echo "==> Committing on '$LOCAL_BRANCH'"
  git add .
  git commit -m "$MSG"

  COMMIT_HASH=$(git rev-parse HEAD)

  CHANGED_FILES=()
  while IFS= read -r -d '' file; do
    CHANGED_FILES+=("$file")
  done < <(git diff -z --name-only HEAD~1 HEAD 2>/dev/null || true)

  confirm_push "LOCAL ($LOCAL_BRANCH)"
  git push origin "$LOCAL_BRANCH"

  LAST_STAGE=local
  save_state local
  print_pushed_summary "LOCAL ($LOCAL_BRANCH)"
fi

case "$TARGET" in
  local|dev|test|main) ;;
  *)
    echo "Invalid target: $TARGET (must be local, dev, test, or main)"
    exit 1
    ;;
esac

CUR_IDX=$(stage_index "$LAST_STAGE")
TGT_IDX=$(stage_index "$TARGET")

if [ "$TGT_IDX" -le "$CUR_IDX" ]; then
  echo "Already at or past '$TARGET' (currently at '$LAST_STAGE'). Nothing to do."
  git checkout "$LOCAL_BRANCH" 2>/dev/null || true
  exit 0
fi

if [ "$CUR_IDX" -lt 1 ] && [ "$TGT_IDX" -ge 1 ]; then
  do_dev
  LAST_STAGE=dev
fi

if [ "$(stage_index "$LAST_STAGE")" -lt 2 ] && [ "$TGT_IDX" -ge 2 ]; then
  do_test
  LAST_STAGE=test
fi

if [ "$(stage_index "$LAST_STAGE")" -lt 3 ] && [ "$TGT_IDX" -ge 3 ]; then
  do_main
  LAST_STAGE=main
fi

git checkout "$LOCAL_BRANCH"
echo "Done. Change pushed till $TARGET."

echo "==> Syncing local branch with latest dev"
git pull origin dev || echo "Warning: could not auto-sync dev into local branch (possible conflict). Please resolve manually."

if [ "$TARGET" == "main" ]; then
  clear_state
fi
