"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/primitives";

/** Big enough to stay sharp at 1200px, small enough to sit in a database row. */
const MAX_SIDE = 1500;
const QUALITY = 0.82;

/**
 * The optional photo for a Journey card.
 *
 * Downscaling happens here, in the browser, before anything is uploaded: a
 * modern phone photo is 4-8MB and none of that survives being rendered into a
 * 1200px card. What leaves the device is a re-encoded JPEG a fraction of the
 * size, stripped of the original file's metadata as a side effect of being
 * redrawn.
 */
export function PhotoPicker({
  hasPhoto,
  onPicked,
  onCleared,
  onUpload,
}: {
  hasPhoto: boolean;
  onPicked: (id: string) => void;
  onCleared: () => void;
  onUpload: (input: {
    dataUrl: string;
    width: number;
    height: number;
  }) => Promise<{ ok: true; id: string } | { ok: false; message: string }>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    setBusy(true);
    setError(null);
    try {
      const shrunk = await shrink(file);
      const result = await onUpload(shrunk);
      if (result.ok) onPicked(result.id);
      else setError(result.message);
    } catch {
      setError("That image couldn't be read. Try another one.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <section>
      <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
        Your photo
      </p>
      <div className="card grid gap-3 p-4">
        <p className="text-sm leading-relaxed text-charcoal-500">
          A Journey card can be built around a photo of your own — your jar, your
          morning glass, wherever you take it. It becomes part of the card, so it
          goes wherever you post the card.
        </p>

        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handle(file);
          }}
        />

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? "Adding…" : hasPhoto ? "Choose another" : "Add a photo"}
          </Button>
          {hasPhoto ? (
            <Button variant="ghost" onClick={onCleared}>
              Remove
            </Button>
          ) : null}
        </div>

        {error ? <p className="text-sm font-bold text-cayenne-700">{error}</p> : null}
      </div>
    </section>
  );
}

/** Redraws the photo at card size and re-encodes it as a JPEG. */
async function shrink(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return { dataUrl: canvas.toDataURL("image/jpeg", QUALITY), width, height };
}
