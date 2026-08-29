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

    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])
        ->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])
        ->name('notifications.read-all');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::middleware('role:worker,brigadier')->prefix('worker')->name('worker.')->group(function (): void {
        Route::get('/', [WorkerController::class, 'home'])->name('home');
        Route::get('/salary', [WorkerController::class, 'salary'])->name('salary');
        Route::get('/advances', [WorkerController::class, 'advances'])->name('advances');
        Route::get('/advances/create', [WorkerController::class, 'createAdvance'])->name('advances.create');
        Route::post('/advances', [WorkerController::class, 'storeAdvance'])->name('advances.store');
        Route::get('/hours', [WorkerController::class, 'hours'])->name('hours');
        Route::post('/time/arrival', [WorkerController::class, 'requestArrival'])->name('time.arrival');
        Route::post('/time/end', [WorkerController::class, 'endShift'])->name('time.end');
    });

    Route::middleware('role:brigadier')->prefix('brigadier')->name('brigadier.')->group(function (): void {
        Route::get('/', [BrigadierController::class, 'home'])->name('home');
        Route::get('/advances', [BrigadierController::class, 'advances'])->name('advances.index');
        Route::post('/members/{member}/time/confirm', [BrigadierController::class, 'confirmMemberTime'])
            ->name('members.time.confirm');
        Route::post('/members/{member}/time/end', [BrigadierController::class, 'endMemberTime'])
            ->name('members.time.end');
        Route::post('/members/{member}/transfer', [BrigadierController::class, 'transferMember'])
            ->name('members.transfer');
    });

    Route::middleware('role:manager')->prefix('manager')->name('manager.')->group(function (): void {
        Route::get('/', [ManagerController::class, 'dashboard'])->name('dashboard');
        Route::get('/employees', [ManagerController::class, 'employees'])->name('employees.index');
        Route::post('/employees', [ManagerController::class, 'storeEmployee'])->name('employees.store');
        Route::post('/employees/import', [ManagerController::class, 'importEmployees'])->name('employees.import');
        Route::get('/employees/import-template', [ManagerController::class, 'importEmployeesTemplate'])->name('employees.import-template');
        Route::get('/employees/{employee}', [ManagerController::class, 'showEmployee'])->name('employees.show');
        Route::patch('/employees/{employee}', [ManagerController::class, 'updateEmployee'])->name('employees.update');
        Route::delete('/employees/{employee}', [ManagerController::class, 'destroyEmployee'])->name('employees.destroy');
        Route::post('/employees/{employee}/restore', [ManagerController::class, 'restoreEmployee'])->name('employees.restore');
        Route::get('/brigades', [ManagerController::class, 'brigades'])->name('brigades.index');
        Route::post('/brigades', [ManagerController::class, 'storeBrigade'])->name('brigades.store');
        Route::get('/brigades/{brigade}', [ManagerController::class, 'showBrigade'])->name('brigades.show');
        Route::patch('/brigades/{brigade}', [ManagerController::class, 'updateBrigade'])->name('brigades.update');
        Route::post('/brigades/{brigade}/members', [ManagerController::class, 'addBrigadeMember'])->name('brigades.members.store');
        Route::delete('/brigades/{brigade}/members/{member}', [ManagerController::class, 'removeBrigadeMember'])->name('brigades.members.destroy');
        Route::get('/schedule', [\App\Http\Controllers\Manager\ScheduleController::class, 'index'])
            ->name('schedule.index');
        Route::post('/schedule', [\App\Http\Controllers\Manager\ScheduleController::class, 'store'])
            ->name('schedule.store');
        Route::get('/objects', [ManagerController::class, 'objects'])->name('objects.index');
        Route::post('/objects', [ManagerController::class, 'storeObject'])->name('objects.store');
        Route::get('/objects/{object}', [ManagerController::class, 'showObject'])->name('objects.show');
        Route::patch('/objects/{object}', [ManagerController::class, 'updateObject'])->name('objects.update');
        Route::post('/objects/{object}/members', [ManagerController::class, 'assignObjectMember'])->name('objects.members.store');
        Route::delete('/objects/{object}/members/{member}', [ManagerController::class, 'unassignObjectMember'])->name('objects.members.destroy');
        Route::post('/objects/{object}/close', [ManagerController::class, 'closeObject'])->name('objects.close');
        Route::get('/advances', [ManagerController::class, 'advances'])->name('advances.index');
        Route::get('/advances/{advance}/receipt', \App\Http\Controllers\AdvanceReceiptController::class)
            ->name('advances.receipt');
        Route::post('/advances/{advance}/approve', [ManagerController::class, 'approveAdvance'])->name('advances.approve');
        Route::post('/advances/{advance}/reject', [ManagerController::class, 'rejectAdvance'])->name('advances.reject');
        Route::get('/reports/export', [ManagerController::class, 'exportReports'])->name('reports.export');
        Route::get('/reports/pdf', [ManagerController::class, 'exportPdf'])->name('reports.pdf');
        Route::get('/reports/{employee}', [ManagerController::class, 'showReport'])->name('reports.show');
        Route::get('/reports', [ManagerController::class, 'reports'])->name('reports.index');
        Route::get('/activity', [\App\Http\Controllers\Manager\ActivityLogController::class, 'index'])
            ->name('activity.index');
    });

    Route::middleware('role:accountant')->prefix('accountant')->name('accountant.')->group(function (): void {
        Route::get('/', [AccountantController::class, 'dashboard'])->name('dashboard');
        Route::get('/advances', [AccountantController::class, 'advances'])->name('advances.index');
        Route::get('/advances/{advance}/receipt', \App\Http\Controllers\AdvanceReceiptController::class)
            ->name('advances.receipt');
        Route::post('/advances/{advance}/paid', [AccountantController::class, 'markPaid'])->name('advances.paid');
        Route::get('/payments', [AccountantController::class, 'payments'])->name('payments.index');
        Route::get('/payments/history', [AccountantController::class, 'paymentsHistory'])->name('payments.history');
        Route::post('/payments', [AccountantController::class, 'storePayment'])->name('payments.store');
        Route::post('/objects/{object}/pay-settlement', [AccountantController::class, 'payObjectSettlement'])
            ->name('objects.pay-settlement');
        Route::get('/reports/export', [AccountantController::class, 'exportReports'])->name('reports.export');
        Route::get('/reports/pdf', [AccountantController::class, 'exportPdf'])->name('reports.pdf');
        Route::get('/reports/{employee}', [AccountantController::class, 'showReport'])->name('reports.show');
        Route::get('/reports', [AccountantController::class, 'reports'])->name('reports.index');
        Route::get('/activity', [\App\Http\Controllers\Manager\ActivityLogController::class, 'index'])
            ->name('activity.index');
    });
});

require __DIR__.'/auth.php';
