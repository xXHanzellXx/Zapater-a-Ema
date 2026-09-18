/*
=========================================================
ZAPATERÍA EMA
APLICACIÓN PRINCIPAL
=========================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeApp();

    }
);


/*
=========================================================
ESTADO DE LA APLICACIÓN
=========================================================
*/

const state = {

    products: [],

    categories: [],

    filteredProducts: [],

    selectedCategory: "todos",

    search: "",

    currentProduct: null,

    currentAdmin: null,

    confirmAction: null

};


/*
=========================================================
INICIALIZACIÓN
=========================================================
*/

async function initializeApp() {

    setupNavigation();

    setupModals();

    setupSearch();

    setupAdmin();

    setupForms();

    await loadPublicData();

    await checkExistingSession();

}


/*
=========================================================
DATOS PÚBLICOS
=========================================================
*/

async function loadPublicData() {

    try {

        await Promise.all([
            loadProducts(),
            loadCategories()
        ]);

    } catch (error) {

        console.error(
            "Error cargando datos:",
            error
        );

        showToast(
            error.message,
            "error"
        );
    }
}


/*
=========================================================
PRODUCTOS
=========================================================
*/

async function loadProducts() {

    const grid =
        document.getElementById(
            "productsGrid"
        );


    try {

        const products =
            await getProducts();


        state.products =
            Array.isArray(products)
                ? products
                : [];


        applyFilters();

    } catch (error) {

        grid.innerHTML = `
            <div class="error-container">
                <div class="error-icon">!</div>

                <h3>
                    No se pudo cargar el catálogo
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

                <button
                    type="button"
                    class="primary-button"
                    onclick="loadProducts()"
                >
                    Intentar nuevamente
                </button>
            </div>
        `;

        throw error;
    }
}


/*
=========================================================
MOSTRAR PRODUCTOS
=========================================================
*/

function renderProducts(products) {

    const grid =
        document.getElementById(
            "productsGrid"
        );

    const empty =
        document.getElementById(
            "emptyProducts"
        );

    const count =
        document.getElementById(
            "productsCount"
        );


    if (!products.length) {

        grid.innerHTML = "";

        empty.classList.remove(
            "hidden"
        );

        count.textContent =
            "0 productos encontrados";

        return;
    }


    empty.classList.add(
        "hidden"
    );


    count.textContent =
        `${products.length} ${
            products.length === 1
                ? "producto"
                : "productos"
        }`;


    grid.innerHTML =
        products
            .map(
                product =>
                    createProductCard(product)
            )
            .join("");


    grid
        .querySelectorAll(
            ".product-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        card.dataset.id;

                    const product =
                        state.products.find(
                            item =>
                                item.id === id
                        );


                    if (product) {
                        openProductModal(
                            product
                        );
                    }

                }
            );

        });
}


/*
=========================================================
TARJETA DE PRODUCTO
=========================================================
*/

function createProductCard(product) {

    const image =
        product.imagen ||
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800";


    const stock =
        Number(product.stock || 0);


    const available =
        stock > 0;


    const price =
        formatPrice(product.precio);


    return `

        <article
            class="product-card"
            data-id="${escapeHtml(product.id)}"
        >

            <div class="product-image-container">

                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(product.nombre)}"
                    class="product-image"
                    loading="lazy"
                    onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'"
                >


                <span
                    class="availability-badge ${
                        available
                            ? "available"
                            : "sold-out"
                    }"
                >
                    ${
                        available
                            ? "Disponible"
                            : "Agotado"
                    }
                </span>


                <div class="view-product">
                    Ver producto
                    <span>→</span>
                </div>

            </div>


            <div class="product-card-content">

                <span class="product-category">
                    ${escapeHtml(
                        product.categoria ||
                        "Sin categoría"
                    )}
                </span>


                <h3>
                    ${escapeHtml(
                        product.nombre
                    )}
                </h3>


                <p class="product-description">
                    ${escapeHtml(
                        truncateText(
                            product.descripcion ||
                            "Producto de calidad.",
                            95
                        )
                    )}
                </p>


                <div class="product-card-footer">

                    <strong class="product-price">
                        ${price}
                    </strong>


                    <span class="product-stock">
                        ${
                            available
                                ? `${stock} disponibles`
                                : "Sin existencias"
                        }
                    </span>

                </div>

            </div>

        </article>

    `;
}


