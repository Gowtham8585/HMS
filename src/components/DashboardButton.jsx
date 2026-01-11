import { Link } from "react-router-dom";

export default function DashboardButton({ title, icon: Icon, to, color = "from-blue-600 to-indigo-600", onClick, alert }) {
    // We expect 'color' to be a gradient string like "from-blue-500 to-indigo-600"
    const className = `glass-card group p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[11rem] w-full active:scale-95 overflow-hidden relative`;

    const content = (
        <>
            {/* Animated background highlights */}
            <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${color}`}></div>

            {/* Alert Badge */}
            {alert && (
                <div className="absolute top-4 right-4 z-10 flex flex-col items-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-ping absolute"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
                </div>
            )}

            <div className={`p-4 rounded-full bg-gradient-to-br ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon size={40} strokeWidth={2} />
            </div>
            <span className="text-lg font-bold tracking-tight">{title}</span>

            {/* Subtle glow effect */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${color} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`}></div>
        </>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className={className}>
                {content}
            </button>
        )
    }

    return (
        <Link to={to} className={className}>
            {content}
        </Link>
    );
}
