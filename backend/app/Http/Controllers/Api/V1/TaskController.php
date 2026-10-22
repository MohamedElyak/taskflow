<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use App\Notifications\TaskAssigned;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /** Tasks of one project (any member). */
    public function index(Request $request, Project $project)
    {
        $this->authorize('view', $project);

        return $this->list($request, $project->tasks()->getQuery());
    }

    /** Tasks across every project the user belongs to ("My tasks"). */
    public function all(Request $request)
    {
        $request->validate(['project_id' => ['nullable', 'integer']]);

        $ids = $request->user()->projects()->whereNull('projects.archived_at')->pluck('projects.id');

        $query = Task::query()->whereIn('tasks.project_id', $ids)
            ->when($request->filled('project_id'), fn ($q) => $q->where('tasks.project_id', $request->integer('project_id')));

        return $this->list($request, $query, withProject: true);
    }

    private function list(Request $request, Builder $query, bool $withProject = false)
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(Task::STATUSES)],
            'priority' => ['nullable', Rule::in(Task::PRIORITIES)],
            'assignee' => ['nullable', 'string', 'max:20'],
            'due' => ['nullable', 'in:overdue,today,week,none'],
            'sort' => ['nullable', 'in:due_date,priority,created_at,updated_at,title,status'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query->with(['creator', 'assignees'])->withCount('comments');

        if ($withProject) {
            $query->with('project:id,name');
        }

        $query
            ->when($request->filled('q'), function (Builder $q) use ($request) {
                $term = '%'.$request->input('q').'%';
                $q->where(fn ($w) => $w->where('tasks.title', 'like', $term)->orWhere('tasks.description', 'like', $term));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('tasks.status', $request->input('status')))
            ->when($request->filled('priority'), fn ($q) => $q->where('tasks.priority', $request->input('priority')));

        if ($request->filled('assignee')) {
            $assignee = $request->input('assignee');

            if ($assignee === 'unassigned') {
                $query->whereDoesntHave('assignees');
            } else {
                $userId = $assignee === 'me' ? $request->user()->id : (int) $assignee;
                $query->whereHas('assignees', fn ($q) => $q->where('users.id', $userId));
            }
        }

        match ($request->input('due')) {
            'overdue' => $query->where('tasks.status', '!=', 'done')->whereDate('tasks.due_date', '<', today()),
            'today' => $query->whereDate('tasks.due_date', today()),
            'week' => $query->whereDate('tasks.due_date', '>=', today())->whereDate('tasks.due_date', '<=', today()->addDays(7)),
            'none' => $query->whereNull('tasks.due_date'),
            default => null,
        };

        $direction = $request->input('direction', 'desc') === 'asc' ? 'asc' : 'desc';

        match ($request->input('sort', 'updated_at')) {
            'priority' => $query->orderByRaw(
                "CASE tasks.priority WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END {$direction}"
            ),
            'due_date' => $query->orderByRaw('tasks.due_date IS NULL')->orderBy('tasks.due_date', $direction),
            'created_at', 'title', 'status', 'updated_at' => $query->orderBy('tasks.'.$request->input('sort', 'updated_at'), $direction),
        };

        $query->orderByDesc('tasks.id');

        return TaskResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function store(TaskRequest $request, Project $project): \Illuminate\Http\JsonResponse
    {
        $this->authorize('createTask', $project);
        abort_if($project->isArchived(), 422, 'Archived projects are read-only.');

        $data = $request->validated();
        $assignees = $data['assignee_ids'] ?? [];

        if ($assignees) {
            $this->authorize('update', $project); // owner/manager may assign
        }

        $task = new Task(collect($data)->except('assignee_ids', 'status')->all());
        $task->project_id = $project->id;
        $task->creator_id = $request->user()->id;
        $task->applyStatus($data['status'] ?? 'todo');
        $task->save();

        $this->syncAssignees($task, $assignees, $request->user());

        return (new TaskResource($this->fresh($task)))->response()->setStatusCode(201);
    }

    public function show(Task $task): TaskResource
    {
        $this->authorize('view', $task);

        return new TaskResource($this->fresh($task));
    }

    public function update(TaskRequest $request, Task $task): TaskResource
    {
        $this->authorize('update', $task);
        abort_if($task->project->isArchived(), 422, 'Archived projects are read-only.');

        $data = $request->validated();

        if (array_key_exists('assignee_ids', $data)) {
            $this->authorize('assign', $task);
        }

        $task->fill(collect($data)->except('assignee_ids', 'status')->all());

        if (isset($data['status'])) {
            $task->applyStatus($data['status']);
        }

        if ($task->isDirty('due_date')) {
            $task->deadline_notified_at = null; // allow a fresh reminder for the new date
        }

        $task->save();

        if (array_key_exists('assignee_ids', $data)) {
            $this->syncAssignees($task, $data['assignee_ids'], $request->user());
        }

        return new TaskResource($this->fresh($task));
    }

    /** Used by the Kanban board when a card is dropped in another column. */
    public function updateStatus(Request $request, Task $task): TaskResource
    {
        $this->authorize('update', $task);
        abort_if($task->project->isArchived(), 422, 'Archived projects are read-only.');

        $data = $request->validate(['status' => ['required', Rule::in(Task::STATUSES)]]);

        $task->applyStatus($data['status']);
        $task->save();

        return new TaskResource($this->fresh($task));
    }

    public function destroy(Task $task): Response
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->noContent();
    }

    private function fresh(Task $task): Task
    {
        return $task->load(['creator', 'assignees', 'project:id,name'])->loadCount('comments');
    }

    /** Sync assignees and notify only the people who were newly added. */
    private function syncAssignees(Task $task, array $ids, $actor): void
    {
        $changes = $task->assignees()->sync($ids);

        $task->unsetRelation('project');
        $task->loadMissing('project');

        foreach ($changes['attached'] as $userId) {
            if ((int) $userId !== $actor->id) {
                \App\Models\User::find($userId)?->notify(new TaskAssigned($task, $actor));
            }
        }
    }
}