/*
=========================================================
FILTROS
=========================================================
*/

function applyFilters() {

    const search =
        state.search
            .trim()
            .toLowerCase();


    let products =
        [...state.products];


    if (
        state.selectedCategory !==
        "todos"
    ) {

        products =
            products.filter(
                product =>
                    (
                        product.categoria ||
                        ""
                    ).toLowerCase() ===
                    state.selectedCategory
                        .toLowerCase()
            );

    }


    if (search) {

        products =
            products.filter(
                product => {

                    const text = `
                        ${product.nombre || ""}
                        ${product.descripcion || ""}
                        ${product.categoria || ""}
                    `.toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    state.filteredProducts =
        products;


    renderProducts(
        products
    );

}


/*
=========================================================
CATEGORÍAS
=========================================================
*/

async function loadCategories() {

    try {

        const categories =
            await getCategories();


        state.categories =
            Array.isArray(categories)
                ? categories
                : [];


        renderCategoryFilters();

        renderCategories();

        populateCategorySelect();

    } catch (error) {

        console.error(
            "Error cargando categorías:",
            error
        );

        throw error;
    }
}


/*
=========================================================
FILTROS DE CATEGORÍAS
=========================================================
*/

function renderCategoryFilters() {

    const container =
        document.getElementById(
            "categoryFilters"
        );


    const buttons = [

        `
        <button
            type="button"
            class="category-filter ${
                state.selectedCategory === "todos"
                    ? "active"
                    : ""
            }"
            data-category="todos"
        >
            Todos
        </button>
        `,

        ...state.categories.map(
            category => `

                <button
                    type="button"
                    class="category-filter ${
                        state.selectedCategory.toLowerCase() ===
                        category.nombre.toLowerCase()
                            ? "active"
                            : ""
                    }"
                    data-category="${escapeHtml(
                        category.nombre
                    )}"
                >
                    ${escapeHtml(
                        category.nombre
                    )}
                </button>

            `
        )

    ];


    container.innerHTML =
        buttons.join("");


    container
        .querySelectorAll(
            ".category-filter"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.selectedCategory =
                        button.dataset.category;


                    container
                        .querySelectorAll(
                            ".category-filter"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    applyFilters();

                }
            );

        });

}


/*
=========================================================
CATEGORÍAS VISUALES
=========================================================
*/

function renderCategories() {

    const container =
        document.getElementById(
            "categoriesGrid"
        );


    if (!state.categories.length) {

        container.innerHTML = `

            <div class="category-empty">

                <span>◆</span>

                <h3>
                    Próximamente
                </h3>

                <p>
                    Estamos preparando nuestras categorías.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.categories
            .map(
                category => {

                    const image =
                        category.imagen ||
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800";


                    return `

                        <article
                            class="category-card"
                            data-category="${escapeHtml(
                                category.nombre
                            )}"
                        >

                            <div class="category-image">

                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(
                                        category.nombre
                                    )}"
                                    loading="lazy"
                                    onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'"
                                >

                            </div>


                            <div class="category-content">

                                <span>
                                    CATEGORÍA
                                </span>

                                <h3>
                                    ${escapeHtml(
                                        category.nombre
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        truncateText(
                                            category.descripcion ||
                                            "Descubre nuestros productos.",
                                            75
                                        )
                                    )}
                                </p>

                                <button
                                    type="button"
                                    class="category-arrow"
                                >
                                    Explorar →
                                </button>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".category-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    state.selectedCategory =
                        card.dataset.category;


                    renderCategoryFilters();

                    applyFilters();


                    document
                        .getElementById(
                            "productos"
                        )
                        .scrollIntoView({
                            behavior: "smooth"
                        });

                }
            );

        });

}


/*
=========================================================
SELECT CATEGORÍAS
=========================================================
*/

