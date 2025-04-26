// components/ImageCanvas.jsx
import React, { useRef, useEffect } from "react";

function ImageCanvas({
  imageSrc,
  imageDimensions,
  showMagnifier,
  mousePos,
  magnifierPos,
  magnifierSize,
  magnifierZoom,
  handleImageLoad,
  onImageClick,
  coordinateSystemRef,
  circle1,
  circle2,
  pendingCircle,
  editingCircle,
  handleCenterMouseDown,
  handleRadiusMouseDown,
  renderCircle,
  strips,
  currentStripId,
  onPointClick,
  setShowMagnifier,
  onCoordinateMouseMove,
  orderedPoints,
}) {
  // ── 1. ВСЕ хуки здесь, до любого return ──
  const lensRef = useRef(null);

  useEffect(() => {
    if (!showMagnifier || !coordinateSystemRef.current || !lensRef.current)
      return;

    const dst = lensRef.current;
    dst.innerHTML = "";

    // Клонируем всю coordinate-system
    const clone = coordinateSystemRef.current.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.top = `${-mousePos.y * magnifierZoom + magnifierSize / 2}px`;
    clone.style.left = `${-mousePos.x * magnifierZoom + magnifierSize / 2}px`;
    clone.style.transformOrigin = "top left";
    clone.style.transform = `scale(${magnifierZoom})`;
    clone.style.pointerEvents = "none";
    dst.appendChild(clone);

    // Добавляем вертикальную линию‑прицел
    const v = document.createElement("div");
    Object.assign(v.style, {
      position: "absolute",
      left: "50%",
      top: "0",
      width: "2px",
      height: "100%",
      background: "rgba(255,0,0,0.7)",
      transform: "translateX(-50%)",
      pointerEvents: "none",
    });
    dst.appendChild(v);

    // Добавляем горизонтальную линию‑прицел
    const h = document.createElement("div");
    Object.assign(h.style, {
      position: "absolute",
      top: "50%",
      left: "0",
      width: "100%",
      height: "2px",
      background: "rgba(255,0,0,0.7)",
      transform: "translateY(-50%)",
      pointerEvents: "none",
    });
    dst.appendChild(h);
  }, [
    showMagnifier,
    mousePos,
    magnifierZoom,
    magnifierSize,
    coordinateSystemRef,
  ]);

  // ── 2. Ранний return, если нет картинки ──
  if (!imageSrc) return null;

  // ── 3. Колбэк клика: используем "e", не глобальный event ──
  const handleCanvasClick = (e) => {
    e.stopPropagation();
    // округляем внутри вашего onImageClick, если нужно
    onImageClick(e);
  };

  return (
    <div className="image-container">
      <div
        className="coordinate-system"
        ref={coordinateSystemRef}
        style={{
          width: imageDimensions.width,
          height: imageDimensions.height,
          position: "relative",
        }}
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        onMouseMove={onCoordinateMouseMove}
        onClick={handleCanvasClick}
      >
        <img
          src={imageSrc}
          alt="Uploaded"
          onLoad={handleImageLoad}
          className="uploaded-image"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: imageDimensions.width,
            height: imageDimensions.height,
          }}
        />

        <svg
          width={imageDimensions.width}
          height={imageDimensions.height}
          className="overlay-svg"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {strips.map((strip) => {
            const pts = strip.points;
            if (!pts || pts.length < 2) return null;

            const pointsForLine =
              orderedPoints && strip.id === currentStripId
                ? orderedPoints
                : pts;

            const groupsByZ = {};
            pointsForLine.forEach((p) => {
              const key = p.z != null ? p.z : "undef";
              if (!groupsByZ[key]) groupsByZ[key] = [];
              groupsByZ[key].push(p);
            });

            return Object.entries(groupsByZ).map(([zKey, grp], idx) => {
              if (grp.length < 2) return null;
              let finalGroup = grp;
              const first = grp[0],
                last = grp[grp.length - 1];
              if (first.x === last.x && first.y === last.y) {
                finalGroup = grp.slice(0, -1);
              }
              const d = finalGroup.map((p) => `${p.x},${p.y}`).join(" ");
              const stroke = strip.id === currentStripId ? "blue" : "red";
              return (
                <polyline
                  key={`pline-${strip.id}-${zKey}-${idx}`}
                  points={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="1"
                />
              );
            });
          })}

          {renderCircle(circle1, "blue")}
          {renderCircle(circle2, "green")}

          {pendingCircle && (
            <>
              <circle
                cx={pendingCircle.centerX}
                cy={pendingCircle.centerY}
                r={pendingCircle.radius}
                stroke={editingCircle === "circle1" ? "blue" : "green"}
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx={pendingCircle.centerX}
                cy={pendingCircle.centerY}
                r="8"
                fill="gray"
                style={{ cursor: "move" }}
                onMouseDown={handleCenterMouseDown}
              />
              <circle
                cx={pendingCircle.centerX + pendingCircle.radius}
                cy={pendingCircle.centerY}
                r="8"
                fill="gray"
                style={{ cursor: "ew-resize" }}
                onMouseDown={handleRadiusMouseDown}
              />
            </>
          )}

          {strips.map((strip) =>
            strip.points.map((point, i) => (
              <circle
                key={`${strip.id}-${i}`}
                cx={point.x}
                cy={point.y}
                r={point.isInterpolated ? 1 : 1.5}
                fill={
                  point.isInterpolated
                    ? "#888"
                    : currentStripId === strip.id
                    ? "blue"
                    : "red"
                }
                title={`Полоса ${strip.id}: (${point.x},${point.y},z=${point.z})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPointClick(strip.id, i);
                }}
              />
            ))
          )}
        </svg>
      </div>

      {showMagnifier && (
        <div
          ref={lensRef}
          style={{
            position: "fixed",
            left: magnifierPos.left,
            top: magnifierPos.top,
            width: magnifierSize,
            height: magnifierSize,
            border: "2px solid #ccc",
            borderRadius: "50%",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 9999,
            background: "#fff",
            boxShadow: "0 0 8px rgba(0,0,0,0.3)",
          }}
        />
      )}
    </div>
  );
}

export default ImageCanvas;
