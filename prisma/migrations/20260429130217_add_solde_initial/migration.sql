-- CreateTable
CREATE TABLE "SoldeInitial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compteBancaireId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "montant" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SoldeInitial_compteBancaireId_fkey" FOREIGN KEY ("compteBancaireId") REFERENCES "CompteBancaire" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SoldeInitial_compteBancaireId_annee_key" ON "SoldeInitial"("compteBancaireId", "annee");
