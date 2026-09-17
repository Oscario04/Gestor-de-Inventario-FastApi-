const API = "/api/products";

const $ = (selector) => document.querySelector(selector);

let editingProductId = null;


// ========================================
// CARGAR PRODUCTOS
// ========================================

async function loadProducts() {
    const response = await fetch(API);

    if (!response.ok) {
        throw new Error("No se pudieron cargar los productos.");
    }

    const products = await response.json();

    $("#count").textContent = `${products.length} producto(s)`;

    $("#productsTable").innerHTML = products.map(product => {
        const lowStock = product.stock <= product.min_stock;

        return `
            <tr>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.category)}</td>
                <td>$${Number(product.price).toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.min_stock}</td>

                <td>
                    <span class="badge ${lowStock ? "warning" : "ok"}">
                        ${lowStock ? "Stock bajo" : "Disponible"}
                    </span>
                </td>

                <td>
                    <div class="actions">
                        <button
                            class="edit small"
                            onclick="editProduct('${product.id}')"
                        >
                            Editar
                        </button>

                        <button
                            class="danger small"
                            onclick="deleteProduct('${product.id}')"
                        >
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


// ========================================
// CREAR / ACTUALIZAR PRODUCTO
// ========================================

async function saveProduct(event) {
    event.preventDefault();

    const payload = {
        name: $("#name").value.trim(),
        category: $("#category").value.trim(),
        price: Number($("#price").value),
        stock: Number($("#stock").value),
        min_stock: Number($("#min_stock").value),
    };

    try {
        let response;

        // ACTUALIZAR → PUT
        if (editingProductId) {
            response = await fetch(
                `${API}/${editingProductId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );
        // CREAR → POST
        } else {
            response = await fetch(
                API,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );
        }

        const data = await response.json();

        if (!response.ok) {
            $("#formMessage").textContent =
                data.detail || "Error al guardar el producto.";
            return;
        }

        // MENSAJE
        if (editingProductId) {
            $("#formMessage").textContent =
                "Producto actualizado correctamente.";
        } else {
            $("#formMessage").textContent =
                "Producto creado correctamente.";
        }

        // RESTABLECER FORMULARIO
        resetForm();

        // RECARGAR PRODUCTOS
        await loadProducts();

    } catch (error) {
        console.error(error);
        $("#formMessage").textContent =
            error.message || "Ocurrió un error.";
    }
}


// ========================================
// EDITAR PRODUCTO
// ========================================

async function editProduct(id) {
    try {
        const response = await fetch(API);

        if (!response.ok) {
            throw new Error("No se pudieron obtener los productos.");
        }

        const products = await response.json();

        const product = products.find(
            item => String(item.id) === String(id)
        );

        if (!product) {
            alert("No se encontró el producto.");
            return;
        }

        // GUARDAR ID
        editingProductId = product.id;

        // CARGAR DATOS
        $("#name").value = product.name;
        $("#category").value = product.category;
        $("#price").value = product.price;
        $("#stock").value = product.stock;
        $("#min_stock").value = product.min_stock;

        // CAMBIAR BOTÓN Y MOSTRAR CANCELAR
        $("#submitProductBtn").textContent = "Actualizar producto";
        $("#cancelEditBtn").style.display = "block";

        $("#formMessage").textContent =
            "Editando producto. Modifica los datos y pulsa actualizar.";

        // SUBIR AL FORMULARIO
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


// ========================================
// CANCELAR EDICIÓN
// ========================================

function cancelEdit() {
    resetForm();
    $("#formMessage").textContent = "Edición cancelada.";
}


// ========================================
// RESET FORMULARIO
// ========================================

function resetForm() {
    editingProductId = null;
    $("#productForm").reset();
    $("#min_stock").value = 5;
    $("#submitProductBtn").textContent = "Crear producto";
    $("#cancelEditBtn").style.display = "none";
}


// ========================================
// ELIMINAR PRODUCTO
// ========================================

async function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API}/${id}`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "No se pudo eliminar.");
            return;
        }

        await loadProducts();
        $("#formMessage").textContent =
            "Producto eliminado correctamente.";

    } catch (error) {
        console.error(error);
        alert(error.message || "No se pudo eliminar.");
    }
}


// ========================================
// REPORTE CPU
// ========================================

async function generateReport() {
    const button = $("#reportBtn");
    const result = $("#reportResult");
    const iterations = Number($("#iterations").value);

    button.disabled = true;
    result.textContent = "Procesando en segundo plano...";

    const started = performance.now();

    try {
        const response = await fetch(
            "/api/reports/cpu",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ iterations }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Error en el reporte.");
        }

        const browserSeconds = (
            (performance.now() - started) / 1000
        ).toFixed(2);

        result.textContent = JSON.stringify(
            {
                ...data,
                browser_seconds: Number(browserSeconds)
            },
            null,
            2
        );

    } catch (error) {
        result.textContent = error.message;
    } finally {
        button.disabled = false;
    }
}


// ========================================
// ESCAPAR HTML
// ========================================

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ========================================
// EVENTOS
// ========================================

$("#productForm").addEventListener("submit", saveProduct);
$("#refreshBtn").addEventListener("click", loadProducts);
$("#reportBtn").addEventListener("click", generateReport);
$("#cancelEditBtn").addEventListener("click", cancelEdit);


// ========================================
// INICIO
// ========================================

loadProducts().catch(error => {
    $("#productsTable").innerHTML = `
        <tr>
            <td colspan="7">
                ${escapeHtml(error.message)}
            </td>
        </tr>
    `;
});


// ========================================
// FUNCIONES GLOBALES (para onclick en HTML)
// ========================================

window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.generateReport = generateReport;
window.loadProducts = loadProducts;
window.saveProduct = saveProduct;
window.cancelEdit = cancelEdit;