// mathUtils.js

/**
 * Построение строки (набора мономов) по x, y для полинома степени degree
 * @param {number} x 
 * @param {number} y 
 * @param {number} degree 
 * @returns {number[]} массив значений [1, x, y, x^2, x*y, y^2, ...] (все комбинации i+j <= degree)
 */
export function buildPolynomialRow(x, y, degree) {
    const terms = [];
    for (let i = 0; i <= degree; i++) {
      for (let j = 0; j <= degree - i; j++) {
        // Каждый моном: x^i * y^j
        terms.push(x**i * y**j);
      }
    }
    return terms;
  }
  
  /**
   * Универсальная полиномиальная регрессия по (x, y) -> z с заданной степенью
   * points: массив объектов вида { x, y, z }
   * degree: степень полинома (целое число)
   * Возвращает массив коэффициентов [a0, a1, ..., aN], где N = (degree+1)(degree+2)/2 - 1
   */
  export function polynomialRegression2D(points, degree) {
    // Формируем матрицу A и вектор b для решения A * coeff = b
    // Размер матрицы A: (количество_точек) x (число_мономов)
    const numPoints = points.length;
    const numTerms = ((degree + 1) * (degree + 2)) / 2; // кол-во мономов для степени degree
  
    // Инициализируем A и b
    const A = Array(numPoints).fill(null).map(() => Array(numTerms).fill(0));
    const b = Array(numPoints).fill(0);
  
    for (let i = 0; i < numPoints; i++) {
      const { x, y, z } = points[i];
      const row = buildPolynomialRow(x, y, degree);
      for (let j = 0; j < numTerms; j++) {
        A[i][j] = row[j];
      }
      b[i] = z;
    }
  
    // Решаем систему (A^T * A) * coeff = A^T * b методом наименьших квадратов
    // Ниже — простой способ через псевдо-обратную (или через numeric.js, math.js и т.д.)
    // Для упрощённого демо: вручную реализуем решение через matrix-inversion (не оптимально, но наглядно)
  
    // Превратим A, b в float-матрицы, используем обычные js-библиотеки или пишем ручной метод:
    // ---- Начало "на коленке" метода решения ----
    // Можно подключить любую библиотеку для линейной алгебры, например, numeric.js.
  
    function transpose(M) {
      return M[0].map((_, iCol) => M.map(row => row[iCol]));
    }
  
    function multiply(A, B) {
      // A: p x q, B: q x r => C: p x r
      const p = A.length, q = A[0].length, r = B[0].length;
      const C = Array(p).fill(null).map(() => Array(r).fill(0));
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < r; j++) {
          let sum = 0;
          for (let k = 0; k < q; k++) {
            sum += A[i][k] * B[k][j];
          }
          C[i][j] = sum;
        }
      }
      return C;
    }
  
    function invert(matrix) {
      // Простая реализация обратной матрицы (Gauss-Jordan), только для демо.
      // Для больших матриц используйте более надёжные методы / библиотеки.
      const n = matrix.length;
      // Создаём единичную матрицу
      const identity = Array(n).fill(null).map((_, i) => {
        const row = Array(n).fill(0);
        row[i] = 1;
        return row;
      });
      // Копия исходной
      const M = matrix.map(row => [...row]);
  
      // Приведение к форме [M | I] => [I | M^-1]
      for (let i = 0; i < n; i++) {
        // 1) Ищем главный элемент
        let pivot = M[i][i];
        if (Math.abs(pivot) < 1e-12) {
          // ищем строку ниже для свапа
          for (let r = i+1; r < n; r++) {
            if (Math.abs(M[r][i]) > Math.abs(pivot)) {
              [M[i], M[r]] = [M[r], M[i]];
              [identity[i], identity[r]] = [identity[r], identity[i]];
              pivot = M[i][i];
              break;
            }
          }
        }
        if (Math.abs(pivot) < 1e-12) {
          // матрица вырождена
          return null;
        }
  
        // 2) Нормализуем текущую строку, чтобы M[i][i] = 1
        const invPivot = 1 / pivot;
        for (let c = 0; c < n; c++) {
          M[i][c] *= invPivot;
          identity[i][c] *= invPivot;
        }
  
        // 3) Обнуляем столбец i во всех строках, кроме i
        for (let r = 0; r < n; r++) {
          if (r !== i) {
            const factor = M[r][i];
            for (let c = 0; c < n; c++) {
              M[r][c] -= factor * M[i][c];
              identity[r][c] -= factor * identity[i][c];
            }
          }
        }
      }
      return identity;
    }
    // ---- Конец "на коленке" ----
  
    const A_T = transpose(A);
    const A_T_A = multiply(A_T, A);     // (numTerms x numTerms)
    const A_T_b = multiply(A_T, b.map(val => [val])); // (numTerms x 1)
  
    const invA_T_A = invert(A_T_A);
    if (!invA_T_A) {
      // Матрица вырождена, вернуть null или выбросить ошибку
      return null;
    }
  
    // coeffMatrix = inv(A^T*A) * (A^T*b)
    const coeffMatrix = multiply(invA_T_A, A_T_b); // (numTerms x 1)
    // Превращаем в обычный одномерный массив
    const coeff = coeffMatrix.map(row => row[0]);
  
    return coeff;
  }
  