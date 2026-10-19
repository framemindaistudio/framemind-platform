/**
 * Releases and permissions for shoots: a model release (an adult, or a minor with a parent or guardian), a location
 * release for a property, and a drone flight permission from the owner or institution.
 * Every release names the client the footage is made for, because the client uses it — the studio shows it only in
 * its portfolio, and only where the release allows.
 */
import { b, brand, companyIntro, dateOf, docDate, fill, line, or, partySign, plain, studioSign, val } from "../text";
import type { SignField, SignTemplate } from "../types";
import { hello, otherSign, partyIntro, tidy } from "./shared";

const FOR_CLIENT: SignField = { key: "client", label: "Client the shoot is for", kind: "text", from: "client.name", required: true, half: true };
const SHOOT: SignField = { key: "shoot", label: "Shoot / project", kind: "text", from: "project.title", required: true, half: true };
const SHOOT_DATE: SignField = { key: "date", label: "Shoot date", kind: "date", half: true };

/* ───────────────────────────── 1 · model release ───────────────────────────── */

export const modelRelease: SignTemplate = {
  id: "model-release",
  version: "1.0",
  title: "Model Release",
  name: "Model release",
  group: "releases",
  kind: "declaration",
  parties: ["other", "team"],
  signs: "party",
  blurb: "A person photographed or filmed at a shoot (or, for a minor, their parent or guardian) allows the client and FrameMind to use the images, with tick boxes for what is allowed.",
  when: "On the shoot day, before the person is photographed or filmed",
  series: "REL",
  source: "14_LEGAL/06_Media_Releases.md",
  keep: "As long as the media is used + 3 years",
  scanNote: "A release for a minor is personal data of a child: keep the scan in the File Vault's signed folder only.",
  lawyer: [
    "No fee is paid under this release. If talent is paid, record the fee and add it to the release.",
    "A minor's release is signed by a parent or guardian: verifiable parental consent under the Digital Personal Data Protection Act, 2023.",
    "Use in paid advertising (billboards, broadcast) needs the extended-licence tick and, for professional talent, usually a separate fee.",
  ],
  fields: [FOR_CLIENT, SHOOT, SHOOT_DATE, { key: "minor", label: "The person is under 18", kind: "select", default: "no", half: true, options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes — a parent or guardian signs" }] }, { key: "personName", label: "Name of the person photographed", kind: "text", half: true }],
  build(ctx) {
    const J = brand(ctx);
    const minor = val(ctx, "minor") === "yes";
    const who = or(val(ctx, "personName") || ctx.party.name, 60);
    return [
      { t: "title", text: "Model Release", sub: "Permission to photograph and film a person and to use the images" },
      {
        t: "p",
        text: `${minor ? `I am the parent or guardian of ${b(who)}, who is under 18, and I` : `I, ${b(who)},`} allow ${companyIntro(ctx)} ("${b(J)}") to photograph, film and record ${minor ? "them" : "me"} at the shoot for ${b(fill(ctx, "client", 50))} (${tidy(ctx, "shoot", 50)}) on ${dateOf(ctx, "date")}, and allow ${b(fill(ctx, "client", 40))} and ${J} to use the images as ticked below.`,
      },
      { t: "p", text: "Tick each one you allow:" },
      {
        t: "checks",
        items: [
          "Photographs",
          "Video and recorded voice",
          `Use by ${val(ctx, "client") || "the client"} on its website, social media and marketing`,
          "Use in paid advertising (online ads, print, billboards, broadcast)",
          `Use by ${J} in its own portfolio and social media`,
          minor ? "Their first name in captions" : "My name in captions",
        ],
      },
      {
        t: "list",
        items: [
          "Images may be edited, cropped, colour-graded and combined with other material, but never in a way that is false, offensive or makes the person appear to say something they did not.",
          "No images will be used to train an AI model or to create a synthetic likeness without separate written consent.",
          "No payment is due for this use, unless a fee is written here.",
          `This permission may be withdrawn for future use by writing to ${J}; what is already printed, published or delivered cannot be recalled.`,
        ],
      },
      { t: "fields", cols: 2, rows: [["Phone or email", ""], ["Fee (if any)", ""]] },
      { t: "sign", blocks: [partySign(ctx, minor ? "Parent / guardian" : "Signature", { title: "", lines: ["Date"] })] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.name)}, thank you for being part of the shoot for ${fill(ctx, "client", 20)}. Please tick what you're happy with on the attached release and sign it.`);
  },
};

/* ───────────────────────────── 2 · location release ───────────────────────────── */

export const locationRelease: SignTemplate = {
  id: "location-release",
  version: "1.0",
  title: "Location Release",
  name: "Location release",
  group: "releases",
  kind: "agreement",
  parties: ["other", "client", "vendor"],
  signs: "both",
  blurb: "The owner or manager of a property allows a shoot there: dates, hours, areas, any fee, care of the property and use of the footage.",
  when: "Before a shoot at a property the client does not own",
  series: "REL",
  source: "14_LEGAL/06_Media_Releases.md",
  keep: "As long as the media is used + 3 years",
  lawyer: ["Check that the person signing has authority over the property (owner, manager, society secretary)."],
  fields: [FOR_CLIENT, SHOOT, { key: "address", label: "Property address", kind: "textarea", required: true }, SHOOT_DATE, { key: "hours", label: "Hours on site", kind: "text", placeholder: "8:00 am to 6:00 pm", half: true }, { key: "areas", label: "Areas that may be used", kind: "text", placeholder: "Lobby, terrace and the conference room", half: true }, { key: "fee", label: "Location fee (optional)", kind: "text", half: true }],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Location Release" },
      { t: "p", text: `This release is given on ${b(docDate(ctx))} by ${partyIntro(ctx)} (the "${b("Owner")}") to ${companyIntro(ctx)} ("${b(J)}"), for a shoot for ${b(fill(ctx, "client", 50))}.` },
      {
        t: "table",
        widths: [30, 70],
        rows: [
          ["Property", fill(ctx, "address", 80)],
          ["Date", dateOf(ctx, "date")],
          ["Hours", fill(ctx, "hours", 40)],
          ["Areas", fill(ctx, "areas", 60)],
          ["Fee", val(ctx, "fee") || (ctx.blank ? `₹ ${line(30)}` : "None")],
        ],
      },
      {
        t: "list",
        items: [
          `The Owner allows ${J}'s crew to bring equipment, set up lights and photograph, film and record the property on the date and in the areas above.`,
          `${J} takes reasonable care of the property, leaves it as it found it, and makes good any damage its crew causes.`,
          `${val(ctx, "client") || "The client"} and ${J} may use the photographs and footage of the property in any media, without naming the property unless the Owner agrees.`,
        ],
      },
      { t: "sign", blocks: [otherSign(ctx, "For the Owner", false), ...studioSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, thank you for letting us shoot at your property on ${dateOf(ctx, "date")}. The attached release sets out the date, the areas and our promise to leave it as we found it. Please sign and send it back.`);
  },
};

/* ───────────────────────────── 3 · drone flight permission ───────────────────────────── */

export const dronePermission: SignTemplate = {
  id: "drone-permission",
  version: "1.0",
  title: "Drone Flight Permission",
  name: "Drone permission",
  group: "releases",
  kind: "agreement",
  parties: ["other", "client"],
  signs: "both",
  blurb: "The owner or institution allows drone photography over its property: date, area, height and safety terms, under the Drone Rules, 2021.",
  when: "Before any drone shoot over private property or a campus",
  series: "REL",
  source: "07_PHOTO_VIDEO/04_Drone_Operations.md",
  keep: "As long as the media is used + 3 years",
  lawyer: [
    "The Drone Rules, 2021 and the Digital Sky airspace map: check the zone (green, yellow, red) for the location before the shoot; this permission does not replace airspace permission.",
    "Drone registration (UIN) and the remote pilot certificate must be valid: fill them in the boxes.",
  ],
  fields: [FOR_CLIENT, SHOOT, { key: "address", label: "Property / campus", kind: "textarea", required: true }, SHOOT_DATE, { key: "pilot", label: "Remote pilot", kind: "text", half: true }, { key: "uin", label: "Drone UIN / registration", kind: "text", half: true }, { key: "height", label: "Maximum height (metres)", kind: "number", default: "60", half: true }],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Drone Flight Permission" },
      { t: "p", text: `${partyIntro(ctx)} (the "${b("Owner")}") permits ${companyIntro(ctx)} ("${b(J)}") to fly a drone over the property below for a shoot for ${b(fill(ctx, "client", 50))}.` },
      {
        t: "table",
        widths: [30, 70],
        rows: [
          ["Property", fill(ctx, "address", 80)],
          ["Date", dateOf(ctx, "date")],
          ["Remote pilot", fill(ctx, "pilot", 50)],
          ["Drone UIN", fill(ctx, "uin", 40)],
          ["Maximum height", `${fill(ctx, "height", 10)} metres above ground`],
        ],
      },
      {
        t: "list",
        items: [
          `${J} flies only in the airspace zone the Digital Sky map allows for the location, with a registered drone and a certified remote pilot, and in daylight and safe weather.`,
          "The drone does not fly directly over gatherings of people, and the take-off area is kept clear. The flight stops at once if the Owner's representative asks.",
          `${J} is responsible for damage its drone causes.`,
          `The aerial footage may be used by ${val(ctx, "client") || "the client"} and by ${J} in its portfolio.`,
        ],
      },
      { t: "sign", blocks: [otherSign(ctx, "For the Owner", true), ...studioSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, for the aerial shots on ${dateOf(ctx, "date")} we need your written permission to fly over the property. The attached letter sets out the area, height and safety rules we follow. Please sign and send it back.`);
  },
};

export const RELEASE_DOCS: SignTemplate[] = [modelRelease, locationRelease, dronePermission];
