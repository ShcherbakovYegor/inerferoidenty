// components/ImageCanvas.jsx
import React from 'react';

function ImageCanvas({
  imageSrc,
  imageDimensions,
  showMagnifier,
  mousePos,
  magnifierPos,
  magnifierSize,
  magnifierZoom,
  handleImageLoad,
  onImageClick,                // заменяем handleImageClick на onImageClick
  coordinateSystemRef,
  circle1,
  circle2,
  pendingCircle,
  editingCircle,
  handleCenterMouseDown,
  handleRadiusMouseDown,
  renderCircle,
  strips,
  currentStripId,             // новый пропс для выделения активной полосы
  onPointClick,               // новый пропс для удаления точки при клике
  setShowMagnifier,           // для переключения лупы
  onCoordinateMouseMove,      // обновление позиции мыши внутри области
}) {

  if (!imageSrc) return null;

  return (
    <div className="image-container">
      {/* Контейнер, в котором лежит <img> и <svg> */}
      <div
        className="coordinate-system"
        ref={coordinateSystemRef}
        style={{
          width: imageDimensions.width,
          height: imageDimensions.height,
          position: 'relative',
        }}
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        onMouseMove={onCoordinateMouseMove}
        onClick={onImageClick}
      >
        {/* Изображение */}
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

        {/* SVG для кругов и точек */}
        <svg
          width={imageDimensions.width}
          height={imageDimensions.height}
          className="overlay-svg"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {renderCircle(circle1, 'blue')}
          {renderCircle(circle2, 'green')}

          {pendingCircle && (
            <>
              <circle
                cx={pendingCircle.centerX}
                cy={pendingCircle.centerY}
                r={pendingCircle.radius}
                stroke={editingCircle === 'circle1' ? 'blue' : 'green'}
                strokeWidth="2"
                fill="none"
              />
              {/* Точка центра pendingCircle */}
              <circle
                cx={pendingCircle.centerX}
                cy={pendingCircle.centerY}
                r="8"
                fill="gray"
                style={{ cursor: 'move' }}
                onMouseDown={handleCenterMouseDown}
              />
              {/* Точка для изменения радиуса */}
              <circle
                cx={pendingCircle.centerX + pendingCircle.radius}
                cy={pendingCircle.centerY}
                r="8"
                fill="gray"
                style={{ cursor: 'ew-resize' }}
                onMouseDown={handleRadiusMouseDown}
              />
            </>
          )}

          {/* Отрисовка точек для всех полос */}
          {strips.map((strip) =>
            strip.points.map((point, index) => (
              <circle
                key={`${strip.id}-${index}`}
                cx={point.x}
                cy={point.y}
                r={point.isInterpolated ? 1 : 1.5}
                fill={
                  point.isInterpolated
                    ? "#888"
                    : currentStripId === strip.id
                      ? "blue" // выделяем точки активной полосы синим
                      : "red"
                }
                title={`Полоса ${strip.id}: (${point.x}, ${point.y}, z=${point.z})`}
                onClick={(e) => {
                  e.stopPropagation(); // чтобы не срабатывал onImageClick
                  if (onPointClick) {
                    onPointClick(strip.id, index);
                  }
                }}
              />
            ))
          )}
        </svg>
      </div>

      {/* Лупа */}
      {showMagnifier && (
        <div
          style={{
            position: 'fixed',
            left: magnifierPos.left,
            top: magnifierPos.top,
            width: magnifierSize,
            height: magnifierSize,
            border: '1px solid #ccc',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 9999,
            background: '#eee',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${imageSrc})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 
                `${imageDimensions.width * magnifierZoom}px ${imageDimensions.height * magnifierZoom}px`,
              backgroundPosition: 
                `${-mousePos.x * magnifierZoom + magnifierSize / 2}px ${-mousePos.y * magnifierZoom + magnifierSize / 2}px`,
              position: 'relative',
            }}
          >
            {/* Прицел лупы */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '2px',
                height: '20px',
                background: 'rgba(255, 0, 0, 0.7)',
                transform: 'translate(-50%, -50%)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '20px',
                height: '2px',
                background: 'rgba(255, 0, 0, 0.7)',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageCanvas;
