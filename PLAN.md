# Plan — Persistance historique recettes + scaffold User

## Problème

La déduplication est **session-based uniquement** (état React effacé au refresh).
Chaque nouveau chargement repart avec un `previousRecipeNames: []` vide → Claude
propose les mêmes recettes en boucle.

---

## Stratégie choisie : Session anonyme + RecipeHistory en DB

### Principe

1. **Côté frontend** : générer un UUID `sessionId` persisté en `localStorage`.
   Le passer dans le header `X-Session-Id` de chaque requête.
2. **Côté backend** : avant chaque génération, lire les N derniers noms de
   recettes de cette session en DB et les fusionner avec ceux déjà passés
   par le frontend. Après génération, sauvegarder les nouveaux noms.

### Pourquoi cette approche est optimale

| Critère | Choix |
|---|---|
| Zéro friction | Pas d'auth à configurer pour avoir la dédup persistante |
| Auth-ready | `userId` FK nullable sur `RecipeHistory` — brancher l'auth = juste renseigner ce champ |
| Writes minimaux | Seul le **nom** de la recette est stocké, pas les 30+ champs |
| Résilient | Si `DATABASE_URL` absent → fallback silencieux sur la dédup session React |
| Zero new deps | Prisma est déjà dans le `package.json` backend |
| Railway-native | PostgreSQL add-on + `prisma migrate deploy` au démarrage |

---

## Changements fichier par fichier

### 1. `backend/prisma/schema.prisma` — Nouveaux modèles

**Conserver** `Recipe`, `WeeklyMenu`, `ExcludedTag` (scaffold menus sauvegardés).

**Ajouter :**

```prisma
model User {
  id        String   @id @default(cuid())
  sessionId String   @unique   // UUID anonyme (localStorage)
  email     String?  @unique   // réservé pour future auth
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  recipeHistory RecipeHistory[]
}

model RecipeHistory {
  id        String   @id @default(cuid())
  name      String
  category  String
  sessionId String                   // dénormalisé → lookup rapide sans JOIN
  userId    String?                  // FK nullable → futur auth
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())

  @@unique([name, sessionId])         // évite les doublons par session
  @@index([sessionId, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
}
```

Rationale :
- `sessionId` dénormalisé sur `RecipeHistory` → `WHERE sessionId = ?` en O(log n),
  pas de JOIN `User` nécessaire pour les sessions anonymes
- `@@unique([name, sessionId])` → upsert idempotent, pas de duplication si la même
  recette est regénérée par accident
- `User.email` nullable + `userId` nullable → le modèle compile et fonctionne
  sans auth, on branche OAuth/JWT plus tard en renseignant ces champs

---

### 2. `backend/src/lib/prisma.ts` — Client singleton *(nouveau fichier)*

Pattern standard Next.js/Express : instancier `PrismaClient` une seule fois,
réutiliser en dev (évite "too many connections" avec hot-reload).

---

### 3. `backend/src/services/historyService.ts` — Service DB *(nouveau fichier)*

Deux fonctions :

```typescript
getSessionHistory(sessionId: string, limit = 100): Promise<string[]>
// SELECT DISTINCT name ORDER BY createdAt DESC LIMIT 100
// → liste de noms à injecter dans previousRecipeNames

saveToHistory(entries: { name: string; category: string }[], sessionId: string): Promise<void>
// createMany avec skipDuplicates: true (respecte @@unique)
```

Wrappées dans un `try/catch` → erreur DB = log + retour silencieux
(l'app fonctionne sans DB).

---

### 4. `backend/src/routes/recipes.ts` — Enrichissement des routes

**`POST /generate`** :
- Lire header `X-Session-Id` (valider format UUID, ignorer si invalide)
- `dbHistory = await getSessionHistory(sessionId)`
- Fusionner : `mergedHistory = [...new Set([...dbHistory, ...body.previousRecipeNames])]`
- Appeler `generateRecipes({ ...body, previousRecipeNames: mergedHistory })`
- `await saveToHistory(recipes.map(r => ({ name: r.name, category: r.category })), sessionId)`

**`POST /regenerate`** :
- Même lecture `getSessionHistory`
- Fusionner avec `existingRecipeNames` du body
- Appeler `regenerateRecipe` avec l'union
- Sauvegarder le nouveau nom

---

### 5. `backend/src/index.ts` — Env + graceful degradation

- Rendre `DATABASE_URL` **optionnel** dans la validation d'env (warn si absent, pas crash)
- Logger au démarrage : `DB connected` ou `DB not configured — history disabled`

---

### 6. `backend/Dockerfile` — Migration automatique au démarrage

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

Ainsi Railway applique les migrations automatiquement à chaque déploiement.

---

### 7. `backend/.env.example` — Ajout DATABASE_URL

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

### 8. `frontend/src/lib/session.ts` — Util UUID *(nouveau fichier)*

```typescript
export function getSessionId(): string {
  const KEY = 'commis_session_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID(); // disponible dans tous les navigateurs modernes
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

---

### 9. `frontend/src/lib/api.ts` — Header X-Session-Id

Ajouter `'X-Session-Id': getSessionId()` dans les headers de la fonction
`request()` — un seul endroit, toutes les routes en bénéficient.

---

## Fichiers touchés — récapitulatif

| Fichier | Action |
|---|---|
| `backend/prisma/schema.prisma` | Modifier — ajouter `User` + `RecipeHistory` |
| `backend/src/lib/prisma.ts` | Créer — client singleton |
| `backend/src/services/historyService.ts` | Créer — get/save history |
| `backend/src/routes/recipes.ts` | Modifier — lire/écrire history |
| `backend/src/index.ts` | Modifier — DATABASE_URL optionnel |
| `backend/Dockerfile` | Modifier — migrate deploy au démarrage |
| `backend/.env.example` | Modifier — ajouter DATABASE_URL |
| `frontend/src/lib/session.ts` | Créer — UUID localStorage |
| `frontend/src/lib/api.ts` | Modifier — header X-Session-Id |

**Aucune modification du frontend visible** (MealSelector, RecipeGrid, etc.)
**Aucune nouvelle dépendance npm**

---

## Ce qui est hors scope (fait plus tard)

- Vraie authentification (OAuth / email+password / magic link)
- UI de compte utilisateur
- Stockage du contenu complet des recettes (juste le nom pour la dédup)
- Tableau de bord des recettes générées
