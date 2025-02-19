export default function Navbar() {
    return (
        <nav className="flex justify-between items-center px-6 py-4 bg-black text-white shadow-md">
        <div className="text-2xl font-bold">Commute Drop</div>
        <div className="flex items-center space-x-6">
            <button className="text-white hover:underline">Activity</button>
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
        </nav>
    );
}