import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { X, Paperclip, ChevronDown, Trash2 } from 'lucide-react';

/** FastAPI / Pydantic 422 `detail` → one string for toast (newlines between items). */
const formatTicketApiError = (json) => {
    if (!json || typeof json !== 'object') return 'Failed to create ticket';
    const detail = json.detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const lines = detail
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const loc = Array.isArray(item.loc) ? item.loc : [];
                const fieldParts = loc.filter((x) => x !== 'body' && x !== 'query' && x !== 'path');
                const fieldLabel = fieldParts.length ? String(fieldParts[fieldParts.length - 1]) : '';
                const msg = item.msg || item.message || 'Invalid value';
                return fieldLabel ? `${fieldLabel}: ${msg}` : msg;
            })
            .filter(Boolean);
        if (lines.length) return lines.join('\n');
    }
    if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
    if (typeof json.error === 'string' && json.error.trim()) return json.error.trim();
    return 'Failed to create ticket';
};

const extractTicketIdFromResponse = (json) => {
    if (!json || typeof json !== 'object') return '';
    const asStr = (v) => {
        if (typeof v === 'string' && v.trim()) return v.trim();
        if (typeof v === 'number' && Number.isFinite(v)) return String(v);
        return '';
    };
    const d = json.data;
    if (d && typeof d === 'object') {
        const nested = asStr(d.id) || asStr(d.ticket_id) || asStr(d.uuid);
        if (nested) return nested;
    }
    return asStr(json.id) || asStr(json.ticket_id) || '';
};

