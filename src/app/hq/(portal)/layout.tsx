import { requireUser } from "@/lib/hq/auth";
import { storeInfoChecked } from "@/lib/store";
import { storeForUser } from "@/lib/hq/access";
import { bookForRole, readPriceBook, startingBook } from "@/lib/hq/pricebook";
import { HqShell } from "@/components/hq/HqShell";

export const dynamic = "force-dynamic";

/** Every HQ module page renders inside the authenticated shell. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // the rates go to everyone who quotes, costs and targets only to the roles that see Finance; a store that cannot be read must not take the portal down
  const { rates, book } = bookForRole(user.role, (await readPriceBook().catch(() => null))?.book ?? startingBook());
  return (
    <HqShell user={user} store={storeForUser(await storeInfoChecked(), user)} rates={rates} book={book}>
      {children}
    </HqShell>
  );
}
