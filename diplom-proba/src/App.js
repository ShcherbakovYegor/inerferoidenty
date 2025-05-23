// App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css'; 
import ImageCanvas from './Components/ImageCanvas';
import SidePanel from './Components/SidePanel';
import Plot3D from './Components/Plot3D';
import SlicePlots from './Components/SlicePlots';
import {
  buildPolynomialRow,
  polynomialRegression2D,
} from './Utils/mathUtils';

function App() {
  // --------------------------
  // Состояния
  // --------------------------
  const [strips, setStrips] = useState([]);
  const [currentStripId, setCurrentStripId] = useState(null);
  const [nextStripId, setNextStripId] = useState(-15);

  const [imageSrc, setImageSrc] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  // Состояния кругов и прочее
  const [circle1, setCircle1] = useState(null);
  const [circle2, setCircle2] = useState(null);
  const [circleDrawingStage, setCircleDrawingStage] = useState('circle1-center');
  const [editingCircle, setEditingCircle] = useState(null);
  const [pendingCircle, setPendingCircle] = useState(null);
  const [isDraggingCenter, setIsDraggingCenter] = useState(false);
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);

  const coordinateSystemRef = useRef(null);

  // Лупа
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [magnifierPos, setMagnifierPos] = useState({ left: 0, top: 0 });
  const magnifierSize = 200;
  const magnifierZoom = 3.0;

  // 3D-график
  const [plotData, setPlotData] = useState(null);
  const [sliceData, setSliceData] = useState(null);

  // --------------------------
  // Удаление точки по клику
  // --------------------------
  const handlePointClick = (stripId, pointIndex) => {
    const updatedStrips = strips.map((strip) => {
      if (strip.id === stripId) {
        const newPoints = [...strip.points];
        newPoints.splice(pointIndex, 1);
        return { ...strip, points: newPoints };
      }
      return strip;
    });
    setStrips(updatedStrips);
  };

  // --------------------------
  // Интерполяция
  // --------------------------
  const interpolatePoints = (p1, p2, numPoints) => {
    const points = [];
    for (let i = 1; i < numPoints; i++) {
      const t = i / numPoints;
      points.push({
        x: Math.round(p1.x + (p2.x - p1.x) * t),
        y: Math.round(p1.y + (p2.y - p1.y) * t),
        z: Math.round(p1.z + (p2.z - p1.z) * t),
        stripId: p1.stripId,
        isInterpolated: true
      });
    }
    return points;
  };



  const handleInterpolate = () => {
    if (currentStripId === null) {
      alert('Пожалуйста, выберите полосу для интерполяции');
      return;
    }
    const currentStrip = strips.find((strip) => strip.id === currentStripId);
    if (!currentStrip || currentStrip.points.length < 2) {
      alert('Нужно минимум 2 точки для интерполяции');
      return;
    }

    const newPoints = [];
    const addedPoints = [];

    for (let i = 0; i < currentStrip.points.length - 1; i++) {
      const p1 = currentStrip.points[i];
      const p2 = currentStrip.points[i + 1];

      // Копируем первую точку
      newPoints.push({ ...p1, isInterpolated: false });

      // Расстояние между точками
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Пример: каждые 10 пикселей вставить точку
      const numPoints = Math.max(1, Math.floor(distance / 5));
      const interpolated = interpolatePoints(p1, p2, numPoints);

      newPoints.push(...interpolated);
      addedPoints.push(...interpolated);
    }

    // Добавляем последнюю точку
    newPoints.push({
      ...currentStrip.points[currentStrip.points.length - 1],
      isInterpolated: false
    });

    const updatedStrips = strips.map((strip) =>
      strip.id === currentStripId
        ? { ...strip, points: newPoints }
        : strip
    );

    setStrips(updatedStrips);
    setUndoStack([...undoStack, {
      type: 'add_points',
      stripId: currentStripId,
      addedPoints
    }]);
  };

  // --------------------------
  // Undo (Ctrl+Z / Cmd+Z)
  // --------------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        handleUndo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoStack]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    const { stripId, addedPoints } = lastAction;

    let pointToRemove;
    let updatedUndoStack = [...undoStack];

    if (addedPoints.length > 1) {
      pointToRemove = addedPoints[addedPoints.length - 1];
      updatedUndoStack[updatedUndoStack.length - 1] = {
        ...lastAction,
        addedPoints: addedPoints.slice(0, addedPoints.length - 1),
      };
    } else {
      pointToRemove = addedPoints[0];
      updatedUndoStack = updatedUndoStack.slice(0, updatedUndoStack.length - 1);
    }

    const updatedStrips = strips.map((strip) => {
      if (strip.id === stripId) {
        const newPoints = [...strip.points];
        for (let i = newPoints.length - 1; i >= 0; i--) {
          if (
            newPoints[i].x === pointToRemove.x &&
            newPoints[i].y === pointToRemove.y &&
            newPoints[i].z === pointToRemove.z
          ) {
            newPoints.splice(i, 1);
            break;
          }
        }
        return { ...strip, points: newPoints };
      }
      return strip;
    });

    setStrips(updatedStrips);
    setUndoStack(updatedUndoStack);
  };

  // --------------------------
  // Мышь (перетаскивание круга)
  // --------------------------
  useEffect(() => {
    const handleMouseMove = (event) => {
      if ((isDraggingCenter || isDraggingRadius) && pendingCircle) {
        const coordinateSystemEl = coordinateSystemRef.current;
        if (!coordinateSystemEl) return;
        const rect = coordinateSystemEl.getBoundingClientRect();
        const scaleX = imageDimensions.naturalWidth / imageDimensions.width;
        const scaleY = imageDimensions.naturalHeight / imageDimensions.height;
        const x = Math.round((event.clientX - rect.left) * scaleX);
        const y = Math.round((event.clientY - rect.top) * scaleY);

        if (isDraggingCenter) {
          const dx = x - dragStart.x;
          const dy = y - dragStart.y;
          setPendingCircle((prev) => ({
            ...prev,
            centerX: prev.centerX + dx,
            centerY: prev.centerY + dy,
          }));
          setDragStart({ x, y });
        } else if (isDraggingRadius) {
          const dx = x - pendingCircle.centerX;
          const dy = y - pendingCircle.centerY;
          const radius = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));
          setPendingCircle((prev) => ({ ...prev, radius }));
        }
      }

      // Лупа: позиция
      setMagnifierPos({
        left: event.clientX + 10,
        top: event.clientY + 10,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingCenter(false);
      setIsDraggingRadius(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDraggingCenter,
    isDraggingRadius,
    pendingCircle,
    dragStart,
    imageDimensions
  ]);

  // --------------------------
  // Загрузка изображения
  // --------------------------
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        // Сброс
        setStrips([]);
        setCurrentStripId(null);
        setNextStripId(-15);
        setCircle1(null);
        setCircle2(null);
        setCircleDrawingStage('circle1-center');
        setEditingCircle(null);
        setPendingCircle(null);
        setUndoStack([]);
        setPlotData(null);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Пожалуйста, выберите файл изображения.');
    }
  };

  // проверяет, лежит ли точка внутри данного круга
