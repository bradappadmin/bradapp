import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import * as api from "../api";
import type { CueCard, ReviewCarModel } from "../api";
import { useAuth } from "../auth-context";
import { SiteHeader } from "../components/SiteHeader";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

function pickMimeType(): string {
  const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

export function RecordReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [models, setModels] = useState<ReviewCarModel[]>([]);
  const [carModelId, setCarModelId] = useState<number | "">("");
  const [cues, setCues] = useState<CueCard[]>([]);
  const [activeCue, setActiveCue] = useState(0);
  const [title, setTitle] = useState("");
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdmin(user.role)) return;
    void api.fetchReviewModels().then((res) => {
      setModels(res.models);
      if (res.models[0]) setCarModelId(res.models[0].id);
    });
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (carModelId === "") return;
    void api.fetchCueCards(carModelId).then((res) => {
      setCues(res.cueCards);
      setActiveCue(0);
      if (!title) {
        setTitle(`${res.car.make} ${res.car.model} bay review`);
      }
    });
  }, [carModelId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }
  if (user && !isAdmin(user.role)) {
    return <Navigate to="/reviews" replace />;
  }

  async function startRecording() {
    setError(null);
    setBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        const recorded = new Blob(chunksRef.current, { type: mimeType });
        setBlob(recorded);
        setPreviewUrl(URL.createObjectURL(recorded));
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera/mic permission failed");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function onPublish() {
    if (!blob || carModelId === "" || !title.trim()) {
      setError("Record a clip, pick a car, and add a title.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.publishReview({
        carModelId,
        title: title.trim(),
        video: blob,
        filename: "review.webm",
      });
      navigate(`/reviews/${res.review.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  const cue = cues[activeCue];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/reviews" className="text-sm text-lime no-underline hover:underline">
          ← Reviews
        </Link>
        <div className="bay-rise mt-6">
          <h1 className="font-display text-3xl font-semibold text-white">Record a review</h1>
          <p className="mt-2 text-sm text-steel">
            Cue cards come from the selected car. Publish stores the file on disk with a database row.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <video
              ref={videoRef}
              className="aspect-video w-full rounded-md border border-white/10 bg-black object-cover"
              muted={recording}
              playsInline
              controls={Boolean(previewUrl) && !recording}
              src={previewUrl ?? undefined}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {!recording ? (
                <button
                  type="button"
                  onClick={() => void startRecording()}
                  className="rounded-md bg-rose px-4 py-2 font-display text-sm font-semibold text-white"
                >
                  {blob ? "Re-record" : "Start recording"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-md border border-lime/40 px-4 py-2 font-display text-sm font-semibold text-lime"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Car
              <select
                className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                value={carModelId}
                onChange={(e) => setCarModelId(Number(e.target.value))}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Title
              <input
                className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="rounded-md border border-white/10 bg-bay-panel/60 p-4">
              <p className="text-xs uppercase tracking-wide text-steel">
                Cue {activeCue + 1} / {Math.max(cues.length, 1)}
              </p>
              <p className="mt-2 font-display text-lg text-white">{cue?.title ?? "…"}</p>
              <p className="mt-2 text-sm text-mist">{cue?.prompt ?? "Pick a car to load cues."}</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={activeCue <= 0}
                  onClick={() => setActiveCue((n) => Math.max(0, n - 1))}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={activeCue >= cues.length - 1}
                  onClick={() => setActiveCue((n) => Math.min(cues.length - 1, n + 1))}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={busy || !blob}
              onClick={() => void onPublish()}
              className="bay-cta rounded-md bg-rose px-4 py-3 font-display text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Publishing…" : "Publish review"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
      </main>
    </div>
  );
}
