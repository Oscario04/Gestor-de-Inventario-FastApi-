# Gestor de Inventario — FastAPI + MongoDB Atlas

Proyecto académico que implementa una aplicación web funcional con:

- API REST desarrollada con FastAPI.
- Validación estricta mediante Pydantic.
- Persistencia asíncrona en MongoDB Atlas usando Motor.
- Gestión del ciclo de vida de la aplicación mediante `@asynccontextmanager`.
- Procesamiento CPU intensivo delegado a un hilo con `asyncio.to_thread()`.
- Frontend HTML5 + JavaScript Vanilla.
- Servido de archivos estáticos directamente desde FastAPI.
- Consumo dinámico de la API mediante `fetch()`.

## 1. Requisitos

- Python 3.11 o superior.
- Una cuenta de MongoDB Atlas.
- Git para versionar el proyecto.

## 2. Instalación

Crear y activar un entorno virtual:

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

## 3. Configurar MongoDB Atlas

1. Crear un cluster en MongoDB Atlas.
2. Crear un usuario de base de datos.
3. Configurar el acceso de red para permitir la conexión de tu computadora.
4. Copiar la URI de conexión.
5. Crear un archivo `.env` a partir de `.env.example`.

Ejemplo:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=inventory_db
```

No subas `.env` a GitHub. El archivo `.gitignore` ya está configurado para ignorarlo.

## 4. Ejecutar

Desde la carpeta raíz:

```bash
uvicorn app.main:app --reload
```

Abrir:

```text
http://127.0.0.1:8000
```

Documentación automática:

```text
http://127.0.0.1:8000/docs
```

## 5. Endpoints

### Crear producto

```http
POST /api/products
```

Respuesta exitosa: `201 Created`.

Ejemplo:

```json
{
  "name": "Café americano",
  "category": "Bebidas",
  "price": 45,
  "stock": 100,
  "min_stock": 10
}
```

### Listar productos

```http
GET /api/products
```

Respuesta: `200 OK`.

### Obtener producto

```http
GET /api/products/{product_id}
```

Respuestas:
- `200 OK`
- `400 Bad Request` si el ID no tiene formato válido.
- `404 Not Found` si el producto no existe.

### Actualizar producto

```http
PUT /api/products/{product_id}
```

Respuestas:
- `200 OK`
- `400 Bad Request`
- `404 Not Found`

### Eliminar producto

```http
DELETE /api/products/{product_id}
```

Respuestas:
- `204 No Content`
- `400 Bad Request`
- `404 Not Found`

### Procesamiento CPU

```http
POST /api/reports/cpu
```

Ejemplo:

```json
{
  "iterations": 35000000
}
```

El cálculo se ejecuta mediante:

```python
await asyncio.to_thread(cpu_intensive_task, payload.iterations)
```

Esto evita ejecutar la función CPU-bound directamente sobre el event loop de FastAPI.

## 6. Prueba de concurrencia

La aplicación incluye una prueba visual.

1. Ejecuta el servidor.
2. Abre `http://127.0.0.1:8000`.
3. En "Prueba de concurrencia", pulsa "Generar reporte pesado".
4. Mientras el cálculo está ejecutándose, pulsa "Actualizar".
5. La API debe continuar respondiendo y la lista de productos debe poder actualizarse mientras el cálculo está en curso.

También puedes demostrarlo desde dos terminales.

### Terminal A

Ejecuta una petición pesada:

```bash
curl -X POST http://127.0.0.1:8000/api/reports/cpu \
  -H "Content-Type: application/json" \
  -d "{\"iterations\":35000000}"
```

### Terminal B

Mientras la anterior sigue procesando:

```bash
curl http://127.0.0.1:8000/api/products
```

La segunda petición puede responder mientras la tarea CPU se ejecuta en el hilo secundario.

> Nota técnica: `asyncio.to_thread()` evita bloquear el event loop. En CPython, una función Python puramente CPU-bound sigue limitada por el GIL para el paralelismo de ejecución, pero el objetivo de esta práctica es demostrar que el event loop permanece disponible para atender otras solicitudes.

## 7. Arquitectura

```text
gestor_inventario/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   └── routers/
│       ├── __init__.py
│       ├── products.py
│       └── reports.py
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

Flujo principal:

```text
Frontend
   │
   │ fetch()
   ▼
FastAPI
   │
   ├── Pydantic → validación
   │
   ├── Products Router → CRUD
   │                         │
   │                         ▼
   │                    MongoDB Atlas
   │
   └── Reports Router
              │
              ▼
       asyncio.to_thread()
              │
              ▼
       tarea CPU intensiva
```

## 8. Relación con los criterios de evaluación

| Criterio | Implementación |
|---|---|
| Arquitectura y Código | Separación de routers, modelos y conexión a BD; variables en `.env` |
| APIs y Datos | Pydantic, CRUD, códigos HTTP semánticos y validación de ObjectId |
| Concurrencia | `asyncio.to_thread()` en `/api/reports/cpu` |
| Frontend | HTML5 + JS Vanilla + `fetch()` + StaticFiles |
| Documentación y Git | README, requirements, `.env.example` y `.gitignore` |

## 9. Preparación para GitHub

Antes de subir:

```bash
git init
git add .
git commit -m "Proyecto inicial gestor de inventario"
```

Asegúrate de que `.env` NO aparezca en:

```bash
git status
```

El `.env.example` sí debe subirse.

## 10. Entrega

El repositorio debe contener todo el código del proyecto excepto secretos y credenciales.

No se incluyen credenciales reales de MongoDB.
# Gestor-de-Inventario-FastApi-
