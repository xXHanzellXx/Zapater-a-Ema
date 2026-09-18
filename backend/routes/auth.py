import os

import bcrypt
import jwt

from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify

from config.database import (
    administradores_collection
)

from models.administrador import (
    administrador_to_json
)

from middleware.auth import (
    admin_required
)


auth_bp = Blueprint(
    "auth",
    __name__
)


# =========================================================
# POST /api/auth/login
# LOGIN
# =========================================================

@auth_bp.route(
    "/login",
    methods=["POST"]
)
def login():

    datos = request.get_json()


    if not datos:

        return jsonify({
            "error": "No se recibieron datos"
        }), 400


    email = datos.get(
        "email"
    )

    password = datos.get(
        "password"
    )


    if not email or not password:

        return jsonify({
            "error":
                "Correo y contraseña son obligatorios"
        }), 400


    email = str(
        email
    ).strip().lower()


    # -----------------------------------------------------
    # BUSCAR ADMIN
    # -----------------------------------------------------

    admin = administradores_collection.find_one({

        "email": email

    })


    if not admin:

        return jsonify({
            "error": "Credenciales incorrectas"
        }), 401


    # -----------------------------------------------------
    # COMPROBAR CONTRASEÑA
    # -----------------------------------------------------

    try:

        password_correcta = bcrypt.checkpw(

            str(password).encode(
                "utf-8"
            ),

            admin["password"].encode(
                "utf-8"
            )

        )

    except Exception:

        return jsonify({
            "error":
                "No se pudo verificar la contraseña"
        }), 500


    if not password_correcta:

        return jsonify({
            "error": "Credenciales incorrectas"
        }), 401


    # -----------------------------------------------------
    # JWT
    # -----------------------------------------------------

    jwt_secret = os.getenv(
        "JWT_SECRET"
    )


    if not jwt_secret:

        return jsonify({
            "error":
                "JWT_SECRET no está configurado"
        }), 500


    payload = {

        "id": str(
            admin["_id"]
        ),

        "email": admin[
            "email"
        ],

        "rol": admin.get(
            "rol",
            "admin"
        ),

        "exp":
            datetime.utcnow()
            + timedelta(
                hours=8
            )
    }


    token = jwt.encode(

        payload,

        jwt_secret,

        algorithm="HS256"

    )


    return jsonify({

        "mensaje":
            "Inicio de sesión correcto",

        "token":
            token,

        "admin":
            administrador_to_json(
                admin
            )

    })


# =========================================================
# GET /api/auth/me
# COMPROBAR SESIÓN
# =========================================================

@auth_bp.route(
    "/me",
    methods=["GET"]
)
@admin_required
def obtener_sesion():

    admin = administradores_collection.find_one({

        "email":
            request.admin["email"]

    })


    if not admin:

        return jsonify({
            "error":
                "Administrador no encontrado"
        }), 404


    return jsonify({

        "admin":
            administrador_to_json(
                admin
            )

    })


# =========================================================
# POST /api/auth/setup-admin
#
# SOLO PARA CREAR EL PRIMER ADMINISTRADOR
# =========================================================

@auth_bp.route(
    "/setup-admin",
    methods=["POST"]
)
def setup_admin():

    setup_key = os.getenv(
        "SETUP_KEY"
    )


    if not setup_key:

        return jsonify({
            "error":
                "SETUP_KEY no configurada"
        }), 500


    # -----------------------------------------------------
    # COMPROBAR CLAVE DE CONFIGURACIÓN
    # -----------------------------------------------------

    provided_key = request.headers.get(
        "X-Setup-Key"
    )


    if provided_key != setup_key:

        return jsonify({
            "error":
                "Clave de configuración incorrecta"
        }), 403


    # -----------------------------------------------------
    # EVITAR CREAR MÁS ADMINISTRADORES
    # -----------------------------------------------------

    cantidad = administradores_collection.count_documents({})


    if cantidad > 0:

        return jsonify({
            "error":
                "Ya existe un administrador. "
                "No se puede utilizar este endpoint."
        }), 409


    datos = request.get_json()


    if not datos:

        return jsonify({
            "error":
                "No se recibieron datos"
        }), 400


    nombre = datos.get(
        "nombre"
    )

    email = datos.get(
        "email"
    )

    password = datos.get(
        "password"
    )


    if not nombre or not email or not password:

        return jsonify({
            "error":
                "Nombre, correo y contraseña son obligatorios"
        }), 400


    nombre = str(
        nombre
    ).strip()


    email = str(
        email
    ).strip().lower()


    password = str(
        password
    )


    if len(password) < 8:

        return jsonify({
            "error":
                "La contraseña debe tener mínimo 8 caracteres"
        }), 400


    # -----------------------------------------------------
    # HASH
    # -----------------------------------------------------

    password_hash = bcrypt.hashpw(

        password.encode(
            "utf-8"
        ),

        bcrypt.gensalt()

    ).decode(
        "utf-8"
    )


    # -----------------------------------------------------
    # ADMINISTRADOR
    # -----------------------------------------------------

    administrador = {

        "nombre":
            nombre,

        "email":
            email,

        "password":
            password_hash,

        "rol":
            "admin",

        "fechaCreacion":
            datetime.utcnow()
    }


    resultado = (
        administradores_collection.insert_one(
            administrador
        )
    )


    administrador["_id"] = (
        resultado.inserted_id
    )


    return jsonify({

        "mensaje":
            "Administrador creado correctamente",

        "admin":
            administrador_to_json(
                administrador
            )

    }), 201
