export default function Toggle({ active, onClick }) {
    return (
        <button type="button" onClick={onClick} className={`w-[48px] h-[24px] rounded-full p-1 transition-colors ${active ? 'bg-primary' : 'bg-[#D1D5DB]'}`}>
            <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${active ? 'translate-x-[24px]' : 'translate-x-0'}`} />
        </button>
    );
}