function populateCategorySelect() {

    const select =
        document.getElementById(
            "productCategory"
        );


    const current =
        select.value;


    select.innerHTML = `

        <option value="">
            Seleccionar categoría
        </option>

        ${
            state.categories
                .map(
                    category => `

                        <option
                            value="${escapeHtml(
                                category.nombre
                            )}"
                        >
                            ${escapeHtml(
                                category.nombre
                            )}
                        </option>

                    `
                )
                .join("")
        }

    `;


    select.value =
        current;

}


/*
=========================================================
MODAL PRODUCTO
=========================================================
*/

function openProductModal(product) {

    state.currentProduct =
        product;


    document.getElementById(
        "modalProductImage"
    ).src =
        product.imagen ||
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800";


    document.getElementById(
        "modalProductImage"
    ).alt =
        product.nombre;


    document.getElementById(
        "modalProductName"
    ).textContent =
        product.nombre;


    document.getElementById(
        "modalProductCategory"
    ).textContent =
        product.categoria ||
        "Sin categoría";


    document.getElementById(
        "modalProductDescription"
    ).textContent =
        product.descripcion ||
        "No hay una descripción disponible.";


    document.getElementById(
        "modalProductPrice"
    ).textContent =
        formatPrice(
            product.precio
        );


    const stock =
        Number(product.stock || 0);


    const stockElement =
        document.getElementById(
            "modalProductStock"
        );


    stockElement.textContent =
        stock > 0
            ? `${stock} disponibles`
            : "Agotado";


    stockElement.className =
        stock > 0
            ? "stock-positive"
            : "stock-negative";


    openModal(
        "productModal"
    );

}


/*
=========================================================
LOGIN ADMIN
=========================================================
*/

async function handleLogin(event) {

    event.preventDefault();


    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    const button =
        document.getElementById(
            "loginButton"
        );


    const message =
        document.getElementById(
            "loginMessage"
        );


    setFormMessage(
        message,
        "",
        ""
    );


    button.disabled = true;

    button.innerHTML =
        `<span class="button-loader"></span> Iniciando...`;


    try {

        const data =
            await loginAdmin(
                email,
                password
            );


        state.currentAdmin =
            data.admin;


        closeModal(
            "loginModal"
        );


        document.getElementById(
            "loginForm"
        ).reset();


        showToast(
            "Sesión iniciada correctamente.",
            "success"
        );


        await openAdminPanel();


    } catch (error) {

        setFormMessage(
            message,
            error.message,
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Iniciar sesión";

    }

}


/*
=========================================================
COMPROBAR SESIÓN
=========================================================
*/

async function checkExistingSession() {

    if (!getToken()) {
        return;
    }


    try {

        const data =
            await getCurrentAdmin();


        state.currentAdmin =
            data.admin;

    } catch (error) {

        logoutAdmin();

        state.currentAdmin =
            null;

    }

}


/*
=========================================================
ABRIR PANEL ADMIN
=========================================================
*/

async function openAdminPanel() {

    if (!getToken()) {

        openModal(
            "loginModal"
        );

        return;
    }


    try {

        if (!state.currentAdmin) {

            const data =
                await getCurrentAdmin();


            state.currentAdmin =
                data.admin;

        }


        document.getElementById(
            "adminWelcome"
        ).textContent =
            `Sesión iniciada como ${state.currentAdmin.nombre}.`;


        openModal(
            "adminModal"
        );


        await loadAdminData();


    } catch (error) {

        logoutAdmin();

        state.currentAdmin =
            null;


        showToast(
            "La sesión ya no es válida.",
            "error"
        );


        openModal(
            "loginModal"
        );

    }

}


/*
=========================================================
DATOS ADMIN
=========================================================
*/

async function loadAdminData() {

    await Promise.all([
        loadProducts(),
        loadCategories()
    ]);


    renderAdminProducts();

    renderAdminCategories();

    populateCategorySelect();

}


/*
=========================================================
ADMIN PRODUCTOS
=========================================================
*/

function renderAdminProducts() {

    const container =
        document.getElementById(
            "adminProductsGrid"
        );


    if (!state.products.length) {

        container.innerHTML = `

            <div class="admin-empty">

                <div>
                    👟
                </div>

                <h3>
                    No hay productos
                </h3>

                <p>
                    Crea tu primer producto.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.products
            .map(
                product => {

                    const image =
                        product.imagen ||
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500";


                    return `

                        <div
                            class="admin-product-card"
                        >

                            <img
                                src="${escapeHtml(image)}"
                                alt="${escapeHtml(
                                    product.nombre
                                )}"
                                onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'"
                            >


                            <div class="admin-product-info">

                                <span>
                                    ${escapeHtml(
                                        product.categoria ||
                                        "Sin categoría"
                                    )}
                                </span>

                                <h4>
                                    ${escapeHtml(
                                        product.nombre
                                    )}
                                </h4>

                                <strong>
                                    ${formatPrice(
                                        product.precio
                                    )}
                                </strong>

                                <small>
                                    Stock:
                                    ${product.stock}
                                </small>

                            </div>


                            <div class="admin-card-actions">

                                <button
                                    type="button"
                                    class="edit-button"
                                    data-edit-product="${
                                        escapeHtml(
                                            product.id
                                        )
                                    }"
                                >
                                    ✎ Editar
                                </button>

                                <button
                                    type="button"
                                    class="delete-button"
                                    data-delete-product="${
                                        escapeHtml(
                                            product.id
                                        )
                                    }"
                                >
                                    × Eliminar
                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-edit-product]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editProduct(
                        button.dataset.editProduct
                    );

                }
            );

        });


    container
        .querySelectorAll(
            "[data-delete-product]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    confirmDeleteProduct(
                        button.dataset.deleteProduct
                    );

                }
            );

        });

}


