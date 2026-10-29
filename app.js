/* =====================================================
   PackageXML Studio
   Salesforce package.xml generator
   Frontend only — no backend or database
   ===================================================== */

"use strict";

/* =====================================================
   1. Metadata Types
   ===================================================== */

const METADATA_TYPES = [
    { name: "ApexClass", icon: "</>", popular: true },
    { name: "ApexTrigger", icon: "ϟ", popular: true },
    { name: "LightningComponentBundle", icon: "▣", popular: true },
    { name: "AuraDefinitionBundle", icon: "⬡", popular: true },
    { name: "Flow", icon: "♧", popular: true },
    { name: "CustomObject", icon: "▤", popular: true },
    { name: "CustomField", icon: "▦", popular: true },
    { name: "PermissionSet", icon: "⬟", popular: true },
    { name: "Profile", icon: "♙", popular: true },
    { name: "StaticResource", icon: "▧", popular: true },
    { name: "ExperienceBundle", icon: "◎", popular: true },

    { name: "Layout", icon: "▦", popular: false },
    { name: "CustomLabel", icon: "◇", popular: false },
    { name: "EmailTemplate", icon: "✉", popular: false },
    { name: "Report", icon: "▥", popular: false },
    { name: "Dashboard", icon: "◔", popular: false },
    { name: "ValidationRule", icon: "✓", popular: false },
    { name: "CustomMetadata", icon: "▤", popular: false },
    { name: "NamedCredential", icon: "♙", popular: false },
    { name: "RemoteSiteSetting", icon: "↗", popular: false },
    { name: "PermissionSetGroup", icon: "⬟", popular: false },
    { name: "Queue", icon: "☷", popular: false },
    { name: "RecordType", icon: "▦", popular: false },
    { name: "CustomTab", icon: "▣", popular: false },
    { name: "ApexPage", icon: "</>", popular: false },
    { name: "ApexComponent", icon: "</>", popular: false },
    { name: "ConnectedApp", icon: "◎", popular: false },
    { name: "CustomApplication", icon: "▣", popular: false },
    { name: "GlobalValueSet", icon: "◉", popular: false },
    { name: "Translations", icon: "文", popular: false }
];


/* =====================================================
   2. Application State
   ===================================================== */

// Metadata types selected when the application opens.
const selectedTypes = new Set([
    "ApexClass",
    "ApexTrigger",
    "LightningComponentBundle"
]);

// Stores component names separately for every metadata type.
// Example:
// ApexClass -> AccountHelper, ContactService
// ApexTrigger -> AccountTrigger
// Flow -> Create_Account
const componentNames = new Map();


/* =====================================================
   3. HTML Elements
   ===================================================== */

const typesContainer = document.getElementById("types");
const searchInput = document.getElementById("search");
const typeFilter = document.getElementById("typeFilter");

const componentInputs = document.getElementById("componentInputs");

const versionInput = document.getElementById("version");
const manifestMode = document.getElementById("manifestMode");

const preview = document.getElementById("preview");
const statusPill = document.getElementById("status");
const toast = document.getElementById("toast");

const wildcardWarning = document.getElementById("wildcardWarning");
const nameCount = document.getElementById("nameCount");
const selectedCount = document.getElementById("selectedCount");


/* =====================================================
   4. Initialize Salesforce API Versions
   ===================================================== */

function initializeVersions() {
    if (!versionInput) return;

    versionInput.replaceChildren();

    // Update these options when your target Salesforce
    // organization supports a different API version range.
    for (let version = 66; version >= 40; version--) {
        const option = document.createElement("option");

        option.value = `${version}.0`;
        option.textContent = `${version}.0`;

        versionInput.appendChild(option);
    }

    versionInput.value = "66.0";
}


/* =====================================================
   5. Escape XML Characters
   ===================================================== */

function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;"
        };

        return entities[character];
    });
}


/* =====================================================
   6. Display Notifications
   ===================================================== */

