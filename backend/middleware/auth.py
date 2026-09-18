import os

import jwt

from functools import wraps

from flask import request, jsonify


def admin_required(function):

    @wraps(function)
    def decorated(*args, **kwargs):

        authorization = request.headers.get(
            "Authorization"
        )

        # -------------------------------------------------
        # COMPROBAR TOKEN
        # -------------------------------------------------

        if not authorization:

            return jsonify({
                "error": "Autenticación requerida"
            }), 401


        if not authorization.startswith(
            "Bearer "
        ):

            return jsonify({
                "error": "Formato de autorización inválido"
            }), 401


        token = authorization.split(
            " ",
            1
        )[1].strip()


        if not token:

            return jsonify({
                "error": "Token vacío"
            }), 401


        # -------------------------------------------------
        # SECRET
        # -------------------------------------------------

        jwt_secret = os.getenv(
            "JWT_SECRET"
        )


        if not jwt_secret:

            return jsonify({
                "error": "JWT_SECRET no configurado"
            }), 500


        # -------------------------------------------------
        # VALIDAR TOKEN
        # -------------------------------------------------

        try:

            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"]
            )


        except jwt.ExpiredSignatureError:

            return jsonify({
                "error": "La sesión ha expirado"
            }), 401


        except jwt.InvalidTokenError:

            return jsonify({
                "error": "Token inválido"
            }), 401


        # -------------------------------------------------
        # COMPROBAR ROL
        # -------------------------------------------------

        if payload.get("rol") != "admin":

            return jsonify({
                "error": "No tienes permisos de administrador"
            }), 403


        # Guardar información del administrador
        # para usarla dentro de la ruta.

        request.admin = payload


        return function(
            *args,
            **kwargs
        )


    return decorated
