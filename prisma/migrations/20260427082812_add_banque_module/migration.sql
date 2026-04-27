-- CreateTable
CREATE TABLE "TransactionBancaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "libelleBancaire" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'A_CATEGORISER',
    "rubrique2035Code" TEXT,
    "libelleComptable" TEXT,
    "ecritureId" TEXT,
    "sens" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionBancaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransactionBancaire_rubrique2035Code_fkey" FOREIGN KEY ("rubrique2035Code") REFERENCES "Rubrique2035" ("code") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MotCle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "motCle" TEXT NOT NULL,
    "rubrique2035Code" TEXT NOT NULL,
    "sens" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MotCle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MotCle_rubrique2035Code_fkey" FOREIGN KEY ("rubrique2035Code") REFERENCES "Rubrique2035" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompteBancaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "iban" TEXT,
    "solde" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompteBancaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TransactionBancaire_userId_statut_idx" ON "TransactionBancaire"("userId", "statut");

-- CreateIndex
CREATE INDEX "TransactionBancaire_userId_date_idx" ON "TransactionBancaire"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MotCle_userId_motCle_key" ON "MotCle"("userId", "motCle");
