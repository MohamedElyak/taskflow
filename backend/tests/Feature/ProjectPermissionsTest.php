<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesProjects;
use Tests\TestCase;

class ProjectPermissionsTest extends TestCase
{
    use CreatesProjects, RefreshDatabase;

    public function test_creating_a_project_makes_the_creator_owner(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/projects', ['name' => 'Alpha'])
            ->assertCreated()->assertJsonPath('data.my_role', 'owner');

        $this->assertDatabaseHas('project_members', ['user_id' => $user->id, 'role' => 'owner']);
    }

    public function test_outsiders_cannot_access_another_teams_project(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($outsider)->getJson("/api/v1/projects/{$project->id}")->assertForbidden();
        $this->actingAs($outsider)->getJson("/api/v1/projects/{$project->id}/tasks")->assertForbidden();
        $this->actingAs($outsider)->getJson("/api/v1/tasks/{$task->id}")->assertForbidden();
        $this->actingAs($outsider)->postJson("/api/v1/projects/{$project->id}/tasks", ['title' => 'x'])->assertForbidden();
        $this->actingAs($outsider)->deleteJson("/api/v1/projects/{$project->id}")->assertForbidden();
    }

    public function test_project_list_only_contains_own_projects(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $this->makeProject($a);
        $this->makeProject($b);

        $this->actingAs($a)->getJson('/api/v1/projects')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_only_owner_and_manager_can_edit_project(): void
    {
        [$owner, $manager, $member] = User::factory()->count(3)->create();
        $project = $this->makeProject($owner, ['manager' => $manager, 'member' => $member]);

        $this->actingAs($member)->putJson("/api/v1/projects/{$project->id}", ['name' => 'Hacked'])->assertForbidden();
        $this->actingAs($manager)->putJson("/api/v1/projects/{$project->id}", ['name' => 'Renamed'])->assertOk();
    }

    public function test_only_owner_can_archive_delete_and_manage_roles(): void
    {
        [$owner, $manager, $member] = User::factory()->count(3)->create();
        $project = $this->makeProject($owner, ['manager' => $manager, 'member' => $member]);

        $this->actingAs($manager)->postJson("/api/v1/projects/{$project->id}/archive")->assertForbidden();
        $this->actingAs($manager)->deleteJson("/api/v1/projects/{$project->id}")->assertForbidden();
        $this->actingAs($manager)->putJson("/api/v1/projects/{$project->id}/members/{$member->id}", ['role' => 'manager'])->assertForbidden();
        $this->actingAs($member)->postJson("/api/v1/projects/{$project->id}/invitations", ['email' => 'a@b.co', 'role' => 'member'])->assertForbidden();

        $this->actingAs($owner)->putJson("/api/v1/projects/{$project->id}/members/{$member->id}", ['role' => 'manager'])->assertOk();
        $this->actingAs($owner)->postJson("/api/v1/projects/{$project->id}/archive")->assertOk()->assertJsonPath('data.archived', true);
        $this->actingAs($owner)->deleteJson("/api/v1/projects/{$project->id}")->assertNoContent();
    }

    public function test_owner_role_cannot_be_changed_or_removed(): void
    {
        $owner = User::factory()->create();
        $project = $this->makeProject($owner);

        $this->actingAs($owner)->putJson("/api/v1/projects/{$project->id}/members/{$owner->id}", ['role' => 'member'])->assertUnprocessable();
        $this->actingAs($owner)->deleteJson("/api/v1/projects/{$project->id}/members/{$owner->id}")->assertUnprocessable();
    }

    public function test_member_can_leave_but_not_remove_others(): void
    {
        [$owner, $member, $other] = User::factory()->count(3)->create();
        $project = $this->makeProject($owner, ['member' => $member]);
        $project->members()->attach($other->id, ['role' => 'member']);

        $this->actingAs($member)->deleteJson("/api/v1/projects/{$project->id}/members/{$other->id}")->assertForbidden();
        $this->actingAs($member)->deleteJson("/api/v1/projects/{$project->id}/members/{$member->id}")->assertNoContent();
    }
}