/*
=========================================================
NUEVO PRODUCTO
=========================================================
*/

function openNewProductForm() {

    document.getElementById(
        "productForm"
    ).reset();


    document.getElementById(
        "productId"
    ).value = "";


    document.getElementById(
        "productFormTitle"
    ).textContent =
        "Nuevo producto";


    setFormMessage(
        document.getElementById(
            "productFormMessage"
        ),
        "",
        ""
    );


    openModal(
        "productFormModal"
    );

}


/*
=========================================================
EDITAR PRODUCTO
=========================================================
*/

function editProduct(id) {

    const product =
        state.products.find(
            item =>
                item.id === id
        );


    if (!product) {
        return;
    }


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.nombre || "";


    document.getElementById(
        "productDescription"
    ).value =
        product.descripcion || "";


    document.getElementById(
        "productPrice"
    ).value =
        product.precio ?? "";


    document.getElementById(
        "productStock"
    ).value =
        product.stock ?? "";


    document.getElementById(
        "productImage"
    ).value =
        product.imagen || "";


    document.getElementById(
        "productCategory"
    ).value =
        product.categoria || "";


    document.getElementById(
        "productFormTitle"
    ).textContent =
        "Editar producto";


    setFormMessage(
        document.getElementById(
            "productFormMessage"
        ),
        "",
        ""
    );


    openModal(
        "productFormModal"
    );

}


/*
=========================================================
GUARDAR PRODUCTO
=========================================================
*/

async function handleProductSubmit(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "productId"
        ).value;


    const product = {

        nombre:
            document.getElementById(
                "productName"
            ).value.trim(),

        descripcion:
            document.getElementById(
                "productDescription"
            ).value.trim(),

        precio:
            Number(
                document.getElementById(
                    "productPrice"
                ).value
            ),

        stock:
            Number(
                document.getElementById(
                    "productStock"
                ).value
            ),

        imagen:
            document.getElementById(
                "productImage"
            ).value.trim(),

        categoria:
            document.getElementById(
                "productCategory"
            ).value

    };


    const message =
        document.getElementById(
            "productFormMessage"
        );


    try {

        if (id) {

            await updateProduct(
                id,
                product
            );


            showToast(
                "Producto actualizado correctamente.",
                "success"
            );

        } else {

            await createProduct(
                product
            );


            showToast(
                "Producto creado correctamente.",
                "success"
            );

        }


        closeModal(
            "productFormModal"
        );


        await loadAdminData();


    } catch (error) {

        setFormMessage(
            message,
            error.message,
            "error"
        );

    }

}


/*
=========================================================
ELIMINAR PRODUCTO
=========================================================
*/

