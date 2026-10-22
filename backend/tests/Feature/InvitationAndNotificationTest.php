<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\User;
use App\Notifications\DeadlineApproaching;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\Feature\Concerns\CreatesProjects;
use Tests\TestCase;

class InvitationAndNotificationTest extends TestCase
{
    use CreatesProjects, RefreshDatabase;

    private function invite(User $owner, $project, string $email, string $role = 'member'): string
    {
        $url = $this->actingAs($owner)->postJson("/api/v1/projects/{$project->id}/invitations", [
            'email' => $email, 'role' => $role,
        ])->assertCreated()->json('data.accept_url');

        return basename($url);
    }

    public function test_invited_user_can_accept_with_matching_email(): void
    {
        $owner = User::factory()->create();
        $guest = User::factory()->create(['email' => 'guest@example.com']);
        $project = $this->makeProject($owner);

        $token = $this->invite($owner, $project, 'Guest@Example.com', 'manager');

        $this->getJson("/api/v1/invitations/{$token}")->assertOk()->assertJsonPath('data.role', 'manager');
        $this->actingAs($guest)->postJson("/api/v1/invitations/{$token}/accept")->assertOk();

        $this->assertSame('manager', $project->fresh()->roleFor($guest));
        $this->actingAs($guest)->postJson("/api/v1/invitations/{$token}/accept")->assertStatus(410);
    }

    public function test_invitation_cannot_be_used_by_another_account(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $project = $this->makeProject($owner);

        $token = $this->invite($owner, $project, 'guest@example.com');

        $this->actingAs($other)->postJson("/api/v1/invitations/{$token}/accept")->assertForbidden();
    }

    public function test_expired_invitation_is_rejected(): void
    {
        $owner = User::factory()->create();
        $guest = User::factory()->create(['email' => 'guest@example.com']);
        $project = $this->makeProject($owner);

        $token = $this->invite($owner, $project, 'guest@example.com');
        Invitation::query()->update(['expires_at' => now()->subMinute()]);

        $this->actingAs($guest)->postJson("/api/v1/invitations/{$token}/accept")->assertStatus(410);
        $this->assertNull($project->fresh()->roleFor($guest));
    }

    public function test_cannot_invite_existing_member(): void
    {
        [$owner, $member] = User::factory()->count(2)->create();
        $project = $this->makeProject($owner, ['member' => $member]);

        $this->actingAs($owner)->postJson("/api/v1/projects/{$project->id}/invitations", [
            'email' => $member->email, 'role' => 'member',
        ])->assertUnprocessable();
    }

    public function test_notifications_can_be_listed_and_marked_read(): void
    {
        $owner = User::factory()->create();
        $task = $this->makeTask($this->makeProject($owner), $owner, ['due_date' => today()]);
        $task->assignees()->attach($owner->id);
        $owner->notify(new DeadlineApproaching($task));

        $this->actingAs($owner)->getJson('/api/v1/notifications')->assertOk()
            ->assertJsonPath('unread_count', 1)->assertJsonPath('data.0.type', 'deadline_approaching');

        $id = $owner->notifications()->first()->id;
        $this->actingAs($owner)->postJson("/api/v1/notifications/{$id}/read")->assertOk();
        $this->actingAs($owner)->getJson('/api/v1/notifications/unread-count')->assertJsonPath('count', 0);
    }

    public function test_users_cannot_read_other_users_notifications(): void
    {
        [$a, $b] = User::factory()->count(2)->create();
        $task = $this->makeTask($this->makeProject($a), $a);
        $a->notify(new DeadlineApproaching($task));
        $id = $a->notifications()->first()->id;

        $this->actingAs($b)->postJson("/api/v1/notifications/{$id}/read")->assertNotFound();
    }

    public function test_deadline_command_notifies_assignees_once(): void
    {
        $owner = User::factory()->create();
        $task = $this->makeTask($this->makeProject($owner), $owner, ['due_date' => today()->addDay()]);
        $task->assignees()->attach($owner->id);

        Artisan::call('taskflow:deadline-reminders');
        Artisan::call('taskflow:deadline-reminders');

        $this->assertSame(1, $owner->notifications()->count());
    }
}
