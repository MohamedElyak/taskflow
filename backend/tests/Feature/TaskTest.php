<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskCommented;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\Feature\Concerns\CreatesProjects;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use CreatesProjects, RefreshDatabase;

    public function test_member_can_create_a_task(): void
    {
        [$owner, $member] = User::factory()->count(2)->create();
        $project = $this->makeProject($owner, ['member' => $member]);

        $this->actingAs($member)->postJson("/api/v1/projects/{$project->id}/tasks", [
            'title' => 'Write docs', 'priority' => 'high', 'due_date' => '2030-01-15',
        ])->assertCreated()
            ->assertJsonPath('data.title', 'Write docs')
            ->assertJsonPath('data.status', 'todo')
            ->assertJsonPath('data.priority', 'high')
            ->assertJsonPath('data.creator.id', $member->id);
    }

    public function test_task_validation(): void
    {
        $owner = User::factory()->create();
        $project = $this->makeProject($owner);

        $this->actingAs($owner)->postJson("/api/v1/projects/{$project->id}/tasks", [
            'title' => '', 'status' => 'bogus', 'priority' => 'nope', 'due_date' => 'tomorrow',
        ])->assertUnprocessable()->assertJsonValidationErrors(['title', 'status', 'priority', 'due_date']);
    }

    public function test_manager_can_assign_members_and_they_get_notified(): void
    {
        Notification::fake();
        [$owner, $member] = User::factory()->count(2)->create();
        $project = $this->makeProject($owner, ['member' => $member]);

        $this->actingAs($owner)->postJson("/api/v1/projects/{$project->id}/tasks", [
            'title' => 'Ship it', 'assignee_ids' => [$member->id],
        ])->assertCreated()->assertJsonCount(1, 'data.assignees');

        Notification::assertSentTo($member, TaskAssigned::class);
    }

    public function test_assignees_must_be_project_members(): void
    {
        [$owner, $stranger] = User::factory()->count(2)->create();
        $project = $this->makeProject($owner);

        $this->actingAs($owner)->postJson("/api/v1/projects/{$project->id}/tasks", [
            'title' => 'x', 'assignee_ids' => [$stranger->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('assignee_ids.0');
    }

    public function test_plain_member_cannot_assign_tasks(): void
    {
        [$owner, $member] = User::factory()->count(2)->create();
        $project = $this->makeProject($owner, ['member' => $member]);

        $this->actingAs($member)->postJson("/api/v1/projects/{$project->id}/tasks", [
            'title' => 'x', 'assignee_ids' => [$owner->id],
        ])->assertForbidden();
    }

    public function test_member_can_only_edit_own_or_assigned_tasks(): void
    {
        [$owner, $member] = User::factory()->count(2)->create();
        $project = $this->makeProject($owner, ['member' => $member]);
        $ownersTask = $this->makeTask($project, $owner);
        $mine = $this->makeTask($project, $member);
        $assigned = $this->makeTask($project, $owner);
        $assigned->assignees()->attach($member->id);

        $this->actingAs($member)->putJson("/api/v1/tasks/{$ownersTask->id}", ['title' => 'Nope'])->assertForbidden();
        $this->actingAs($member)->patchJson("/api/v1/tasks/{$ownersTask->id}/status", ['status' => 'done'])->assertForbidden();
        $this->actingAs($member)->putJson("/api/v1/tasks/{$mine->id}", ['title' => 'Mine'])->assertOk();
        $this->actingAs($member)->patchJson("/api/v1/tasks/{$assigned->id}/status", ['status' => 'in_progress'])
            ->assertOk()->assertJsonPath('data.status', 'in_progress');
    }

    public function test_member_cannot_delete_others_tasks_but_manager_can(): void
    {
        [$owner, $manager, $member] = User::factory()->count(3)->create();
        $project = $this->makeProject($owner, ['manager' => $manager, 'member' => $member]);
        $task = $this->makeTask($project, $owner);
        $mine = $this->makeTask($project, $member);

        $this->actingAs($member)->deleteJson("/api/v1/tasks/{$task->id}")->assertForbidden();
        $this->actingAs($member)->deleteJson("/api/v1/tasks/{$mine->id}")->assertNoContent();
        $this->actingAs($manager)->deleteJson("/api/v1/tasks/{$task->id}")->assertNoContent();
    }

    public function test_status_change_sets_completed_at(): void
    {
        $owner = User::factory()->create();
        $task = $this->makeTask($this->makeProject($owner), $owner);

        $this->actingAs($owner)->patchJson("/api/v1/tasks/{$task->id}/status", ['status' => 'done'])->assertOk();
        $this->assertNotNull($task->fresh()->completed_at);

        $this->actingAs($owner)->patchJson("/api/v1/tasks/{$task->id}/status", ['status' => 'todo'])->assertOk();
        $this->assertNull($task->fresh()->completed_at);
    }

    public function test_filters_search_and_overdue(): void
    {
        $owner = User::factory()->create();
        $project = $this->makeProject($owner);
        $this->makeTask($project, $owner, ['title' => 'Fix login bug', 'priority' => 'urgent', 'due_date' => today()->subDay()]);
        $this->makeTask($project, $owner, ['title' => 'Write report', 'priority' => 'low']);
        $this->makeTask($project, $owner, ['title' => 'Old done', 'status' => 'done', 'due_date' => today()->subDays(5)]);

        $base = "/api/v1/projects/{$project->id}/tasks";

        $this->actingAs($owner)->getJson("$base?q=login")->assertJsonCount(1, 'data');
        $this->actingAs($owner)->getJson("$base?priority=low")->assertJsonCount(1, 'data');
        $this->actingAs($owner)->getJson("$base?due=overdue")->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Fix login bug')->assertJsonPath('data.0.is_overdue', true);
        $this->actingAs($owner)->getJson("$base?sort=priority&direction=desc")->assertJsonPath('data.0.priority', 'urgent');
    }

    public function test_comments_notify_others_and_respect_permissions(): void
    {
        Notification::fake();
        [$owner, $member, $outsider] = User::factory()->count(3)->create();
        $project = $this->makeProject($owner, ['member' => $member]);
        $task = $this->makeTask($project, $owner);
        $task->assignees()->attach($member->id);

        $this->actingAs($outsider)->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'hi'])->assertForbidden();

        $this->actingAs($member)->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'Working on it'])
            ->assertCreated()->assertJsonPath('data.user.id', $member->id);

        Notification::assertSentTo($owner, TaskCommented::class);
        Notification::assertNotSentTo($member, TaskCommented::class);
    }

    public function test_dashboard_returns_real_counts(): void
    {
        $owner = User::factory()->create();
        $project = $this->makeProject($owner);
        $this->makeTask($project, $owner, ['status' => 'done']);
        $this->makeTask($project, $owner, ['status' => 'in_progress']);
        $this->makeTask($project, $owner, ['due_date' => today()->subDay()]);

        $this->actingAs($owner)->getJson('/api/v1/dashboard')->assertOk()
            ->assertJsonPath('data.stats.total_projects', 1)
            ->assertJsonPath('data.stats.total_tasks', 3)
            ->assertJsonPath('data.stats.completed_tasks', 1)
            ->assertJsonPath('data.stats.in_progress_tasks', 1)
            ->assertJsonPath('data.stats.overdue_tasks', 1);
    }
}
