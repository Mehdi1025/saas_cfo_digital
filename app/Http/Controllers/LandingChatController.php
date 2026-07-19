<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\LandingChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class LandingChatController extends Controller
{
    public function __invoke(Request $request, LandingChatService $chat): JsonResponse
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
            $reply = $chat->reply($messages);

            return response()->json(['reply' => $reply]);
        } catch (RuntimeException $exception) {
            $message = str_contains($exception->getMessage(), 'Groq non configurée')
                ? 'Clé API Groq manquante. Ajoutez GROQ_API_KEY dans votre fichier .env.'
                : 'L\'assistant est momentanément indisponible. Réessayez dans un instant.';

            return response()->json(['error' => $message], 503);
        }
    }
}