function notify(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(notify.timer);

    notify.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =====================================================
   7. Get Component Names for a Metadata Type
   ===================================================== */

function getNamesForType(typeName) {
    const value = componentNames.get(typeName) || "";

    return [
        ...new Set(
            value
                .split(/[\n,;]/)
                .map(name => name.trim())
                .filter(Boolean)
        )
    ];
}


/* =====================================================
   8. Get All Entered Component Names
   ===================================================== */

function getAllComponentNames() {
    const allNames = [];

    for (const typeName of selectedTypes) {
        allNames.push(...getNamesForType(typeName));
    }

    return allNames;
}


/* =====================================================
   9. Render Metadata Cards
   ===================================================== */

function renderMetadataTypes() {
    if (!typesContainer) return;

    const query = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filterValue = typeFilter ? typeFilter.value : "all";

    const visibleTypes = METADATA_TYPES.filter(type => {
        const matchesSearch = type.name
            .toLowerCase()
            .includes(query);

        const matchesFilter =
            filterValue !== "popular" || type.popular;

        return matchesSearch && matchesFilter;
    });

    typesContainer.replaceChildren();

    if (visibleTypes.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-state";
        emptyMessage.textContent =
            "No metadata types match your search.";

        typesContainer.appendChild(emptyMessage);

        return;
    }

    visibleTypes.forEach(type => {
        const isSelected = selectedTypes.has(type.name);

        const button = document.createElement("button");

        button.type = "button";
        button.className =
            `metadata-card${isSelected ? " selected" : ""}`;

        button.setAttribute("aria-pressed", String(isSelected));
        button.setAttribute(
            "aria-label",
            `${isSelected ? "Deselect" : "Select"} ${type.name}`
        );

        const icon = document.createElement("span");
        icon.className = "meta-icon";
        icon.textContent = type.icon;

        const name = document.createElement("span");
        name.className = "meta-name";
        name.textContent = type.name;

        const check = document.createElement("span");
        check.className = "check";
        check.setAttribute("aria-hidden", "true");

        button.append(icon, name, check);

        button.addEventListener("click", () => {
            toggleMetadataType(type.name);
        });

        typesContainer.appendChild(button);
    });
}


/* =====================================================
   10. Toggle a Metadata Type
   ===================================================== */

function toggleMetadataType(typeName) {
    if (selectedTypes.has(typeName)) {
        selectedTypes.delete(typeName);
    } else {
        selectedTypes.add(typeName);
    }

    renderMetadataTypes();
    renderComponentInputs();
    renderXml();
}


/* =====================================================
   11. Render Separate Component Inputs
   ===================================================== */

function renderComponentInputs() {
    if (!componentInputs) return;

    componentInputs.replaceChildren();

    if (selectedTypes.size === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-state";
        emptyMessage.textContent =
            "Select a metadata type above to enter component names.";

        componentInputs.appendChild(emptyMessage);

        return;
    }

    [...selectedTypes].sort().forEach(typeName => {
        const wrapper = document.createElement("div");

        wrapper.className = "component-type-input";

        const label = document.createElement("label");
        const textarea = document.createElement("textarea");

        const inputId = `component-${typeName}`;

        label.htmlFor = inputId;
        label.textContent = typeName;

        textarea.id = inputId;
        textarea.name = inputId;
        textarea.rows = 4;
        textarea.placeholder =
            `Enter ${typeName} names, one per line`;

        textarea.value = componentNames.get(typeName) || "";

        textarea.setAttribute(
            "aria-label",
            `Component names for ${typeName}`
        );

        textarea.addEventListener("input", event => {
            componentNames.set(typeName, event.target.value);
            renderXml();
        });

        const helpText = document.createElement("small");

        helpText.textContent =
            "Separate multiple names using new lines, commas, or semicolons.";

        wrapper.append(label, textarea, helpText);

        componentInputs.appendChild(wrapper);
    });
}


/* =====================================================
   12. Build package.xml
   ===================================================== */

function buildXml() {
    const useWildcard =
        manifestMode && manifestMode.value === "wildcard";

    const typesXml = [...selectedTypes]
        .sort()
        .map(typeName => {
            // Each metadata type uses its own component names.
            const members = useWildcard
                ? ["*"]
                : getNamesForType(typeName);

            // In specific-name mode, skip types without names.
            if (members.length === 0) {
                return null;
            }

            const memberXml = members
                .map(name => {
                    return `        <members>${escapeXml(name)}</members>`;
                })
                .join("\n");

            return [
                "    <types>",
                memberXml,
                `        <name>${escapeXml(typeName)}</name>`,
                "    </types>"
            ].join("\n");
        })
        .filter(Boolean);

    const apiVersion =
        versionInput && versionInput.value
            ? versionInput.value.trim()
            : "66.0";

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
        ...typesXml,
        `    <version>${escapeXml(apiVersion)}</version>`,
        "</Package>"
    ].join("\n");
}


