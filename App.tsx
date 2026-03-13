import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, PhotoType } from "./backend";
import { useActor } from "./hooks/useActor";

/* ─── Static star data (generated once, stable keys) ─── */
function makeStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `star-${i}`,
    w: (1 + ((i * 7) % 3)).toFixed(1),
    left: `${(i * 37 + 13) % 97}%`,
    top: `${(i * 53 + 7) % 93}%`,
    opacity: 0.3 + (i % 7) / 10,
    animDur: `${1.5 + ((i * 3) % 3)}s`,
    animDelay: `${(i * 0.4) % 4}s`,
  }));
}

const _STARS_60 = makeStars(60);
const STARS_80 = makeStars(80);

/* ─── Static sparkle configs ─── */
interface SparkleConfig {
  id: string;
  x: string;
  y: string;
  delay: string;
  dur: string;
  sz: string;
  dx: string;
  symbol: string;
}

function makeSparkles(count: number): SparkleConfig[] {
  const symbols = ["✦", "✺", "⋆", "✧", "★", "✴"];
  return Array.from({ length: count }, (_, i) => ({
    id: `sp-${i}`,
    x: `${(i * 41 + 5) % 95}%`,
    y: `${(i * 67 + 11) % 88}%`,
    delay: `${((i * 0.7) % 5).toFixed(2)}s`,
    dur: `${(3 + ((i * 0.9) % 4)).toFixed(2)}s`,
    sz: `${8 + (i % 10)}px`,
    dx: `${(i % 40) - 20}px`,
    symbol: symbols[i % symbols.length],
  }));
}

const SPARKLES_NORMAL = makeSparkles(22);
const SPARKLES_DENSE = makeSparkles(38);

interface SparkleLayerProps {
  dense?: boolean;
  dark?: boolean;
}

function SparkleLayer({ dense = false, dark = false }: SparkleLayerProps) {
  const particles = dense ? SPARKLES_DENSE : SPARKLES_NORMAL;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((s) => (
        <span
          key={s.id}
          className="star-particle"
          style={
            {
              left: s.x,
              top: s.y,
              "--delay": s.delay,
              "--dur": s.dur,
              "--sz": s.sz,
              "--dx": s.dx,
              color: dark ? "#f0d060" : "#d4af37",
            } as React.CSSProperties
          }
        >
          {s.symbol}
        </span>
      ))}
    </div>
  );
}

/* ─── Heart decorations for Screen4 ─── */
const HEARTS = [
  {
    id: "h1",
    top: "8%",
    left: "5%",
    right: undefined,
    bottom: undefined,
    size: "2rem",
    delay: "0s",
  },
  {
    id: "h2",
    top: "15%",
    left: undefined,
    right: "8%",
    bottom: undefined,
    size: "1.5rem",
    delay: "0.5s",
  },
  {
    id: "h3",
    top: undefined,
    left: "8%",
    right: undefined,
    bottom: "20%",
    size: "1.8rem",
    delay: "1s",
  },
  {
    id: "h4",
    top: undefined,
    left: undefined,
    right: "6%",
    bottom: "12%",
    size: "2.2rem",
    delay: "1.5s",
  },
  {
    id: "h5",
    top: "40%",
    left: "2%",
    right: undefined,
    bottom: undefined,
    size: "1.2rem",
    delay: "0.8s",
  },
  {
    id: "h6",
    top: "60%",
    left: undefined,
    right: "3%",
    bottom: undefined,
    size: "1.4rem",
    delay: "1.2s",
  },
] as const;

/* ─── Photo Upload Hook ─── */
function usePhotoUpload(photoType: PhotoType) {
  const { actor, isFetching } = useActor();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor.getPhoto(photoType).then((photo) => {
      if (photo) {
        photo.blob.getBytes().then((bytes) => {
          const url = URL.createObjectURL(new Blob([bytes]));
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = url;
          setPhotoUrl(url);
        });
      }
    });
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [actor, isFetching, photoType]);

  const upload = useCallback(
    async (file: File) => {
      if (!actor) return;
      setUploading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(bytes);
        await actor.uploadPhoto(photoType, blob);
        const url = URL.createObjectURL(file);
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = url;
        setPhotoUrl(url);
        toast.success("Photo uploaded successfully ✨");
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [actor, photoType],
  );

  return { photoUrl, upload, uploading };
}

