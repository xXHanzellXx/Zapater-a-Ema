from flask import Blueprint, request, jsonify

from bson import ObjectId
from bson.errors import InvalidId

from datetime import datetime

from config.database import productos_collection

from models.producto import producto_to_json

from middleware.auth import admin_required


productos_bp = Blueprint(
    "productos",
    __name__
)


# =========================================================
# GET /api/productos
# Obtener todos los productos
# =========================================================

@productos_bp.route(
    "/",
    methods=["GET"]
)
def obtener_productos():

    productos = productos_collection.find().sort(
        "fechaCreacion",
        -1
    )

    return jsonify([

        producto_to_json(producto)

        for producto in productos

    ])


# =========================================================
# GET /api/productos/<id>
# Obtener un producto
# =========================================================

@productos_bp.route(
    "/<id>",
    methods=["GET"]
)
def obtener_producto(id):

    try:

        object_id = ObjectId(id)

    except InvalidId:

        return jsonify({
            "error": "ID de producto inválido"
        }), 400


    producto = productos_collection.find_one({
        "_id": object_id
    })


    if not producto:

        return jsonify({
            "error": "Producto no encontrado"
        }), 404


    return jsonify(
        producto_to_json(producto)
    )


# =========================================================
# POST /api/productos
# Crear producto
# ADMINISTRADOR
# =========================================================

@productos_bp.route(
    "/",
    methods=["POST"]
)
@admin_required
def crear_producto():

    datos = request.get_json()


    if not datos:

        return jsonify({
            "error": "No se recibieron datos"
        }), 400


    # -----------------------------------------------------
    # DATOS
    # -----------------------------------------------------

    nombre = datos.get(
        "nombre"
    )

    descripcion = datos.get(
        "descripcion",
        ""
    )

    precio = datos.get(
        "precio"
    )

    stock = datos.get(
        "stock"
    )

    imagen = datos.get(
        "imagen",
        ""
    )

    categoria = datos.get(
        "categoria",
        ""
    )


    # -----------------------------------------------------
    # VALIDACIONES
    # -----------------------------------------------------

    if not nombre:

        return jsonify({
            "error": "El nombre es obligatorio"
        }), 400


    if precio is None:

        return jsonify({
            "error": "El precio es obligatorio"
        }), 400


    if stock is None:

        return jsonify({
            "error": "El stock es obligatorio"
        }), 400


    try:

        precio = float(
            precio
        )

        stock = int(
            stock
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "error": "Precio o stock inválido"
        }), 400


    if precio < 0:

        return jsonify({
            "error": "El precio no puede ser negativo"
        }), 400


    if stock < 0:

        return jsonify({
            "error": "El stock no puede ser negativo"
        }), 400


    # -----------------------------------------------------
    # PRODUCTO
    # -----------------------------------------------------

    producto = {

        "nombre": str(
            nombre
        ).strip(),

        "descripcion": str(
            descripcion
        ).strip(),

        "precio": precio,

        "stock": stock,

        "imagen": str(
            imagen
        ).strip(),

        "categoria": str(
            categoria
        ).strip(),

        "estado": (
            "Disponible"
            if stock > 0
            else "Agotado"
        ),

        "fechaCreacion": datetime.utcnow(),

        "fechaActualizacion": datetime.utcnow()
    }


    # -----------------------------------------------------
    # INSERTAR
    # -----------------------------------------------------

    resultado = productos_collection.insert_one(
        producto
    )


    producto["_id"] = (
        resultado.inserted_id
    )


    return jsonify(
        producto_to_json(producto)
    ), 201


# =========================================================
# PUT /api/productos/<id>
# Editar producto
# ADMINISTRADOR
# =========================================================

@productos_bp.route(
    "/<id>",
    methods=["PUT"]
)
@admin_required
def editar_producto(id):

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


    # -----------------------------------------------------
    # NOMBRE
    # -----------------------------------------------------

    if "nombre" in datos:

        nombre = str(
            datos["nombre"]
        ).strip()


        if not nombre:

            return jsonify({
                "error": "El nombre no puede estar vacío"
            }), 400


        cambios["nombre"] = nombre


    # -----------------------------------------------------
    # DESCRIPCIÓN
    # -----------------------------------------------------

    if "descripcion" in datos:

        cambios["descripcion"] = str(
            datos["descripcion"]
        ).strip()


    # -----------------------------------------------------
    # IMAGEN
    # -----------------------------------------------------

    if "imagen" in datos:

        cambios["imagen"] = str(
            datos["imagen"]
        ).strip()


    # -----------------------------------------------------
    # CATEGORÍA
    # -----------------------------------------------------

    if "categoria" in datos:

        cambios["categoria"] = str(
            datos["categoria"]
        ).strip()


    # -----------------------------------------------------
    # PRECIO
    # -----------------------------------------------------

    if "precio" in datos:

        try:

            precio = float(
                datos["precio"]
            )

        except (
            ValueError,
            TypeError
        ):

            return jsonify({
                "error": "Precio inválido"
            }), 400


        if precio < 0:

            return jsonify({
                "error": "El precio no puede ser negativo"
            }), 400


        cambios["precio"] = precio


    # -----------------------------------------------------
    # STOCK
    # -----------------------------------------------------

    if "stock" in datos:

        try:

            stock = int(
                datos["stock"]
            )

        except (
            ValueError,
            TypeError
        ):

            return jsonify({
                "error": "Stock inválido"
            }), 400


        if stock < 0:

            return jsonify({
                "error": "El stock no puede ser negativo"
            }), 400


        cambios["stock"] = stock

        cambios["estado"] = (

            "Disponible"
            if stock > 0
            else "Agotado"

        )


    # -----------------------------------------------------
    # FECHA
    # -----------------------------------------------------

    cambios[
        "fechaActualizacion"
    ] = datetime.utcnow()


    # -----------------------------------------------------
    # ACTUALIZAR
    # -----------------------------------------------------

    resultado = productos_collection.update_one(

        {
            "_id": object_id
        },

        {
            "$set": cambios
        }

    )


    if resultado.matched_count == 0:

        return jsonify({
            "error": "Producto no encontrado"
        }), 404


    producto = productos_collection.find_one({

        "_id": object_id

    })


    return jsonify(
        producto_to_json(producto)
    )


# =========================================================
# DELETE /api/productos/<id>
# Eliminar producto
# ADMINISTRADOR
# =========================================================

@productos_bp.route(
    "/<id>",
    methods=["DELETE"]
)
@admin_required
def eliminar_producto(id):

    try:

        object_id = ObjectId(id)

    except InvalidId:

        return jsonify({
            "error": "ID inválido"
        }), 400


    resultado = productos_collection.delete_one({

        "_id": object_id

    })


    if resultado.deleted_count == 0:

        return jsonify({
            "error": "Producto no encontrado"
        }), 404


    return jsonify({

        "mensaje":
            "Producto eliminado correctamente"

    })
