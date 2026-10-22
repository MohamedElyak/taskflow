<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationResource extends JsonResource
{
    /** Plain token, only known right after creation. */
    public ?string $plainToken = null;

    public function withToken(string $plain): static
    {
        $this->plainToken = $plain;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            'accept_url' => $this->when(
                $this->plainToken !== null,
                fn () => rtrim(config('app.frontend_url'), '/').'/invitations/'.$this->plainToken
            ),
        ];
    }
}
