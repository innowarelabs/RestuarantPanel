import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SupportHeader from '../../components/Support/SupportHeader';

import AdminSupportTickets from '../../components/Support/AdminSupportTickets';
import CustomerSupportLayout from '../../components/Support/CustomerSupportLayout';
import CreateTicketModal from '../../components/Support/CreateTicketModal';
import FilterTicketsModal from '../../components/Support/FilterTicketsModal';
import TicketDetailsModal from '../../components/Support/TicketDetailsModal';

const Supports = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() =>
        searchParams.get('tab') === 'admin' ? 'admin' : 'customer'
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filterModalSession, setFilterModalSession] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [appliedTicketFilters, setAppliedTicketFilters] = useState(() => ({
        status: [],
        priority: [],
        assignedTo: [],
        fromDate: '',
        toDate: '',
    }));
    const [ticketSearchInput, setTicketSearchInput] = useState('');
    const [debouncedTicketSearch, setDebouncedTicketSearch] = useState('');

    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedTicketSearch(ticketSearchInput.trim());
        }, 400);
        return () => clearTimeout(id);
    }, [ticketSearchInput]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'admin') setActiveTab('admin');
        else setActiveTab('customer');
    }, [searchParams]);

    const handleTabChange = useCallback(
        (tab) => {
            setActiveTab(tab);
            if (tab === 'admin') {
                setSearchParams({ tab: 'admin' }, { replace: true });
            } else {
                setSearchParams({}, { replace: true });
            }
        },
        [setSearchParams]
    );

    const listFiltersForApi = useMemo(
        () => ({
            ...appliedTicketFilters,
            search: debouncedTicketSearch,
        }),
        [appliedTicketFilters, debouncedTicketSearch],
    );

    // Ticket Details Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setIsDetailsModalOpen(true);
    };

    const refreshTicketsList = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleApplyTicketFilters = useCallback(
        (filters) => {
            if (Array.isArray(filters?.assignedTo) && filters.assignedTo.includes('Admin Team') && activeTab === 'customer') {
                handleTabChange('admin');
            }
            setAppliedTicketFilters(filters);
        },
        [activeTab, handleTabChange],
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <SupportHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onNewTicket={() => setIsCreateModalOpen(true)}
                ticketSearchQuery={ticketSearchInput}
                onTicketSearchChange={setTicketSearchInput}
                onFilter={() => {
                    setFilterModalSession((s) => s + 1);
                    setIsFilterModalOpen(true);
                }}
            />


            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'customer' ? (
                    <CustomerSupportLayout refreshKey={refreshKey} />
                ) : (
                    <AdminSupportTickets
                        refreshKey={refreshKey}
                        listFilters={listFiltersForApi}
                        onViewTicket={handleViewTicket}
                    />
                )}
            </div>

            {/* Modals */}
            <CreateTicketModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={refreshTicketsList}
            />
            <FilterTicketsModal
                key={filterModalSession}
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                initialFilters={appliedTicketFilters}
                onApply={handleApplyTicketFilters}
            />
            <TicketDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                ticket={selectedTicket}
                onTicketUpdated={refreshTicketsList}
            />
        </div>
    );
};

export default Supports;
