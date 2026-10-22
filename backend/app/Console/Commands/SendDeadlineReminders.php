<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Notifications\DeadlineApproaching;
use Illuminate\Console\Command;

class SendDeadlineReminders extends Command
{
    protected $signature = 'taskflow:deadline-reminders';

    protected $description = 'Notify assignees of tasks due today or tomorrow (once per task).';

    public function handle(): int
    {
        $sent = 0;

        Task::query()
            ->where('status', '!=', 'done')
            ->whereNull('deadline_notified_at')
            ->whereDate('due_date', '>=', today())
            ->whereDate('due_date', '<=', today()->addDay())
            ->whereHas('project', fn ($q) => $q->whereNull('archived_at'))
            ->with('assignees')
            ->chunkById(100, function ($tasks) use (&$sent) {
                foreach ($tasks as $task) {
                    foreach ($task->assignees as $user) {
                        $user->notify(new DeadlineApproaching($task));
                        $sent++;
                    }
                    $task->forceFill(['deadline_notified_at' => now()])->save();
                }
            });

        $this->info("Sent {$sent} deadline reminder(s).");

        return self::SUCCESS;
    }
}
