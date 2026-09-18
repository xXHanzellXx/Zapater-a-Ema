def administrador_to_json(admin):

    return {

        "id": str(
            admin["_id"]
        ),

        "nombre": admin.get(
            "nombre",
            ""
        ),

        "email": admin.get(
            "email",
            ""
        ),

        "rol": admin.get(
            "rol",
            "admin"
        )
    }
