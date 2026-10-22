<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Notifications\Notification;

class TaskAssigned extends Notification
{
    public function __construct(public Task $task, public User $actor) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_assigned',
            'message' => "{$this->actor->name} assigned you to \"{$this->task->title}\"",
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
        ];
    }
}