/* ─── Shared "continue" button style ─── */
function ContinueButton({
  onClick,
  label = "Click to continue →",
  light = false,
}: {
  onClick: () => void;
  label?: string;
  light?: boolean;
}) {
  return (
    <button
      type="button"
      className="mt-5 z-20 fade-in-up"
      onClick={onClick}
      data-ocid="card.next_button"
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: "italic",
        color: light ? "#d4af37" : "#0d1b5e",
        opacity: 0.75,
        fontSize: "14px",
        letterSpacing: "0.1em",
        background: "none",
        border: "none",
        cursor: "pointer",
        animationDelay: "0.8s",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Vintage Paper with Border ─── */
function VintagePaper({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Allow callers to override border-radius (e.g. Screen1 uses borderRadius: 0)
  const outerRadius =
    style.borderRadius !== undefined ? style.borderRadius : "16px";
  const innerRadius =
    outerRadius === 0 || outerRadius === "0" || outerRadius === "0px"
      ? "0px"
      : "13px";

  // Props that belong on the outer sizing wrapper (not inner content div)
  const {
    borderRadius: _br,
    padding: _p,
    overflow: _ov,
    display: _d,
    flexDirection: _fd,
    alignItems: _ai,
    ...outerStyle
  } = style;

  // Props that belong on the inner content wrapper
  const innerStyle: React.CSSProperties = {
    border: "1px solid rgba(26, 58, 184, 0.35)",
    borderRadius: innerRadius,
    width: "100%",
    height: "100%",
    display: style.display ?? "flex",
    flexDirection:
      (style.flexDirection as React.CSSProperties["flexDirection"]) ?? "column",
    ...(style.alignItems ? { alignItems: style.alignItems } : {}),
    ...(style.overflow ? { overflow: style.overflow } : {}),
    ...(style.padding ? { padding: style.padding } : { padding: "0" }),
  };

  return (
    <div
      className={`relative vintage-paper w-full mx-auto ${className}`}
      style={{
        border: "2px solid #1a3ab8",
        borderRadius: outerRadius,
        padding: "3px",
        ...outerStyle,
      }}
    >
      <div style={innerStyle}>{children}</div>
    </div>
  );
}

/* ─── Screen 0: Sealed Envelope (full-screen CSS envelope) ─── */
interface Screen0Props {
  onOpen: () => void;
}

function Screen0({ onOpen }: Screen0Props) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(onOpen, 900);
  };

  return (
    <button
      type="button"
      className="relative w-full h-full overflow-hidden select-none p-0 border-0"
      data-ocid="envelope.open_button"
      style={{
        background:
          "linear-gradient(160deg, #cce8f7 0%, #a8d8f0 40%, #7ab8d8 100%)",
        cursor: animating ? "default" : "pointer",
      }}
      onClick={handleClick}
      aria-label="Open birthday card"
    >
      <SparkleLayer />

      {/* ── Bottom V-flap (decorative) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <svg
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
          aria-hidden="true"
          role="presentation"
        >
          <polygon
            points="0,50 50,0 100,50"
            fill="rgba(106,168,209,0.55)"
            stroke="rgba(13,27,94,0.12)"
            strokeWidth="0.3"
          />
          <polygon
            points="0,0 50,50 0,50"
            fill="rgba(120,178,220,0.4)"
            stroke="rgba(13,27,94,0.10)"
            strokeWidth="0.3"
          />
          <polygon
            points="100,0 50,50 100,50"
            fill="rgba(100,160,205,0.4)"
            stroke="rgba(13,27,94,0.10)"
            strokeWidth="0.3"
          />
        </svg>
      </div>

      {/* ── Top flap triangle (pointing down) — seal area ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          zIndex: animating ? 3 : 5,
          transformOrigin: "top center",
          perspective: "900px",
          filter: animating
            ? "drop-shadow(0 0 40px rgba(212,175,55,0.8))"
            : undefined,
          transition: "filter 0.4s ease",
        }}
        className={animating ? "envelope-flap-opening" : ""}
      >
        <svg
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
          aria-hidden="true"
          role="presentation"
        >
          <polygon
            points="0,0 100,0 50,50"
            fill="#90c8e8"
            stroke="rgba(13,27,94,0.15)"
            strokeWidth="0.4"
          />
        </svg>

        {/* ── Wax seal centered on flap ── */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
        >
          <div
            className={!animating ? "wax-glow" : ""}
            style={{
              width: "clamp(64px, 10vw, 96px)",
              height: "clamp(64px, 10vw, 96px)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 35%, #2a3a9a 0%, #0d1b5e 60%, #060e3a 100%)",
              border: "2px solid #d4af37",
              boxShadow:
                "0 4px 20px rgba(13,27,94,0.5), 0 0 24px rgba(212,175,55,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              viewBox="0 0 40 40"
              style={{
                width: "62%",
                height: "62%",
                fill: "none",
                stroke: "#d4af37",
                strokeWidth: "1.5",
                strokeLinecap: "round",
              }}
              aria-hidden="true"
              role="presentation"
            >
              <circle cx="20" cy="20" r="6" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 20 + Math.cos(rad) * 9;
                const y1 = 20 + Math.sin(rad) * 9;
                const x2 = 20 + Math.cos(rad) * 14;
                const y2 = 20 + Math.sin(rad) * 14;
                if (idx % 2 === 0) {
                  return (
                    <line
                      key={angle}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#d4af37"
                      strokeWidth="1.5"
                    />
                  );
                }
                const mx = 20 + Math.cos(rad) * 11.5;
                const my = 20 + Math.sin(rad) * 11.5;
                const perpRad = rad + Math.PI / 2;
                const cx1 = mx + Math.cos(perpRad) * 1.5;
                const cy1 = my + Math.sin(perpRad) * 1.5;
                return (
                  <path
                    key={angle}
                    d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
                    stroke="#d4af37"
                    strokeWidth="1.2"
                    fill="none"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* ── "Tap to open" prompt at bottom ── */}
      {!animating && (
        <div
          style={{
            position: "absolute",
            bottom: "6%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <p
            className="pulse-glow"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              color: "#d4af37",
              fontSize: "clamp(14px, 2.5vw, 20px)",
              letterSpacing: "0.12em",
            }}
          >
            Tap to open ✨
          </p>
        </div>
      )}
    </button>
  );
}

/* ─── Screen 1: Happy Birthday — Phone Envelope ─── */
interface Screen1Props {
  onNext: () => void;
}

function Screen1({ onNext }: Screen1Props) {
  const [opened, setOpened] = useState(false);
  const [showPaper, setShowPaper] = useState(false);

  const handleEnvelopeClick = () => {
    if (opened) return;
    setOpened(true);
    // After flap fully opens (1.8s), reveal paper
    setTimeout(() => setShowPaper(true), 1800);
  };

  return (
    <div
      className="relative w-full h-full sky-bg flex items-center justify-center overflow-hidden"
      data-ocid="page.section"
    >
      <SparkleLayer />

      {/* Phone-ratio envelope wrapper — 9:16 portrait */}
      <div
        style={{
          position: "relative",
          height: "100%",
          maxHeight: "100vh",
          aspectRatio: "9 / 16",
          maxWidth: "calc(100vh * 9 / 16)",
          width: "100%",
          cursor: opened ? "default" : "pointer",
          overflow: "hidden",
        }}
        onClick={!opened ? handleEnvelopeClick : undefined}
        data-ocid="envelope.open_button"
        role={!opened ? "button" : undefined}
        aria-label={!opened ? "Open birthday card" : undefined}
        tabIndex={!opened ? 0 : undefined}
        onKeyDown={
          !opened
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") handleEnvelopeClick();
              }
            : undefined
        }
      >
        {/* ── Envelope body (sky blue gradient fills entire area) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg, #cce8f7 0%, #a8d8f0 40%, #7ab8d8 100%)",
            zIndex: 0,
          }}
        />

        {/* ── Envelope V-shaped inner flap lines (decorative bottom triangle) ── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block" }}
            aria-hidden="true"
            role="presentation"
          >
            {/* bottom flap triangle */}
            <polygon
              points="0,50 50,0 100,50"
              fill="rgba(106,168,209,0.55)"
              stroke="rgba(13,27,94,0.12)"
              strokeWidth="0.3"
            />
            {/* left side flap */}
            <polygon
              points="0,0 50,50 0,50"
              fill="rgba(120,178,220,0.4)"
              stroke="rgba(13,27,94,0.10)"
              strokeWidth="0.3"
            />
            {/* right side flap */}
            <polygon
              points="100,0 50,50 100,50"
              fill="rgba(100,160,205,0.4)"
              stroke="rgba(13,27,94,0.10)"
              strokeWidth="0.3"
            />
          </svg>
        </div>

        {/* ── Top flap (triangle pointing down — the seal flap) ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            zIndex: opened ? 3 : 5,
            transformOrigin: "top center",
            perspective: "900px",
          }}
          className={opened ? "envelope-flap-opening" : ""}
        >
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block" }}
            aria-hidden="true"
            role="presentation"
          >
            {/* top flap triangle (points down) */}
            <polygon
              points="0,0 100,0 50,50"
              fill="#90c8e8"
              stroke="rgba(13,27,94,0.15)"
              strokeWidth="0.4"
            />
          </svg>

          {/* ── Wax seal on flap ── */}
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          >
            {/* Outer glow ring */}
            <div
              className={!opened ? "wax-glow" : ""}
              style={{
                width: "clamp(52px, 9%, 80px)",
                height: "clamp(52px, 9%, 80px)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 40% 35%, #2a3a9a 0%, #0d1b5e 60%, #060e3a 100%)",
                border: "2px solid #d4af37",
                boxShadow:
                  "0 4px 16px rgba(13,27,94,0.5), 0 0 20px rgba(212,175,55,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Sun icon inside seal */}
              <svg
                viewBox="0 0 40 40"
                style={{
                  width: "60%",
                  height: "60%",
                  fill: "none",
                  stroke: "#d4af37",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                }}
                aria-hidden="true"
                role="presentation"
              >
                <circle cx="20" cy="20" r="6" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 20 + Math.cos(rad) * 9;
                  const y1 = 20 + Math.sin(rad) * 9;
                  const x2 = 20 + Math.cos(rad) * 14;
                  const y2 = 20 + Math.sin(rad) * 14;
                  if (idx % 2 === 0) {
                    // Straight ray
                    return (
                      <line
                        key={angle}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#d4af37"
                        strokeWidth="1.5"
                      />
                    );
                  }
                  // Wavy ray (simulate with slightly curved path)
                  const mx = 20 + Math.cos(rad) * 11.5;
                  const my = 20 + Math.sin(rad) * 11.5;
                  const perpRad = rad + Math.PI / 2;
                  const cx1 = mx + Math.cos(perpRad) * 1.5;
                  const cy1 = my + Math.sin(perpRad) * 1.5;
                  return (
                    <path
                      key={angle}
                      d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
                      stroke="#d4af37"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* ── Tap prompt (hidden once opened) ── */}
        {!opened && (
          <div
            style={{
              position: "absolute",
              bottom: "8%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <p
              className="pulse-glow"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                color: "#0d1b5e",
                fontSize: "clamp(11px, 2.5vw, 15px)",
                letterSpacing: "0.1em",
                opacity: 0.75,
              }}
            >
              Tap to open ✨
            </p>
          </div>
        )}

        {/* ── Vintage paper sliding up from inside the envelope ── */}
        {showPaper && (
          <div
            className="paper-reveal"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              overflow: "hidden",
            }}
          >
            <VintagePaper
              style={{
                height: "100%",
                borderRadius: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                padding: "clamp(16px, 5%, 32px) clamp(14px, 4%, 28px)",
              }}
            >
              <div
                className="flex flex-col items-center text-center"
                style={{ flex: 1, overflow: "hidden" }}
              >
                {/* Date */}
                <p
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: "#0d1b5e",
                    fontSize: "clamp(9px, 2vw, 12px)",
                    letterSpacing: "0.25em",
                    marginBottom: "clamp(6px, 2%, 14px)",
                  }}
                >
                  12.04.2026
                </p>

                {/* Happy Birthday */}
                <h1
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "clamp(1.6rem, 6vw, 3rem)",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "#0d1b5e",
                    lineHeight: 1.2,
                    marginBottom: "0.15em",
                    textShadow: "0 2px 8px rgba(13,27,94,0.15)",
                  }}
                >
                  Happy Birthday
                </h1>
                <h1
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "clamp(2rem, 7.5vw, 3.6rem)",
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: "#0d1b5e",
                    lineHeight: 1.1,
                    marginBottom: "clamp(8px, 2.5%, 18px)",
                    textShadow: "0 2px 12px rgba(13,27,94,0.2)",
                  }}
                >
                  Pasha
                </h1>

                {/* Gold divider */}
                <div
                  className="flex items-center gap-2"
                  style={{ marginBottom: "clamp(8px, 2.5%, 18px)" }}
                >
                  <div
                    style={{
                      height: "1px",
                      width: "clamp(30px, 8%, 60px)",
                      background:
                        "linear-gradient(to right, transparent, #d4af37)",
                    }}
                  />
                  <span
                    style={{
                      color: "#d4af37",
                      fontSize: "clamp(12px, 3vw, 18px)",
                    }}
                  >
                    ✦
                  </span>
                  <div
                    style={{
                      height: "1px",
                      width: "clamp(30px, 8%, 60px)",
                      background:
                        "linear-gradient(to left, transparent, #d4af37)",
                    }}
                  />
                </div>

                {/* Illustrations row */}
                <div
                  className="flex justify-between items-end w-full"
                  style={{ flex: 1, minHeight: 0 }}
                >
                  <div
                    className="float-anim"
                    style={{
                      transform: "rotate(-10deg)",
                      transformOrigin: "bottom center",
                    }}
                  >
                    <img
                      src="/assets/generated/cake-illustration-transparent.dim_300x400.png"
                      alt="Birthday cake"
                      style={{
                        height: "clamp(70px, 22%, 130px)",
                        width: "auto",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      color: "#d4af37",
                      fontSize: "clamp(12px, 3vw, 18px)",
                      opacity: 0.7,
                    }}
                  >
                    ✦ ✧ ✦
                  </div>

                  <div
                    className="float-anim"
                    style={{
                      transform: "rotate(10deg)",
                      transformOrigin: "bottom center",
                      animationDelay: "1s",
                    }}
                  >
                    <img
                      src="/assets/generated/bouquet-illustration-transparent.dim_300x400.png"
                      alt="Flower bouquet"
                      style={{
                        height: "clamp(70px, 22%, 130px)",
                        width: "auto",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                </div>

                {/* Continue button */}
                <div
                  style={{
                    marginTop: "clamp(8px, 2%, 16px)",
                    paddingBottom: "4px",
                  }}
                >
                  <ContinueButton onClick={onNext} />
                </div>
              </div>
            </VintagePaper>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Screen 2: Dear Pasha Letter ─── */
interface Screen2Props {
  onNext: () => void;
}

function Screen2({ onNext }: Screen2Props) {
  const { photoUrl, upload, uploading } = usePhotoUpload(PhotoType.portrait);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await upload(file);
  };

  return (
    <div
      className="relative w-full h-full sky-bg flex flex-col items-center justify-center overflow-auto p-4"
      data-ocid="page.section"
    >
      <SparkleLayer />

      <VintagePaper
        className="max-w-4xl"
        style={{ padding: "2rem 2.5rem", minHeight: "420px" }}
      >
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Photo Upload */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <button
              type="button"
              className="relative rounded-lg overflow-hidden cursor-pointer group p-0 border-0"
              style={{
                width: "180px",
                height: "230px",
                border: "3px solid #d4af37",
                boxShadow:
                  "0 4px 16px rgba(13,27,94,0.2), 0 0 12px rgba(212,175,55,0.2)",
                background: "#f0e8d8",
              }}
              onClick={() => fileInputRef.current?.click()}
              data-ocid="portrait.upload_button"
              aria-label="Upload portrait photo"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Portrait"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <span style={{ fontSize: "2.5rem", opacity: 0.4 }}>📷</span>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "11px",
                      color: "#8b6340",
                      opacity: 0.8,
                    }}
                  >
                    {uploading ? "Uploading..." : "Tap to add a photo"}
                  </p>
                </div>
              )}
              {photoUrl && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-2xl transition-opacity">
                    ✎
                  </span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Portrait photo file input"
            />
            <p
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontSize: "10px",
                color: "#8b6340",
                opacity: 0.7,
              }}
            >
              — add a photo —
            </p>
            <img
              src="/assets/generated/cake-illustration-transparent.dim_300x400.png"
              alt=""
              className="mt-2"
              style={{
                height: "70px",
                width: "auto",
                opacity: 0.7,
                transform: "rotate(-5deg)",
              }}
              aria-hidden="true"
            />
          </div>

          {/* Letter */}
          <div className="flex-1">
            <h2
              className="mb-4 fade-in-up"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                fontWeight: 400,
                fontStyle: "italic",
                color: "#0d1b5e",
                animationDelay: "0.2s",
              }}
            >
              Dear Pasha,
            </h2>

            <div
              className="fade-in-up"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(12px, 1.4vw, 14.5px)",
                lineHeight: 1.9,
                color: "#3a2a18",
                animationDelay: "0.4s",
              }}
            >
              <p style={{ marginBottom: "1em" }}>
                I have watched you carry the weight of the world on your
                shoulders, and through it all, you never stopped standing.
              </p>
              <p style={{ marginBottom: "1em" }}>
                I may not always have the right words, but believing in you —
                that has never been difficult. Not even for a second.
              </p>
              <p style={{ marginBottom: "1em" }}>
                There is a day coming, Pasha, that will be the best of your
                life. I know it the way I know your smile. That day is yours,
                and it is coming.
              </p>
              <p style={{ marginBottom: "1.5em" }}>
                In every high and every low, in every storm and every sunrise, I
                will be right here — by your side, always.
              </p>
              <p
                style={{
                  textAlign: "right",
                  fontSize: "clamp(12px, 1.3vw, 14px)",
                }}
              >
                With all my heart,
                <br />
                <span style={{ color: "#0d1b5e", fontSize: "1.1em" }}>
                  Always yours 💙
                </span>
              </p>
            </div>
          </div>
        </div>
      </VintagePaper>

      <ContinueButton onClick={onNext} />
    </div>
  );
}

