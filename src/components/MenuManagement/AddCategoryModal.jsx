import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function AddCategoryModal({ isOpen, onClose, onSave, saving, errorLines, duplicateSource }) {
    const fileInputRef = useRef(null);
    const objectUrlRef = useRef('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        if (duplicateSource && typeof duplicateSource === 'object') {
            const baseName = typeof duplicateSource.name === 'string' ? duplicateSource.name.trim() : '';
            setName(baseName ? `Copy of ${baseName}` : '');
            setDescription(typeof duplicateSource.description === 'string' ? duplicateSource.description : '');
            const remote =
                typeof duplicateSource.imageUrl === 'string' ? duplicateSource.imageUrl.trim() : '';
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = '';
            }
            setImageFile(null);
            setImagePreviewUrl(remote);
        } else {
            setName('');
            setDescription('');
            setImageFile(null);
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = '';
            }
            setImagePreviewUrl('');
        }
    }, [isOpen, duplicateSource]);

    const canReuseImage =
        duplicateSource &&
        typeof duplicateSource.imageUrl === 'string' &&
        duplicateSource.imageUrl.trim().length > 0;

    const canSave = useMemo(
        () => !!name.trim() && !saving && (!!imageFile || !!canReuseImage),
        [canReuseImage, imageFile, name, saving]
    );

    if (!isOpen) return null;

    const isDuplicate = !!(duplicateSource && typeof duplicateSource === 'object');

    const handleSaveClick = () => {
        const existingImageUrl =
            !imageFile && canReuseImage ? duplicateSource.imageUrl.trim() : '';
        onSave?.({ name, description, imageFile, existingImageUrl });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="bg-white rounded-[16px] w-full max-w-[500px] shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-[18px] font-bold text-[#111827]">{isDuplicate ? 'Duplicate Category' : 'Add Category'}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 bg-white">
                    {!!errorLines?.length && (
                        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 space-y-1">
                            {errorLines.map((line, idx) => (
                                <div key={`${line}-${idx}`}>{line}</div>
                            ))}
                        </div>
                    )}

                    {/* Category Image */}
                    <div>
                        <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Category Image</label>
                        <div className="flex items-center gap-4 flex-wrap">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                                disabled={saving}
                            >
                                Upload Image
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (objectUrlRef.current) {
                                        URL.revokeObjectURL(objectUrlRef.current);
                                        objectUrlRef.current = '';
                                    }
                                    setImageFile(file);
                                    if (!file) {
                                        const fallback =
                                            duplicateSource &&
                                            typeof duplicateSource.imageUrl === 'string' &&
                                            duplicateSource.imageUrl.trim()
                                                ? duplicateSource.imageUrl.trim()
                                                : '';
                                        setImagePreviewUrl(fallback);
                                        return;
                                    }
                                    const url = URL.createObjectURL(file);
                                    objectUrlRef.current = url;
                                    setImagePreviewUrl(url);
                                }}
                            />
                            {imagePreviewUrl ? (
                                <img
                                    src={imagePreviewUrl}
                                    alt="Category preview"
                                    className="w-[54px] h-[54px] rounded-[8px] object-cover border border-gray-100"
                                />
                            ) : null}
                        </div>
                        {isDuplicate && canReuseImage ? (
                            <p className="text-[12px] text-[#6B7280] mt-2">
                                Using the original category image — upload to replace it.
                            </p>
                        ) : null}
                    </div>

                    {/* Category Name */}
                    <div>
                        <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Category Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Burgers, Pizzas, Drinks"
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors placeholder-gray-400"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    {/* Category Description */}
                    <div>
                        <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Category Description (Optional)</label>
                        <input
                            type="text"
                            placeholder="Brief description of this category"
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors placeholder-gray-400"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={!canSave}
                        className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white transition-colors ${canSave ? 'bg-[#DD2F26] hover:bg-[#C52820]' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        {saving ? 'Saving...' : 'Save Category'}
                    </button>
                </div>
            </div>
        </div>
    );
}
