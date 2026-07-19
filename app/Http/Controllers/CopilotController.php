<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\CopilotContextService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CopilotController extends Controller
{
    public function __construct(private CopilotContextService $contextService) {}

    public function __invoke(Request $request): Response
    {
        $apiKey = config('services.groq.api_key') ?? config('services.groq.key');

        return Inertia::render('Copilot', [
            'summary' => $this->contextService->buildUiSummary($request->user()),
            'aiConfigured' => is_string($apiKey) && $apiKey !== '',
        ]);
    }
}
