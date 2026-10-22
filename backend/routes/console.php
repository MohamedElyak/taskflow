<?php

use Illuminate\Support\Facades\Schedule;

// Run locally with: php artisan schedule:work
Schedule::command('taskflow:deadline-reminders')->hourly();
