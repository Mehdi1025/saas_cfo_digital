<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('bridge_user_uuid')->nullable()->after('powens_access_token');
        });

        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->string('bridge_account_id')->nullable()->after('stripe_fc_account_id');
            $table->unsignedBigInteger('bridge_item_id')->nullable()->after('bridge_account_id');
            $table->unique(['user_id', 'bridge_account_id'], 'bank_accounts_user_bridge_unique');
        });

        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->string('bridge_transaction_id')->nullable()->after('stripe_transaction_id');
            $table->unique(['bank_account_id', 'bridge_transaction_id'], 'bank_tx_account_bridge_unique');
        });
    }

    public function down(): void
    {
        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->dropUnique('bank_tx_account_bridge_unique');
            $table->dropColumn('bridge_transaction_id');
        });

        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropUnique('bank_accounts_user_bridge_unique');
            $table->dropColumn(['bridge_account_id', 'bridge_item_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('bridge_user_uuid');
        });
    }
};
