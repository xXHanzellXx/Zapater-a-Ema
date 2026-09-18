/*
=========================================================
ZAPATERÍA EMA
API CLIENT
=========================================================
*/

// URL DEL BACKEND DE RENDER
//
// Cuando Render te dé tu URL definitiva,
// debe quedar así:
//
// https://zapateria-ema-api.onrender.com/api
//

const API_BASE = "https://zapateria-ema-api.onrender.com/api";


/*
=========================================================
TOKEN
=========================================================
*/

const TOKEN_KEY = "zapateria_ema_admin_token";


function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}


function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}


function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}


/*
=========================================================
PETICIÓN GENERAL
=========================================================
*/

async function apiRequest(
    endpoint,
    options = {}
) {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }


    const config = {
        ...options,
        headers
    };


    try {

        const response = await fetch(
            `${API_BASE}${endpoint}`,
            config
        );


        let data = null;

        const contentType =
            response.headers.get("content-type") || "";


        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }


        if (!response.ok) {

            const message =
                typeof data === "object" && data?.error
                    ? data.error
                    : "Ocurrió un error en la solicitud.";

            const error = new Error(message);

            error.status = response.status;
            error.data = data;

            throw error;
        }


        return data;

    } catch (error) {

        if (error instanceof TypeError) {

            throw new Error(
                "No se pudo conectar con el servidor. Verifica que el backend de Render esté funcionando."
            );
        }

        throw error;
    }
}


/*
=========================================================
PRODUCTOS
=========================================================
*/

async function getProducts() {

    return await apiRequest(
        "/productos/"
    );
}


async function getProduct(id) {

    return await apiRequest(
        `/productos/${id}`
    );
}


async function createProduct(product) {

    return await apiRequest(
        "/productos/",
        {
            method: "POST",
            body: JSON.stringify(product)
        }
    );
}


async function updateProduct(
    id,
    product
) {

    return await apiRequest(
        `/productos/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(product)
        }
    );
}


async function deleteProduct(id) {

    return await apiRequest(
        `/productos/${id}`,
        {
            method: "DELETE"
        }
    );
}


/*
=========================================================
CATEGORÍAS
=========================================================
*/

async function getCategories() {

    return await apiRequest(
        "/categorias/"
    );
}


async function getCategory(id) {

    return await apiRequest(
        `/categorias/${id}`
    );
}


async function createCategory(category) {

    return await apiRequest(
        "/categorias/",
        {
            method: "POST",
            body: JSON.stringify(category)
        }
    );
}


async function updateCategory(
    id,
    category
) {

    return await apiRequest(
        `/categorias/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(category)
        }
    );
}


async function deleteCategory(id) {

    return await apiRequest(
        `/categorias/${id}`,
        {
            method: "DELETE"
        }
    );
}


/*
=========================================================
AUTENTICACIÓN
=========================================================
*/

async function loginAdmin(
    email,
    password
) {

    const data = await apiRequest(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        }
    );


    if (data.token) {
        saveToken(data.token);
    }


    return data;
}


async function getCurrentAdmin() {

    return await apiRequest(
        "/auth/me"
    );
}


function logoutAdmin() {

    removeToken();
}


/*
=========================================================
HEALTH CHECK
=========================================================
*/

async function checkApiHealth() {

    return await apiRequest(
        "/health"
    );
}
