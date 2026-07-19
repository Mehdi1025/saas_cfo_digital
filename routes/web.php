<?php

use App\Http\Controllers\AdminAiInsightController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminUserDashboardController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CopilotController;
use App\Http\Controllers\DashboardChatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DashboardSimulationController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\FacturationDashboardController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\FactureFournisseurController;
use App\Http\Controllers\FinancialRecordController;
use App\Http\Controllers\LandingChatController;
use App\Http\Controllers\ParametresController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StripeCheckoutController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\TrackingController;
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

Route::post('/landing/chat', LandingChatController::class)
    ->middleware('throttle:12,1')
    ->name('landing.chat');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard_test', fn () => Inertia::render('TestDashboard'));
    Route::get('/dashboard_test/saisie-mensuelle', fn () => Inertia::render('TestSaisieMensuelle'));
    Route::get('/dashboard_test/rapports', fn () => Inertia::render('TestRapports'));
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified', 'active.subscription'])
    ->name('dashboard');

Route::post('/dashboard/simulate-insights', [DashboardSimulationController::class, 'simulateInsights'])
    ->middleware(['auth', 'verified', 'active.subscription', 'throttle:12,1'])
    ->name('dashboard.simulate-insights');

Route::post('/dashboard/chat', DashboardChatController::class)
    ->middleware(['auth', 'verified', 'active.subscription', 'throttle:20,1'])
    ->name('dashboard.chat');

Route::post('/copilote/chat', DashboardChatController::class)
    ->middleware(['auth', 'verified', 'active.subscription', 'throttle:20,1'])
    ->name('copilot.chat');

Route::get('/copilote', CopilotController::class)
    ->middleware(['auth', 'verified', 'active.subscription'])
    ->name('copilot.index');

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

Route::get('/tracking/{document}/pixel', [TrackingController::class, 'pixel'])->name('tracking.pixel');

Route::middleware(['auth', 'verified', 'active.subscription'])->group(function () {
    Route::get('/facturation', [FacturationDashboardController::class, 'index'])->name('facturation.dashboard');
    Route::post('/facturation/analyze', [FacturationDashboardController::class, 'analyze'])->name('facturation.analyze');

    Route::prefix('factures')->name('factures.')->group(function () {
        Route::get('/', [FactureController::class, 'index'])->name('index');
        Route::get('/nouveau', [FactureController::class, 'create'])->name('create');
        Route::post('/', [FactureController::class, 'store'])->name('store');
        Route::get('/{facture}/pdf', [FactureController::class, 'pdf'])->name('pdf');
        Route::get('/{facture}/edit', [FactureController::class, 'edit'])->name('edit');
        Route::put('/{facture}', [FactureController::class, 'update'])->name('update');
        Route::delete('/{facture}', [FactureController::class, 'destroy'])->name('destroy');
        Route::post('/{facture}/send', [FactureController::class, 'send'])->name('send');
        Route::post('/{facture}/payments', [FactureController::class, 'recordPayment'])->name('payments.store');
        Route::post('/{facture}/avoir', [FactureController::class, 'generateAvoir'])->name('generate-avoir');
    });

    Route::prefix('devis')->name('devis.')->group(function () {
        Route::get('/', [DevisController::class, 'index'])->name('index');
        Route::get('/nouveau', [DevisController::class, 'create'])->name('create');
        Route::post('/', [DevisController::class, 'store'])->name('store');
        Route::get('/{devis}/pdf', [DevisController::class, 'pdf'])->name('pdf');
        Route::get('/{devis}/edit', [DevisController::class, 'edit'])->name('edit');
        Route::put('/{devis}', [DevisController::class, 'update'])->name('update');
        Route::delete('/{devis}', [DevisController::class, 'destroy'])->name('destroy');
        Route::post('/{devis}/send', [DevisController::class, 'sendEmail'])->name('send');
        Route::patch('/{devis}/sent', [DevisController::class, 'markAsSent'])->name('mark-as-sent');
        Route::patch('/{devis}/accepted', [DevisController::class, 'markAsAccepted'])->name('mark-as-accepted');
        Route::patch('/{devis}/rejected', [DevisController::class, 'markAsRejected'])->name('mark-as-rejected');
        Route::post('/{devis}/convert', [DevisController::class, 'convertToFacture'])->name('convert');
    });

    Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');

    Route::prefix('catalogue')->name('catalogue.')->group(function () {
        Route::get('/', [ArticleController::class, 'index'])->name('index');
        Route::get('/export', [ArticleController::class, 'export'])->name('export');
        Route::post('/', [ArticleController::class, 'store'])->name('store');
        Route::put('/{article}', [ArticleController::class, 'update'])->name('update');
        Route::delete('/{article}', [ArticleController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('paiements')->name('paiements.')->group(function () {
        Route::get('/', [PaymentController::class, 'index'])->name('index');
        Route::post('/', [PaymentController::class, 'store'])->name('store');
        Route::get('/export', [PaymentController::class, 'export'])->name('export');
        Route::patch('/{payment}/success', [PaymentController::class, 'markSuccess'])->name('mark-success');
        Route::patch('/{payment}/retry', [PaymentController::class, 'retry'])->name('retry');
    });

    Route::get('/parametres', [ParametresController::class, 'index'])->name('parametres.index');
    Route::put('/parametres', [ParametresController::class, 'update'])->name('parametres.update');

    Route::get('/achats/factures-fournisseurs', [FactureFournisseurController::class, 'index'])
        ->name('achats.factures-fournisseurs.index');
});

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
