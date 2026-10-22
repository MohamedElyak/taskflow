<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;
use Illuminate\Notifications\Notification;

class TaskCommented extends Notification
{
    public function __construct(public Task $task, public Comment $comment, public User $actor) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_commented',
            'message' => "{$this->actor->name} commented on \"{$this->task->title}\"",
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
        ];
    }
}
