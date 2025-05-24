const translations = {};
let currentLanguage = localStorage.getItem('language') || 'pt'; // Default to Portuguese

async function fetchTranslations(lang) {
    try {
        const response = await fetch(`../../shared/locales/${lang}.json`);
        if (!response.ok) {
            console.error(`Could not load ${lang}.json: ${response.statusText}`);
            // Fallback to default language if fetch fails
            if (lang !== 'pt') {
                return fetchTranslations('pt');
            }
            return; // Avoid infinite loop if pt.json also fails
        }
        translations[lang] = await response.json();
        console.log(`Translations for ${lang} loaded.`);
    } catch (error) {
        console.error(`Error fetching translations for ${lang}:`, error);
        // Fallback to default language on error
        if (lang !== 'pt') {
            await fetchTranslations('pt');
        }
    }
}

function translateElement(element, key) {
    const keys = key.split('.');
    let text = translations[currentLanguage];
    try {
        for (const k of keys) {
            text = text[k];
            if (text === undefined) throw new Error(`Key not found: ${key}`);
        }

        if (typeof text === 'string') {
            // Check for specific attribute translations
            if (element.hasAttribute('data-i18n-placeholder')) {
                element.placeholder = text;
            } else if (element.hasAttribute('data-i18n-aria-label')) {
                element.setAttribute('aria-label', text);
            } else if (element.tagName === 'TITLE') {
                 // Special handling for title tag if needed, though direct data-i18n might work
                 // For simplicity, let's assume direct data-i18n works or handle it separately if needed.
                 // We might need a specific key like 'pageTitle' in the JSON.
                 document.title = text; // Update document title directly
            } else {
                // Default to updating innerText or textContent
                element.textContent = text;
            }
        } else {
            console.warn(`Translation for key '${key}' is not a string.`);
        }
    } catch (error) {
        console.warn(`Translation error: ${error.message}`);
        // Optionally display the key itself as fallback
        // element.textContent = key;
    }
}

async function applyTranslations(lang) {
    if (!translations[lang]) {
        await fetchTranslations(lang);
    }
    // Ensure translations are loaded before applying
    if (!translations[lang]) {
        console.error(`Translations for ${lang} could not be loaded. Cannot apply.`);
        return; // Stop if translations failed to load
    }

    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang.split('-')[0]; // Update html lang attribute

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        translateElement(element, key);
    });

    // Handle attributes separately
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        translateElement(element, key);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria-label');
        translateElement(element, key);
    });

    // Update language selector if it exists on the current page
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
    }

    // Update page title (if a specific key exists)
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
        const titleKey = titleElement.getAttribute('data-i18n');
        translateElement(titleElement, titleKey);
    }

    console.log(`Applied translations for ${lang}`);
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations(currentLanguage);

    // Add event listener to language selector if it exists
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (event) => {
            applyTranslations(event.target.value);
        });
    }
});

