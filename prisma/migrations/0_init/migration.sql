-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ATENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConversationState" (
    "phone" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL DEFAULT 'IDLE',
    "pendingItemId" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "foto" TEXT,
    "tipo" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "horario" TEXT NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "vagas" INTEGER NOT NULL DEFAULT 50,
    "preco" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoRetirada" TEXT NOT NULL,
    "dataStr" TEXT NOT NULL,
    "customerId" TEXT,
    "guestName" TEXT,
    "menuItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "observacao" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'SITE',
    "retiradoEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_matricula_key" ON "Staff"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Order_codigoRetirada_dataStr_key" ON "Order"("codigoRetirada", "dataStr");

