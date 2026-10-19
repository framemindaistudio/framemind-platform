/** The founders' saved signatures, read from the File Vault (server only). See src/lib/sign/ink.ts. */
import "server-only";
import { FOUNDERS } from "@/lib/sign/context";
import { inkPath, type Inks } from "@/lib/sign/ink";
import { store } from "@/lib/store";

/** name as printed → data: address of the picture, for every founder who has saved one */
export async function readInks(): Promise<Inks> {
  const out: Inks = {};
  await Promise.all(
    FOUNDERS.map(async (f) => {
      try {
        const buf = await store.readBinary(inkPath(f.id));
        if (buf?.length) out[f.name] = `data:image/png;base64,${buf.toString("base64")}`;
      } catch {
        // no picture saved for this founder
      }
    }),
  );
  return out;
}
