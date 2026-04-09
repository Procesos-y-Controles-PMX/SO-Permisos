import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# Importamos el router que creamos en el paso anterior
from app.routes import solicitudes 

load_dotenv()

# --- Configuración de Supabase ---
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("⚠️ ERROR: No se encontraron variables de Supabase en el .env")
    supabase = None
else:
    # Esta instancia es la que usarás para guardar las solicitudes en la DB
    supabase: Client = create_client(url, key)

app = FastAPI(title="SO-Permisos API")

# --- Middleware (CRUCIAL para conectar con Next.js) ---
app.add_middleware(
    CORSMiddleware,
    # Aquí permitimos que tu frontend en el puerto 3000 pueda hacer peticiones
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Incluir Rutas de la App ---
# Registramos las rutas de correos que hicimos
app.include_router(solicitudes.router, prefix="/api/v1", tags=["Solicitudes"])

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "Backend de SO-Permisos funcionando",
        "supabase_connected": supabase is not None
    }

# Mantenemos tu check de conexión para pruebas
@app.get("/supabase-check")
def check_supabase():
    if not supabase:
        return {"error": "Cliente de Supabase no inicializado"}
    try:
        response = supabase.table("test_connection").select("*").execute()
        return {"datos": response.data}
    except Exception as e:
        return {"error": str(e)}