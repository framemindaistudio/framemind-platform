"use client";

import { useMemo, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Modal } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { sendJson } from "./hooks";
import { allFolders, docDate, docTemplate, nodeTitle, numberedFileName, OPS_ROOT, type TreeNode } from "./lib";

/** Create a new Markdown document with the standard FrameMind header in any library folder. */
export function NewDocModal({
  open,
  onClose,
  root,
  index,
  defaultFolder,
  ownerDefault,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  root: TreeNode;
  index: Map<string, TreeNode>;
  defaultFolder: string;
  ownerDefault: string;
  onCreated: (path: string) => void;
}) {
  const folders = useMemo(() => allFolders(root), [root]);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState(defaultFolder);
  const [owner, setOwner] = useState(ownerDefault);
  const [appliesTo, setAppliesTo] = useState("All team");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = index.get(folder);
  const fileName = numberedFileName(title, target);
  const exists = !!fileName && !!target?.children.some((c) => c.name.toLowerCase() === fileName.toLowerCase());

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || exists) return;
    setBusy(true);
    setError(null);
    const path = `${folder}/${fileName}`;
    const res = await sendJson("/api/hq/docs", "PUT", {
      path,
      content: docTemplate({ title: title.trim(), owner: owner.trim(), appliesTo: appliesTo.trim(), date: docDate() }),
      message: `Add ${fileName}`,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not create the document");
      return;
    }
    setTitle("");
    onCreated(path);
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="New document"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} type="button">
            Cancel
          </Button>
          <Button size="sm" type="submit" form="new-doc-form" disabled={busy || !fileName || exists}>
            <FilePlus2 className="size-4" /> {busy ? "Creating…" : "Create & start writing"}
          </Button>
        </>
      }
    >
      <form id="new-doc-form" onSubmit={create} className="space-y-4">
        <Field label="Title" htmlFor="nd-title" required>
          <Input id="nd-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rainy Day Shoot Contingency" autoFocus maxLength={90} required />
        </Field>
        <Field label="Folder" htmlFor="nd-folder">
          <Select id="nd-folder" value={folder} onChange={(e) => setFolder(e.target.value)}>
            {folders.map((f) => (
              <option key={f.path} value={f.path}>
                {f.path === OPS_ROOT ? "Operations (top level)" : f.path.replace(`${OPS_ROOT}/`, "").split("/").map((s) => nodeTitle({ name: s, type: "dir", path: s })).join(" / ")}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner" htmlFor="nd-owner" help="Who keeps this up to date">
            <Input id="nd-owner" value={owner} onChange={(e) => setOwner(e.target.value)} maxLength={60} />
          </Field>
          <Field label="Applies to" htmlFor="nd-applies" help="Who should follow it">
            <Input id="nd-applies" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)} maxLength={60} />
          </Field>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 bg-paper-100/60 px-3 py-2.5 text-xs text-charcoal">
          File name: <span className="break-all font-mono text-graphite">{fileName || "—"}</span>
          <br />
          <span className="text-blueprint">Numbered after the last document in the folder, spaces become underscores.</span>
          {exists && <p className="mt-1 font-semibold text-bad">A document with this name already exists in that folder.</p>}
        </div>
        {error && (
          <p role="alert" className="rounded-[var(--radius-sm)] border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
