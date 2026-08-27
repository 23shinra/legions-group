<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accountant;

use App\Enums\AdvanceStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdvanceRequest;
use App\Models\Payment;
use App\Models\User;
use App\Services\AdvanceService;
use App\Services\PaymentService;
use App\Services\PayrollService;
use App\Services\ReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class AccountantController extends Controller
{
    public function dashboard(PayrollService $payroll, ReportService $reports): Response
    {
        $workers = User::query()
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->where('is_active', true)
            ->get();

        $totalRemaining = 0.0;
        foreach ($workers as $worker) {
            $totalRemaining += $payroll->balanceFor($worker)['remaining'];
        }

        $approved = AdvanceRequest::query()
            ->where('status', AdvanceStatus::Approved)
            ->get();

        return Inertia::render('Accountant/Dashboard', [
            'stats' => [
                'totalRemaining' => round($totalRemaining, 2),
                'pendingAdvancesCount' => $approved->count(),
                'pendingAdvancesSum' => (float) $approved->sum('amount'),
                'paidThisMonth' => (float) Payment::query()
                    ->whereMonth('paid_on', now()->month)
                    ->whereYear('paid_on', now()->year)
                    ->sum('amount'),
            ],
            'pendingAdvances' => AdvanceRequest::query()
                ->with('user')
                ->where('status', AdvanceStatus::Approved)
                ->latest()
                ->limit(8)
                ->get(),
            'recentPayments' => Payment::query()->with('user')->latest()->limit(8)->get(),
        ]);
    }

    public function advances(): Response
    {
        return Inertia::render('Accountant/Advances', [
            'advances' => AdvanceRequest::query()
                ->with('user')
                ->whereIn('status', [AdvanceStatus::Approved, AdvanceStatus::Paid])
                ->latest()
                ->get(),
        ]);
    }

    public function markPaid(AdvanceRequest $advance, AdvanceService $service, Request $request): RedirectResponse
    {
        $service->markPaid($advance, $request->user());

        return back()->with('success', 'Аванс отмечен как выплаченный.');
    }

    public function payments(): Response
    {
        return Inertia::render('Accountant/Payments', [
            'employees' => User::query()
                ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'payments' => Payment::query()->with(['user', 'payer'])->latest()->limit(50)->get(),
        ]);
    }

    public function storePayment(Request $request, PaymentService $payments): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'period' => ['nullable', 'string', 'max:100'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $employee = User::query()->findOrFail($data['user_id']);
        $payments->pay(
            $employee,
            (float) $data['amount'],
            $request->user(),
            $data['period'] ?? null,
            $data['comment'] ?? null,
        );

        return back()->with('success', 'Выплата сохранена.');
    }

    public function reports(ReportService $reports): Response
    {
        $data = $reports->financialOverview();

        return Inertia::render('Accountant/Reports', [
            'summary' => $data['summary'],
            'rows' => $data['rows'],
        ]);
    }

    public function exportReports(ReportService $reports): BinaryFileResponse|\Symfony\Component\HttpFoundation\StreamedResponse
    {
        $data = $reports->employeeReport();

        return (new \App\Exports\EmployeeReportExport($data['reports']))->download('otchet-finansy.xlsx');
    }
}
