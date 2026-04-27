-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MotCle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "motCle" TEXT NOT NULL,
    "rubrique2035Code" TEXT NOT NULL,
    "sens" TEXT NOT NULL,
    "tauxTVA" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MotCle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MotCle_rubrique2035Code_fkey" FOREIGN KEY ("rubrique2035Code") REFERENCES "Rubrique2035" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MotCle" ("createdAt", "id", "motCle", "rubrique2035Code", "sens", "userId") SELECT "createdAt", "id", "motCle", "rubrique2035Code", "sens", "userId" FROM "MotCle";
DROP TABLE "MotCle";
ALTER TABLE "new_MotCle" RENAME TO "MotCle";
CREATE UNIQUE INDEX "MotCle_userId_motCle_key" ON "MotCle"("userId", "motCle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
