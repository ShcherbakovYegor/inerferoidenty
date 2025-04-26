  import React, { useState } from 'react';

  function SidePanel({
    strips,
    currentStripId,
    selectStrip,
    addStrip,
    handleInterpolate,
    handleDownloadPoints,
    handleLoadPointsFile,
    handleBuildAll,
    clearCurrentStrip,
    removeCurrentStrip,
    autoDetectStrips,  // <-- добавлено проп
  }) {
    const [polyDegree, setPolyDegree] = useState(3);

    const handleChangeDegree = (event) => {
      setPolyDegree(parseInt(event.target.value, 10));
    };

    const onBuild3DClick = () => {
      handleBuildAll(polyDegree);
    };

    return (
      <div className="SidePanel">
        <h2>Управление</h2>

        {/* Кнопки управления */}
        <button onClick={clearCurrentStrip}>Очистить выбранную полосу</button>
        <button onClick={removeCurrentStrip}>Удалить выбранную полосу</button>
        <button onClick={handleInterpolate}>Интерполировать</button>
        <button onClick={handleDownloadPoints}>Скачать точки</button>
        <button onClick={addStrip}>Добавить полосу</button>

        {/* Загрузка файла */}
        <input
          type="file"
          accept=".txt,.csv,.bmp"
          onChange={handleLoadPointsFile}
          style={{ marginTop: '10px' }}
        />

        {/* Построение 3D */}
        <h3 style={{ marginTop: '16px' }}>Построить 3D</h3>
        <div style={{ marginBottom: '8px' }}>
          Степень полинома:&nbsp;
          <select value={polyDegree} onChange={handleChangeDegree}>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
        <button onClick={() => handleBuildAll(polyDegree)}>Построить 3‑D + 2‑D</button>

        {/* Список полос */}
        <h3 style={{ marginTop: '16px' }}>Полосы</h3>
        <div className='nit'>
        {strips.map((strip) => (
          <label key={strip.id}>
            <input
              type="radio"
              name="strip"
              value={strip.id}
              checked={currentStripId === strip.id}
              onChange={() => selectStrip(strip.id)}
            />
            Полоса {strip.id}
          </label>
        ))}
        </div>

        {/* Контейнер для точек с прокруткой */}
        <h3 style={{ marginTop: '16px' }}>Точки</h3>
        <div className="points-container">
          {strips
            .filter((s) => s.id === currentStripId)
            .map((strip) => (
              <div key={strip.id}>
                {strip.points.length === 0 ? (
                  <p>Нет точек</p>
                ) : (
                  strip.points.map((pt, idx) => (
                    <div
                      key={idx}
                      className={`point ${currentStripId === strip.id ? 'highlighted' : ''}`}
                    >
                      x: {pt.x}, y: {pt.y}, z: {pt.z}
                    </div>
                  ))
                )}
              </div>
            ))}
        </div>
      </div>
    );
  }

  export default SidePanel;