export const makeClientId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const mapApiAddonCategoriesToForm = (dish) => {
    const raw = dish && typeof dish === 'object' ? dish : {};
    const categories = Array.isArray(raw.addon_categories) ? raw.addon_categories : [];
    return categories.map((cat) => ({
        clientId: typeof cat?.id === 'string' ? cat.id : makeClientId(),
        id: typeof cat?.id === 'string' ? cat.id : undefined,
        name: typeof cat?.name === 'string' ? cat.name : '',
        sort_order: typeof cat?.sort_order === 'number' ? cat.sort_order : 0,
        is_multiple_allowed: cat?.is_multiple_allowed !== false,
        addons: (Array.isArray(cat?.addons) ? cat.addons : []).map((addon) => ({
            clientId: typeof addon?.id === 'string' ? addon.id : makeClientId(),
            id: typeof addon?.id === 'string' ? addon.id : undefined,
            name: typeof addon?.name === 'string' ? addon.name : '',
            price: addon?.price === 0 || addon?.price ? addon.price : 0,
            image: typeof addon?.image === 'string' ? addon.image : null,
        })),
    }));
};

export const buildAddonCategoriesPayload = (addonCategories) => {
    return (Array.isArray(addonCategories) ? addonCategories : [])
        .map((cat, index) => ({
            name: cat.name?.trim() || '',
            sort_order: typeof cat.sort_order === 'number' ? cat.sort_order : index,
            is_multiple_allowed: cat.is_multiple_allowed !== false,
            addons: (Array.isArray(cat.addons) ? cat.addons : [])
                .map((addon) => {
                    const price = Number(addon.price);
                    const entry = {
                        name: addon.name?.trim() || '',
                        price: Number.isFinite(price) ? price : 0,
                    };
                    if (typeof addon.image === 'string' && addon.image.trim()) {
                        entry.image = addon.image.trim();
                    }
                    return entry;
                })
                .filter((addon) => addon.name),
        }))
        .filter((cat) => cat.name && cat.addons.length > 0);
};

export const formatAddonPrice = (price) => {
    const value = Number(price);
    if (!Number.isFinite(value)) return '$0.00';
    return `$${value.toFixed(2)}`;
};
