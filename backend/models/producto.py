import os

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError


# =========================================================
# CARGAR VARIABLES DE ENTORNO
# =========================================================

load_dotenv()


MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "zapateria")


# =========================================================
# VALIDAR CONFIGURACIÓN
# =========================================================

if not MONGO_URI:
    raise RuntimeError(
        "ERROR: No existe MONGO_URI en las variables de entorno."
    )


# =========================================================
# CONEXIÓN A MONGODB
# =========================================================

try:

    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=10000
    )

    db = client[DB_NAME]

    productos_collection = db["productos"]

    categorias_collection = db["categorias"]

    administradores_collection = db["administradores"]

except Exception as error:

    print(
        f"ERROR creando la conexión MongoDB: {error}"
    )

    raise


# =========================================================
# COMPROBAR CONEXIÓN
# =========================================================

def test_connection():

    try:

        client.admin.command("ping")

        return True

    except PyMongoError as error:

        print(
            f"ERROR conectando con MongoDB: {error}"
        )

        return False
