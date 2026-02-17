import React, { useState } from 'react';
import CustomerSupportInbox from './CustomerSupportInbox';
import CustomerChatWindow from './CustomerChatWindow';

const CustomerSupportLayout = () => {
    const [conversations] = useState([
        {
            id: 1,
            name: "Sarah Johnson",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
            online: true,
            orderId: "#ORD-8765",
            time: "3m ago",
            lastMessage: "Where is my order? It's been 45 minutes...",
            tags: ["Urgent", "Open", "Delivery"],
            hasMessage: true,
            progress: 70,
            statusColor: "#F59E0B"
        },
        {
            id: 2,
            name: "Michael Chen",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
            online: false,
            orderId: "#ORD-8764",
            time: "15m ago",
            lastMessage: "Thank you for the refund!",
            tags: ["Normal", "Resolved", "Refund", "Quality"],
            hasEmail: true,
            hasAttachment: true,
            progress: 30,
            statusColor: "#2BB29C"
        },
        {
            id: 3,
            name: "Emma Williams",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
            online: true,
            orderId: "#ORD-8763",
            time: "1h ago",
            lastMessage: "Bot: How can I help you today?",
            tags: ["Low", "New", "Payment"],
            isBot: true,
            progress: 15,
            statusColor: "#2BB29C"
        },
        {
            id: 4,
            name: "James Taylor",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
            online: false,
            orderId: "#ORD-8763",
            time: "2h ago",
            lastMessage: "I'll escalate this to our manager.",
            tags: ["High", "Escalated", "Delivery", "Quality"],
            hasMessage: true,
            progress: 85,
            statusColor: "#EF4444"
        },
        {
            id: 5,
            name: "Olivia Brown",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia",
            online: false,
            orderId: "#ORD-8762",
            time: "3h ago",
            lastMessage: "Great, I'll wait for the driver.",
            tags: ["Normal", "Waiting", "Delivery"],
            hasEmail: true,
            progress: 50,
            statusColor: "#2BB29C"
        }
    ]);


    const [selectedConversation, setSelectedConversation] = useState(conversations[0]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-280px)] lg:min-h-[600px] pb-10 lg:pb-0">
            <div className="w-full lg:w-[400px] flex-shrink-0">
                <CustomerSupportInbox
                    conversations={conversations}
                    activeId={selectedConversation?.id}
                    onSelect={setSelectedConversation}
                />
            </div>
            <div className="flex-1">
                <CustomerChatWindow conversation={selectedConversation} />
            </div>
        </div>
    );
};

export default CustomerSupportLayout;
