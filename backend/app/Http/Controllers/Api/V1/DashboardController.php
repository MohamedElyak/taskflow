<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** All statistics are computed from the user's real projects and tasks. */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $projectIds = $user->projects()->whereNull('projects.archived_at')->pluck('projects.id');
        $tasks = fn () => Task::query()->whereIn('tasks.project_id', $projectIds);

        $byStatus = $tasks()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        $upcoming = $tasks()
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '>=', today())
            ->whereDate('due_date', '<=', today()->addDays(7))
            ->with(['project:id,name', 'assignees'])
            ->orderBy('due_date')->limit(6)->get();

        $recentTasks = $tasks()->with(['project:id,name', 'assignees'])
            ->orderByDesc('updated_at')->limit(6)->get();

        $recentProjects = $user->projects()->whereNull('projects.archived_at')
            ->with('owner')
            ->withCount(['members', 'tasks', 'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done')])
            ->orderByDesc('projects.updated_at')->limit(4)->get();

        // Tasks completed per day for the last 7 days (zero-filled).
        $completed = $tasks()->whereNotNull('completed_at')
            ->where('completed_at', '>=', today()->subDays(6))
            ->selectRaw('DATE(completed_at) as day, count(*) as total')
            ->groupBy('day')->pluck('total', 'day');

        $days = collect(range(6, 0))->map(function ($ago) use ($completed) {
            $day = today()->subDays($ago)->toDateString();

            return ['date' => $day, 'completed' => (int) ($completed[$day] ?? 0)];
        })->values();

        return response()->json(['data' => [
            'stats' => [
                'total_projects' => $projectIds->count(),
                'total_tasks' => (int) $byStatus->sum(),
                'completed_tasks' => (int) ($byStatus['done'] ?? 0),
                'in_progress_tasks' => (int) ($byStatus['in_progress'] ?? 0),
                'overdue_tasks' => $tasks()->where('status', '!=', 'done')->whereDate('due_date', '<', today())->count(),
            ],
            'by_status' => collect(Task::STATUSES)->map(fn ($s) => ['status' => $s, 'count' => (int) ($byStatus[$s] ?? 0)])->values(),
            'completed_last_7_days' => $days,
            'upcoming_deadlines' => TaskResource::collection($upcoming)->resolve(),
            'recent_tasks' => TaskResource::collection($recentTasks)->resolve(),
            'recent_projects' => ProjectResource::collection($recentProjects)->resolve(),
            'recent_notifications' => NotificationResource::collection($user->notifications()->limit(5)->get())->resolve(),
            'unread_notifications' => $user->unreadNotifications()->count(),
        ]]);
    }
}
