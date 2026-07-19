<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures_fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('pa_document_id')->unique();
            $table->string('supplier_name');
            $table->string('supplier_siret')->nullable();
            $table->string('reference');
            $table->date('issue_date');
            $table->decimal('amount_ht', 12, 2);
            $table->decimal('amount_ttc', 12, 2);
            $table->string('cdar_status');
            $table->string('pdf_url')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'issue_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures_fournisseurs');
    }
};
