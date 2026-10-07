import { authorEntries, urlsetXml, xmlResponse } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return xmlResponse(urlsetXml(authorEntries()));
}
