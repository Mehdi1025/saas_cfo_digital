<?php

use App\Http\Controllers\PaWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/pa/webhook', [PaWebhookController::class, 'handle'])->name('pa.webhook');
