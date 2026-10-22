<?php

namespace Tests\Feature\Concerns;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

trait CreatesProjects
{
    /** Makes SPA-style requests so Sanctum starts a session. */
    protected function spa(): static
    {
        return $this->withHeader('Origin', 'http://localhost:5173');
    }

    protected function makeProject(User $owner, array $members = []): Project
    {
        $project = Project::create(['name' => 'Test project', 'owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => 'owner']);

        foreach ($members as $role => $user) {
            $project->members()->attach($user->id, ['role' => $role]);
        }

        return $project;
    }

    protected function makeTask(Project $project, User $creator, array $attributes = []): Task
    {
        $task = new Task(array_merge(['title' => 'A task'], $attributes));
        $task->project_id = $project->id;
        $task->creator_id = $creator->id;
        $task->save();

        return $task;
    }
}
