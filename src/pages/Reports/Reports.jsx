import React, { useState } from 'react';
import ReportsMain from '../../components/Reports/ReportsMain';
import OrderReports from '../../components/Reports/OrderReports';
import SalesReports from '../../components/Reports/SalesReports';

const Reports = () => {
    const [view, setView] = useState('main'); // 'main', 'order', 'sales'

    const renderView = () => {
        switch (view) {
            case 'main':
                return <ReportsMain onSelectReport={(id) => setView(id)} />;
            case 'order':
                return <OrderReports onBack={() => setView('main')} />;
            case 'sales':
                return <SalesReports onBack={() => setView('main')} />;
            default:
                // For categories not yet implemented, just show the main page 
                // or a placeholder if you want
                return <ReportsMain onSelectReport={(id) => setView(id)} />;
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            {renderView()}
        </div>
    );
};

export default Reports;
