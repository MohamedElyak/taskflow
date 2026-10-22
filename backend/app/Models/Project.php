<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    public const ROLE_OWNER = 'owner';
    public const ROLE_MANAGER = 'manager';
    public const ROLE_MEMBER = 'member';

    protected $fillable = ['name', 'description', 'owner_id', 'archived_at'];

    /** @var array<int, string|null> */
    protected array $roleCache = [];

    protected function casts(): array
    {
        return ['archived_at' => 'datetime'];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    /** The user's role in this project, or null if they are not a member. */
    public function roleFor(User $user): ?string
    {
        if (! array_key_exists($user->id, $this->roleCache)) {
            $this->roleCache[$user->id] = $this->members()
                ->where('users.id', $user->id)
                ->value('project_members.role');
        }

        return $this->roleCache[$user->id];
    }

    public function forgetRoleCache(): void
    {
        $this->roleCache = [];
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }
}
