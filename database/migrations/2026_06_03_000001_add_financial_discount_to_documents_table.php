<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->decimal('financial_discount_percent', 5, 2)->default(0)->after('payment_terms');
            $table->unsignedSmallInteger('financial_discount_days')->nullable()->after('financial_discount_percent');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['financial_discount_percent', 'financial_discount_days']);
        });
    }
};
