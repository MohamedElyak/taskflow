<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    private function role(User $user, Task $task): ?string
    {
        return $task->project->roleFor($user);
    }

    private function isManager(?string $role): bool
    {
        return in_array($role, [Project::ROLE_OWNER, Project::ROLE_MANAGER], true);
    }

    public function view(User $user, Task $task): bool
    {
        return $this->role($user, $task) !== null;
    }

    /** Managers edit any task; members edit tasks they created or are assigned to. */
    public function update(User $user, Task $task): bool
    {
        $role = $this->role($user, $task);

        if ($role === null) {
            return false;
        }

        if ($this->isManager($role)) {
            return true;
        }

        return $task->creator_id === $user->id
            || $task->assignees()->where('users.id', $user->id)->exists();
    }

    public function delete(User $user, Task $task): bool
    {
        $role = $this->role($user, $task);

        return $this->isManager($role) || ($role !== null && $task->creator_id === $user->id);
    }

    /** Only owner/manager can assign tasks to people. */
    public function assign(User $user, Task $task): bool
    {
        return $this->isManager($this->role($user, $task));
    }

    public function comment(User $user, Task $task): bool
    {
        return $this->role($user, $task) !== null;
    }
}
