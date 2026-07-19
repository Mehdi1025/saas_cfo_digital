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
        if (! Schema::hasColumn('articles', 'vat_rate')) {
            return;
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('vat_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->decimal('vat_rate', 5, 2)->default(20)->after('price_type');
        });
    }
};
