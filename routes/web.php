<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminAiInsightController;
use App\Http\Controllers\AdminUserDashboardController;
use App\Http\Controllers\AdminUserController;
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

    if ($user && $user->role === 'admin') {
        return redirect()->route('admin.dashboard');
    }

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

Route::get('/test', fn () => Inertia::render('TestLanding'));

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard_test', fn () => Inertia::render('TestDashboard'));
    Route::get('/dashboard_test/saisie-mensuelle', fn () => Inertia::render('TestSaisieMensuelle'));
    Route::get('/dashboard_test/rapports', fn () => Inertia::render('TestRapports'));
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified', 'active.subscription'])
    ->name('dashboard');

Route::get('/saisie-mensuelle', function (Request $request) {
    return Inertia::render('FinancialEntry', [
        'latestRecord' => $request->user()
            ->financialRecords()
            ->orderByDesc('month')
            ->first(),
    ]);
})->middleware(['auth', 'verified', 'active.subscription'])
    ->name('financial-entry.index');

Route::get('/admin', AdminController::class)
    ->middleware(['auth', 'verified', 'admin'])
    ->name('admin.dashboard');

Route::get('/admin/users/{user}/dashboard', AdminUserDashboardController::class)
    ->middleware(['auth', 'verified', 'admin'])
    ->name('admin.users.dashboard');

Route::patch('/admin/users/{user}/suspend', [AdminUserController::class, 'suspend'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('admin.users.suspend');

Route::patch('/admin/users/{user}/restore', [AdminUserController::class, 'restore'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('admin.users.restore');

Route::patch('/admin/ai-insights/{aiInsight}', [AdminAiInsightController::class, 'update'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('admin.ai-insights.update');

Route::post('/financial-records', [FinancialRecordController::class, 'store'])
    ->middleware(['auth', 'verified', 'active.subscription'])
    ->name('financial-records.store');

Route::post('/billing/checkout', [StripeCheckoutController::class, 'store'])
    ->middleware(['auth'])
    ->name('billing.checkout');

Route::get('/billing/checkout/start', [StripeCheckoutController::class, 'store'])
    ->middleware(['auth'])
    ->name('billing.checkout.start');

Route::get('/billing/success', [StripeCheckoutController::class, 'success'])
    ->middleware(['auth'])
    ->name('billing.success');

Route::get('/billing/cancel', [StripeCheckoutController::class, 'cancel'])
    ->middleware(['auth'])
    ->name('billing.cancel');

Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])
    ->middleware('throttle:60,1')
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
