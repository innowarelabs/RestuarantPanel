import Toggle from './Toggle';

export default function NotificationToggle({ title, desc, active, onClick }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
                <p className="text-[15px] font-[500] text-[#111827]">{title}</p>
                <p className="text-[13px] text-[#6B7280]">{desc}</p>
            </div>
            <Toggle active={active} onClick={onClick} />
        </div>
    );
}
