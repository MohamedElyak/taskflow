<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Task;
use App\Notifications\TaskCommented;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CommentController extends Controller
{
    public function index(Task $task)
    {
        $this->authorize('view', $task);

        return CommentResource::collection($task->comments()->with('user')->orderBy('created_at')->orderBy('id')->get());
    }

    public function store(Request $request, Task $task): \Illuminate\Http\JsonResponse
    {
        $this->authorize('comment', $task);

        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $comment = $task->comments()->create(['body' => $data['body'], 'user_id' => $request->user()->id]);
        $comment->load('user');

        // Notify the creator and assignees, except the commenter.
        $task->load('assignees');
        $recipients = $task->assignees->push($task->creator)->filter()->unique('id')
            ->reject(fn ($u) => $u->id === $request->user()->id);

        foreach ($recipients as $user) {
            $user->notify(new TaskCommented($task, $comment, $request->user()));
        }

        return (new CommentResource($comment))->response()->setStatusCode(201);
    }

    public function destroy(Comment $comment): Response
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->noContent();
    }
}
