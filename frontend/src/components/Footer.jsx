import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t-2 border-gray-200 mt-auto shadow-lg">
            <div className="container mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                            Ruhunu Tyre House
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            Your trusted partner for professional battery management solutions.
                            Streamline your inventory, sales, and customer service with our advanced platform.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-600 rounded-lg flex items-center justify-center transition-all">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-600 rounded-lg flex items-center justify-center transition-all">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-600 rounded-lg flex items-center justify-center transition-all">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-gray-800 font-bold mb-3 text-sm uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Dashboard
                                </a>
                            </li>
                            <li>
                                <a href="/pos" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Point of Sale
                                </a>
                            </li>
                            <li>
                                <a href="/inventory" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Inventory Management
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-gray-800 font-bold mb-3 text-sm uppercase tracking-wider">Contact</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <Mail size={16} className="text-blue-500" />
                                pasancp2000@gmail.com
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone size={16} className="text-blue-500" />
                                +94 71 268 4685
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin size={16} className="text-blue-500" />
                                Colombo, Sri Lanka
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-600 text-sm">
                            &copy; {currentYear} Ruhunu Tyre House. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-xs text-gray-500">
                            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
