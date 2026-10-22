<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Project;
use App\Models\User;

class CommentPolicy
{
    public function delete(User $user, Comment $comment): bool
    {
        if ($comment->user_id === $user->id) {
            return true;
        }

        $role = $comment->task->project->roleFor($user);

        return in_array($role, [Project::ROLE_OWNER, Project::ROLE_MANAGER], true);
    }
}
