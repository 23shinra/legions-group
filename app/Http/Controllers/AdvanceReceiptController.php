<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\AdvanceStatus;
use App\Models\AdvanceRequest;
use Illuminate\Http\Response;

final class AdvanceReceiptController extends Controller
{
    public function __invoke(AdvanceRequest $advance): Response
    {
        abort_unless($advance->status === AdvanceStatus::Paid, 404);

        $advance->loadMissing(['user.brigade', 'payer', 'reviewer']);

        return response()->view('advances.receipt', [
            'advance' => $advance,
            'employee' => $advance->user,
            'payer' => $advance->payer,
        ]);
    }
}
