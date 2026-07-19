@php
    $brandColor = $company['brand_color'] ?? '#3B82F6';
    $hex = ltrim((string) $brandColor, '#');
    if (strlen($hex) === 6) {
        $brandR = hexdec(substr($hex, 0, 2));
        $brandG = hexdec(substr($hex, 2, 2));
        $brandB = hexdec(substr($hex, 4, 2));
    } else {
        $brandR = 59;
        $brandG = 130;
        $brandB = 246;
    }
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $document->reference }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
            line-height: 1.45;
        }
        .page { padding: 36px 40px; }
        .header { margin-bottom: 28px; }
        .header-table { width: 100%; border-collapse: collapse; }
        .logo-img { max-height: 48px; max-width: 140px; }
        .logo {
            width: 40px;
            height: 40px;
            background: {{ $brandColor }};
            border-radius: 8px;
            display: inline-block;
        }
        .logo-inner {
            width: 18px;
            height: 18px;
            border: 2px solid #fff;
            margin: 11px;
            transform: rotate(45deg);
        }
        .doc-title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: -0.02em;
        }
        .doc-ref { font-size: 12px; color: #475569; margin-top: 4px; }
        .section-label {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #94a3b8;
            margin-bottom: 4px;
        }
        .party-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
        .party-table td { width: 50%; vertical-align: top; }
        .party-name { font-weight: bold; font-size: 12px; }
        .party-line { color: #475569; margin-top: 4px; }
        .dates-table { width: 100%; border-collapse: collapse; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 22px; }
        .dates-table td { width: 50%; padding-top: 16px; vertical-align: top; }
        .items-table { width: 100%; border-collapse: collapse; border-top: 2px solid #111827; margin-top: 8px; }
        .items-table th {
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            padding: 10px 0 8px;
            border-bottom: 1px solid #cbd5e1;
        }
        .items-table th.right { text-align: right; }
        .items-table td {
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .items-table td.right { text-align: right; }
        .item-label { font-weight: bold; }
        .item-desc { font-size: 10px; color: #64748b; margin-top: 2px; }
        .totals-wrap { margin-top: 24px; width: 100%; }
        .totals-table { width: 220px; margin-left: auto; border-collapse: collapse; }
        .totals-table td { padding: 4px 0; }
        .totals-table .label { color: #475569; }
        .totals-table .value { text-align: right; font-weight: bold; }
        .total-box {
            margin-top: 10px;
            border: 1px solid rgba({{ $brandR }}, {{ $brandG }}, {{ $brandB }}, 0.25);
            background: rgba({{ $brandR }}, {{ $brandG }}, {{ $brandB }}, 0.07);
            border-radius: 6px;
            padding: 12px 14px;
        }
        .total-box-table { width: 100%; border-collapse: collapse; }
        .total-box-table td { font-weight: bold; }
        .total-amount { text-align: right; font-size: 18px; color: {{ $brandColor }}; font-weight: bold; }
        .empty { text-align: center; color: #94a3b8; padding: 24px 0; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <table class="header-table">
                <tr>
                    <td style="width: 50%;">
                        @if (! empty($company['logo_data_uri']))
                            <img src="{{ $company['logo_data_uri'] }}" alt="Logo" class="logo-img">
                        @else
                            <div class="logo"><div class="logo-inner"></div></div>
                        @endif
                    </td>
                    <td style="width: 50%; text-align: right;">
                        <div class="doc-title">{{ $documentTypeLabel }}</div>
                        <div class="doc-ref">{{ $document->reference }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <table class="party-table">
            <tr>
                <td>
                    <div class="party-name">{{ $company['name'] ?? 'Copifi' }}</div>
                    @if (! empty($company['address']))
                        <div class="party-line">{{ $company['address'] }}</div>
                    @endif
                    @if (! empty($company['registration_number']))
                        <div class="party-line">{{ $company['registration_number'] }}</div>
                    @endif
                    @if (! empty($company['email']))
                        <div class="party-line">{{ $company['email'] }}</div>
                    @endif
                    @if (! empty($company['phone']))
                        <div class="party-line">{{ $company['phone'] }}</div>
                    @endif
                </td>
                <td style="text-align: right;">
                    <div class="section-label">Facturé à</div>
                    <div class="party-name">{{ $client?->name ?? '—' }}</div>
                    @if ($client?->email)
                        <div class="party-line">{{ $client->email }}</div>
                    @endif
                    @if ($client?->address)
                        <div class="party-line">{!! nl2br(e($client->address)) !!}</div>
                    @endif
                </td>
            </tr>
        </table>

        <table class="dates-table">
            <tr>
                <td>
                    <div class="section-label">Date d'émission</div>
                    <div class="party-name">
                        {{ $document->issue_date?->translatedFormat('d F Y') ?? '—' }}
                    </div>
                </td>
                <td>
                    <div class="section-label">Échéance</div>
                    <div class="party-name">
                        {{ $document->due_date?->translatedFormat('d F Y') ?? '—' }}
                    </div>
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 38%;">Description</th>
                    <th class="right" style="width: 10%;">Qté</th>
                    <th class="right" style="width: 16%;">Prix HT</th>
                    <th class="right" style="width: 14%;">Remise</th>
                    <th class="right" style="width: 16%;">Total HT</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($lignes as $ligne)
                    @php
                        $lineHt = \App\Support\LigneAmounts::totalHt($ligne);
                        $discountLabel = \App\Support\LigneAmounts::discountLabel($ligne);
                    @endphp
                    <tr>
                        <td>
                            <div class="item-label">{{ $ligne->label }}</div>
                            @if ($ligne->description)
                                <div class="item-desc">{{ $ligne->description }}</div>
                            @endif
                        </td>
                        <td class="right">{{ number_format((float) $ligne->quantity, 2, ',', ' ') }}</td>
                        <td class="right">{{ number_format((float) $ligne->unit_price_ht, 2, ',', ' ') }} {{ $currency }}</td>
                        <td class="right">{{ $discountLabel ?? '—' }}</td>
                        <td class="right">{{ number_format($lineHt, 2, ',', ' ') }} {{ $currency }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="empty">Aucun article</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="totals-wrap">
            <table class="totals-table">
                <tr>
                    <td class="label">Sous-total HT (lignes)</td>
                    <td class="value">{{ number_format($lines_subtotal ?? $subtotal, 2, ',', ' ') }} {{ $currency }}</td>
                </tr>
                @if ($document->type_prestation === 'produit' && (float) $document->frais_port > 0)
                    <tr>
                        <td class="label">
                            Frais de port et stockage
                            ({{ (int) $document->jours_stockage }} jour{{ (int) $document->jours_stockage > 1 ? 's' : '' }}
                            @if ($document->destination)
                                vers {{ $document->destination }}
                            @endif
                            )
                        </td>
                        <td class="value">{{ number_format((float) $document->frais_port, 2, ',', ' ') }} {{ $currency }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="label">Total HT</td>
                    <td class="value">{{ number_format($subtotal, 2, ',', ' ') }} {{ $currency }}</td>
                </tr>
                <tr>
                    <td class="label">TVA</td>
                    <td class="value">{{ number_format($tax, 2, ',', ' ') }} {{ $currency }}</td>
                </tr>
            </table>
            @if ($financial_discount_configured ?? false)
                <table class="totals-table" style="margin-top: 8px;">
                    <tr>
                        <td class="label">
                            Escompte financier ({{ number_format((float) $financial_discount_percent, 2, ',', ' ') }} % si paiement sous {{ (int) $financial_discount_days }} jour{{ (int) $financial_discount_days > 1 ? 's' : '' }}
                            @if ($financial_discount_deadline)
                                — avant le {{ $financial_discount_deadline->locale('fr')->translatedFormat('j F Y') }}
                            @endif
                            )
                        </td>
                        <td class="value">-{{ number_format((float) $financial_discount_amount, 2, ',', ' ') }} {{ $currency }}</td>
                    </tr>
                    <tr>
                        <td class="label">Net à payer avec escompte</td>
                        <td class="value">{{ number_format((float) $net_payable_with_discount, 2, ',', ' ') }} {{ $currency }}</td>
                    </tr>
                </table>
            @endif
            <div class="total-box">
                <table class="total-box-table">
                    <tr>
                        <td>Total TTC ({{ $currency }})</td>
                        <td class="total-amount">{{ number_format($total, 2, ',', ' ') }} {{ $currency }}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
