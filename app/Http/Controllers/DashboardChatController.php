<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DashboardChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class DashboardChatController extends Controller
{
    public function __invoke(Request $request, DashboardChatService $chat): JsonResponse
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:20'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'min:1', 'max:1200'],
        ]);

        $messages = collect($validated['messages'])
            ->take(-12)
            ->values()
            ->all();

        try {
            $reply = $chat->reply($request->user(), $messages);

            return response()->json(['reply' => $reply]);
        } catch (RuntimeException $exception) {
            report($exception);

            $message = match (true) {
                str_contains($exception->getMessage(), 'Groq non configurée') => 'Clé API Groq manquante. Ajoutez GROQ_API_KEY dans votre fichier .env puis relancez le serveur.',
                str_contains($exception->getMessage(), 'Groq API error') => 'Le service IA est temporairement indisponible. Réessayez dans quelques instants.',
                default => 'Le copilote est momentanément indisponible. Réessayez dans un instant.',
            };

            return response()->json(['error' => $message], 503);
        }
    }
}
