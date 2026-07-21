<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('powens_transaction_id');
            $table->decimal('amount', 14, 2);
            $table->date('date');
            $table->string('label');
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->unique(['bank_account_id', 'powens_transaction_id']);
            $table->index(['bank_account_id', 'date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');
    }
};
