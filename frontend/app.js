const API = "/api/products";

const $ = (selector) => document.querySelector(selector);

async function loadProducts() {
    const response = await fetch(API);
    if (!response.ok) throw new Error("No se pudieron cargar los productos.");

    const products = await response.json();
    $("#count").textContent = `${products.length} producto(s)`;

    $("#productsTable").innerHTML = products.map(product => {
        const lowStock = product.stock <= product.min_stock;
        return `
            <tr>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.category)}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.min_stock}</td>
                <td><span class="badge ${lowStock ? "warning" : "ok"}">${lowStock ? "Stock bajo" : "Disponible"}</span></td>
                <td>
                    <button class="danger small" onclick="deleteProduct('${product.id}')">Eliminar</button>
                </td>
            </tr>
        `;
    }).join("");
}

async function createProduct(event) {
    event.preventDefault();

    const payload = {
        name: $("#name").value,
        category: $("#category").value,
        price: Number($("#price").value),
        stock: Number($("#stock").value),
        min_stock: Number($("#min_stock").value),
    };

    const response = await fetch(API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        $("#formMessage").textContent = data.detail || "Error de validación.";
        return;
    }

    $("#formMessage").textContent = "Producto creado correctamente.";
    $("#productForm").reset();
    $("#min_stock").value = 5;
    await loadProducts();
}

async function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto?")) return;

    const response = await fetch(`${API}/${id}`, {method: "DELETE"});

    if (!response.ok) {
        const data = await response.json();
        alert(data.detail || "No se pudo eliminar.");
        return;
    }

    await loadProducts();
}

async function generateReport() {
    const button = $("#reportBtn");
    const result = $("#reportResult");
    const iterations = Number($("#iterations").value);

    button.disabled = true;
    result.textContent = "Procesando en segundo plano...";

    const started = performance.now();

    try {
        const response = await fetch("/api/reports/cpu", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({iterations}),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || "Error en el reporte.");

        const browserSeconds = ((performance.now() - started) / 1000).toFixed(2);
        result.textContent = JSON.stringify({
            ...data,
            browser_seconds: Number(browserSeconds)
        }, null, 2);
    } catch (error) {
        result.textContent = error.message;
    } finally {
        button.disabled = false;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

$("#productForm").addEventListener("submit", createProduct);
$("#refreshBtn").addEventListener("click", loadProducts);
$("#reportBtn").addEventListener("click", generateReport);

loadProducts().catch(error => {
    $("#productsTable").innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
});

window.deleteProduct = deleteProduct;
