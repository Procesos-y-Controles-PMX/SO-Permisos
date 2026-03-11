import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Variables de entorno
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

# Inicialización estándar (gracias a pip-system-certs ya no ocupamos parches)
if not url or not key:
    print("⚠️ ERROR: No se encontraron variables en el .env")
    supabase = None
else:
    supabase: Client = create_client(url, key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/supabase-check")
def check_supabase():
    if not supabase:
        return {"error": "Cliente de Supabase no inicializado"}
    try:
        response = supabase.table("test_connection").select("*").execute()
        return {"datos": response.data}
    except Exception as e:
        # Si el error de SSL persiste, aquí lo veremos, pero ya no debería
        return {"error": str(e)}