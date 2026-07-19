<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('documents')
            ->where('status', 'refused')
            ->update(['status' => 'rejected']);

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(
            "ALTER TABLE documents MODIFY COLUMN status ENUM(
                'draft',
                'sent',
                'paid',
                'cancelled',
                'accepted',
                'rejected',
                'expired'
            ) NOT NULL DEFAULT 'draft'",
        );
    }

    public function down(): void
    {
        DB::table('documents')
            ->where('status', 'rejected')
            ->update(['status' => 'refused']);

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(
            "ALTER TABLE documents MODIFY COLUMN status ENUM(
                'draft',
                'sent',
                'paid',
                'cancelled',
                'accepted',
                'refused',
                'expired'
            ) NOT NULL DEFAULT 'draft'",
        );
    }
};
