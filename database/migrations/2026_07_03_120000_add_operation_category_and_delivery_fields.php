<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const OPERATION_CATEGORIES = ['bien', 'service', 'mixte'];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->enum('operation_category', self::OPERATION_CATEGORIES)
                ->default('service')
                ->after('type');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->enum('operation_category', self::OPERATION_CATEGORIES)
                ->default('service')
                ->after('type_prestation');
            $table->text('delivery_address')->nullable()->after('destination');
            $table->boolean('vat_on_debits')->default(false)->after('delivery_address');
        });

        Schema::table('tiers', function (Blueprint $table) {
            $table->text('delivery_address')->nullable()->after('address');
        });

        $this->backfillArticleOperationCategories();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tiers', function (Blueprint $table) {
            $table->dropColumn('delivery_address');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['operation_category', 'delivery_address', 'vat_on_debits']);
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('operation_category');
        });
    }

    private function backfillArticleOperationCategories(): void
    {
        DB::table('articles')
            ->where('type', 'product')
            ->update(['operation_category' => 'bien']);

        DB::table('articles')
            ->where('type', 'bundle')
            ->update(['operation_category' => 'mixte']);
    }
};
