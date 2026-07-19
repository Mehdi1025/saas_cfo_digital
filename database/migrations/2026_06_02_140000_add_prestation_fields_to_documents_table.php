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
        Schema::table('documents', function (Blueprint $table) {
            $table->string('type_prestation', 20)->default('service')->after('type');
            $table->string('destination')->nullable()->after('type_prestation');
            $table->unsignedInteger('jours_stockage')->default(0)->after('destination');
            $table->decimal('frais_port', 10, 2)->default(0)->after('jours_stockage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['type_prestation', 'destination', 'jours_stockage', 'frais_port']);
        });
    }
};
