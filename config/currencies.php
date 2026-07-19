<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Taux de change figés — valeur en EUR de 1 unité de devise
|--------------------------------------------------------------------------
| Exemple : 1 USD = 0.92 EUR → une facture de 1000 USD compte pour 920 €
| au moment de la création (taux enregistré sur le document).
*/
return [
    'EUR' => 1.0,
    'USD' => 0.92,
    'GBP' => 1.17,
    'CHF' => 1.02,
];