/* ─── Screen 3: Make a Wish ─── */
interface Screen3Props {
  onNext: () => void;
}

function Screen3({ onNext }: Screen3Props) {
  return (
    <div
      className="relative w-full h-full sky-bg flex flex-col items-center justify-center overflow-hidden p-4"
      data-ocid="page.section"
    >
      <SparkleLayer dense />

      <VintagePaper
        className="max-w-2xl text-center"
        style={{ padding: "2.5rem 2rem" }}
      >
        <div className="flex flex-col items-center">
          <h2
            className="fade-in-up"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#0d1b5e",
              lineHeight: 1.3,
              marginBottom: "0.2rem",
              animationDelay: "0.1s",
            }}
          >
            Close your eyes,
          </h2>
          <h2
            className="fade-in-up"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#0d1b5e",
              lineHeight: 1.3,
              marginBottom: "1.5rem",
              animationDelay: "0.3s",
            }}
          >
            Make a wish! ✨
          </h2>

          <div
            className="fade-in-up flex justify-center"
            style={{ animationDelay: "0.5s" }}
          >
            <img
              src="/assets/generated/wish-decorations-transparent.dim_600x400.png"
              alt="Cake, balloons, and gifts"
              className="float-anim"
              style={{
                maxWidth: "100%",
                height: "auto",
                maxHeight: "260px",
                objectFit: "contain",
              }}
            />
          </div>

          <p
            className="fade-in-up mt-2"
            style={{
              color: "#d4af37",
              fontSize: "1.5rem",
              letterSpacing: "0.4em",
              animationDelay: "0.7s",
            }}
          >
            ✦ ✧ ✦
          </p>
        </div>
      </VintagePaper>

      <ContinueButton onClick={onNext} />
    </div>
  );
}

