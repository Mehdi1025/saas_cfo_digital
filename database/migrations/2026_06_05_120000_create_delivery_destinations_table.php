<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_destinations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('fee_per_day', 10, 2)->default(10);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();

        DB::table('delivery_destinations')->insert([
            ['name' => 'France', 'fee_per_day' => 10, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'États-Unis (USA)', 'fee_per_day' => 10, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Canada', 'fee_per_day' => 10, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Suisse', 'fee_per_day' => 10, 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Belgique', 'fee_per_day' => 10, 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_destinations');
    }
};
