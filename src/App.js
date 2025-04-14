import React, { useState, useEffect, useRef } from "react";
import { Button, Container, Row, Col, Badge, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 8;
const DEFAULT_BOMBS = 10;

function crearTablero(rows, cols, bombs, safeRow = -1, safeCol = -1) {
  let tablero = [];

  for (let i = 0; i < rows; i++) {
    let fila = [];
    for (let j = 0; j < cols; j++) {
      fila.push({
        clickado: false,
        isBomb: false,
        bombasAlrededor: 0,
        conBandera: false,
        isRevealed: false
      });
    }
    tablero.push(fila);
  }

  let bombasColocadas = 0;

  while (bombasColocadas < bombs) {
    let filaAleatoria = Math.floor(Math.random() * rows);
    let columnaAleatoria = Math.floor(Math.random() * cols);

    if ((filaAleatoria === safeRow && columnaAleatoria === safeCol) || 
        tablero[filaAleatoria][columnaAleatoria].isBomb) {
      continue;
    }

    tablero[filaAleatoria][columnaAleatoria].isBomb = true;
    bombasColocadas++;
  }

  const direcciones = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (let fila = 0; fila < rows; fila++) {
    for (let columna = 0; columna < cols; columna++) {
      if (tablero[fila][columna].isBomb) continue;

      let contadorBombas = 0;

      for (let d = 0; d < direcciones.length; d++) {
        const [df, dc] = direcciones[d];
        const nuevaFila = fila + df;
        const nuevaColumna = columna + dc;

        if (nuevaFila >= 0 && nuevaFila < rows && 
            nuevaColumna >= 0 && nuevaColumna < cols) {
          if (tablero[nuevaFila][nuevaColumna].isBomb) {
            contadorBombas++;
          }
        }
      }

      tablero[fila][columna].bombasAlrededor = contadorBombas;
    }
  }

  return tablero;
}

function App() {
  const [configModo, setConfigModo] = useState(true);
  const [configRows, setConfigRows] = useState(DEFAULT_ROWS);
  const [configCols, setConfigCols] = useState(DEFAULT_COLS);
  const [configBombs, setConfigBombs] = useState(DEFAULT_BOMBS);
  const [error, setError] = useState("");

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [bombs, setBombs] = useState(DEFAULT_BOMBS);
  const [tablero, setTablero] = useState([]);
  const [primerClick, setPrimerClick] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const [tiempoActivo, setTiempoActivo] = useState(false);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (!configModo) {
      setTablero(crearTablero(rows, cols, bombs));
    }
  }, [configModo, rows, cols, bombs]);

  useEffect(() => {
    if (tiempoActivo) {
      intervalRef.current = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior + 1);
      }, 1000);
    } else if (!tiempoActivo && tiempo !== 0) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tiempoActivo, tiempo]);

  useEffect(() => {
    if (gameOver || gameWon) {
      setTiempoActivo(false);
    }
  }, [gameOver, gameWon]);

  function revelarCeldasAdyacentes(board, row, col, visited = new Set()) {
    const claveCelda = `${row},${col}`;

    if (visited.has(claveCelda) || 
        row < 0 || row >= rows || 
        col < 0 || col >= cols) {
      return board;
    }

    visited.add(claveCelda);

    if (board[row][col].isRevealed || 
        board[row][col].conBandera || 
        board[row][col].isBomb) {
      return board;
    }

    board[row][col] = {
      ...board[row][col],
      isRevealed: true,
      clickado: true
    };

    if (board[row][col].bombasAlrededor === 0) {
      const direcciones = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];

      for (let i = 0; i < direcciones.length; i++) {
        const [df, dc] = direcciones[i];
        const nuevaFila = row + df;
        const nuevaColumna = col + dc;
        board = revelarCeldasAdyacentes(board, nuevaFila, nuevaColumna, visited);
      }
    }

    return board;
  }

  function checkWinCondition(board) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isBomb && !board[r][c].isRevealed) {
          return false;
        }
      }
    }
    return true;
  }

  function handleClick(row, col) {
    if (gameOver || gameWon || tablero[row][col].isRevealed || tablero[row][col].conBandera) {
      return;
    }

    if (primerClick) {
      setTiempoActivo(true);
    }

    let nuevoTablero;

    if (primerClick) {
      nuevoTablero = crearTablero(rows, cols, bombs, row, col);

      const direcciones = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];

      for (let i = 0; i < direcciones.length; i++) {
        const [df, dc] = direcciones[i];
        const nuevaFila = row + df;
        const nuevaColumna = col + dc;

        if (nuevaFila >= 0 && nuevaFila < rows && 
            nuevaColumna >= 0 && nuevaColumna < cols && 
            nuevoTablero[nuevaFila][nuevaColumna].isBomb) {
          
          nuevoTablero[nuevaFila][nuevaColumna].isBomb = false;

          let bombaPuesta = false;
          while (!bombaPuesta) {
            const filaAleatoria = Math.floor(Math.random() * rows);
            const columnaAleatoria = Math.floor(Math.random() * cols);

            let esAdyacente = false;
            for (let j = 0; j < direcciones.length; j++) {
              const [dff, dcc] = direcciones[j];
              const filaAdyacente = row + dff;
              const columnaAdyacente = col + dcc;

              if (filaAleatoria === filaAdyacente && columnaAleatoria === columnaAdyacente) {
                esAdyacente = true;
                break;
              }
            }

            if (!nuevoTablero[filaAleatoria][columnaAleatoria].isBomb && 
                !(filaAleatoria === row && columnaAleatoria === col) &&
                !esAdyacente) {
              nuevoTablero[filaAleatoria][columnaAleatoria].isBomb = true;
              bombaPuesta = true;
            }
          }
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (nuevoTablero[r][c].isBomb) continue;

          let contadorBombas = 0;
          for (let d = 0; d < direcciones.length; d++) {
            const [df, dc] = direcciones[d];
            const nuevaFila = r + df;
            const nuevaColumna = c + dc;

            if (nuevaFila >= 0 && nuevaFila < rows && 
                nuevaColumna >= 0 && nuevaColumna < cols) {
              if (nuevoTablero[nuevaFila][nuevaColumna].isBomb) {
                contadorBombas++;
              }
            }
          }
          nuevoTablero[r][c].bombasAlrededor = contadorBombas;
        }
      }

      setPrimerClick(false);
    } else {
      nuevoTablero = [...tablero];
    }

    if (nuevoTablero[row][col].isBomb) {
      nuevoTablero = nuevoTablero.map(fila => 
        fila.map(celda => {
          if (celda.isBomb) {
            return { ...celda, isRevealed: true, clickado: true };
          }
          return celda;
        })
      );
      nuevoTablero[row][col] = { ...nuevoTablero[row][col], isRevealed: true, clickado: true };
      setGameOver(true);
    } else {
      nuevoTablero = revelarCeldasAdyacentes([...nuevoTablero], row, col, new Set());

      if (checkWinCondition(nuevoTablero)) {
        setGameWon(true);
      }
    }

    setTablero(nuevoTablero);
  }

  function banderaRightClick(event, row, col) {
    event.preventDefault();

    if (gameOver || gameWon || tablero[row][col].isRevealed) {
      return;
    }

    const nuevoTablero = tablero.map((fila, indiceFila) =>
      fila.map((celda, indiceColumna) => {
        if (indiceFila === row && indiceColumna === col) {
          const nuevaBandera = !celda.conBandera;
          if (nuevaBandera) {
            setFlagCount(contadorActual => contadorActual + 1);
          } else {
            setFlagCount(contadorActual => contadorActual - 1);
          }
          return {...celda, conBandera: nuevaBandera};
        }
        return celda;
      })
    );

    setTablero(nuevoTablero);
  }

  function reiniciarJuego() {
    setConfigModo(true);
    setTablero([]);
    setPrimerClick(true);
    setGameOver(false);
    setGameWon(false);
    setFlagCount(0);
    setTiempo(0);
    setTiempoActivo(false);
    setError("");
  }

  function formatarTiempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    const minutosFormateados = minutos.toString().padStart(2, '0');
    const segundosFormateados = segundosRestantes.toString().padStart(2, '0');
    return `${minutosFormateados}:${segundosFormateados}`;
  }

  function handleConfigSubmit(e) {
    e.preventDefault();
    
    const maxBombas = (configRows * configCols) - 9;
    
    if (configRows < 4 || configCols < 4) {
      setError("El tablero debe tener al menos 4x4 celdas");
      return;
    }

    if (configRows > 20 || configCols > 20) {
      setError("El tablero no puede exceder 20x20 celdas");
      return;
    }
    
    if (configBombs < 1) {
      setError("Debe haber al menos 1 bomba");
      return;
    }
    
    if (configBombs > maxBombas) {
      setError(`Demasiadas bombas. Máximo para este tamaño: ${maxBombas}`);
      return;
    }
    
    setRows(configRows);
    setCols(configCols);
    setBombs(configBombs);
    setConfigModo(false);
    setError("");
  }

  return (
    <Container className="mt-4 text-center">
      <h1>Buscaminas</h1>
      
      {configModo ? (
        <div className="mt-4 mb-4">
          <h3>Configurar tablero</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form onSubmit={handleConfigSubmit} className="mt-3">
            <Row className="justify-content-center">
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Filas</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={configRows}
                    onChange={(e) => setConfigRows(Number(e.target.value))}
                    min="4"
                    max="20"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Columnas</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={configCols}
                    onChange={(e) => setConfigCols(Number(e.target.value))}
                    min="4"
                    max="20"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Bombas</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={configBombs}
                    onChange={(e) => setConfigBombs(Number(e.target.value))}
                    min="1"
                    max={(configRows * configCols) - 9}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" type="submit" className="mt-2">
              Comenzar Juego
            </Button>
          </Form>
        </div>
      ) : (
        <>
          <Row className="mt-3 mb-3 justify-content-center">
            <Col xs={4} className="text-end">
              <h5>
                <Badge bg="warning">
                  Minas: {bombs - flagCount}
                </Badge>
              </h5>
            </Col>
            <Col xs={4}>
              <Button variant="primary" onClick={reiniciarJuego}>
                Configurar Nuevo Juego
              </Button>
            </Col>
            <Col xs={4} className="text-start">
              <h5>
                <Badge bg="info">
                  Tiempo: {formatarTiempo(tiempo)}
                </Badge>
              </h5>
            </Col>
          </Row>
          {gameOver && (
            <div className="alert alert-danger mb-3">
              <strong>¡Perdiste! 💣</strong>
            </div>
          )}
          
          {gameWon && (
            <div className="alert alert-success mb-3">
              <strong>¡Ganaste! 🎉</strong>
            </div>
          )}
          <div className="mt-3" style={{ overflowX: 'auto' }}>
            {tablero.map((fila, indiceFila) => (
              <Row key={indiceFila} className="justify-content-center flex-nowrap">
                {fila.map((celda, indiceColumna) => (
                  <Col xs="auto" key={indiceColumna} className="p-0">
                    <Button
                      variant={
                        celda.isRevealed 
                          ? celda.isBomb
                            ? "danger"   
                            : "light"    
                          : "secondary"
                      }
                      style={{ 
                        width: 40, 
                        height: 40,
                        fontSize: '0.9rem',
                        padding: 0
                      }}
                      onClick={() => handleClick(indiceFila, indiceColumna)}
                      onContextMenu={(e) => banderaRightClick(e, indiceFila, indiceColumna)}>
                      {celda.isRevealed
                        ? celda.isBomb
                          ? "💣" 
                          : celda.bombasAlrededor || ""
                        : celda.conBandera
                          ? "🚩"
                          : ""
                      }
                    </Button>
                  </Col>
                ))}
              </Row>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}

export default App;