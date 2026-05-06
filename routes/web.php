<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinancialRecordController;
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

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::post('/financial-records', [FinancialRecordController::class, 'store'])
    ->middleware(['auth', 'verified','active.subscription'])
    ->name('financial-records.store');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/mes-enregistrements-financiers', function (Request $request) {
    $records = $request->user()->financialRecords()->get();

    return response()->json($records);
})->middleware(['auth','active.subscription']);

require __DIR__.'/auth.php';
