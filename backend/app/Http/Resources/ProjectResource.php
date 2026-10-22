<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $total = $this->resource->getAttribute('tasks_count');
        $done = $this->resource->getAttribute('done_tasks_count');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'archived' => $this->archived_at !== null,
            'archived_at' => $this->archived_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Role of the signed-in user: from the pivot when listed via user->projects(), else one lookup.
            'my_role' => $this->pivot?->role ?? ($request->user() ? $this->roleFor($request->user()) : null),
            'owner' => new UserResource($this->whenLoaded('owner')),
            'members_count' => $this->whenCounted('members'),
            'tasks_count' => $total,
            'done_tasks_count' => $done,
            'progress' => $total ? (int) round(($done ?? 0) / $total * 100) : 0,
            'members' => MemberResource::collection($this->whenLoaded('members')),
        ];
    }
}
