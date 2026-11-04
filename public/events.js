(() => {
  const categorySelect = document.querySelector("[data-category-select]");
  if (!categorySelect) return;

  const conditionalFields = Array.from(document.querySelectorAll("[data-category-field]"));

  function updateCategoryFields() {
    const selectedOption = categorySelect.selectedOptions[0];
    const selectedCategory = selectedOption?.dataset.categoryName || "";

    for (const field of conditionalFields) {
      const visible = field.dataset.categoryField === selectedCategory;
      field.hidden = !visible;
      if (!visible) {
        const input = field.querySelector("input");
        if (input) input.value = "";
      }
    }
  }

  categorySelect.addEventListener("change", updateCategoryFields);
  updateCategoryFields();
})();