function confirmDeleteProduct(id) {

    const product =
        state.products.find(
            item =>
                item.id === id
        );


    if (!product) {
        return;
    }


    showConfirmation(
        "¿Eliminar producto?",
        `¿Seguro que deseas eliminar "${product.nombre}"? Esta acción no se puede deshacer.`,
        async () => {

            try {

                await deleteProduct(
                    id
                );


                showToast(
                    "Producto eliminado correctamente.",
                    "success"
                );


                await loadAdminData();

            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            }

        }
    );

}


/*
=========================================================
ADMIN CATEGORÍAS
=========================================================
*/

function renderAdminCategories() {

    const container =
        document.getElementById(
            "adminCategoriesList"
        );


    if (!state.categories.length) {

        container.innerHTML = `

            <div class="admin-empty">

                <div>
                    ◆
                </div>

                <h3>
                    No hay categorías
                </h3>

                <p>
                    Crea una categoría para organizar
                    tus productos.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.categories
            .map(
                category => `

                    <div
                        class="admin-category-item"
                    >

                        <div class="category-admin-icon">

                            ${
                                category.imagen
                                    ? `
                                        <img
                                            src="${escapeHtml(
                                                category.imagen
                                            )}"
                                            alt="${escapeHtml(
                                                category.nombre
                                            )}"
                                        >
                                      `
                                    : "◆"
                            }

                        </div>


                        <div class="category-admin-info">

                            <h4>
                                ${escapeHtml(
                                    category.nombre
                                )}
                            </h4>

                            <p>
                                ${escapeHtml(
                                    category.descripcion ||
                                    "Sin descripción."
                                )}
                            </p>

                        </div>


                        <div class="category-admin-actions">

                            <button
                                type="button"
                                class="edit-button"
                                data-edit-category="${
                                    escapeHtml(
                                        category.id
                                    )
                                }"
                            >
                                ✎
                            </button>

                            <button
                                type="button"
                                class="delete-button"
                                data-delete-category="${
                                    escapeHtml(
                                        category.id
                                    )
                                }"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-edit-category]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editCategory(
                        button.dataset.editCategory
                    );

                }
            );

        });


    container
        .querySelectorAll(
            "[data-delete-category]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    confirmDeleteCategory(
                        button.dataset.deleteCategory
                    );

                }
            );

        });

}


/*
=========================================================
NUEVA CATEGORÍA
=========================================================
*/

function openNewCategoryForm() {

    document.getElementById(
        "categoryForm"
    ).reset();


    document.getElementById(
        "categoryId"
    ).value = "";


    document.getElementById(
        "categoryFormTitle"
    ).textContent =
        "Nueva categoría";


    setFormMessage(
        document.getElementById(
            "categoryFormMessage"
        ),
        "",
        ""
    );


    openModal(
        "categoryFormModal"
    );

}


/*
=========================================================
EDITAR CATEGORÍA
=========================================================
*/

function editCategory(id) {

    const category =
        state.categories.find(
            item =>
                item.id === id
        );


    if (!category) {
        return;
    }


    document.getElementById(
        "categoryId"
    ).value =
        category.id;


    document.getElementById(
        "categoryName"
    ).value =
        category.nombre || "";


    document.getElementById(
        "categoryDescription"
    ).value =
        category.descripcion || "";


    document.getElementById(
        "categoryImage"
    ).value =
        category.imagen || "";


    document.getElementById(
        "categoryFormTitle"
    ).textContent =
        "Editar categoría";


    openModal(
        "categoryFormModal"
    );

}


/*
=========================================================
GUARDAR CATEGORÍA
=========================================================
*/

async function handleCategorySubmit(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "categoryId"
        ).value;


    const category = {

        nombre:
            document.getElementById(
                "categoryName"
            ).value.trim(),

        descripcion:
            document.getElementById(
                "categoryDescription"
            ).value.trim(),

        imagen:
            document.getElementById(
                "categoryImage"
            ).value.trim()

    };


    const message =
        document.getElementById(
            "categoryFormMessage"
        );


    try {

        if (id) {

            await updateCategory(
                id,
                category
            );


            showToast(
                "Categoría actualizada correctamente.",
                "success"
            );

        } else {

            await createCategory(
                category
            );


            showToast(
                "Categoría creada correctamente.",
                "success"
            );

        }


        closeModal(
            "categoryFormModal"
        );


        await loadAdminData();


    } catch (error) {

        setFormMessage(
            message,
            error.message,
            "error"
        );

    }

}


