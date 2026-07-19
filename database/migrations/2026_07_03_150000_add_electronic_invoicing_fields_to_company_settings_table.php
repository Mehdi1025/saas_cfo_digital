<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->boolean('electronic_invoicing_active')->default(false)->after('brand_color');
            $table->timestamp('billing_mandate_accepted_at')->nullable()->after('electronic_invoicing_active');
        });
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn(['electronic_invoicing_active', 'billing_mandate_accepted_at']);
        });
    }
};
