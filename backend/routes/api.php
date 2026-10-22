<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectMemberController;
use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('health', fn () => response()->json(['status' => 'ok']));

    // Public
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [PasswordResetController::class, 'sendLink'])->middleware('throttle:5,1');
    Route::post('reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
    Route::get('invitations/{token}', [InvitationController::class, 'show'])->middleware('throttle:30,1');

    // Authenticated (cookie session via Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('profile/password', [ProfileController::class, 'updatePassword']);

        Route::get('dashboard', DashboardController::class);

        Route::get('projects', [ProjectController::class, 'index']);
        Route::post('projects', [ProjectController::class, 'store']);
        Route::get('projects/{project}', [ProjectController::class, 'show']);
        Route::put('projects/{project}', [ProjectController::class, 'update']);
        Route::delete('projects/{project}', [ProjectController::class, 'destroy']);
        Route::post('projects/{project}/archive', [ProjectController::class, 'archive']);
        Route::post('projects/{project}/unarchive', [ProjectController::class, 'unarchive']);

        Route::get('projects/{project}/members', [ProjectMemberController::class, 'index']);
        Route::put('projects/{project}/members/{user}', [ProjectMemberController::class, 'update']);
        Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);

        Route::get('projects/{project}/invitations', [InvitationController::class, 'index']);
        Route::post('projects/{project}/invitations', [InvitationController::class, 'store']);
        Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy'])->whereNumber('invitation');
        Route::post('invitations/{token}/accept', [InvitationController::class, 'accept']);

        Route::get('tasks', [TaskController::class, 'all']);
        Route::get('projects/{project}/tasks', [TaskController::class, 'index']);
        Route::post('projects/{project}/tasks', [TaskController::class, 'store']);
        Route::get('tasks/{task}', [TaskController::class, 'show']);
        Route::put('tasks/{task}', [TaskController::class, 'update']);
        Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus']);
        Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

        Route::get('tasks/{task}/comments', [CommentController::class, 'index']);
        Route::post('tasks/{task}/comments', [CommentController::class, 'store']);
        Route::delete('comments/{comment}', [CommentController::class, 'destroy']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);
    });
});
