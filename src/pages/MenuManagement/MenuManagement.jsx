import React, { useState } from 'react';
import { Search, Plus, Eye, MoreVertical, Edit2, Copy, Trash2, TrendingUp, Upload, Download, FileText } from 'lucide-react';
import EditMenuItemModal from '../../components/MenuManagement/EditMenuItemModal';
import MenuPreviewModal from '../../components/MenuManagement/MenuPreviewModal';
import AddCategoryModal from '../../components/MenuManagement/AddCategoryModal';
import EditCategoryModal from '../../components/MenuManagement/EditCategoryModal';

export default function MenuManagement() {
    const [activeCategory, setActiveCategory] = useState('Burgers');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeCategoryMenu, setActiveCategoryMenu] = useState(null); // To track which category menu is open

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleEditCategory = (category, e) => {
        e.stopPropagation();
        setSelectedCategory(category);
        setIsEditCategoryModalOpen(true);
        setActiveCategoryMenu(null);
    };

    // Mock Data
    const categories = [
        { id: 1, name: 'Burgers', count: 8, visible: true },
        { id: 2, name: 'Pizza', count: 12, visible: true },
        { id: 3, name: 'Pasta', count: 6, visible: false },
        { id: 4, name: 'Drinks', count: 5, visible: false },
    ];

    const menuItems = [
        {
            id: 101,
            name: 'Zinger Burger',
            sales: '24 sold this week',
            prepTime: '15 min',
            price: '$12.99',
            orders: { current: 142, total: '528 (30d)' },
            status: true,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80'
        },
        {
            id: 102,
            name: 'Classic Beef Burger',
            sales: '16 sold this week',
            prepTime: '12 min',
            price: '$10.99',
            orders: { current: 98, total: '412 (30d)' },
            status: true,
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=100&q=80'
        },
        {
            id: 103,
            name: 'Veggie Burger',
            sales: '8 sold this week',
            prepTime: '10 min',
            price: '$11.49',
            orders: { current: 76, total: '298 (30d)' },
            status: true,
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=100&q=80'
        },
        {
            id: 104,
            name: 'Veggie Burger',
            sales: '12 sold this week',
            prepTime: '10 min',
            price: '$11.49',
            orders: { current: 76, total: '298 (30d)' },
            status: true,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80'
        },
        {
            id: 105,
            name: 'Veggie Burger',
            sales: '20 sold this week',
            prepTime: '10 min',
            price: '$11.49',
            orders: { current: 76, total: '298 (30d)' },
            status: true,
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=100&q=80'
        }
    ];

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
                {/* Left Sidebar: Categories */}
                <div className="xl:col-span-4 bg-white rounded-[12px] p-5 border border-[#00000033] h-[475px]">
                    <h2 className="text-[18px] font-bold text-[#111827] mb-4">Categories</h2>

                    {/* Search */}
                    <div className="relative mb-4 ">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-9 pr-4 py-2 bg-[#F3F4F6] rounded-[8px] text-[14px] outline-none border border-transparent focus:border-[#2BB29C] transition-colors"
                        />
                    </div>

                    {/* Add Category Button */}
                    <button
                        onClick={() => setIsAddCategoryModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 border border-[#2BB29C] text-[#2BB29C] bg-white hover:bg-[#F0FDFA] py-2.5 rounded-[8px] font-medium text-[14px] mb-6 transition-colors cursor-pointer"
                    >
                        <Plus size={18} />
                        Add Category
                    </button>

                    {/* Categories List */}
                    <div className="space-y-1 overflow-y-auto max-h-[250px] no-scrollbar">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`group flex items-center justify-between p-3 rounded-[8px] cursor-pointer border transition-all
                                ${activeCategory === cat.name
                                        ? 'bg-[#E0F7F4] border-[#2BB29C]'
                                        : 'bg-white border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div>
                                    <h3 className={`text-[16px] font-[400] ${activeCategory === cat.name ? 'text-[#111827]' : 'text-[#374151]'}`}>
                                        {cat.name}
                                    </h3>
                                    <p className="text-[12px] text-gray-500">{cat.count} items</p>
                                </div>

                                <div className="flex items-center gap-2 relative">
                                    <Eye size={16} className={`cursor-pointer ${cat.visible ? 'text-[#2BB29C]' : 'text-gray-300'}`} />
                                    <div className="relative">
                                        <MoreVertical
                                            size={16}
                                            className="text-gray-400 cursor-pointer hover:text-gray-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveCategoryMenu(activeCategoryMenu === cat.id ? null : cat.id);
                                            }}
                                        />

                                        {/* Dropdown Menu */}
                                        {activeCategoryMenu === cat.id && (
                                            <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
                                                <button
                                                    onClick={(e) => handleEditCategory(cat, e)}
                                                    className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveCategoryMenu(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Copy size={14} /> Duplicate
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side Column (Table) */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="bg-white rounded-[12px] border border-[#00000033] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E5E7EB] text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider bg-gray-50/50">
                                        <th className="px-4 py-4 whitespace-nowrap">Item Name</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Prep Time</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Price</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Orders (7d)</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-4 whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E7EB]">
                                    {menuItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <img src={item.image} alt={item.name} className="w-[48px] h-[48px] rounded-[10px] object-cover border border-gray-100" />
                                                    <div>
                                                        <p className="text-[16px] font-[400] text-[#111827]">{item.name}</p>
                                                        <p className="text-[12px] text-[#6B7280]">{item.sales}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#374151] whitespace-nowrap">{item.prepTime}</td>
                                            <td className="px-6 py-4 text-[14px] font-[500] text-[#111827] whitespace-nowrap">{item.price}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-[500] text-[#111827]">{item.orders.current}</span>
                                                    <span className="text-[11px] text-[#9CA3AF]">{item.orders.total}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className={`w-[44px] h-[23px] rounded-full p-1 cursor-pointer transition-colors ${item.status ? 'bg-[#2BB29C]' : 'bg-gray-300'}`}>
                                                    <div className={`w-[16px] h-[15px] bg-white rounded-full shadow-sm transform transition-transform ${item.status ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(item)}
                                                        className="text-[#2BB29C] hover:text-[#2BB29C]/80 bg-[#F0FDFA] p-2 rounded-md transition-colors cursor-pointer"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="text-[#6B7280] hover:text-[#374151] hover:bg-gray-100 p-2 rounded-md transition-colors cursor-pointer"><Copy size={16} /></button>
                                                    <button className="text-[#EF4444] hover:text-[#D14343] hover:bg-red-50 p-2 rounded-md transition-colors cursor-pointer"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Analytics */}
            <div className="bg-white rounded-[12px] border border-[#00000033] p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-[#2BB29C] w-5 h-5" />
                    <h3 className="text-[16px] font-[800] text-[#111827]">Quick Analytics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-[#00000033] rounded-[12px] h-[104px] p-4 flex gap-4 hover:shadow-sm transition-shadow">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80" className="w-[60px] h-[60px] rounded-[10px] object-cover" alt="Best Seller" />
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-orange-400 text-[12px]">✨</span>
                                <span className="text-[10px] font-[400] font-poppins text-[#9CA3AF] uppercase">Best Seller Today</span>
                            </div>
                            <h4 className="text-[16px] text-[#111827]">Zinger Burger</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[12px] text-[#6B7280]">324 orders today</span>
                                <span className="text-[12px] text-[#6B7280]">18.2% contribution</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#00000033] rounded-[12px] p-4 h-[104px] flex gap-4 hover:shadow-sm transition-shadow">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80" className="w-[60px] h-[60px] rounded-[10px] object-cover" alt="Best Seller" />
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <TrendingUp className="text-[#2BB29C] w-3 h-3" />
                                <span className="text-[10px] font-[400] font-poppins text-[#9CA3AF] uppercase">Rising Star</span>
                            </div>
                            <h4 className="text-[16px]  text-[#111827]">Loaded Fries</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[12px] text-[#6B7280]">98 orders today</span>
                                <span className="text-[12px] text-[#6B7280]">12.5% contribution</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#00000033] rounded-[12px] h-[104px] p-4 flex gap-4 hover:shadow-sm transition-shadow">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80" className="w-[60px] h-[60px] rounded-[10px] object-cover" alt="Best Seller" />
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <TrendingUp className="text-[#2BB29C] w-3 h-3" />
                                <span className="text-[10px] font-[400] font-poppins text-[#9CA3AF] uppercase">Rising Star</span>
                            </div>
                            <h4 className="text-[16px]  text-[#111827]">Fries Combo</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[12px] text-[#6B7280]">198 orders today</span>
                                <span className="text-[12px] text-[#6B7280]">10.5% contribution</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Import & Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#00000033] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="text-[#2BB29C] w-5 h-5" />
                        <h3 className="text-[16px] font-[800] text-[#111827]">Import / Export</h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-4">
                            <div>
                                <button className="w-full flex items-center justify-center gap-2 bg-[#F0FDFA] text-[#2BB29C] text-[13px] font-[500] py-3 rounded-[8px] border border-[#24B99E] hover:bg-[#E0F7F4] transition-colors cursor-pointer">
                                    <Upload size={18} />
                                    Upload CSV
                                </button>
                                <p className="text-center text-[11px] text-[#6B7280] mt-2">Upload a CSV file to bulk import menu items</p>
                            </div>

                            <div>
                                <button className="w-full flex items-center justify-center gap-2 bg-white text-[#374151] text-[13px] font-[500] py-3 rounded-[12px] border border-[#E5E7EB] hover:bg-gray-50 transition-colors cursor-pointer">
                                    <Download size={18} />
                                    Download Template
                                </button>
                                <p className="text-center text-[11px] text-[#6B7280] mt-2">Get csv template guide</p>
                            </div>
                        </div>

                        <div className="bg-[#F6F8F9] rounded-[8px] p-5 flex-1 border border-gray-100">
                            <p className="font-[600] text-[16px] text-[#4B5563] mb-3">Required Columns:</p>
                            <ul className="text-[12px] text-[#6B7280] space-y-2 list-disc pl-4">
                                <li>Item Name</li>
                                <li>Category</li>
                                <li>Price (Numeric)</li>
                                <li>Description (Optional)</li>
                                <li>Prep Time (HH:MM)</li>
                                <li>Available (Status)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Preview Menu Card */}
                <div className="bg-white rounded-[12px] border border-[#00000033] p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#F0FDFA] rounded-full flex items-center justify-center mb-4">
                        <Eye size={32} className="text-[#2BB29C]" />
                    </div>
                    <h3 className="text-[16px] font-[800] text-[#111827] mb-2">Live Preview</h3>
                    <p className="text-center text-[11px] text-[#6B7280] mb-6">See how your menu looks for your customers on the mobile app and web.</p>
                    <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="w-full bg-[#2BB29C] text-white text-[14px] font-[500] py-3.5 rounded-[12px] shadow-sm hover:bg-[#259D89] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Eye size={18} />
                        Preview Menu
                    </button>
                </div>
            </div>

            {/* Modals */}
            <EditMenuItemModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                item={selectedItem}
            />
            <MenuPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
            />
            <AddCategoryModal
                isOpen={isAddCategoryModalOpen}
                onClose={() => setIsAddCategoryModalOpen(false)}
            />
            <EditCategoryModal
                isOpen={isEditCategoryModalOpen}
                onClose={() => setIsEditCategoryModalOpen(false)}
                category={selectedCategory}
            />
        </div>
    );
}
