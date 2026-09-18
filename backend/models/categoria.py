from datetime import datetime


def formatear_fecha(fecha):
    """Convierte un objeto datetime o string a un formato de cadena ISO serializable."""
    if isinstance(fecha, datetime):
        return fecha.isoformat()
    if isinstance(fecha, str):
        return fecha
    return None


def categoria_to_json(categoria):
    """Convierte los tipos BSON de MongoDB a tipos serializables en JSON."""
    if not categoria:
        return None

    return {
        "_id": str(categoria.get("_id", "")),
        "nombre": categoria.get("nombre", ""),
        "descripcion": categoria.get("descripcion", ""),
        "estado": categoria.get("estado", "Activo"),
        "fechaCreacion": formatear_fecha(categoria.get("fechaCreacion")),
        "fechaActualizacion": formatear_fecha(categoria.get("fechaActualizacion")),
    }
