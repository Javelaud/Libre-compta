-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TransactionBancaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "libelleBancaire" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "tva" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'A_CATEGORISER',
    "rubrique2035Code" TEXT,
    "libelleComptable" TEXT,
    "ecritureId" TEXT,
    "sens" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionBancaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransactionBancaire_rubrique2035Code_fkey" FOREIGN KEY ("rubrique2035Code") REFERENCES "Rubrique2035" ("code") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TransactionBancaire" ("createdAt", "date", "ecritureId", "id", "libelleBancaire", "libelleComptable", "montant", "rubrique2035Code", "sens", "statut", "userId") SELECT "createdAt", "date", "ecritureId", "id", "libelleBancaire", "libelleComptable", "montant", "rubrique2035Code", "sens", "statut", "userId" FROM "TransactionBancaire";
DROP TABLE "TransactionBancaire";
ALTER TABLE "new_TransactionBancaire" RENAME TO "TransactionBancaire";
CREATE INDEX "TransactionBancaire_userId_statut_idx" ON "TransactionBancaire"("userId", "statut");
CREATE INDEX "TransactionBancaire_userId_date_idx" ON "TransactionBancaire"("userId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
