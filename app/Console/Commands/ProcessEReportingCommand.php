<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Contracts\PaClientInterface;
use App\Models\Document;
use App\Models\Payment;
use App\Models\User;
use App\Support\EReportingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcessEReportingCommand extends Command
{
    protected $signature = 'finflow:process-ereporting';

    protected $description = 'Transmet les données d\'e-reporting (B2C/international et encaissements) à la Plateforme Agréée';

    public function handle(EReportingService $ereportingService, PaClientInterface $paClient): int
    {
        $users = User::query()
            ->whereNull('suspended_at')
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->get();

        $transmittedUsers = 0;
        $transmittedDocuments = 0;
        $transmittedPayments = 0;

        foreach ($users as $user) {
            $data = $ereportingService->collectDataForUser($user);

            if ($data['transactions'] === [] && $data['payments'] === []) {
                continue;
            }

            $payload = [
                'user_id' => $data['user_id'],
                'transactions' => $data['transactions'],
                'payments' => $data['payments'],
            ];

            if (! $paClient->submitEreporting($payload)) {
                $this->warn("Échec e-reporting pour l'utilisateur #{$user->id}.");

                continue;
            }

            DB::transaction(function () use ($data): void {
                if ($data['document_ids'] !== []) {
                    Document::query()
                        ->withoutGlobalScopes()
                        ->whereIn('id', $data['document_ids'])
                        ->update(['ereported_at' => now()]);
                }

                if ($data['payment_ids'] !== []) {
                    Payment::query()
                        ->withoutGlobalScopes()
                        ->whereIn('id', $data['payment_ids'])
                        ->update(['ereported_at' => now()]);
                }
            });

            $transmittedUsers++;
            $transmittedDocuments += count($data['document_ids']);
            $transmittedPayments += count($data['payment_ids']);

            $this->info(sprintf(
                'Utilisateur #%d : %d transaction(s), %d paiement(s) transmis.',
                $user->id,
                count($data['document_ids']),
                count($data['payment_ids']),
            ));
        }

        $this->info(sprintf(
            'E-reporting terminé — %d utilisateur(s), %d facture(s), %d paiement(s).',
            $transmittedUsers,
            $transmittedDocuments,
            $transmittedPayments,
        ));

        return self::SUCCESS;
    }
}