const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Payments');
    const [priority, setPriority] = useState('Normal');
    const [description, setDescription] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [preferredContact, setPreferredContact] = useState('email');
    /** Pending files for ticket (multiple allowed; each has stable id for list UI). */
    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);

    const getRestaurantId = () => {
        const fromUser = user && typeof user === 'object' && typeof user.restaurant_id === 'string' ? user.restaurant_id : '';
        let fromStorage = '';
        try {
            fromStorage = localStorage.getItem('restaurant_id') || '';
        } catch {
            fromStorage = '';
        }
        return (fromUser || fromStorage).trim();
    };

    const restaurantId = getRestaurantId();

    const mapCategoryToTicketType = (value) => {
        const v = (value || '').toLowerCase();
        if (v === 'payments' || v === 'payment' || v === 'billing') return 'billing';
        if (v === 'technical') return 'technical';
        if (v === 'integrations' || v === 'integration') return 'technical';
        if (v === 'account') return 'support';
        return 'general';
    };

    const mapPriorityToApi = (value) => {
        const v = (value || '').toLowerCase();
        if (v === 'low') return 'low';
        if (v === 'normal' || v === 'medium') return 'medium';
        if (v === 'high' || v === 'urgent') return 'high';
        return 'medium';
    };

    const resetForm = () => {
        setTitle('');
        setCategory('Payments');
        setPriority('Normal');
        setDescription('');
        setOrderNumber('');
        setPreferredContact('email');
        setAttachments([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const postTicketAttachment = async (ticketId, file) => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/${encodeURIComponent(ticketId)}/attachments`;
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
            },
            body: formData,
        });
        const rawText = await res.text();
        let json = {};
        if (rawText) {
            try {
                json = JSON.parse(rawText);
            } catch {
                json = { message: rawText };
            }
        }
        if (!res.ok) {
            throw new Error(formatTicketApiError(json));
        }
        return json;
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            toast.error('Title and description are required.');
            return;
        }

        if (!accessToken) {
            toast.error('You are not authenticated. Please log in again.');
            return;
        }

        if (!restaurantId) {
            toast.error('Restaurant ID is missing. Please log in again.');
            return;
        }

        setSubmitting(true);

        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) {
                throw new Error('VITE_BACKEND_URL is missing');
            }

            const url = `${baseUrl.replace(/\/$/, '')}/api/v1/tickets/`;

            const payload = {
                subject: title.trim(),
                description: description.trim(),
                ticket_type: mapCategoryToTicketType(category),
                priority: mapPriorityToApi(priority),
                order_number: orderNumber.trim(),
                preferred_contact: preferredContact,
                tags: '',
                restaurant_id: restaurantId,
            };

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'X-Restaurant-Id': restaurantId,
            };

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const rawText = await res.text();
            let json = {};
            if (rawText) {
                try {
                    json = JSON.parse(rawText);
                } catch {
                    json = { message: rawText };
                }
            }

            const code = json?.code;
            const isSuccessCode = code && typeof code === 'string' && code.startsWith('SUCCESS_');
            const isStatusSuccess = res.status === 201 || (res.ok && res.status >= 200 && res.status < 300);

            if (!isSuccessCode && !isStatusSuccess) {
                toast.error(formatTicketApiError(json));
                return;
            }

            const ticketId = extractTicketIdFromResponse(json);
            const filesToUpload = attachments.map((a) => a.file);
            const ticketSuccessMsg = json?.message || 'Ticket created successfully';

            if (filesToUpload.length > 0) {
                if (!ticketId) {
                    toast.success(ticketSuccessMsg);
                    toast.error(
                        'Attachments were not uploaded: ticket id was missing in the server response.'
                    );
                } else {
                    const failed = [];
                    for (let i = 0; i < filesToUpload.length; i += 1) {
                        const file = filesToUpload[i];
                        try {
                            await postTicketAttachment(ticketId, file);
                        } catch (attErr) {
                            failed.push({ name: file.name, message: attErr?.message || 'Upload failed' });
                        }
                    }
                    if (failed.length > 0) {
                        toast.success(ticketSuccessMsg);
                        toast.error(
                            failed.length === filesToUpload.length
                                ? `Attachments failed:\n${failed.map((f) => `${f.name}: ${f.message}`).join('\n')}`
                                : `Some attachments failed:\n${failed.map((f) => `${f.name}: ${f.message}`).join('\n')}`
                        );
                    } else {
                        toast.success(json?.message || 'Ticket and attachments submitted successfully');
                    }
                }
            } else {
                toast.success(ticketSuccessMsg);
            }

            resetForm();
            onSuccess?.();
            onClose?.();
        } catch (e) {
            toast.error(e.message || 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[12px] border border-[#00000033] w-[500px] max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-[18px] font-bold text-general-text">Create Ticket for Platform Support</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Title */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Brief description of your issue"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[14px] font-[500] text-general-text mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="Payments">Payments</option>
                                    <option value="Technical">Technical</option>
                                    <option value="Integrations">Integrations</option>
                                    <option value="Account">Account</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[14px] font-[500] text-general-text mb-2">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Normal">Normal</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Provide detailed information about your issue"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-gray-400"
                        ></textarea>
                    </div>

                    {/* Link Order */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Link an Order (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., #ORD-8765"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Attach Evidence */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-2">
                            Attach Evidence
                        </label>
                        <div className="space-y-2">
                            <label
                                htmlFor="platform-ticket-attachments"
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-[8px] text-[14px] font-[500] text-general-text hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                Upload Files
                            </label>
                            <input
                                ref={fileInputRef}
                                id="platform-ticket-attachments"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const picked = Array.from(e.target.files || []);
                                    if (!picked.length) return;
                                    setAttachments((prev) => [
                                        ...prev,
                                        ...picked.map((file) => ({
                                            id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                                            file,
                                        })),
                                    ]);
                                    e.target.value = '';
                                }}
                            />
                            {attachments.length > 0 && (
                                <ul className="text-[12px] text-gray-600 space-y-1.5">
                                    {attachments.map(({ id, file }) => (
                                        <li
                                            key={id}
                                            className="flex items-center justify-between gap-2 rounded-[6px] border border-gray-100 bg-gray-50/80 px-2 py-1.5"
                                        >
                                            <span className="truncate" title={file.name}>
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(id)}
                                                className="shrink-0 p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                                                aria-label={`Remove ${file.name}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Preferred Contact Method */}
                    <div>
                        <label className="block text-[14px] font-[500] text-general-text mb-3">
                            Preferred Contact Method
                        </label>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="preferred-contact"
                                    value="email"
                                    checked={preferredContact === 'email'}
                                    onChange={() => setPreferredContact('email')}
                                    className="hidden"
                                />
                                <div className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${preferredContact === 'email' ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                                    {preferredContact === 'email' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                </div>
                                <span className="text-[13px] font-[500] text-gray-600">Email</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="preferred-contact"
                                    value="phone"
                                    checked={preferredContact === 'phone'}
                                    onChange={() => setPreferredContact('phone')}
                                    className="hidden"
                                />
                                <div className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${preferredContact === 'phone' ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                                    {preferredContact === 'phone' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                </div>
                                <span className="text-[13px] font-[500] text-gray-600">Phone</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-[#F9FAFB]/50">
                    <button
                        onClick={() => {
                            resetForm();
                            onClose?.();
                        }}
                        className="px-6 py-2.5 border border-gray-200 text-gray-600 text-[14px] font-[500] rounded-[8px] hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`px-6 py-2.5 bg-[#DD2F26] text-white text-[14px] font-[500] rounded-[8px] hover:bg-[#C52820] transition-colors shadow-sm ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Submitting…' : 'Submit Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTicketModal;
