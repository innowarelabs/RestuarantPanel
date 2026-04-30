import Toggle from './Toggle';

export default function NotificationToggle({ title, desc, active, onClick }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
                <p className="font-sans text-[14px] font-medium leading-[21px] tracking-normal text-[#374151]">{title}</p>
                <p className="text-[12px] text-[#6B7280] leading-relaxed">{desc}</p>
            </div>
            <Toggle active={active} onClick={onClick} />
        </div>
    );
}
