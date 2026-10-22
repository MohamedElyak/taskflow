<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\ProjectResource;
use App\Models\Invitation;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    /** Pending invitations of a project (owner only). */
    public function index(Project $project)
    {
        $this->authorize('manageMembers', $project);

        return InvitationResource::collection(
            $project->invitations()->whereNull('accepted_at')->where('expires_at', '>', now())->latest()->get()
        );
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('manageMembers', $project);
        abort_if($project->isArchived(), 422, 'Archived projects are read-only.');

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', 'in:manager,member'],
        ]);
        $email = strtolower($data['email']);

        $alreadyMember = $project->members()->whereRaw('LOWER(users.email) = ?', [$email])->exists();
        abort_if($alreadyMember, 422, 'That person is already a member of this project.');

        // Replace any earlier pending invitation for the same email.
        $project->invitations()->where('email', $email)->whereNull('accepted_at')->delete();

        $plain = Str::random(48);
        $invitation = $project->invitations()->create([
            'email' => $email,
            'role' => $data['role'],
            'token_hash' => Invitation::hashToken($plain),
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(7),
        ]);

        $resource = (new InvitationResource($invitation))->withToken($plain);
        $url = rtrim(config('app.frontend_url'), '/').'/invitations/'.$plain;

        try {
            Mail::raw(
                "{$request->user()->name} invited you to join \"{$project->name}\" on TaskFlow as {$data['role']}.\n\nAccept the invitation (valid for 7 days):\n{$url}",
                fn ($m) => $m->to($email)->subject("You're invited to {$project->name} on TaskFlow")
            );
        } catch (\Throwable $e) {
            report($e); // Email delivery is optional locally; the link is also returned to the owner.
        }

        return $resource->response()->setStatusCode(201);
    }

    public function destroy(Invitation $invitation): Response
    {
        $this->authorize('manageMembers', $invitation->project);

        $invitation->delete();

        return response()->noContent();
    }

    /** Public: lets the invitee see what they were invited to before signing in. */
    public function show(string $token): JsonResponse
    {
        $invitation = Invitation::findByToken($token);
        abort_unless($invitation, 404, 'Invitation not found.');

        $invitation->load(['project:id,name', 'inviter:id,name']);

        return response()->json(['data' => [
            'project' => ['id' => $invitation->project->id, 'name' => $invitation->project->name],
            'invited_by' => $invitation->inviter?->name,
            'email' => $invitation->email,
            'role' => $invitation->role,
            'expired' => $invitation->isExpired(),
            'accepted' => $invitation->accepted_at !== null,
        ]]);
    }

    public function accept(Request $request, string $token)
    {
        $invitation = Invitation::findByToken($token);
        abort_unless($invitation, 404, 'Invitation not found.');
        abort_if($invitation->accepted_at !== null, 410, 'This invitation was already used.');
        abort_if($invitation->isExpired(), 410, 'This invitation has expired.');
        abort_unless(
            strtolower($request->user()->email) === strtolower($invitation->email),
            403,
            "This invitation was sent to {$invitation->email}. Sign in with that account to accept it."
        );

        $project = $invitation->project;

        if ($project->roleFor($request->user()) === null) {
            $project->members()->attach($request->user()->id, ['role' => $invitation->role]);
            $project->forgetRoleCache();
        }

        $invitation->update(['accepted_at' => now()]);

        return new ProjectResource($project->load('owner'));
    }
}
