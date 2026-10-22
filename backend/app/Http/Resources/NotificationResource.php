<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->data['type'] ?? 'info',
            'message' => $this->data['message'] ?? '',
            'task_id' => $this->data['task_id'] ?? null,
            'project_id' => $this->data['project_id'] ?? null,
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
