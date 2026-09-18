import os

from flask import Flask, jsonify

from flask_cors import CORS

from dotenv import load_dotenv

from config.database import test_connection

from routes.productos import productos_bp

from routes.categorias import categorias_bp

from routes.auth import auth_bp


# =========================================================
# VARIABLES DE ENTORNO
# =========================================================

load_dotenv()


# =========================================================
# FLASK
# =========================================================

app = Flask(
    __name__
)


# =========================================================
# CORS
# =========================================================

frontend_origins = os.getenv(
    "FRONTEND_ORIGIN",
    ""
)


origins = [

    origin.strip()

    for origin in frontend_origins.split(",")

    if origin.strip()

]


CORS(

    app,

    resources={

        r"/api/*": {

            "origins": origins

        }

    },

    methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
    ],

    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Setup-Key"
    ]

)


# =========================================================
# BLUEPRINTS
# =========================================================

app.register_blueprint(

    productos_bp,

    url_prefix="/api/productos"

)


app.register_blueprint(

    categorias_bp,

    url_prefix="/api/categorias"

)


app.register_blueprint(

    auth_bp,

    url_prefix="/api/auth"

)


# =========================================================
# RUTA PRINCIPAL
# =========================================================

@app.route("/")
def inicio():

    return jsonify({

        "mensaje":
            "API de Zapatería Ema funcionando",

        "estado":
            "OK",

        "version":
            "1.0.0"

    })


# =========================================================
# INFORMACIÓN DE LA API
# =========================================================

@app.route("/api")
def api_info():

    return jsonify({

        "nombre":
            "Zapatería Ema API",

        "version":
            "1.0.0",

        "endpoints": {

            "productos":
                "/api/productos",

            "categorias":
                "/api/categorias",

            "login":
                "/api/auth/login",

            "sesion":
                "/api/auth/me",

            "salud":
                "/api/health"

        }

    })


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health")
def health():

    mongodb = test_connection()


    return jsonify({

        "backend":
            "OK",

        "mongodb":
            "OK"
            if mongodb
            else "ERROR"

    }), 200 if mongodb else 503


# =========================================================
# ERRORES
# =========================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "error":
            "Ruta no encontrada"

    }), 404


@app.errorhandler(405)
def method_not_allowed(error):

    return jsonify({

        "error":
            "Método HTTP no permitido"

    }), 405


@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "error":
            "Error interno del servidor"

    }), 500


# =========================================================
# EJECUCIÓN
# =========================================================

if __name__ == "__main__":

    print("")
    print("========================================")
    print("       ZAPATERÍA EMA - BACKEND")
    print("========================================")


    if test_connection():

        print(
            "MongoDB Atlas: CONECTADO"
        )

    else:

        print(
            "MongoDB Atlas: ERROR"
        )


    # Render proporciona PORT.
    # Si no existe, usamos 5000 solamente
    # como respaldo.

    port = int(
        os.getenv(
            "PORT",
            "5000"
        )
    )


    print(
        f"Puerto: {port}"
    )

    print(
        "========================================"
    )


    app.run(

        host="0.0.0.0",

        port=port,

        debug=False

    )
