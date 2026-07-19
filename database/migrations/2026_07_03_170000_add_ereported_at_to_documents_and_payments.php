<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->timestamp('ereported_at')->nullable()->after('pa_document_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->timestamp('ereported_at')->nullable()->after('paid_at');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('ereported_at');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('ereported_at');
        });
    }
};
