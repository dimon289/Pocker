import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Іконки з lucide-react

export function BurgerMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="relative bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                {/* Іконка бургер-меню */}
                <button onClick={() => setIsOpen(!isOpen)} className="text-white md:hidden absolute top-4 left-4 z-20">
                    {isOpen ? <X size={38} /> : <Menu size={38} />}
                </button>

                {/* Навігація (Плашка, яка висувається) */}
                <ul className={`fixed left-0 top-0 h-full w-64 bg-gray-800 transition-transform transform ${isOpen ? "translate-x-0" : "-translate-x-[300px]"} flex flex-col mt-16 space-y-2 p-4`}>
                    <li><Link to="/" className="block px-4 py-2 text-white hover:bg-gray-700">Main</Link></li>
                    <li><Link to="/Lobbys" className="block px-4 py-2 text-white hover:bg-gray-700">Lobbys</Link></li>
                </ul>
            </div>
        </nav>
    );
}