/*
=========================================================
ELIMINAR CATEGORÍA
=========================================================
*/

function confirmDeleteCategory(id) {

    const category =
        state.categories.find(
            item =>
                item.id === id
        );


    if (!category) {
        return;
    }


    showConfirmation(
        "¿Eliminar categoría?",
        `¿Seguro que deseas eliminar "${category.nombre}"?`,
        async () => {

            try {

                await deleteCategory(
                    id
                );


                showToast(
                    "Categoría eliminada correctamente.",
                    "success"
                );


                await loadAdminData();

            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            }

        }
    );

}


/*
=========================================================
ADMIN TABS
=========================================================
*/

function switchAdminTab(tab) {

    document
        .querySelectorAll(
            ".admin-tab"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    document
        .querySelectorAll(
            ".admin-panel"
        )
        .forEach(panel => {

            panel.classList.remove(
                "active"
            );

        });


    const button =
        document.querySelector(
            `[data-admin-tab="${tab}"]`
        );


    const panel =
        document.getElementById(
            tab === "productos"
                ? "adminProductos"
                : "adminCategorias"
        );


    if (button) {
        button.classList.add(
            "active"
        );
    }


    if (panel) {
        panel.classList.add(
            "active"
        );
    }

}


/*
=========================================================
LOGOUT
=========================================================
*/

function handleLogout() {

    logoutAdmin();

    state.currentAdmin =
        null;


    closeModal(
        "adminModal"
    );


    showToast(
        "Sesión cerrada.",
        "success"
    );

}


/*
=========================================================
BÚSQUEDA
=========================================================
*/

function setupSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const clearButton =
        document.getElementById(
            "clearSearch"
        );


    input.addEventListener(
        "input",
        () => {

            state.search =
                input.value;


            clearButton.classList.toggle(
                "visible",
                Boolean(
                    input.value
                )
            );


            applyFilters();

        }
    );


    clearButton.addEventListener(
        "click",
        () => {

            input.value = "";

            state.search = "";

            clearButton.classList.remove(
                "visible"
            );

            applyFilters();

        }
    );


    document
        .getElementById(
            "resetFilters"
        )
        .addEventListener(
            "click",
            () => {

                input.value = "";

                state.search = "";

                state.selectedCategory =
                    "todos";


                renderCategoryFilters();

                applyFilters();

            }
        );


    document
        .getElementById(
            "reloadProducts"
        )
        .addEventListener(
            "click",
            async () => {

                try {

                    await loadPublicData();

                    showToast(
                        "Catálogo actualizado.",
                        "success"
                    );

                } catch (error) {

                    showToast(
                        error.message,
                        "error"
                    );

                }

            }
        );

}


/*
=========================================================
NAVEGACIÓN
=========================================================
*/

function setupNavigation() {

    const mobileButton =
        document.getElementById(
            "mobileMenuButton"
        );


    const mobileNav =
        document.getElementById(
            "mobileNav"
        );


    mobileButton.addEventListener(
        "click",
        () => {

            mobileNav.classList.toggle(
                "open"
            );

        }
    );


    mobileNav
        .querySelectorAll(
            "a"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    mobileNav.classList.remove(
                        "open"
                    );

                }
            );

        });


    document
        .getElementById(
            "openAdminLogin"
        )
        .addEventListener(
            "click",
            () => {

                openAdminEntry();

            }
        );


    document
        .getElementById(
            "mobileAdminButton"
        )
        .addEventListener(
            "click",
            () => {

                mobileNav.classList.remove(
                    "open"
                );

                openAdminEntry();

            }
        );

}


/*
=========================================================
ENTRADA ADMIN
=========================================================
*/

async function openAdminEntry() {

    if (getToken()) {

        try {

            const data =
                await getCurrentAdmin();


            state.currentAdmin =
                data.admin;


            await openAdminPanel();


            return;

        } catch (error) {

            logoutAdmin();

        }

    }


    openModal(
        "loginModal"
    );

}


