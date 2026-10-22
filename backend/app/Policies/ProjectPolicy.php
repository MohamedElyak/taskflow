<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    private function role(User $user, Project $project): ?string
    {
        return $project->roleFor($user);
    }

    /** Any member can see the project. */
    public function view(User $user, Project $project): bool
    {
        return $this->role($user, $project) !== null;
    }

    /** Owner and manager can edit project details. */
    public function update(User $user, Project $project): bool
    {
        return in_array($this->role($user, $project), [Project::ROLE_OWNER, Project::ROLE_MANAGER], true);
    }

    /** Owner only: delete, archive, members, invitations, roles. */
    public function delete(User $user, Project $project): bool
    {
        return $this->role($user, $project) === Project::ROLE_OWNER;
    }

    public function archive(User $user, Project $project): bool
    {
        return $this->delete($user, $project);
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $this->delete($user, $project);
    }

    public function createTask(User $user, Project $project): bool
    {
        return $this->role($user, $project) !== null;
    }
}
