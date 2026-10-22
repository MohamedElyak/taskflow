<?php

namespace App\Http\Requests;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates create and update. The project is resolved from the route
 * ({project} on create, {task} on update) so assignees can be limited to members.
 */
class TaskRequest extends FormRequest
{
    /** Authorize before validating, so outsiders get 403 instead of validation hints. */
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task instanceof Task
            ? $this->user()->can('update', $task)
            : $this->user()->can('createTask', $this->project());
    }

    public function project(): Project
    {
        $route = $this->route('project') ?? $this->route('task')?->project;

        return $route instanceof Project ? $route : Project::findOrFail($route);
    }

    public function rules(): array
    {
        $partial = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';
        $memberIds = $this->project()->members()->pluck('users.id')->all();

        return [
            'title' => [$partial, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::in(Task::STATUSES)],
            'priority' => ['sometimes', Rule::in(Task::PRIORITIES)],
            'due_date' => ['nullable', 'date_format:Y-m-d'],
            'assignee_ids' => ['sometimes', 'array', 'max:20'],
            'assignee_ids.*' => ['integer', 'distinct', Rule::in($memberIds)],
        ];
    }

    public function messages(): array
    {
        return ['assignee_ids.*.in' => 'Assignees must be members of this project.'];
    }
}
