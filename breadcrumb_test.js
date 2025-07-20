// Test script to verify breadcrumb logic
const testApi = {
  id: "dcr-register-client",
  name: "Post Register – Consumer Data Right",
  bundle: "Dynamic Client Registration (DCR)",
  tags: ["Consumer Data Right", "Dynamic Client Registration", "Open Banking"]
};

// Our breadcrumb function
const getBreadcrumbHierarchy = (api) => {
  if (!api) return [];
  
  // Special handling for DCR (Dynamic Client Registration) APIs
  if (api.bundle === "Dynamic Client Registration (DCR)") {
    return [
      { name: "Open Banking", category: "Open Banking" },
      { name: "Dynamic Client Registration (DCR)", category: "Dynamic Client Registration (DCR)" }
    ];
  }
  
  // Default: use the first tag as the primary category
  const primaryCategory = api.tags?.[0] || '';
  return primaryCategory ? [{ name: primaryCategory, category: primaryCategory }] : [];
};

// Test the function
const result = getBreadcrumbHierarchy(testApi);
console.log("Expected breadcrumb hierarchy:");
console.log("Home > APIs > Open Banking > Dynamic Client Registration (DCR) > Post Register – Consumer Data Right");
console.log("\nActual breadcrumb levels generated:");
console.log("Home > APIs >", result.map(level => level.name).join(" > "), "> Post Register – Consumer Data Right");

// Test with old logic for comparison
const oldLogic = testApi.tags?.[0] || '';
console.log("\nOld breadcrumb (incorrect):");
console.log("Home > APIs >", oldLogic, "> Post Register – Consumer Data Right");