<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\FinancialRecordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StripeCheckoutController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    $user = $request->user();

    if ($user
        && $user->suspended_at === null
        && in_array($user->stripe_status, ['active', 'trialing'], true)) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified', 'active.subscription'])
    ->name('dashboard');

Route::get('/admin', AdminController::class)
    ->middleware(['auth', 'verified', 'admin'])
    ->name('admin.dashboard');

Route::post('/financial-records', [FinancialRecordController::class, 'store'])
    ->middleware(['auth', 'verified', 'active.subscription'])
    ->name('financial-records.store');

Route::post('/billing/checkout', [StripeCheckoutController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('billing.checkout');

Route::get('/billing/success', [StripeCheckoutController::class, 'success'])
    ->middleware(['auth', 'verified'])
    ->name('billing.success');

Route::get('/billing/cancel', [StripeCheckoutController::class, 'cancel'])
    ->middleware(['auth', 'verified'])
    ->name('billing.cancel');

Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])
    ->name('stripe.webhook');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/mes-enregistrements-financiers', function (Request $request) {
    $records = $request->user()->financialRecords()->get();

    return response()->json($records);
})->middleware(['auth', 'active.subscription']);

require __DIR__.'/auth.php';
