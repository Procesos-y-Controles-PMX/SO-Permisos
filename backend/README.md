# Backend local setup (SO-Permisos)

## 1) Crear y activar entorno virtual

### macOS / Linux
```bash
python -m venv .venv
source .venv/bin/activate
```

### Windows (PowerShell)
```powershell
python -m venv .venv
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\.venv\Scripts\activate
```

## 2) Instalar dependencias
```bash
pip install -r requirements.txt
```

## 3) Configurar variables y credenciales
```bash
cp .env.example .env
cp client_secret.example.json client_secret.json
```

`token.json` no se recomienda crear manualmente. Se genera al autenticar Gmail OAuth por primera vez.

## 4) Ejecutar el backend
```bash
uvicorn app.main:app --reload
```

## 5) Probar endpoints principales
- `GET http://127.0.0.1:8000/`
- `GET http://127.0.0.1:8000/supabase-check`
- `POST http://127.0.0.1:8000/api/v1/notificar?email=test@correo.com&estatus=aprobada`

## Seguridad
- No subir al repositorio archivos reales: `.env`, `client_secret.json`, `token.json`.
- Comparte solo los `*.example` con valores de ejemplo.
