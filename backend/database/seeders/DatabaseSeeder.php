<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssigned;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Demo data for local development. Every demo account uses the password "password". */
    public function run(): void
    {
        $demo = User::create(['name' => 'Demo User', 'email' => 'demo@taskflow.test', 'password' => 'password']);
        $sara = User::create(['name' => 'Sara Benali', 'email' => 'sara@taskflow.test', 'password' => 'password']);
        $omar = User::create(['name' => 'Omar Idrissi', 'email' => 'omar@taskflow.test', 'password' => 'password']);

        $web = $this->project($demo, 'Website Redesign', 'Refresh the marketing site with a new look and faster pages.', [
            [$sara, 'manager'], [$omar, 'member'],
        ]);
        $thesis = $this->project($sara, 'Thesis Research', 'Literature review, experiments and writing schedule.', [
            [$demo, 'member'],
        ]);

        $rows = [
            [$web, 'Audit current pages', 'done', 'medium', -6, [$sara]],
            [$web, 'Design new homepage', 'in_review', 'high', 2, [$sara, $demo]],
            [$web, 'Build responsive navigation', 'in_progress', 'high', 1, [$omar]],
            [$web, 'Write launch announcement', 'todo', 'low', 9, [$demo]],
            [$web, 'Fix broken contact form', 'todo', 'urgent', -2, [$omar]],
            [$web, 'Set up analytics', 'todo', 'medium', null, []],
            [$thesis, 'Collect 20 more sources', 'in_progress', 'medium', 4, [$demo]],
            [$thesis, 'Draft methodology chapter', 'todo', 'high', 12, [$sara]],
            [$thesis, 'Run baseline experiment', 'done', 'urgent', -4, [$sara, $demo]],
        ];

        foreach ($rows as [$project, $title, $status, $priority, $days, $assignees]) {
            $task = new Task(['title' => $title, 'priority' => $priority, 'due_date' => $days === null ? null : today()->addDays($days)]);
            $task->project_id = $project->id;
            $task->creator_id = $project->owner_id;
            $task->description = 'Seeded example task.';
            $task->applyStatus($status);
            $task->save();
            $task->assignees()->sync(collect($assignees)->pluck('id')->all());
        }

        $task = Task::where('title', 'Design new homepage')->first();
        Comment::create(['task_id' => $task->id, 'user_id' => $sara->id, 'body' => 'First draft is ready for review.']);
        Comment::create(['task_id' => $task->id, 'user_id' => $demo->id, 'body' => 'Looks great, can we try a larger hero image?']);

        $demo->notify(new TaskAssigned($task, $sara));
    }

    private function project(User $owner, string $name, string $description, array $members): Project
    {
        $project = Project::create(['name' => $name, 'description' => $description, 'owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => Project::ROLE_OWNER]);

        foreach ($members as [$user, $role]) {
            $project->members()->attach($user->id, ['role' => $role]);
        }

        return $project;
    }
}