/* =====================================================
   13. Validate Generated XML
   ===================================================== */

function validateXml(xml = buildXml()) {
    const errors = [];

    // There must be at least one selected metadata type.
    if (selectedTypes.size === 0) {
        errors.push("Select at least one metadata type.");
    }

    const useWildcard =
        manifestMode && manifestMode.value === "wildcard";

    if (!useWildcard && getAllComponentNames().length === 0) {
        errors.push(
            "Enter at least one component name or select wildcard mode."
        );
    }

    // Validate API version format.
    const apiVersion =
        versionInput && versionInput.value
            ? versionInput.value.trim()
            : "";

    if (!/^\d+\.0$/.test(apiVersion)) {
        errors.push("Select a valid Salesforce API version.");
    }

    // Parse XML and check its basic structure.
    const parser = new DOMParser();

    const documentXml = parser.parseFromString(
        xml,
        "application/xml"
    );

    const parserErrors =
        documentXml.getElementsByTagName("parsererror");

    if (parserErrors.length > 0) {
        errors.push("The generated XML is not well-formed.");
        return { valid: false, errors };
    }

    const root = documentXml.documentElement;

    if (!root || root.localName !== "Package") {
        errors.push("The XML root element must be Package.");
        return { valid: false, errors };
    }

    const expectedNamespace =
        "http://soap.sforce.com/2006/04/metadata";

    if (root.namespaceURI !== expectedNamespace) {
        errors.push("The Salesforce metadata namespace is missing or invalid.");
    }

    const versionElements = root.getElementsByTagNameNS(
        expectedNamespace,
        "version"
    );

    if (
        versionElements.length !== 1 ||
        versionElements[0].parentNode !== root
    ) {
        errors.push(
            "The package must contain exactly one top-level version element."
        );
    }

    const typeElements = root.getElementsByTagNameNS(
        expectedNamespace,
        "types"
    );

    if (typeElements.length === 0) {
        errors.push("The package must contain at least one types element.");
    }

    for (const typeElement of typeElements) {
        const members = typeElement.getElementsByTagNameNS(
            expectedNamespace,
            "members"
        );

        const names = typeElement.getElementsByTagNameNS(
            expectedNamespace,
            "name"
        );

        if (members.length === 0) {
            errors.push("Every types element must contain a member.");
        }

        if (names.length !== 1) {
            errors.push(
                "Every types element must contain exactly one name element."
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}


/* =====================================================
   14. Render XML Preview and Status
   ===================================================== */

function renderXml() {
    if (!preview) return;

    const xml = buildXml();

    // Use textContent to display the XML as plain text.
    // Never insert the XML into the preview using innerHTML.
    preview.textContent = xml;

    const allNames = getAllComponentNames();

    const uniqueNameCount = new Set(allNames).size;

    if (nameCount) {
        nameCount.textContent =
            `${uniqueNameCount} ${
                uniqueNameCount === 1 ? "name" : "names"
            }`;
    }

    if (selectedCount) {
        selectedCount.textContent =
            `${selectedTypes.size} metadata ${
                selectedTypes.size === 1 ? "type" : "types"
            } selected`;
    }

    // Show or hide the wildcard warning.
    const useWildcard =
        manifestMode && manifestMode.value === "wildcard";

    if (wildcardWarning) {
        wildcardWarning.hidden = !useWildcard;
    }

    // Update status using validation results.
    const result = validateXml(xml);

    if (statusPill) {
        statusPill.classList.remove("warn", "error");

        if (result.valid) {
            statusPill.textContent = "XML valid";
        } else {
            statusPill.textContent = "Needs attention";
            statusPill.classList.add("warn");
        }

        statusPill.title = result.valid
            ? "The generated XML passed basic structural validation."
            : result.errors.join("\n");
    }
}


/* =====================================================
   15. Show Validation Errors
   ===================================================== */

function showValidationErrors(result) {
    if (result.valid) return true;

    const message = result.errors.join(" ");

    notify(message);

    if (statusPill) {
        statusPill.textContent = "Validation failed";
        statusPill.classList.remove("warn");
        statusPill.classList.add("error");
        statusPill.title = message;
    }

    return false;
}


/* =====================================================
   16. Copy XML
   ===================================================== */

async function copyXml() {
    const xml = buildXml();
    const result = validateXml(xml);

    if (!showValidationErrors(result)) {
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(xml);
        } else {
            throw new Error("Clipboard API unavailable");
        }

        notify("XML copied to clipboard.");
    } catch (error) {
        // Fallback for browsers that block the Clipboard API.
        const temporaryInput = document.createElement("textarea");

        temporaryInput.value = xml;
        temporaryInput.setAttribute("readonly", "");

        temporaryInput.style.position = "fixed";
        temporaryInput.style.left = "-9999px";
        temporaryInput.style.top = "0";

        document.body.appendChild(temporaryInput);

        temporaryInput.select();
        temporaryInput.setSelectionRange(0, xml.length);

        let copied = false;

        try {
            copied = document.execCommand("copy");
        } catch (copyError) {
            copied = false;
        }

        temporaryInput.remove();

        notify(
            copied
                ? "XML copied to clipboard."
                : "Copy failed. Please copy the XML manually."
        );
    }
}


/* =====================================================
   17. Download package.xml
   ===================================================== */

function downloadXml() {
    const xml = buildXml();
    const result = validateXml(xml);

    if (!showValidationErrors(result)) {
        return;
    }

    const useWildcard =
        manifestMode && manifestMode.value === "wildcard";

    if (useWildcard) {
        const confirmed = window.confirm(
            "Wildcard mode includes all members for each selected metadata type. " +
            "Review the generated package.xml before using it. Continue downloading?"
        );

        if (!confirmed) {
            return;
        }
    }

    const blob = new Blob(
        [xml],
        { type: "application/xml;charset=utf-8" }
    );

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = "package.xml";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 1000);

    notify("package.xml downloaded.");
}


/* =====================================================
   18. Select All Metadata Types
   ===================================================== */

function selectAllTypes() {
    METADATA_TYPES.forEach(type => {
        selectedTypes.add(type.name);
    });

    renderMetadataTypes();
    renderComponentInputs();
    renderXml();

    notify("All metadata types selected.");
}


/* =====================================================
   19. Select Popular Metadata Types
   ===================================================== */

function selectPopularTypes() {
    METADATA_TYPES
        .filter(type => type.popular)
        .forEach(type => {
            selectedTypes.add(type.name);
        });

    renderMetadataTypes();
    renderComponentInputs();
    renderXml();

    notify("Popular metadata types selected.");
}


/* =====================================================
   20. Deselect All Metadata Types
   ===================================================== */

function deselectAllTypes() {
    selectedTypes.clear();

    renderMetadataTypes();
    renderComponentInputs();
    renderXml();

    notify("All metadata types deselected.");
}


/* =====================================================
   21. Clear Everything
   ===================================================== */

function clearAll() {
    selectedTypes.clear();
    componentNames.clear();

    if (searchInput) {
        searchInput.value = "";
    }

    if (typeFilter) {
        typeFilter.value = "all";
    }

    if (manifestMode) {
        manifestMode.value = "names";
    }

    renderMetadataTypes();
    renderComponentInputs();
    renderXml();

    notify("Selections and component names cleared.");
}


/* =====================================================
   22. Load Example Data
   ===================================================== */

function loadExample() {
    // Add the metadata types used in the example.
    selectedTypes.add("ApexClass");
    selectedTypes.add("ApexTrigger");
    selectedTypes.add("LightningComponentBundle");
    selectedTypes.add("Flow");

    // Store example names independently by metadata type.
    componentNames.set(
        "ApexClass",
        "AccountHelper\nContactService\nOrderProcessor"
    );

    componentNames.set(
        "ApexTrigger",
        "AccountTrigger\nContactTrigger"
    );

    componentNames.set(
        "LightningComponentBundle",
        "accountCard\ncontactDetails"
    );

    componentNames.set(
        "Flow",
        "Create_Account\nUpdate_Contact"
    );

    if (manifestMode) {
        manifestMode.value = "names";
    }

    renderMetadataTypes();
    renderComponentInputs();
    renderXml();

    notify("Example component names loaded.");
}


/* =====================================================
   23. Format XML Preview
   ===================================================== */

function formatXml() {
    // buildXml() already produces consistently indented XML.
    renderXml();

    notify("XML preview formatted.");
}


/* =====================================================
   24. Toggle Dark Mode
   ===================================================== */

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark");

    const themeButton = document.getElementById("themeToggle");

    if (themeButton) {
        themeButton.setAttribute(
            "aria-pressed",
            String(isDark)
        );
    }
}


