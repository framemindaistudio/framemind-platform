import { requireUser } from "@/lib/hq/auth";
import { storeInfoChecked } from "@/lib/store";
import { storeForUser } from "@/lib/hq/access";
import { bookForRole, readPriceBook, startingBook } from "@/lib/hq/pricebook";
import { HqProvider } from "@/components/hq/data";

export const dynamic = "force-dynamic";

/** Printable documents: authenticated, but without the HQ chrome. */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { rates, book } = bookForRole(user.role, (await readPriceBook().catch(() => null))?.book ?? startingBook());
  return (
    <HqProvider user={user} store={storeForUser(await storeInfoChecked(), user)} rates={rates} book={book}>
      {children}
    </HqProvider>
  );
}
