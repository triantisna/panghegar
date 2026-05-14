// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedRoles() {
  const roles = ["CEO", "ADMIN", "PM", "TECH", "ENGINEER"];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r },
    });
  }
}

async function seedCeo() {
  const ceoRole = await prisma.role.findUnique({ where: { name: "CEO" } });
  const email = "ceo@panghegar.test";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("ceo123", 11);
    await prisma.user.create({
      data: {
        name: "CEO Panghegar",
        email,
        password: hashedPassword,
        roleId: ceoRole.id,
      },
    });
  }
}

async function seedAdmin() {
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  const email = "admin@panghegar.test";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin123", 11);
    await prisma.user.create({
      data: {
        name: "Admin Panghegar",
        email,
        password: hashedPassword,
        roleId: adminRole.id,
      },
    });
  }
}

async function seedMaterials() {
  console.log("Cleaning old materials...");
  // OPSIONAL: Hapus baris di bawah jika Anda ingin material lama (Semen, Pasir) tetap ada
  // WARNING: Ini akan gagal jika material lama sudah dipakai di tabel MaterialUsage (Foreign Key Constraint)
  // await prisma.material.deleteMany({}); 

  const materials = [
    { name: "Pipa Tembaga (0,5 PK)", sku: "PIP-001", unit: "Meter", defaultPrice: 90000 },
    { name: "Pipa Tembaga (1 PK)", sku: "PIP-002", unit: "Meter", defaultPrice: 110000 },
    { name: "Pipa Tembaga (1,5 PK)", sku: "PIP-003", unit: "Meter", defaultPrice: 140000 },
    { name: "Pipa Tembaga (2 PK)", sku: "PIP-004", unit: "Meter", defaultPrice: 160000 },
    { name: "Isolasi Pipa AC", sku: "ISO-001", unit: "Meter", defaultPrice: 350000 },
    { name: "Freon", sku: "FRE-001", unit: "Kg/Psi", defaultPrice: 350000 },
    { name: "Kabel Power", sku: "KAB-001", unit: "Meter", defaultPrice: 25000 },
    { name: "Kabel Kontrol", sku: "KAB-002", unit: "Meter", defaultPrice: 85000 },
    { name: "Power Socket", sku: "SKT-001", unit: "Set", defaultPrice: 45000 },
    { name: "MCB", sku: "MCB-001", unit: "Unit", defaultPrice: 100000 },
    { name: "Flexibel Conduit", sku: "CON-001", unit: "Batang/3m", defaultPrice: 20000 },
    { name: "Pipa Drain", sku: "DRN-001", unit: "Meter", defaultPrice: 12000 },
    { name: "Pipa PVC", sku: "PVC-001", unit: "Batang/4m", defaultPrice: 45000 },
    { name: "Bracket Outdoor (0,5 PK)", sku: "BRK-001", unit: "Set", defaultPrice: 50000 },
    { name: "Bracket Outdoor (1 PK)", sku: "BRK-002", unit: "Set", defaultPrice: 75000 },
    { name: "Bracket Outdoor (1,5 PK)", sku: "BRK-003", unit: "Set", defaultPrice: 100000 },
    { name: "Bracket Outdoor (2 PK)", sku: "BRK-004", unit: "Set", defaultPrice: 130000 },
    { name: "Dynabolt/Fisher", sku: "DYN-001", unit: "Set", defaultPrice: 5000 },
    { name: "Duct Tape", sku: "DCT-001", unit: "Rol", defaultPrice: 15000 },
    { name: "Sealant", sku: "SEA-001", unit: "Tube/Kg", defaultPrice: 35000 },
    { name: "Ducting", sku: "DCT-002", unit: "Meter", defaultPrice: 120000 },
    { name: "Difusser", sku: "DIF-001", unit: "Unit", defaultPrice: 200000 },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { name: m.name },
      update: {
        sku: m.sku,
        unit: m.unit,
        defaultPrice: m.defaultPrice
      },
      create: m,
    });
  }
  console.log("Materials seeded successfully.");
}

async function main() {
  await seedRoles();
  await seedCeo();
  await seedAdmin();
  await seedMaterials();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });