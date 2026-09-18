from flask import Blueprint, request, jsonify

from bson import ObjectId
from bson.errors import InvalidId

from datetime import datetime

from config.database import categorias_collection

from models.categoria import categoria_to_json

from middleware.auth import admin_required


categorias_bp = Blueprint(
    "categorias",
    __name__
)


# =========================================================
# GET /api/categorias
# =========================================================

@categorias_bp.route(
    "/",
    methods=["GET"]
)
def obtener_categorias():

    categorias = categorias_collection.find().sort(
        "nombre",
        1
    )

    return jsonify([

        categoria_to_json(categoria)

        for categoria in categorias

    ])


# =========================================================
# GET /api/categorias/<id>
# =========================================================

@categorias_bp.route(
    "/<id>",
    methods=["GET"]
)
def obtener_categoria(id):

    try:

        object_id = ObjectId(id)

    except InvalidId:

        return jsonify({
            "error": "ID inválido"
        }), 400


    categoria = categorias_collection.find_one({

        "_id": object_id

    })


    if not categoria:

        return jsonify({
            "error": "Categoría no encontrada"
        }), 404


    return jsonify(
        categoria_to_json(categoria)
    )


# =========================================================
# POST /api/categorias
# ADMINISTRADOR
# =========================================================

@categorias_bp.route(
    "/",
    methods=["POST"]
)
@admin_required
def crear_categoria():

    datos = request.get_json()


    if not datos:

        return jsonify({
            "error": "No se recibieron datos"
        }), 400


    nombre = datos.get(
        "nombre"
    )


    if not nombre:

        return jsonify({
            "error": "El nombre es obligatorio"
        }), 400


    nombre = str(
        nombre
    ).strip()


    # -----------------------------------------------------
    # EVITAR DUPLICADOS
    # -----------------------------------------------------

    existente = categorias_collection.find_one({

        "nombre": {
            "$regex": f"^{nombre}$",
            "$options": "i"
        }

    })


    if existente:

        return jsonify({
            "error": "La categoría ya existe"
        }), 409


    categoria = {

        "nombre": nombre,

        "descripcion": str(
            datos.get(
                "descripcion",
                ""
            )
        ).strip(),

        "imagen": str(
            datos.get(
                "imagen",
                ""
            )
        ).strip(),

        "fechaCreacion": datetime.utcnow()
    }


    resultado = categorias_collection.insert_one(
        categoria
    )


    categoria["_id"] = (
        resultado.inserted_id
    )


    return jsonify(
        categoria_to_json(categoria)
    ), 201


# =========================================================
# PUT /api/categorias/<id>
# ADMINISTRADOR
# =========================================================

@categorias_bp.route(
    "/<id>",
    methods=["PUT"]
)
@admin_required
def editar_categoria(id):

    try:

        object_id = ObjectId(id)

    except InvalidId:

        return jsonify({
            "error": "ID inválido"
        }), 400


    datos = request.get_json()


    if not datos:

        return jsonify({
            "error": "No se recibieron datos"
        }), 400


    cambios = {}


    if "nombre" in datos:

        nombre = str(
            datos["nombre"]
        ).strip()


        if not nombre:

            return jsonify({
                "error": "El nombre es obligatorio"
            }), 400


        cambios["nombre"] = nombre


    if "descripcion" in datos:

        cambios["descripcion"] = str(
            datos["descripcion"]
        ).strip()


    if "imagen" in datos:

        cambios["imagen"] = str(
            datos["imagen"]
        ).strip()


    if not cambios:

        return jsonify({
            "error": "No hay cambios para realizar"
        }), 400


    resultado = categorias_collection.update_one(

        {
            "_id": object_id
        },

        {
            "$set": cambios
        }

    )


    if resultado.matched_count == 0:

        return jsonify({
            "error": "Categoría no encontrada"
        }), 404


    categoria = categorias_collection.find_one({

        "_id": object_id

    })


    return jsonify(
        categoria_to_json(categoria)
    )


# =========================================================
# DELETE /api/categorias/<id>
# ADMINISTRADOR
# =========================================================

@categorias_bp.route(
    "/<id>",
    methods=["DELETE"]
)
@admin_required
def eliminar_categoria(id):

    try:

        object_id = ObjectId(id)

    except InvalidId:

        return jsonify({
            "error": "ID inválido"
        }), 400


    resultado = categorias_collection.delete_one({

        "_id": object_id

    })


    if resultado.deleted_count == 0:

        return jsonify({
            "error": "Categoría no encontrada"
        }), 404


    return jsonify({

        "mensaje":
            "Categoría eliminada correctamente"

    })
