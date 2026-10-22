<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ProjectMemberController extends Controller
{
    public function index(Project $project)
    {
        $this->authorize('view', $project);

        return MemberResource::collection($project->members()->orderBy('users.name')->get());
    }

    /** Change a member's role (owner only; the owner's own role cannot change). */
    public function update(Request $request, Project $project, User $user): MemberResource
    {
        $this->authorize('manageMembers', $project);

        $request->validate(['role' => ['required', 'in:manager,member']]);

        abort_if($project->owner_id === $user->id, 422, 'The owner role cannot be changed.');
        abort_unless($project->members()->where('users.id', $user->id)->exists(), 404, 'Not a member.');

        $project->members()->updateExistingPivot($user->id, ['role' => $request->input('role')]);

        return new MemberResource($project->members()->where('users.id', $user->id)->firstOrFail());
    }

    /** The owner removes a member, or any member leaves on their own. */
    public function destroy(Request $request, Project $project, User $user): Response
    {
        abort_if($project->owner_id === $user->id, 422, 'The owner cannot be removed from the project.');

        if ($request->user()->id !== $user->id) {
            $this->authorize('manageMembers', $project);
        } else {
            $this->authorize('view', $project);
        }

        abort_unless($project->members()->where('users.id', $user->id)->exists(), 404, 'Not a member.');

        DB::transaction(function () use ($project, $user) {
            DB::table('task_assignees')
                ->whereIn('task_id', $project->tasks()->select('tasks.id'))
                ->where('user_id', $user->id)
                ->delete();
            $project->members()->detach($user->id);
        });

        return response()->noContent();
    }
}
