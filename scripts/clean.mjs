import { rm } from "node:fs/promises";

for (const directory of ["dist", "release"]) {
  await rm(directory, { recursive: true, force: true });
}
