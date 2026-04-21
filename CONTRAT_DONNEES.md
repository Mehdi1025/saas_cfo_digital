# Contrat de données — Inertia.js (Mini CFO Digital)

Ce document fixe le **contrat d’interface** entre le backend Laravel et le frontend React pour les **props globales** partagées entre les pages Inertia. Toute évolution de ce schéma doit être **versionnée ici** et communiquée aux deux développeurs (Dev A — Accès / Revenus, Dev B — Métier / Dashboard).

---

## Props globales Inertia

À chaque chargement de page, le middleware / le contrôleur peut fusionner ces props avec les props spécifiques à la page. La structure ci-dessous décrit la **forme attendue** des objets `auth` et `dashboard_data` lorsqu’ils sont présents.

### Schéma JSON (référence)

```json
{
  "auth": {
    "user": {
      "id": 1,
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com"
    },
    "stripe_status": "active",
    "stripe_subscription_id": "sub_1AbCdEfGhIjKlMnO"
  },
  "dashboard_data": {
    "kpis_mensuels": {
      "mois_actuel": "2026-04",
      "chiffre_affaires": 125000.5,
      "charges_totales": 78000.0,
      "marge_nette": 47000.5,
      "cac": 150.0,
      "ltv": 2400.0
    },
    "graphique_evolution": [
      {
        "mois": "2026-02",
        "ca": 98000.0,
        "charges": 65000.0
      },
      {
        "mois": "2026-03",
        "ca": 110000.0,
        "charges": 70000.0
      },
      {
        "mois": "2026-04",
        "ca": 125000.5,
        "charges": 78000.0
      }
    ]
  }
}
```

---

## Détail par objet

### `auth` — périmètre Dev A (Accès & revenus)

| Champ | Type | Description |
|--------|------|-------------|
| `auth.user` | `object \| null` | Utilisateur connecté ; `null` si invité (selon politique d’auth). |
| `auth.user.id` | `number` | Identifiant utilisateur. |
| `auth.user.name` | `string` | Nom affiché. |
| `auth.user.email` | `string` | Email. |
| `auth.stripe_status` | `string` | État d’abonnement côté produit, ex. `"active"`, `"inactive"`, `"past_due"`, `"trialing"` (liste à figer avec le métier). |
| `auth.stripe_subscription_id` | `string \| null` | Identifiant Stripe `sub_…` ; `null` si pas d’abonnement. |

### `dashboard_data` — périmètre Dev B (Métier & dashboard)

| Champ | Type | Description |
|--------|------|-------------|
| `dashboard_data.kpis_mensuels` | `object` | Agrégats du mois en cours (ou période métier définie). |
| `kpis_mensuels.mois_actuel` | `string` | Période au format `YYYY-MM`. |
| `kpis_mensuels.chiffre_affaires` | `number` | CA (devise du produit, même unité que le reste). |
| `kpis_mensuels.charges_totales` | `number` | Total des charges. |
| `kpis_mensuels.marge_nette` | `number` | Marge nette. |
| `kpis_mensuels.cac` | `number` | Coût d’acquisition client (indicateur agrégé). |
| `kpis_mensuels.ltv` | `number` | Lifetime value (indicateur agrégé). |
| `dashboard_data.graphique_evolution` | `array` | **Exactement 3 éléments** pour le MVP (évolution sur 3 mois). |
| Chaque élément | `object` | `mois` (`YYYY-MM`), `ca`, `charges` (nombres). |

---

## Comment l’utiliser ?

### Côté Laravel

- Partager les props via `Inertia::share()` (middleware) ou `return Inertia::render(..., ['auth' => ..., 'dashboard_data' => ...])` en respectant les clés et types ci-dessus.
- Éviter de renommer les clés sans mettre à jour ce document.

### Côté React — lecture des props

Les props Inertia sont accessibles avec le hook **`usePage()`** fourni par `@inertiajs/react` :

```tsx
import { usePage } from '@inertiajs/react';

type PageProps = {
  auth: {
    user: { id: number; name: string; email: string } | null;
    stripe_status: string;
    stripe_subscription_id: string | null;
  };
  dashboard_data: {
    kpis_mensuels: {
      mois_actuel: string;
      chiffre_affaires: number;
      charges_totales: number;
      marge_nette: number;
      cac: number;
      ltv: number;
    };
    graphique_evolution: Array<{ mois: string; ca: number; charges: number }>;
  };
};

export function Example() {
  const { props } = usePage<PageProps>();
  const kpis = props.dashboard_data.kpis_mensuels;
  return <div>{kpis.chiffre_affaires}</div>;
}
```

### Mock / simulation pour le Dev B (en attendant le contrôleur)

Tant que le Dev A n’a pas branché le partage réel des données :

1. **Props locales dans le composant** : définir un objet `mockDashboardData` (ou `mockAuth`) qui respecte **exactement** le JSON de ce contrat, et l’utiliser à la place de `props.dashboard_data` le temps du développement UI.
2. **Props Inertia de dev** : sur une route de démo uniquement, retourner les mêmes structures depuis un contrôleur temporaire ou un middleware local — toujours aligné sur ce fichier.
3. **Typage** : réutiliser les types TypeScript du bloc ci-dessus pour que le passage des vraies props (quand elles arrivent) soit un **remplacement** sans refactor massif.

Règle : tout mock doit être **structurellement identique** au schéma JSON ci-dessus pour limiter les conflits de merge et les surprises à l’intégration.

---

*Document maintenu par l’équipe MVP — Mini CFO Digital.*
