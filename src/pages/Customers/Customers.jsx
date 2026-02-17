import React, { useState } from 'react';
import { Search, ChevronDown, User } from 'lucide-react';
import Pagination from '../../components/Customers/Pagination';
import CustomerDetailsModal from '../../components/Customers/CustomerDetailsModal';

export default function Customers() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Mock Customer Data
    const customers = [
        { id: 1, name: 'Ali Raza', phone: '+44 7700 900123', email: 'ali.raza@email.com', lastOrder: '2 days ago', totalOrders: 12, totalSpend: '$145.90', status: 'Active' },
        { id: 2, name: 'Sana Khan', phone: '+44 7700 900456', email: 'sana.khan@email.com', lastOrder: '4 days ago', totalOrders: 7, totalSpend: '$82.40', status: 'Active' },
        { id: 3, name: 'Wajahat Ali', phone: '+44 7700 900789', email: 'wajahat@email.com', lastOrder: 'Yesterday', totalOrders: 20, totalSpend: '$240.10', status: 'Active' },
        { id: 4, name: 'Bilal Ahmed', phone: '+44 7700 901234', email: 'bilal.ahmed@email.com', lastOrder: '2 weeks ago', totalOrders: 3, totalSpend: '$24.90', status: 'Active' },
        { id: 5, name: 'Farah', phone: '+44 7700 902345', email: 'farah.m@email.com', lastOrder: '3 days ago', totalOrders: 15, totalSpend: '$180.00', status: 'Active' },
        { id: 6, name: 'Danish', phone: '+44 7700 903456', email: 'danish.k@email.com', lastOrder: '3 weeks ago', totalOrders: 1, totalSpend: '$8.50', status: 'Active' },
        { id: 7, name: 'Noor Hassan', phone: '+44 7700 904567', email: 'noor.h@email.com', lastOrder: '6 days ago', totalOrders: 8, totalSpend: '$95.60', status: 'Active' },
        { id: 8, name: 'Hamza Noor', phone: '+44 7700 905678', email: 'hamza@email.com', lastOrder: 'Yesterday', totalOrders: 18, totalSpend: '$215.30', status: 'Active' },
        { id: 9, name: 'Imran Sheikh', phone: '+44 7700 906789', email: 'imran.sheikh@email.com', lastOrder: '1 weeks ago', totalOrders: 5, totalSpend: '$58.70', status: 'Blocked' },
        { id: 10, name: 'Sara Ahmed', phone: '+44 7700 907890', email: 'sara.a@email.com', lastOrder: '2 days ago', totalOrders: 11, totalSpend: '$132.40', status: 'Active' }
    ];

    const stats = [
        { label: 'Total Customers', value: '10' },
        { label: 'Loyalty Members', value: '10', textColor: 'text-[#2BB29C]' },
        { label: 'High Value ($100+)', value: '5' },
        { label: 'Blocked', value: '1', textColor: 'text-[#EF4444]' },
    ];

    const handleRowClick = (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <h1 className="text-[24px] font-[800] text-[#111827] mb-6">Customers</h1>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-[16px]  mb-6 border border-[#E5E7EB] flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-[14px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-[180px] relative">
                    <button className="w-full px-4 py-2 border border-gray-200 rounded-lg flex items-center justify-between bg-white text-[14px] font-[500] text-gray-600 hover:bg-gray-50 cursor-pointer">
                        <span>Sort By</span>
                        <ChevronDown size={16} />
                    </button>
                </div>

                <div className="w-[180px] relative">
                    <button className="w-full px-4 py-2 border border-gray-200 rounded-lg flex items-center justify-between bg-white text-[14px] text-gray-600 hover:bg-gray-50 cursor-pointer">
                        <span>Dd/Mm/Yyyy</span>
                        <ChevronDown size={16} />
                    </button>
                </div>

                <button className="px-4 py-2 bg-[#E0F2F1] text-[#2BB29C] rounded-lg text-[14px] font-medium hover:bg-[#B2DFDB] transition-colors cursor-pointer">
                    Reset Filters
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6 mb-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 rounded-[12px] h-[100px]  border border-[#E5E7EB]">
                        <p className="text-[13px] text-gray-500 mb-1">{stat.label}</p>
                        <p className={`text-[24px] font-[800] ${stat.textColor || 'text-[#111827]'}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-[16px]  border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#E5E7EB] border-b border-[#E5E7EB]">
                            <tr>
                                <th className="px-6 py-4 text-left text-[13px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Customer Name</th>
                                <th className="px-6 py-4 text-left text-[13px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Phone Number</th>
                                <th className="px-6 py-4 text-left text-[13px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-[13px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Last Order</th>
                                <th className="px-6 py-4 text-left text-[13px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Total Orders</th>
                                <th className="px-6 py-4 text-left text-[13px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Total Spend</th>
                                <th className="px-6 py-4 text-left text-[13px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-[12px] font-[400] text-gray-500 text-nowrap style-regular font-avenir tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {customers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => handleRowClick(customer)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#2BB29C]">
                                                <User size={16} />
                                            </div>
                                            <span className="text-[14px] font-[500] text-[#111827]">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">{customer.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">{customer.lastOrder}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">{customer.totalOrders}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[500] text-[#0F1724]">{customer.totalSpend}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-[8px] text-[12px] font-medium
                                            ${customer.status === 'Active' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            className="px-3 py-1.5 border border-gray-200 rounded-[6px] text-[12px] font-[500] text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRowClick(customer);
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={2}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            <CustomerDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customer={selectedCustomer}
            />
        </div>
    );
}