/* ─── Screen 4: Song for You ─── */
interface Screen4Props {
  onNext: () => void;
}

function Screen4({ onNext }: Screen4Props) {
  const { photoUrl, upload, uploading } = usePhotoUpload(PhotoType.couple);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          // Audio autoplay may be blocked by browser
        });
      }
    }
    setIsPlaying((p) => !p);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 98 ? 5 : p + 0.3));
    }, 300);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await upload(file);
  };

  const timeElapsed = useMemo(() => {
    const totalSec = Math.floor((progress / 100) * 215);
    const m = Math.floor(totalSec / 60);
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [progress]);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-auto p-4"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #1a2060 0%, #07091e 60%, #020310 100%)",
      }}
      data-ocid="page.section"
    >
      <SparkleLayer dark />

      {/* Decorative hearts */}
      {HEARTS.map((h) => (
        <span
          key={h.id}
          className="absolute pointer-events-none"
          style={{
            top: h.top,
            left: h.left,
            right: h.right,
            bottom: h.bottom,
            fontSize: h.size,
            color: "#1a3ab8",
            opacity: 0.6,
            animation: `sparkle-twinkle 2.4s ease-in-out ${h.delay} infinite`,
            textShadow: "0 0 10px rgba(26,58,184,0.8)",
          }}
          aria-hidden="true"
        >
          ♥
        </span>
      ))}

      {/* Title */}
      <h2
        className="z-20 mb-6 fade-in-up text-center"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#d4af37",
          textShadow: "0 0 20px rgba(212,175,55,0.6)",
          animationDelay: "0.1s",
        }}
      >
        Song for you ♡
      </h2>

      <div className="z-20 w-full max-w-2xl flex flex-col items-center gap-6">
        {/* Photo + vinyl */}
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {/* Circular photo frame */}
          <button
            type="button"
            className="relative cursor-pointer group flex-shrink-0 p-0 bg-transparent"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: "4px solid #d4af37",
              overflow: "hidden",
              boxShadow:
                "0 0 20px rgba(212,175,55,0.5), 0 8px 32px rgba(7,9,30,0.6)",
              background: "#1a1a3e",
            }}
            onClick={() => fileInputRef.current?.click()}
            data-ocid="couple.upload_button"
            aria-label="Upload couple photo"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Couple"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <span style={{ fontSize: "3rem" }}>🎵</span>
                <p
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "11px",
                    color: "#d4af37",
                    opacity: 0.8,
                    textAlign: "center",
                    padding: "0 1rem",
                  }}
                >
                  {uploading ? "Uploading..." : "Tap to add photo"}
                </p>
              </div>
            )}
            {photoUrl && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-full flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-2xl transition-opacity">
                  ✎
                </span>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Couple photo file input"
          />

          {/* Vinyl record */}
          <div
            className="flex-shrink-0"
            style={{ width: "160px", height: "160px" }}
          >
            <img
              src="/assets/generated/vinyl-record.dim_400x400.png"
              alt="Spinning vinyl record"
              className={isPlaying ? "vinyl-spinning" : ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
                boxShadow: isPlaying
                  ? "0 0 30px rgba(26,58,184,0.8), 0 8px 24px rgba(7,9,30,0.6)"
                  : "0 8px 24px rgba(7,9,30,0.6)",
                transition: "box-shadow 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Spotify-style player */}
        <div
          className="w-full max-w-sm rounded-2xl p-5 fade-in-up"
          style={{
            background: "#1a1a3e",
            border: "1px solid rgba(26,58,184,0.3)",
            boxShadow: "0 8px 32px rgba(7,9,30,0.5)",
            animationDelay: "0.4s",
          }}
        >
          {/* Song info */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "#0d1b5e",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>🎵</span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold truncate"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "#ffffff",
                  fontSize: "15px",
                }}
              >
                Birds of a Feather
              </p>
              <p
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "12px",
                }}
              >
                Billie Eilish
              </p>
            </div>
            <span style={{ color: "#d4af37", fontSize: "1rem" }}>♥</span>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div
              className="rounded-full overflow-hidden"
              style={{ height: "4px", background: "rgba(255,255,255,0.1)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #1a3ab8, #4a6cf7)",
                  transition: isPlaying ? "width 0.3s linear" : "none",
                }}
              />
            </div>
            <div
              className="flex justify-between mt-1"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: "10px",
                fontFamily: "monospace",
              }}
            >
              <span>{timeElapsed}</span>
              <span>3:35</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
              aria-label="Previous"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={togglePlay}
              data-ocid="music.play_button"
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1a3ab8, #4a6cf7)",
                border: "none",
                color: "#ffffff",
                fontSize: "1.3rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(26,58,184,0.6)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1)";
              }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
              aria-label="Next"
            >
              ⏭
            </button>
          </div>

          {/* Note */}
          <p
            className="text-center mt-3"
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "9px",
              fontStyle: "italic",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Add audio file as /assets/birds-of-a-feather.mp3 to enable playback
          </p>
        </div>

        {/* Hidden audio element — music-only, no captions needed for background music */}
        {/* biome-ignore lint/a11y/useMediaCaption: background birthday music, no speech content */}
        <audio ref={audioRef} loop>
          <source src="/assets/birds-of-a-feather.mp3" type="audio/mpeg" />
        </audio>
      </div>

      <ContinueButton onClick={onNext} light />
    </div>
  );
}

