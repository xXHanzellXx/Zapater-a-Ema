from datetime import datetime


def formatear_fecha(fecha):
    """Convierte un objeto datetime o string a un formato de cadena ISO serializable."""
    if isinstance(fecha, datetime):
        return fecha.isoformat()
    if isinstance(fecha, str):
        return fecha
    return None


def producto_to_json(producto):
    """Convierte los tipos BSON de MongoDB a tipos serializables en JSON."""
    if not producto:
        return None

    return {
        "_id": str(producto.get("_id", "")),
        "nombre": producto.get("nombre", ""),
        "descripcion": producto.get("descripcion", ""),
        "precio": float(producto.get("precio", 0.0)),
        "stock": int(producto.get("stock", 0)),
        "imagen": producto.get("imagen", ""),
        "categoria": producto.get("categoria", ""),
        "estado": producto.get("estado", "Disponible"),
        "fechaCreacion": formatear_fecha(producto.get("fechaCreacion")),
        "fechaActualizacion": formatear_fecha(producto.get("fechaActualizacion")),
    }
