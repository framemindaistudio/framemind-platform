import Script from "next/script";

/**
 * Google Analytics 4 for the public website only (it is rendered by the (site) layout, so HQ, papers to sign and
 * certificate checks are never measured). Page changes between site pages are counted by GA4's enhanced measurement
 * ("page changes based on browser history events"), so no extra code runs on navigation.
 * NEXT_PUBLIC_GA_ID overrides the stream's ID; set it to "off" to switch measuring off.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || "G-NY0SV0RT9P";

export function Analytics() {
  if (GA_ID === "off" || process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