/* ─── Screen 5: Closing Message ─── */
interface Screen5Props {
  onNext: () => void;
}

function Screen5({ onNext }: Screen5Props) {
  useEffect(() => {
    const timer = setTimeout(onNext, 12000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div
      className="relative w-full h-full sky-bg flex flex-col items-center justify-center overflow-auto p-4"
      data-ocid="page.section"
    >
      <SparkleLayer />

      <VintagePaper
        className="max-w-2xl text-center"
        style={{ padding: "2.5rem 3rem" }}
      >
        <div className="flex flex-col items-center">
          {/* 24 */}
          <h1
            className="fade-in-up"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(4rem, 12vw, 7rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "#d4af37",
              lineHeight: 1,
              marginBottom: "0.5rem",
              textShadow: "0 4px 16px rgba(212,175,55,0.4)",
              animationDelay: "0.1s",
            }}
          >
            24
          </h1>

          {/* Divider */}
          <div
            className="fade-in-up flex items-center justify-center gap-3 mb-5"
            style={{ animationDelay: "0.2s" }}
          >
            <div
              style={{
                height: "1px",
                width: "50px",
                background: "linear-gradient(to right, transparent, #d4af37)",
              }}
            />
            <span style={{ color: "#d4af37", fontSize: "14px" }}>✦ ✧ ✦</span>
            <div
              style={{
                height: "1px",
                width: "50px",
                background: "linear-gradient(to left, transparent, #d4af37)",
              }}
            />
          </div>

          <div
            className="fade-in-up"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(12px, 1.6vw, 14.5px)",
              lineHeight: 2,
              color: "#3a2a18",
              animationDelay: "0.4s",
            }}
          >
            <p style={{ marginBottom: "0.8em" }}>
              You are turning 24 — and what a journey it has been.
            </p>
            <p style={{ marginBottom: "0.8em" }}>
              Many more birthdays to be celebrated,
              <br />
              many more dreams to be achieved.
              <br />
              You deserve every beautiful thing this world has to offer.
            </p>
            <p style={{ marginBottom: "0.8em" }}>
              I am always by your side.
              <br />
              Through everything — always.
            </p>
            <p style={{ marginBottom: "1.2em" }}>
              May God bless you with every happiness you have longed for.
              <br />
              May every prayer you have whispered be answered.
              <br />
              May your days be filled with light. 💙
            </p>
            <p
              style={{
                textAlign: "right",
                color: "#0d1b5e",
                fontSize: "1.1em",
              }}
            >
              — Forever yours ✨
            </p>
          </div>

          <p
            className="fade-in-up mt-4"
            style={{
              color: "#d4af37",
              fontSize: "1.3rem",
              letterSpacing: "0.5em",
              animationDelay: "0.8s",
            }}
          >
            💙 ✦ 💙
          </p>
        </div>
      </VintagePaper>

      <ContinueButton onClick={onNext} label="Click to close ✨" />
    </div>
  );
}

