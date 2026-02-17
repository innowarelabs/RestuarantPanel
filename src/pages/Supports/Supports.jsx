import React, { useState } from 'react';
import SupportHeader from '../../components/Support/SupportHeader';

import AdminSupportTickets from '../../components/Support/AdminSupportTickets';
import CustomerSupportLayout from '../../components/Support/CustomerSupportLayout';
import CreateTicketModal from '../../components/Support/CreateTicketModal';
import FilterTicketsModal from '../../components/Support/FilterTicketsModal';
import TicketDetailsModal from '../../components/Support/TicketDetailsModal';

const Supports = () => {
    const [activeTab, setActiveTab] = useState('customer');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Ticket Details Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <SupportHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onNewTicket={() => setIsCreateModalOpen(true)}
                onFilter={() => setIsFilterModalOpen(true)}
            />


            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'customer' ? (
                    <CustomerSupportLayout />
                ) : (
                    <AdminSupportTickets onViewTicket={handleViewTicket} />
                )}
            </div>

            {/* Modals */}
            <CreateTicketModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            <FilterTicketsModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
            />
            <TicketDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                ticket={selectedTicket}
            />
        </div>
    );
};

export default Supports;
