import Careers from "@/site/pages/Careers";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/careers");

type Params = Record<string, string | string[] | undefined>;

/** /careers · ?role=<id> preselects a role in the application form. */
export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const role = (await searchParams).role;
  return <Careers initialRole={(Array.isArray(role) ? role[0] : role) ?? ""} />;
}