/* ─── Screen 6: Envelope Closing ─── */
function Screen6() {
  return (
    <div
      className="relative w-full h-full night-sky flex flex-col items-center justify-center overflow-hidden"
      data-ocid="page.section"
    >
      <SparkleLayer dark dense />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS_80.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full"
            style={{
              width: `${s.w}px`,
              height: `${s.w}px`,
              background: "#f0d060",
              left: s.left,
              top: s.top,
              opacity: s.opacity,
              animation: `sparkle-twinkle ${s.animDur} ease-in-out ${s.animDelay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Closed envelope */}
      <div className="relative z-20 wax-glow">
        <img
          src="/assets/generated/envelope-sealed.dim_800x600.png"
          alt="Sealed envelope"
          className="w-full max-w-md md:max-w-lg h-auto"
          style={{
            filter: "drop-shadow(0 20px 60px rgba(7,9,30,0.8))",
            animation: "fade-in-up 0.8s ease-out forwards",
          }}
        />
      </div>

      {/* Final message */}
      <div
        className="z-20 text-center mt-8"
        style={{
          animation: "fade-in-up 1s ease-out 0.5s forwards",
          opacity: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#d4af37",
            textShadow: "0 0 30px rgba(212,175,55,0.7)",
          }}
        >
          Happy Birthday, Pasha 🌟
        </h1>
        <p
          className="mt-3"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1rem",
            color: "rgba(212,175,55,0.7)",
            letterSpacing: "0.3em",
          }}
        >
          12.04.2026
        </p>
      </div>

      {/* Footer */}
      <p
        className="absolute bottom-4 z-20 text-center"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontSize: "11px",
          color: "rgba(212,175,55,0.35)",
        }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(212,175,55,0.5)", textDecoration: "underline" }}
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const { actor, isFetching } = useActor();
  const cardOpenedRef = useRef(false);

  const goToNext = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentPage((p) => p + 1);
      setTransitioning(false);
    }, 400);
  }, [transitioning]);

  const handleEnvelopeOpen = useCallback(() => {
    if (!cardOpenedRef.current && actor && !isFetching) {
      cardOpenedRef.current = true;
      actor.cardOpened().catch(() => {
        // silent
      });
    }
    goToNext();
  }, [goToNext, actor, isFetching]);

  const totalPages = 7;
  const safeIndex = Math.min(currentPage, totalPages - 1);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
    >
      <Toaster position="top-center" />

      <div
        key={currentPage}
        className={`absolute inset-0 ${transitioning ? "page-exit" : "page-enter"}`}
      >
        {safeIndex === 0 && <Screen0 onOpen={handleEnvelopeOpen} />}
        {safeIndex === 1 && <Screen1 onNext={goToNext} />}
        {safeIndex === 2 && <Screen2 onNext={goToNext} />}
        {safeIndex === 3 && <Screen3 onNext={goToNext} />}
        {safeIndex === 4 && <Screen4 onNext={goToNext} />}
        {safeIndex === 5 && <Screen5 onNext={goToNext} />}
        {safeIndex === 6 && <Screen6 />}
      </div>
    </div>
  );
}
