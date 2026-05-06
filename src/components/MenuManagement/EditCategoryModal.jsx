import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

const getInitialFormData = (category) => {
    if (category) {
        return {
            name: category.name || '',
            isVisible: category.visible !== false,
        };
    }

    return {
        name: '',
        isVisible: true,
    };
};

function EditCategoryModalInner({ onClose, category, onSave, saving, errorLines }) {
    const fileInputRef = useRef(null);
    const objectUrlRef = useRef('');
    const [formData, setFormData] = useState(() => getInitialFormData(category));
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [baselineRemoteUrl, setBaselineRemoteUrl] = useState('');

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    useEffect(() => {
        setFormData(getInitialFormData(category));
        const remote = typeof category?.imageUrl === 'string' ? category.imageUrl.trim() : '';
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = '';
        }
        setImageFile(null);
        setBaselineRemoteUrl(remote);
        setImagePreviewUrl(remote);
    }, [category]);

    const canSave = useMemo(
        () => !!formData.name?.trim() && !saving && (!!imageFile || !!baselineRemoteUrl.trim()),
        [baselineRemoteUrl, formData.name, imageFile, saving],
    );

    const handleSaveClick = () => {
        const existingImageUrl = imageFile ? '' : baselineRemoteUrl.trim();
        onSave?.({
            name: formData.name,
            isVisible: formData.isVisible,
            imageFile,
            existingImageUrl,
        });
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 transition-opacity"
            onClick={() => {
                if (saving) return;
                onClose();
            }}
        >
            <div
                className="bg-white rounded-[16px] w-full max-w-[500px] shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-[18px] font-bold text-[#111827]">Edit Category</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-60"
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
                                        setImagePreviewUrl(baselineRemoteUrl);
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
                        {baselineRemoteUrl ? (
                            <p className="text-[12px] text-[#6B7280] mt-2">Upload a new image to replace the current one.</p>
                        ) : (
                            <p className="text-[12px] text-[#6B7280] mt-2">This category has no image yet — upload one to save.</p>
                        )}
                    </div>

                    {/* Category Name */}
                    <div>
                        <label className="block text-[14px] font-medium text-[#374151] mb-1.5">Category Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Burgers, Pizzas, Drinks"
                            disabled={saving}
                            className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] outline-none focus:border-[#DD2F26] transition-colors placeholder-gray-400 disabled:opacity-60"
                        />
                    </div>

                    {/* Category Visibility */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-[14px] font-medium text-[#374151]">Category Visibility</h4>
                            <p className="text-[12px] text-gray-500">Show this category to customers</p>
                        </div>
                        <div
                            className={`w-[44px] h-[24px] rounded-full p-1 transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${formData.isVisible ? 'bg-[#DD2F26]' : 'bg-gray-300'}`}
                            onClick={() => {
                                if (saving) return;
                                setFormData((prev) => ({ ...prev, isVisible: !prev.isVisible }));
                            }}
                        >
                            <div
                                className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform ${formData.isVisible ? 'translate-x-[20px]' : 'translate-x-0'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-[#374151] hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={!canSave}
                        className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white transition-colors ${canSave ? 'bg-[#DD2F26] hover:bg-[#C52820]' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EditCategoryModal({ isOpen, onClose, category, onSave, saving, errorLines }) {
    if (!isOpen) return null;

    const modalKey = category?.id ? String(category.id) : 'new';

    return (
        <EditCategoryModalInner
            key={modalKey}
            onClose={onClose}
            category={category}
            onSave={onSave}
            saving={saving}
            errorLines={errorLines}
        />
    );
}
