const tableBody = document.querySelector("#content-table tbody");

function addContentRow(item = { Name: "", Description: "", Content: "" }) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td contenteditable="true" class="editable-td">${item.Name||""}</td>
    <td contenteditable="true" class="editable-td">${item.Description||""}</td>
    <td contenteditable="true" class="editable-td">${item.Content||""}</td>
  `;
  if(tableBody) tableBody.appendChild(tr);
}

document.getElementById("add-content-btn")?.addEventListener("click", () => addContentRow());

document.getElementById("remove-content-btn")?.addEventListener("click", () => {
  if (tableBody && tableBody.rows.length > 1) {
    tableBody.deleteRow(-1);
  } else if (tableBody && tableBody.rows.length === 1) {
    Array.from(tableBody.rows[0].cells).forEach(c => c.innerText = "");
  }
});

document.getElementById("load-package-btn")?.addEventListener("click", async () => {
  const fileInput = document.getElementById("package-file");
  if (!fileInput) return;
  const file = fileInput.files[0];
  if (!file) return alert("Select a JSON file first!");
  try {
    const data = JSON.parse(await file.text());
    
    // Fill manifest values if they exist
    const pName = document.getElementById("package-name");
    const pId = document.getElementById("package-id");
    if(pName) pName.value = data.Manifest?.PackageName || "";
    if(pId) pId.value = data.Manifest?.PackageId || "";
    
    if(tableBody) tableBody.innerHTML = "";
    (data.Content && data.Content.length ? data.Content : [{}]).forEach(addContentRow);
    alert("Package Loaded Successfully! ✅");
  } catch (e) { alert("Invalid JSON Format."); }
});

document.getElementById("save-package-btn")?.addEventListener("click", () => {
  const n = document.getElementById("package-name");
  const i = document.getElementById("package-id");
  const manifest = {
    PackageName: (n ? n.value.trim() : ""),
    PackageId: (i ? i.value.trim() : "") || "com.mathmind.pkg",
    Version: "1.0.0"
  };
  
  const Content = tableBody ? Array.from(tableBody.rows).map(row => ({
    Name: row.cells[0].innerText.trim(),
    Description: row.cells[1].innerText.trim(),
    Content: row.cells[2].innerText.trim()
  })).filter(r => r.Name || r.Content) : [];

  const blob = new Blob([JSON.stringify({ Manifest: manifest, Content }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${manifest.PackageId}.json`;
  a.click();
});

document.getElementById("compile-btn")?.addEventListener("click", () => {
  const i = document.getElementById("package-id");
  const pkgId = (i ? i.value.trim() : "") || "math_pack";
  let lua = `-- MathMind Package: ${pkgId}\nlocal package = {\n`;
  if(tableBody) {
    Array.from(tableBody.rows).forEach(row => {
      const name = row.cells[0].innerText.trim();
      const logic = row.cells[2].innerText.trim().replace(/\[=\[/g, '').replace(/\]=\]/g, ''); // sanitize Lua block markers
      if (name || logic) lua += `  ["${name}"] = [=[${logic}]=],\n`;
    });
  }
  lua += `}\nreturn package`;
  const out = document.getElementById("lua-output");
  if(out) out.value = lua;
});

document.getElementById("copy-lua-btn")?.addEventListener("click", async () => {
  const out = document.getElementById("lua-output");
  if (!out || !out.value) return;
  try {
    await navigator.clipboard.writeText(out.value);
    const btn = document.getElementById("copy-lua-btn");
    btn.innerText = "Copied! ✨";
    setTimeout(() => btn.innerText = "Copy Lua ✓", 2000);
  } catch (e) { alert("Failed to copy. Please manually copy."); }
});

// Initialize with a blank row inside package manager screen
if (tableBody && tableBody.rows.length === 0) {
  addContentRow();
}
