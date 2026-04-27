-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nom" TEXT NOT NULL,
    "siret" TEXT,
    "profession" TEXT,
    "regime" TEXT NOT NULL DEFAULT 'DECLARATION_CONTROLEE',
    "regimeTVA" TEXT NOT NULL DEFAULT 'FRANCHISE',
    "tauxTVA" REAL NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "nom", "password", "profession", "regime", "siret", "updatedAt") SELECT "createdAt", "email", "id", "nom", "password", "profession", "regime", "siret", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