/* =====================================================
   25. Register Event Listeners
   ===================================================== */

function registerEvents() {
    // Search metadata types.
    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderMetadataTypes
        );
    }

    // Filter metadata types.
    if (typeFilter) {
        typeFilter.addEventListener(
            "change",
            renderMetadataTypes
        );
    }

    // Update XML when API version changes.
    if (versionInput) {
        versionInput.addEventListener(
            "change",
            renderXml
        );
    }

    // Update XML when manifest mode changes.
    if (manifestMode) {
        manifestMode.addEventListener(
            "change",
            renderXml
        );
    }

    // Copy XML.
    const copyButton = document.getElementById("copy");

    if (copyButton) {
        copyButton.addEventListener("click", copyXml);
    }

    // Download XML.
    const downloadButton = document.getElementById("download");

    if (downloadButton) {
        downloadButton.addEventListener(
            "click",
            downloadXml
        );
    }

    // Clear all selections and names.
    const clearButton = document.getElementById("clear");

    if (clearButton) {
        clearButton.addEventListener("click", clearAll);
    }

    // Format preview.
    const formatButton = document.getElementById("format");

    if (formatButton) {
        formatButton.addEventListener("click", formatXml);
    }

    // Load example.
    const exampleButton = document.getElementById("example");

    if (exampleButton) {
        exampleButton.addEventListener("click", loadExample);
    }

    // Select all metadata types.
    const selectAllButton = document.getElementById("selectAll");

    if (selectAllButton) {
        selectAllButton.addEventListener(
            "click",
            selectAllTypes
        );
    }

    // Select popular metadata types.
    const selectPopularButton =
        document.getElementById("selectPopular");

    if (selectPopularButton) {
        selectPopularButton.addEventListener(
            "click",
            selectPopularTypes
        );
    }

    // Deselect all metadata types.
    const deselectAllButton =
        document.getElementById("deselectAll");

    if (deselectAllButton) {
        deselectAllButton.addEventListener(
            "click",
            deselectAllTypes
        );
    }

    // Dark mode.
    const themeButton = document.getElementById("themeToggle");

    if (themeButton) {
        themeButton.addEventListener(
            "click",
            toggleTheme
        );
    }
}


/* =====================================================
   26. Initialize Application
   ===================================================== */

function initializeApp() {
    initializeVersions();
    registerEvents();

    renderMetadataTypes();
    renderComponentInputs();
    renderXml();
}

initializeApp();