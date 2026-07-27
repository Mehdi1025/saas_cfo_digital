<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->string('stripe_fc_account_id')->nullable()->after('powens_account_id');
            $table->unsignedBigInteger('powens_account_id')->nullable()->change();
            $table->unique(['user_id', 'stripe_fc_account_id'], 'bank_accounts_user_stripe_fc_unique');
        });

        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->string('stripe_transaction_id')->nullable()->after('powens_transaction_id');
            $table->unsignedBigInteger('powens_transaction_id')->nullable()->change();
            $table->unique(['bank_account_id', 'stripe_transaction_id'], 'bank_tx_account_stripe_unique');
        });
    }

    public function down(): void
    {
        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->dropUnique('bank_tx_account_stripe_unique');
            $table->dropColumn('stripe_transaction_id');
            $table->unsignedBigInteger('powens_transaction_id')->nullable(false)->change();
        });

        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropUnique('bank_accounts_user_stripe_fc_unique');
            $table->dropColumn('stripe_fc_account_id');
            $table->unsignedBigInteger('powens_account_id')->nullable(false)->change();
        });
    }
};
