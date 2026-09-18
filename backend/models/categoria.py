from datetime import datetime


def producto_to_json(producto):

    fecha_creacion = producto.get(
        "fechaCreacion"
    )

    fecha_actualizacion = producto.get(
        "fechaActualizacion"
    )

    return {

        "id": str(
            producto["_id"]
        ),

        "nombre": producto.get(
            "nombre",
            ""
        ),

        "descripcion": producto.get(
            "descripcion",
            ""
        ),

        "precio": producto.get(
            "precio",
            0
        ),

        "stock": producto.get(
            "stock",
            0
        ),

        "imagen": producto.get(
            "imagen",
            ""
        ),

        "categoria": producto.get(
            "categoria",
            ""
        ),

        "estado": producto.get(
            "estado",
            "Agotado"
        ),

        "fechaCreacion": (
            fecha_creacion.isoformat()
            if isinstance(
                fecha_creacion,
                datetime
            )
            else None
        ),

        "fechaActualizacion": (
            fecha_actualizacion.isoformat()
            if isinstance(
                fecha_actualizacion,
                datetime
            )
            else None
        )
    }
