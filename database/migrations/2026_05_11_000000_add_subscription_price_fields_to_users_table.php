<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('stripe_price_id')->nullable()->after('stripe_subscription_id');
            $table->decimal('subscription_amount', 15, 2)->nullable()->after('stripe_status');
            $table->string('subscription_currency', 3)->nullable()->after('subscription_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_price_id',
                'subscription_amount',
                'subscription_currency',
            ]);
        });
    }
};