/*
=========================================================
MODALES
=========================================================
*/

function setupModals() {

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    closeModal(
                        button.dataset.closeModal
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        closeModal(
                            overlay.id
                        );

                    }

                }
            );

        });


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                document
                    .querySelectorAll(
                        ".modal-overlay.open"
                    )
                    .forEach(modal => {

                        closeModal(
                            modal.id
                        );

                    });

            }

        }
    );


    document
        .getElementById(
            "cancelConfirm"
        )
        .addEventListener(
            "click",
            () => {

                closeModal(
                    "confirmModal"
                );

                state.confirmAction =
                    null;

            }
        );


    document
        .getElementById(
            "acceptConfirm"
        )
        .addEventListener(
            "click",
            async () => {

                const action =
                    state.confirmAction;


                closeModal(
                    "confirmModal"
                );


                state.confirmAction =
                    null;


                if (action) {
                    await action();
                }

            }
        );

}


function openModal(id) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "open"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(id) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    if (
        !document.querySelector(
            ".modal-overlay.open"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


/*
=========================================================
CONFIRMACIÓN
=========================================================
*/

function showConfirmation(
    title,
    text,
    action
) {

    document.getElementById(
        "confirmTitle"
    ).textContent =
        title;


    document.getElementById(
        "confirmText"
    ).textContent =
        text;


    state.confirmAction =
        action;


    openModal(
        "confirmModal"
    );

}


/*
=========================================================
FORMULARIOS
=========================================================
*/

function setupForms() {

    document
        .getElementById(
            "loginForm"
        )
        .addEventListener(
            "submit",
            handleLogin
        );


    document
        .getElementById(
            "productForm"
        )
        .addEventListener(
            "submit",
            handleProductSubmit
        );


    document
        .getElementById(
            "categoryForm"
        )
        .addEventListener(
            "submit",
            handleCategorySubmit
        );

}


/*
=========================================================
ADMIN
=========================================================
*/

function setupAdmin() {

    document
        .getElementById(
            "newProductButton"
        )
        .addEventListener(
            "click",
            openNewProductForm
        );


    document
        .getElementById(
            "newCategoryButton"
        )
        .addEventListener(
            "click",
            openNewCategoryForm
        );


    document
        .getElementById(
            "logoutButton"
        )
        .addEventListener(
            "click",
            handleLogout
        );


    document
        .querySelectorAll(
            "[data-admin-tab]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    switchAdminTab(
                        button.dataset.adminTab
                    );

                }
            );

        });

}


/*
=========================================================
TOAST
=========================================================
*/

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const icon =
        document.getElementById(
            "toastIcon"
        );


    const text =
        document.getElementById(
            "toastMessage"
        );


    toast.className =
        `toast ${type}`;


    icon.textContent =
        type === "success"
            ? "✓"
            : "!";


    text.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimeout
    );


    window.toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/*
=========================================================
MENSAJES DE FORMULARIO
=========================================================
*/

function setFormMessage(
    element,
    message,
    type
) {

    if (!element) {
        return;
    }


    if (!message) {

        element.className =
            "form-message hidden";

        element.textContent = "";

        return;
    }


    element.className =
        `form-message ${type}`;


    element.textContent =
        message;

}


/*
=========================================================
FORMATO PRECIO
=========================================================
*/

function formatPrice(
    price
) {

    const number =
        Number(price || 0);


    return new Intl.NumberFormat(
        "es-CR",
        {
            style: "currency",
            currency: "CRC",
            maximumFractionDigits: 0
        }
    ).format(number);

}


/*
=========================================================
TRUNCAR TEXTO
=========================================================
*/

function truncateText(
    text,
    length
) {

    if (!text) {
        return "";
    }


    if (
        text.length <=
        length
    ) {

        return text;

    }


    return (
        text.substring(
            0,
            length
        ).trim() +
        "..."
    );

}


/*
=========================================================
SEGURIDAD HTML
=========================================================
*/

function escapeHtml(
    value
) {

    if (
        value ===
        null ||
        value ===
        undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/*
=========================================================
EXPORTAR PARA BOTONES HTML
=========================================================
*/

window.loadProducts =
    loadProducts;

window.openProductModal =
    openProductModal;
