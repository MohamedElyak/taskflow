<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,archived,all'],
            'role' => ['nullable', 'in:owner,manager,member'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $status = $request->input('status', 'active');

        $projects = $request->user()->projects()
            ->with('owner')
            ->withCount([
                'members',
                'tasks',
                'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
            ])
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->input('q').'%';
                $query->where(fn ($w) => $w->where('projects.name', 'like', $term)
                    ->orWhere('projects.description', 'like', $term));
            })
            ->when($status === 'active', fn ($q) => $q->whereNull('projects.archived_at'))
            ->when($status === 'archived', fn ($q) => $q->whereNotNull('projects.archived_at'))
            ->when($request->filled('role'), fn ($q) => $q->wherePivot('role', $request->input('role')))
            ->orderByDesc('projects.updated_at')
            ->paginate($request->integer('per_page', 12));

        return ProjectResource::collection($projects);
    }

    public function store(ProjectRequest $request): \Illuminate\Http\JsonResponse
    {
        $project = DB::transaction(function () use ($request) {
            $project = Project::create([...$request->validated(), 'owner_id' => $request->user()->id]);
            $project->members()->attach($request->user()->id, ['role' => Project::ROLE_OWNER]);

            return $project;
        });

        $project->load('owner')->loadCount(['members', 'tasks']);

        return (new ProjectResource($project))->response()->setStatusCode(201);
    }

    public function show(Project $project): ProjectResource
    {
        $this->authorize('view', $project);

        $project->load(['owner', 'members'])->loadCount([
            'members',
            'tasks',
            'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
        ]);

        return new ProjectResource($project);
    }

    public function update(ProjectRequest $request, Project $project): ProjectResource
    {
        $this->authorize('update', $project);

        $project->update($request->validated());

        return $this->show($project);
    }

    public function archive(Project $project): ProjectResource
    {
        $this->authorize('archive', $project);

        $project->update(['archived_at' => now()]);

        return $this->show($project);
    }

    public function unarchive(Project $project): ProjectResource
    {
        $this->authorize('archive', $project);

        $project->update(['archived_at' => null]);

        return $this->show($project);
    }

    public function destroy(Project $project): Response
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->noContent();
    }
}
