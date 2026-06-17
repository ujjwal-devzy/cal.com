// Deliberate architecture-layer violation for on-prem review testing.
// The UI layer (@calcom/ui) must NOT import the Data layer (@calcom/prisma).
import { prisma } from "@calcom/prisma";

export async function probeUserCount(): Promise<number> {
  return prisma.user.count();
}
