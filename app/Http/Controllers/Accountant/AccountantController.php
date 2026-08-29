<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accountant;

use App\Enums\AdvancePaymentMethod;
use App\Enums\AdvanceStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdvanceRequest;
use App\Models\Payment;
use App\Models\User;
use App\Models\WorkObject;
use App\Services\AdvanceService;
use App\Services\PaymentService;
use App\Services\PayrollService;
use App\Services\ReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
                ->with(['user', 'reviewer'])
                ->where('status', AdvanceStatus::Approved)
                ->latest('reviewed_at')
                ->limit(8)
                ->get()
                ->map(fn (AdvanceRequest $advance): array => $this->mapAdvance($advance)),
            'recentPayments' => Payment::query()->with('user')->latest()->limit(8)->get(),
        ]);
    }

    public function advances(Request $request): Response
    {
        $map = fn (AdvanceRequest $advance): array => $this->mapAdvance($advance);
        $month = $request->string('month')->toString();
        $status = $request->string('status')->toString();

        $paid = AdvanceRequest::query()
            ->with(['user', 'reviewer', 'payer'])
            ->where('status', AdvanceStatus::Paid)
            ->latest('paid_at');

        if (preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
            $start = \Carbon\Carbon::parse($month.'-01')->startOfMonth();
            $paid->whereBetween('paid_at', [$start, $start->copy()->endOfMonth()]);
        }

        return Inertia::render('Accountant/Advances', [
            'pendingAdvances' => AdvanceRequest::query()
                ->with(['user', 'reviewer'])
                ->where('status', AdvanceStatus::Approved)
                ->latest('reviewed_at')
                ->get()
                ->map($map),
            'paidAdvances' => $paid->get()->map($map),
            'filters' => [
                'month' => $month ?: now()->format('Y-m'),
                'status' => $status,
            ],
        ]);
    }

    public function markPaid(AdvanceRequest $advance, AdvanceService $service, Request $request): RedirectResponse
    {
        $data = $request->validate([
            'payment_method' => ['required', Rule::enum(AdvancePaymentMethod::class)],
            'receipt' => [
                Rule::requiredIf($request->input('payment_method') === AdvancePaymentMethod::Transfer->value),
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,pdf,webp',
                'max:5120',
            ],
            'payment_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $method = AdvancePaymentMethod::from($data['payment_method']);
        $receiptPath = null;

        if ($method === AdvancePaymentMethod::Transfer && $request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('advance-receipts', 'public');
        }

        $service->markPaid(
            $advance,
            $request->user(),
            $method,
            $receiptPath,
            $data['payment_note'] ?? null,
        );

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
            'payments' => Payment::query()
                ->with(['user', 'payer'])
                ->latest('paid_on')
                ->latest('id')
                ->limit(8)
                ->get(),
            'closedObjects' => WorkObject::query()
                ->where('status', \App\Enums\ObjectStatus::Closed)
                ->whereNotNull('settlement')
                ->orderByDesc('closed_at')
                ->get(['id', 'name', 'settlement']),
        ]);
    }

    public function paymentsHistory(Request $request): Response
    {
        $from = $request->filled('from')
            ? \Carbon\Carbon::parse($request->string('from')->toString())->startOfDay()
            : null;
        $to = $request->filled('to')
            ? \Carbon\Carbon::parse($request->string('to')->toString())->endOfDay()
            : null;

        if ($from !== null && $to !== null && $from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $userId = $request->integer('user_id');

        $query = Payment::query()->with(['user', 'payer']);

        if ($from !== null) {
            $query->whereDate('paid_on', '>=', $from->toDateString());
        }

        if ($to !== null) {
            $query->whereDate('paid_on', '<=', $to->toDateString());
        }

        if ($userId > 0) {
            $query->where('user_id', $userId);
        }

        $summary = [
            'count' => (clone $query)->count(),
            'total' => (float) (clone $query)->sum('amount'),
        ];

        $payments = $query
            ->latest('paid_on')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Accountant/PaymentsHistory', [
            'payments' => $payments,
            'employees' => User::query()
                ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => [
                'from' => $from?->toDateString() ?? '',
                'to' => $to?->toDateString() ?? '',
                'user_id' => $userId > 0 ? (string) $userId : '',
            ],
            'summary' => $summary,
        ]);
    }

    public function payObjectSettlement(
        Request $request,
        WorkObject $object,
        PaymentService $payments,
    ): RedirectResponse {
        $count = $payments->payObjectSettlement($object, $request->user());

        return back()->with('success', $count > 0
            ? "Оформлено выплат: {$count}."
            : 'Нет остатков к выплате по этому объекту.');
    }

    public function storePayment(Request $request, PaymentService $payments): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'period' => ['nullable', 'string', 'max:100'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'paid_on' => ['nullable', 'date', 'before_or_equal:today'],
        ]);

        $employee = User::query()->findOrFail($data['user_id']);
        $payments->pay(
            $employee,
            (float) $data['amount'],
            $request->user(),
            $data['period'] ?? null,
            $data['comment'] ?? null,
            isset($data['paid_on']) ? \Carbon\Carbon::parse($data['paid_on']) : null,
        );

        return back()->with('success', 'Выплата сохранена.');
    }

    public function reports(Request $request, ReportService $reports): Response
    {
        [$from, $to] = $this->reportPeriod($request);
        $data = $reports->financialOverview($from, $to);

        return Inertia::render('Accountant/Reports', [
            'summary' => $data['summary'],
            'rows' => $data['rows'],
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    public function showReport(Request $request, User $employee, ReportService $reports): Response
    {
        [$from, $to] = $this->reportPeriod($request);
        $report = $reports->employeeReportRow($employee, $from, $to);

        abort_if($report === null, 404);

        return Inertia::render('Accountant/Reports/Show', [
            'report' => $report,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    public function exportReports(Request $request, ReportService $reports): BinaryFileResponse|\Symfony\Component\HttpFoundation\StreamedResponse
    {
        [$from, $to] = $this->reportPeriod($request);
        $data = $reports->employeeReport($from, $to);

        return (new \App\Exports\EmployeeReportExport($data['reports']))->download('otchet-finansy.xlsx');
    }

    public function exportPdf(Request $request, ReportService $reports): \Illuminate\Http\Response
    {
        [$from, $to] = $this->reportPeriod($request);
        $data = $reports->employeeReport($from, $to);

        return response()
            ->view('reports.print', [
                'title' => 'Финансовый отчёт',
                'period' => $from->format('d.m.Y').' — '.$to->format('d.m.Y'),
                'summary' => $data['summary'],
                'rows' => $data['reports'],
                'type' => 'employees',
            ]);
    }

    /**
     * @return array{0: \Carbon\Carbon, 1: \Carbon\Carbon}
     */
    private function reportPeriod(Request $request): array
    {
        $from = $request->filled('from')
            ? \Carbon\Carbon::parse($request->string('from')->toString())->startOfDay()
            : now()->startOfMonth();
        $to = $request->filled('to')
            ? \Carbon\Carbon::parse($request->string('to')->toString())->endOfDay()
            : now()->endOfMonth();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }

    /** @return array<string, mixed> */
    private function mapAdvance(AdvanceRequest $advance): array
    {
        return [
            'id' => $advance->id,
            'amount' => (float) $advance->amount,
            'comment' => $advance->comment,
            'status' => $advance->status->value,
            'review_comment' => $advance->review_comment,
            'payment_method' => $advance->payment_method?->value,
            'payment_method_label' => $advance->payment_method?->label(),
            'payment_note' => $advance->payment_note,
            'payment_receipt_url' => $advance->receiptUrl(),
            'created_at' => $advance->created_at?->toIso8601String(),
            'reviewed_at' => $advance->reviewed_at?->toIso8601String(),
            'paid_at' => $advance->paid_at?->toIso8601String(),
            'user' => $advance->user ? [
                'id' => $advance->user->id,
                'name' => $advance->user->name,
                'position' => $advance->user->position,
            ] : null,
            'reviewer' => $advance->reviewer ? [
                'id' => $advance->reviewer->id,
                'name' => $advance->reviewer->name,
            ] : null,
            'payer' => $advance->payer ? [
                'id' => $advance->payer->id,
                'name' => $advance->payer->name,
            ] : null,
        ];
    }
}
