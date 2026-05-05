<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function (Request $request) {
    $records = $request->user()
        ->financialRecords()
        ->orderBy('month')
        ->get();

    $currentMonthRecord = $records->sortByDesc('month')->first();

    $dashboardData = [
        'kpis_mensuels' => [
            'mois_actuel' => $currentMonthRecord?->month,
            'chiffre_affaires' => $currentMonthRecord?->revenue ?? 0,
            'charges_totales' => $currentMonthRecord?->charges ?? 0,
            'marge_nette' => $currentMonthRecord
                ? $currentMonthRecord->revenue - $currentMonthRecord->charges
                : 0,
            'cac' => ($currentMonthRecord && $currentMonthRecord->clients_count > 0)
                ? $currentMonthRecord->marketing_budget / $currentMonthRecord->clients_count
                : 0,
            'ltv' => 0,
        ],
        'graphique_evolution' => $records->take(-3)->values()->map(function ($record) {
            return [
                'mois' => $record->month,
                'ca' => $record->revenue,
                'charges' => $record->charges,
            ];
        }),
    ];

    return Inertia::render('Dashboard', [
        'dashboardData' => $dashboardData,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/mes-enregistrements-financiers', function (Request $request) {
    $records = $request->user()->financialRecords()->get();

    return response()->json($records);
})->middleware(['auth']);

require __DIR__.'/auth.php';
