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
            $table->string('project_title')->nullable()->after('reference');
            $table->boolean('online_signature')->default(false)->after('status');
            $table->boolean('open_tracking')->default(false)->after('online_signature');
            $table->text('payment_terms')->nullable()->after('open_tracking');
        });

        Schema::table('ligne_documents', function (Blueprint $table) {
            $table->text('description')->nullable()->after('label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['project_title', 'online_signature', 'open_tracking', 'payment_terms']);
        });

        Schema::table('ligne_documents', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }
};
