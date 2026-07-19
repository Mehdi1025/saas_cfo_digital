<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Facture {{ $document->reference }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
                    <tr>
                        <td style="padding:32px 32px 24px;">
                            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">
                                {{ $companyName }}
                            </p>
                            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#18181b;">
                                Votre facture est disponible
                            </h1>
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
                                Bonjour{{ $clientName ? ' '.$clientName : '' }},
                            </p>
                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">
                                Nous vous informons que votre facture
                                <strong>{{ $document->reference }}</strong>
                                a été émise. La facture est jointe à cet email au format
                                <strong>Factur-X</strong> (PDF/A-3 avec données structurées EN&nbsp;16931).
                                Vous trouverez ci-dessous un récapitulatif.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                                <tr>
                                    <td style="padding:16px 20px;font-size:14px;color:#52525b;">Montant TTC</td>
                                    <td align="right" style="padding:16px 20px;font-size:16px;font-weight:700;color:#18181b;">
                                        {{ number_format($totalTtc, 2, ',', ' ') }} {{ $currencyCode }}
                                    </td>
                                </tr>
                                @if ($dueDateLabel)
                                    <tr>
                                        <td style="padding:0 20px 16px;font-size:14px;color:#52525b;border-top:1px solid #e4e4e7;">Échéance</td>
                                        <td align="right" style="padding:0 20px 16px;font-size:14px;font-weight:600;color:#18181b;border-top:1px solid #e4e4e7;">
                                            {{ $dueDateLabel }}
                                        </td>
                                    </tr>
                                @endif
                            </table>

                            <p style="margin:0 0 24px;text-align:center;">
                                <a href="{{ $documentUrl }}"
                                   style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;">
                                    Consulter la facture
                                </a>
                            </p>

                            <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                                Merci pour votre confiance.<br>
                                L'équipe {{ $companyName }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <img src="{{ route('tracking.pixel', ['document' => $document->id]) }}" width="1" height="1" style="display:none;" alt="" />
</body>
</html>
