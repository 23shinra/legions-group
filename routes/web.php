<?php

declare(strict_types=1);

use App\Http\Controllers\Accountant\AccountantController;
use App\Http\Controllers\Brigadier\BrigadierController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Manager\ManagerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\Worker\WorkerController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

Route::middleware(['auth'])->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/settings', SettingsController::class)->name('settings');

    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])
        ->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])
        ->name('notifications.read-all');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/time/start', [WorkerController::class, 'start'])->name('time.start');
    Route::post('/time/end', [WorkerController::class, 'end'])->name('time.end');

    Route::middleware('role:worker,brigadier')->prefix('worker')->name('worker.')->group(function (): void {
        Route::get('/', [WorkerController::class, 'home'])->name('home');
        Route::get('/salary', [WorkerController::class, 'salary'])->name('salary');
        Route::get('/advances', [WorkerController::class, 'advances'])->name('advances');
        Route::get('/advances/create', [WorkerController::class, 'createAdvance'])->name('advances.create');
        Route::post('/advances', [WorkerController::class, 'storeAdvance'])->name('advances.store');
        Route::get('/hours', [WorkerController::class, 'hours'])->name('hours');
    });

    Route::middleware('role:brigadier')->prefix('brigadier')->name('brigadier.')->group(function (): void {
        Route::get('/', [BrigadierController::class, 'home'])->name('home');
    });

    Route::middleware('role:manager')->prefix('manager')->name('manager.')->group(function (): void {
        Route::get('/', [ManagerController::class, 'dashboard'])->name('dashboard');
        Route::get('/employees', [ManagerController::class, 'employees'])->name('employees.index');
        Route::get('/employees/{employee}', [ManagerController::class, 'showEmployee'])->name('employees.show');
        Route::get('/brigades', [ManagerController::class, 'brigades'])->name('brigades.index');
        Route::get('/brigades/{brigade}', [ManagerController::class, 'showBrigade'])->name('brigades.show');
        Route::get('/objects', [ManagerController::class, 'objects'])->name('objects.index');
        Route::get('/objects/{object}', [ManagerController::class, 'showObject'])->name('objects.show');
        Route::post('/objects/{object}/close', [ManagerController::class, 'closeObject'])->name('objects.close');
        Route::get('/advances', [ManagerController::class, 'advances'])->name('advances.index');
        Route::post('/advances/{advance}/approve', [ManagerController::class, 'approveAdvance'])->name('advances.approve');
        Route::post('/advances/{advance}/reject', [ManagerController::class, 'rejectAdvance'])->name('advances.reject');
        Route::get('/reports', [ManagerController::class, 'reports'])->name('reports.index');
        Route::get('/reports/export', [ManagerController::class, 'exportReports'])->name('reports.export');
    });

    Route::middleware('role:accountant')->prefix('accountant')->name('accountant.')->group(function (): void {
        Route::get('/', [AccountantController::class, 'dashboard'])->name('dashboard');
        Route::get('/advances', [AccountantController::class, 'advances'])->name('advances.index');
        Route::post('/advances/{advance}/paid', [AccountantController::class, 'markPaid'])->name('advances.paid');
        Route::get('/payments', [AccountantController::class, 'payments'])->name('payments.index');
        Route::post('/payments', [AccountantController::class, 'storePayment'])->name('payments.store');
        Route::get('/reports', [AccountantController::class, 'reports'])->name('reports.index');
        Route::get('/reports/export', [AccountantController::class, 'exportReports'])->name('reports.export');
    });
});

require __DIR__.'/auth.php';