const isInsideCircle = (x, y, circle) => {
  const dx = x - circle.centerX;
  const dy = y - circle.centerY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
};


  const handleImageLoad = ({ target }) => {
    setImageDimensions({
      width: target.naturalWidth,
      height: target.naturalHeight,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
    });
  };

  // --------------------------
  // Клик по изображению
  // --------------------------
  const handleImageClick = (event) => {
    if (editingCircle) return;
    if (!coordinateSystemRef.current) return;
  
    const x = Math.round(event.nativeEvent.offsetX);
    const y = Math.round(event.nativeEvent.offsetY);
    setMousePos({ x, y });
  
    if (circleDrawingStage === 'circle1-center') {
      setPendingCircle({ centerX: x, centerY: y, radius: 50 });
      setEditingCircle('circle1');
    }
    else if (circleDrawingStage === 'circle2-center') {
      setPendingCircle({ centerX: x, centerY: y, radius: 50 });
      setEditingCircle('circle2');
    }
    else if (circleDrawingStage === 'points-drawing') {
      if (currentStripId === null) {
        alert('Сначала добавьте и выберите полосу.');
        return;
      }
  
      // если оба круга уже заданы — проверяем попадание в их пересечение
      if (circle1 && circle2) {
        if (
          !isInsideCircle(x, y, circle1) ||
          !isInsideCircle(x, y, circle2)
        ) {
          // можно просто return или показать сообщение
          alert('Точка должна быть внутри области пересечения двух кругов.');
          return;
        }
      }
  
      const current = strips.find(s => s.id === currentStripId);
      if (!current) return;
      const duplicate = current.points.some(p => p.x === x && p.y === y);
      if (duplicate) return;
  
      const newPoint = { x, y, z: 0, stripId: currentStripId, isInterpolated: false };
      const updated = strips.map(s =>
        s.id === currentStripId
          ? { ...s, points: [...s.points, newPoint] }
          : s
      );
      setStrips(updated);
      setUndoStack([...undoStack, {
        type: 'add_points',
        stripId: currentStripId,
        addedPoints: [newPoint],
      }]);
    }
  };
  
  // --------------------------
  // Выбор полосы
  // --------------------------
  const selectStrip = (id) => {
    setCurrentStripId(id);
  };

  // --------------------------
  // Редактирование круга
  // --------------------------
  const handleCenterMouseDown = (e) => {
    e.stopPropagation();
    if (!pendingCircle) return;

    const coordinateSystemEl = coordinateSystemRef.current;
    if (!coordinateSystemEl) return;
    const rect = coordinateSystemEl.getBoundingClientRect();
    const scaleX = imageDimensions.naturalWidth / imageDimensions.width;
    const scaleY = imageDimensions.naturalHeight / imageDimensions.height;
    const cx = Math.round((e.clientX - rect.left) * scaleX);
    const cy = Math.round((e.clientY - rect.top) * scaleY);

    setIsDraggingCenter(true);
    setDragStart({ x: cx, y: cy });
  };

  const handleRadiusMouseDown = (e) => {
    e.stopPropagation();
    if (pendingCircle) {
      setIsDraggingRadius(true);
    }
  };

  const handleCancelCircle = () => {
    setEditingCircle(null);
    setPendingCircle(null);
    if (circleDrawingStage.startsWith('circle1')) {
      setCircleDrawingStage('circle1-center');
    } else if (circleDrawingStage.startsWith('circle2')) {
      setCircleDrawingStage('circle2-center');
    }
  };

  const handleOkCircle = () => {
    if (pendingCircle) {
      if (editingCircle === 'circle1') {
        setCircle1(pendingCircle);
        setEditingCircle(null);
        setPendingCircle(null);
        setCircleDrawingStage('circle2-center');
      } else if (editingCircle === 'circle2') {
        setCircle2(pendingCircle);
        setEditingCircle(null);
        setPendingCircle(null);
        setCircleDrawingStage('points-drawing');
      }
    }
  };

  const renderCircle = (circle, strokeColor) => {
    if (!circle || !circle.radius) return null;
    return (
      <circle
        cx={circle.centerX}
        cy={circle.centerY}
        r={circle.radius}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
      />
    );
  };

  // --------------------------
  // Скачать точки
  // --------------------------
  const handleDownloadPoints = () => {
    if (!strips || strips.length === 0) {
      alert("Нет полос и точек для скачивания");
      return;
    }
    let lines = [];
    lines.push("x   y   z   stripId");
    strips.forEach((strip) => {
      strip.points.forEach((point) => {
        lines.push(`${point.x}   ${point.y}   ${point.z ?? 0}   ${strip.id}`);
      });
    });
    const textContent = lines.join("\r\n");
    const blob = new Blob([textContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'points.bmp';
    a.click();
  };

  // --------------------------
  // Загрузка точек из .bmp
  // --------------------------
  const handleLoadPointsFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter((ln) => ln.trim() !== '');

      let newStrips = [...strips];

      let startIndex = 0;
      if (lines[0].toLowerCase().includes('x') && lines[0].toLowerCase().includes('y')) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(/\s+/);
        if (parts.length !== 3) {
          console.warn("Строка пропущена (нужно 3 столбца):", line);
          continue;
        }
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        const zVal = parseFloat(parts[2]);
        if (isNaN(x) || isNaN(y) || isNaN(zVal)) {
          console.warn("Строка содержит неверные числа:", line);
          continue;
        }
        // В примере: zVal = stripId
        const stripId = zVal;
        let stripIndex = newStrips.findIndex((s) => s.id === stripId);
        if (stripIndex === -1) {
          newStrips.push({ id: stripId, points: [] });
          stripIndex = newStrips.length - 1;
        }
        newStrips[stripIndex].points.push({
          x, y, z: zVal, stripId, isInterpolated: false,
        });
      }
      setStrips(newStrips);
      alert('Точки успешно загружены!');
    };
    reader.readAsText(file);
  };

  // --------------------------
  // Построение 3D-графика
  // --------------------------
  const handleBuildAll = (degree) => {
    const allPoints = strips.flatMap((s) => s.points);
    if (allPoints.length < 3) {
      alert("Слишком мало точек для регрессии");
      return;
    }
  
    // 1. Находим границы данных и определяем центр и радиус.
    const xs = allPoints.map((p) => p.x);
    const ys = allPoints.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
  
    // Если задан круг (например, circle1), используем его центр и радиус,
    // иначе берем центр всего изображения и радиус как половину меньшей стороны.
    const centerX = circle1 ? circle1.centerX : (minX + maxX) / 2;
    const centerY = circle1 ? circle1.centerY : (minY + maxY) / 2;
    const R = circle1 ? circle1.radius : Math.min(maxX - minX, maxY - minY) / 2;
  
    // 2. Сдвигаем все точки так, чтобы центр стал (0,0).
    const shiftedPoints = allPoints.map((p) => ({
      x: p.x - centerX,
      y: p.y - centerY,
      z: p.z,
    }));
  
    // 3. Выполняем полиномиальную регрессию по сдвинутым координатам.
    const coeff = polynomialRegression2D(shiftedPoints, degree);
    if (!coeff) {
      alert("Не удалось вычислить регрессию");
      return;
    }
    // Убираем наклон (клин) — обнуляем коэффициенты линейных членов.
    if (degree >= 1) {
      coeff[1] = 0; // коэффициент при x
      coeff[2] = 0; // коэффициент при y
    }
  
    // 4. Строим равномерную сетку в диапазоне от -R до +R (по осям X и Y в сдвинутых координатах).
    const steps = 303;
    const xVals = [];
    const yVals = [];
    const step = (2 * R) / (steps - 1);
    for (let i = 0; i < steps; i++) {
      xVals.push(-R + i * step);
      yVals.push(-R + i * step);
    }
  
    // 5. Формируем матрицу Z.
    // Если точка (x,y) лежит вне круга (x^2 + y^2 > R^2), запишем NaN.
    const Z = [];
    for (let j = 0; j < steps; j++) {
      const row = [];
      for (let i = 0; i < steps; i++) {
        const xVal = xVals[i];
        const yVal = yVals[j];
        if (xVal * xVal + yVal * yVal > R * R) {
          row.push(NaN);
        } else {
          const rowPoly = buildPolynomialRow(xVal, yVal, degree);
          let zVal = 0;
          for (let k = 0; k < rowPoly.length; k++) {
            zVal += rowPoly[k] * coeff[k];
          }
          row.push(zVal);
        }
      }
      Z.push(row);
    }
  
    // 6. Определяем минимальное и максимальное значение z (игнорируя NaN)
    let zArray = [];
    for (let j = 0; j < steps; j++) {
      for (let i = 0; i < steps; i++) {
        const val = Z[j][i];
        if (!isNaN(val)) {
          zArray.push(val);
        }
      }
    }
    const zMin = Math.min(...zArray);
    const zMax = Math.max(...zArray);
  
    // 7. Создаем surface‑трейс с черными контурными линиями по оси z,
    //    используя step = 1 (параметры start, end и size для контуров).
    const surfaceTrace = {
      type: "surface",
      x: xVals,
      y: yVals,
      z: Z,
      colorscale: "Jet",
      opacity: 1,
      contours: {
        z: {
          show: true,
          usecolormap: false,  // отключаем использование colormap для линий
          color: "black",      // цвет линий – черный
          width: 2,            // толщина линий
          start: Math.floor(zMin),   // начинаем с ближайшего целого ниже минимума
          end: Math.ceil(zMax),      // заканчиваем ближайшим целым выше максимума
          size: 1,             // шаг между уровнями равен 1
          project: { z: true }
        }
      }
    };
  
    setPlotData([surfaceTrace]);
    const idx = [
      Math.floor(steps * 0.25),
      Math.floor(steps * 0.5),
      Math.floor(steps * 0.75),
    ];
 
    const xSlices = idx.map(j => ({
      label: `y = ${yVals[j].toFixed(0)}`,
      x: [...xVals],
      z: [...Z[j]],
    }));
 
    const ySlices = idx.map(i => ({
      label: `x = ${xVals[i].toFixed(0)}`,
      x: [...yVals],
      z: Z.map(row => row[i]),
    }));
 
    setSliceData({ xSlices, ySlices });
  };
  

  const handleCoordinateMouseMove = (e) => {
    const rect = coordinateSystemRef.current.getBoundingClientRect();
    // НЕ округляем!
    const offsetX = e.nativeEvent.offsetX;
    const offsetY = e.nativeEvent.offsetY;
    setMousePos({ x: offsetX, y: offsetY });
    setMagnifierPos({
      left: e.clientX + 10,
      top:  e.clientY + 10,
    });
  };
  

  // --------------------------
  // Управление полосами
  // --------------------------
  const addStrip = () => {
    const newStrip = { id: nextStripId, points: [] };
    setStrips([...strips, newStrip]);
    setCurrentStripId(nextStripId);
    setNextStripId(nextStripId + 1);
  };

  const clearCurrentStrip = () => {
    if (currentStripId === null) {
      alert('Сначала выберите полосу для очистки.');
      return;
    }
    const confirmed = window.confirm("Вы уверены, что хотите удалить все точки из текущей полосы?");
    if (!confirmed) return;
    const updatedStrips = strips.map((strip) => {
      if (strip.id === currentStripId) {
        return { ...strip, points: [] };
      }
      return strip;
    });
    setStrips(updatedStrips);
  };

  const removeCurrentStrip = () => {
    if (currentStripId === null) {
      alert('Сначала выберите полосу для удаления.');
      return;
    }
    const confirmed = window.confirm("Удалить выбранную полосу целиком?");
    if (!confirmed) return;
    const updated = strips.filter((s) => s.id !== currentStripId);
    setStrips(updated);
    setCurrentStripId(null);
  };

  // --------------------------
  // Render
  // --------------------------
  return (
    <div className="App">
      <h1>Загрузите фотографию</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />

      {imageSrc && (
        <div className="content" style={{ display: 'flex' }}>
          {/* Левая часть: Canvas */}
          <div>
            <ImageCanvas
              imageSrc={imageSrc}
              imageDimensions={imageDimensions}
              showMagnifier={showMagnifier}
              mousePos={mousePos}
              magnifierPos={magnifierPos}
              magnifierSize={magnifierSize}
              magnifierZoom={magnifierZoom}
              handleImageLoad={handleImageLoad}
              onImageClick={handleImageClick}
              coordinateSystemRef={coordinateSystemRef}
              circle1={circle1}
              circle2={circle2}
              pendingCircle={pendingCircle}
              editingCircle={editingCircle}
              handleCenterMouseDown={handleCenterMouseDown}
              handleRadiusMouseDown={handleRadiusMouseDown}
              renderCircle={renderCircle}
              strips={strips}
              currentStripId={currentStripId}
              onPointClick={handlePointClick}
              setShowMagnifier={setShowMagnifier}
              onCoordinateMouseMove={handleCoordinateMouseMove}
            />

            {/* Кнопки ОК/Отмена для круга */}
            {pendingCircle && editingCircle && (
              <div style={{ marginTop: 8 }}>
                <button onClick={handleOkCircle}>Ок</button>
                <button onClick={handleCancelCircle}>Отмена</button>
              </div>
            )}

            {!pendingCircle && circleDrawingStage !== 'points-drawing' && (
              <p style={{ marginTop: 8 }}>
                <b>Укажите {circleDrawingStage.includes('circle1') ? 'первый' : 'второй'} круг.</b><br />
                Кликните для выбора центра круга, подправьте радиус, затем нажмите "Ок".
              </p>
            )}
          </div>

          {/* Правая часть: Панель инструментов */}
          <SidePanel
            strips={strips}
            currentStripId={currentStripId}
            selectStrip={selectStrip}
            addStrip={addStrip}
            handleInterpolate={handleInterpolate}
            handleDownloadPoints={handleDownloadPoints}
            handleLoadPointsFile={handleLoadPointsFile}
            handleBuildAll={handleBuildAll} 
            clearCurrentStrip={clearCurrentStrip}
            removeCurrentStrip={removeCurrentStrip}
          />
        </div>
      )}

      {/* 3D-график */}
      <Plot3D plotData={plotData} />

      {sliceData && (
        <SlicePlots xSlices={sliceData.xSlices} ySlices={sliceData.ySlices} />
      )}
    </div>
  );
}

export default App;
