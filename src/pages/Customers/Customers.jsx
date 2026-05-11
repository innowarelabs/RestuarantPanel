import React, { useState, useEffect, useCallback } from 'react';
import { Search, User } from 'lucide-react';
import Pagination from '../../components/Customers/Pagination';
import CustomerDetailsModal from '../../components/Customers/CustomerDetailsModal';
import { useSelector } from 'react-redux';

export default function Customers() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [customerCards, setCustomerCards] = useState(null);

    const accessToken = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);

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

    const fetchCustomerCards = useCallback(async () => {
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
            const url = `${baseUrl}/api/v1/orders/customers/cards`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();
            if (data.code === 'SUCCESS_200' && data.data) {
                setCustomerCards(data.data);
            }
        } catch (error) {
            console.error('Error fetching customer cards:', error);
        }
    }, [accessToken, restaurantId]);

    const fetchCustomersData = useCallback(async (page = 1, search = '', sort = '', date = '') => {
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_BACKEND_URL;
            if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');

            const skip = (page - 1) * 20;
            const root = String(baseUrl).replace(/\/$/, '');
            const listUrl = new URL(`${root}/api/v1/orders/customers`);
            listUrl.searchParams.set('skip', String(skip));
            listUrl.searchParams.set('limit', '20');
            const q =
                typeof search === 'string' ? search.replace(/\s+/g, '').trim() : '';
            if (q) listUrl.searchParams.set('search', q);
            if (sort) listUrl.searchParams.set('sort', sort);
            if (date) {
                const d = String(date).trim();
                if (d) {
                    listUrl.searchParams.set('start_date', d);
                    listUrl.searchParams.set('end_date', d);
                }
            }

            const res = await fetch(listUrl.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                },
            });
            const data = await res.json();

            if (data.code === 'SUCCESS_200' && data.data) {
                const customersList = data.data.customers.map((customer) => ({
                    customer_id: customer.customer_id,
                    name: customer.name,
                    phone_number: customer.phone_number,
                    email: customer.email,
                    is_locked: !!customer.is_locked,
                    total_orders: customer.total_orders,
                    total_spending: customer.total_spending,
                    loyalty_points: customer.loyalty_points,
                    last_order: customer.last_order,
                }));
                setCustomers(customersList);
                setTotalCustomers(data.data.total);
                setTotalPages(data.data.total_pages);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, restaurantId]);

    const refreshCustomersListAndCards = useCallback(() => {
        fetchCustomersData(currentPage, debouncedSearchTerm, sortBy, filterDate);
        fetchCustomerCards();
    }, [currentPage, debouncedSearchTerm, sortBy, filterDate, fetchCustomerCards, fetchCustomersData]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 2000);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchCustomersData(currentPage, debouncedSearchTerm, sortBy, filterDate);
        fetchCustomerCards();
    }, [accessToken, currentPage, debouncedSearchTerm, sortBy, filterDate, fetchCustomerCards, fetchCustomersData]);

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const customerStatusBadge = (isLocked) => (
        <span className="inline-flex items-center rounded-[8px] bg-primary-bg px-3 py-1.5 text-[12px] font-medium text-primary">
            {isLocked ? 'Blocked' : 'Active'}
        </span>
    );

    const formatCurrency = (amount) => {
        return `$${amount.toFixed(2)}`;
    };

    const stats = [
        { label: 'Total Customers', value: customerCards?.total_customers.toString() || '0' },
        { label: 'Loyalty Members', value: customerCards?.loyalty_members.toString() || '0', textColor: 'text-[#DD2F26]' },
        { label: 'High Value ($100+)', value: customerCards?.high_value_customers.toString() || '0' },
        {
            label: 'Blocked users',
            value:
                customerCards?.blocked_users != null
                    ? String(customerCards.blocked_users)
                    : customerCards?.blocked != null
                      ? String(customerCards.blocked)
                      : customerCards?.blocked_customers != null
                        ? String(customerCards.blocked_customers)
                        : '0',
            textColor: 'text-primary',
        },
    ];

    const handleRowClick = (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
        setLoadingDetails(true);
        setCustomerDetails(null);

        const fetchCustomerDetails = async () => {
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL;
                if (!baseUrl) throw new Error('VITE_BACKEND_URL is missing');
                const url = `${baseUrl}/api/v1/orders/customers/${encodeURIComponent(customer.customer_id)}`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(restaurantId ? { 'X-Restaurant-Id': restaurantId } : {}),
                    },
                });
                const data = await res.json();
                if (data.code === 'SUCCESS_200' && data.data) {
                    setCustomerDetails(data.data);
                }
            } catch (error) {
                console.error('Error fetching customer details:', error);
            } finally {
                setLoadingDetails(false);
            }
        };

        fetchCustomerDetails();
    };

    const handleSortChange = (sortValue) => {
        setSortBy(sortValue);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSortBy('');
        setFilterDate('');
        setCurrentPage(1);
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <h1 className="mb-6 font-sans text-[24px] font-[700] leading-[28.8px] tracking-normal text-[#0F1724]">
                Customers
            </h1>

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
                    <select 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg flex items-center justify-between bg-white text-[14px] font-[500] text-gray-600 hover:bg-gray-50 cursor-pointer appearance-none"
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                    >
                        <option value="">Sort By</option>
                        <option value="az">A - Z</option>
                        <option value="za">Z - A</option>
                    </select>
                </div>

                <div className="w-[200px] min-w-[200px] relative">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => {
                            setFilterDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-2 pr-3 text-[14px] font-[500] text-gray-600 hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:light]"
                        title="Filter by date"
                    />
                </div>

                <button 
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-[#FEF2F2] text-[#DD2F26] rounded-lg text-[14px] font-medium hover:bg-[#FECACA] transition-colors cursor-pointer">
                    Reset Filters
                </button>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 rounded-[12px] h-[100px] border border-[#E5E7EB]">
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
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : customers.length > 0 ? (
                                customers.map((customer) => (
                                    <tr
                                        key={customer.customer_id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleRowClick(customer)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#DD2F26]">
                                                    <User size={16} />
                                                </div>
                                                <span className="text-[14px] font-[500] text-[#111827]">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">{customer.phone_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">{customer.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">
                                            {customer.last_order ? formatDateTime(customer.last_order.created_at) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[400] text-[#374151]">{customer.total_orders}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[500] text-[#0F1724]">{formatCurrency(customer.total_spending)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{customerStatusBadge(customer.is_locked)}</td>
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No customers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            <CustomerDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customer={selectedCustomer}
                customerDetails={customerDetails}
                loadingDetails={loadingDetails}
                onLockStatusChanged={refreshCustomersListAndCards}
            />
        </div>
    );
}
