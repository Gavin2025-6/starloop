import { prisma } from "./prisma";

export async function generateJobNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SS-${year}-`;

  const last = await prisma.job.findFirst({
    where: { jobNumber: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
  });

  let seq = 1;
  if (last) {
    const parts = last.jobNumber.split("-");
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}
