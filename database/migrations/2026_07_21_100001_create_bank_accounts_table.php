<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('powens_account_id');
            $table->string('bank_name');
            $table->string('iban')->nullable();
            $table->decimal('balance', 14, 2)->default(0);
            $table->string('type')->default('checking');
            $table->timestamps();

            $table->unique(['user_id', 'powens_account_id']);
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
