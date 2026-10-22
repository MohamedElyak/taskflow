<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Auth\Notifications\ResetPassword;
use Tests\Feature\Concerns\CreatesProjects;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use CreatesProjects, RefreshDatabase;

    public function test_user_can_register(): void
    {
        $this->spa()->postJson('/api/v1/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'password' => 'Passw0rd123',
            'password_confirmation' => 'Passw0rd123',
        ])->assertCreated()->assertJsonPath('data.email', 'ada@example.com');

        $this->assertAuthenticated();
    }

    public function test_registration_validates_input(): void
    {
        $this->spa()->postJson('/api/v1/register', ['email' => 'nope'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::factory()->create(['password' => 'Passw0rd123']);

        $this->spa()->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'Passw0rd123'])
            ->assertOk()->assertJsonPath('data.id', $user->id);
        $this->assertAuthenticatedAs($user);

        $this->spa()->postJson('/api/v1/logout')->assertNoContent();
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->spa()->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_private_endpoints_require_authentication(): void
    {
        $this->spa()->getJson('/api/v1/user')->assertUnauthorized();
        $this->spa()->getJson('/api/v1/projects')->assertUnauthorized();
        $this->spa()->getJson('/api/v1/dashboard')->assertUnauthorized();
    }

    public function test_user_can_update_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/api/v1/profile', ['name' => 'New Name', 'email' => $user->email])
            ->assertOk()->assertJsonPath('data.name', 'New Name');
    }

    public function test_forgot_password_sends_reset_link_without_revealing_accounts(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->spa()->postJson('/api/v1/forgot-password', ['email' => $user->email])->assertOk();
        $this->spa()->postJson('/api/v1/forgot-password', ['email' => 'ghost@example.com'])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
        Notification::assertCount(1);
    }
}
