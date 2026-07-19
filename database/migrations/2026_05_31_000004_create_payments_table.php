<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('payments')) {
            $this->upgradeLegacyPaymentsTable();

            return;
        }

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tiers_id')->constrained('tiers')->restrictOnDelete();
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->enum('kind', ['payment', 'refund'])->default('payment');
            $table->decimal('amount', 12, 2);
            $table->decimal('transaction_fee', 10, 2)->default(0);
            $table->enum('payment_method', ['sepa', 'card', 'direct_debit', 'manual'])->default('manual');
            $table->string('payment_method_detail')->nullable();
            $table->enum('status', ['success', 'pending', 'failed'])->default('pending');
            $table->timestamp('paid_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'paid_at']);
            $table->index('payment_method');
        });
    }

    private function upgradeLegacyPaymentsTable(): void
    {
        if (! Schema::hasColumn('payments', 'tiers_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->foreignId('tiers_id')->nullable()->after('id')->constrained('tiers')->restrictOnDelete();
            });

            DB::statement('
                UPDATE payments p
                INNER JOIN documents d ON p.document_id = d.id
                SET p.tiers_id = d.tiers_id
                WHERE p.tiers_id IS NULL
            ');

            Schema::table('payments', function (Blueprint $table) {
                $table->unsignedBigInteger('tiers_id')->nullable(false)->change();
            });
        }

        if (! Schema::hasColumn('payments', 'kind')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->enum('kind', ['payment', 'refund'])->default('payment')->after('document_id');
            });
        }

        if (! Schema::hasColumn('payments', 'transaction_fee')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->decimal('transaction_fee', 10, 2)->default(0)->after('amount');
            });
        }

        if (! Schema::hasColumn('payments', 'payment_method_detail')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->string('payment_method_detail')->nullable()->after('payment_method');
            });

            DB::table('payments')
                ->whereNull('payment_method_detail')
                ->update(['payment_method_detail' => DB::raw('payment_method')]);
        }

        if (! Schema::hasColumn('payments', 'status')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->enum('status', ['success', 'pending', 'failed'])->default('success')->after('payment_method_detail');
            });
        }

        DB::table('payments')->where('payment_method', 'virement')->update(['payment_method' => 'sepa']);
        DB::table('payments')->where('payment_method', 'cb')->update(['payment_method' => 'card']);
        DB::table('payments')->whereIn('payment_method', ['especes', 'cheque'])->update(['payment_method' => 'manual']);

        DB::statement("
            ALTER TABLE payments
            MODIFY payment_method ENUM('sepa', 'card', 'direct_debit', 'manual') NOT NULL DEFAULT 'manual'
        ");

        if (Schema::hasColumn('payments', 'payment_date') && ! Schema::hasColumn('payments', 'paid_at')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->timestamp('paid_at')->nullable()->after('status');
            });

            DB::statement('UPDATE payments SET paid_at = payment_date');

            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('payment_date');
            });

            Schema::table('payments', function (Blueprint $table) {
                $table->timestamp('paid_at')->nullable(false)->change();
            });
        }

        Schema::table('payments', function (Blueprint $table) {
            if (! $this->indexExists('payments', 'payments_status_paid_at_index')) {
                $table->index(['status', 'paid_at']);
            }
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        $indexes = Schema::getIndexes($table);

        foreach ($indexes as $definition) {
            if (($definition['name'] ?? '') === $index) {
                return true;
            }
        }

        return false;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
