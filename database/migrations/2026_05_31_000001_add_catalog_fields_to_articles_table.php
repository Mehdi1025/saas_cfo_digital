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
        Schema::table('articles', function (Blueprint $table) {
            $table->string('sku')->nullable()->unique()->after('id');
            $table->enum('type', ['service', 'bundle', 'product'])->default('service')->after('description');
            $table->string('category')->default('')->after('type');
            $table->enum('price_type', ['year', 'fixed', 'hour', 'month', 'unit'])->default('fixed')->after('price_ht');

            $table->index('type');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['category']);
            $table->dropColumn(['sku', 'type', 'category', 'price_type']);
        });
    }
};
