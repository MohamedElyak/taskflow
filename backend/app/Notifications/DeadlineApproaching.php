<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Notifications\Notification;

class DeadlineApproaching extends Notification
{
    public function __construct(public Task $task) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $when = $this->task->due_date->isToday() ? 'today' : 'tomorrow';

        return [
            'type' => 'deadline_approaching',
            'message' => "\"{$this->task->title}\" is due {$when}",
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
        ];
    }
}
