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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tiers_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['devis', 'facture', 'avoir']);
            $table->string('reference')->unique();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->enum('status', [
                'draft',
                'sent',
                'paid',
                'cancelled',
                'accepted',
                'rejected',
                'expired',
            ])->default('draft');
            $table->foreignId('parent_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->timestamps();

            $table->index(['type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
