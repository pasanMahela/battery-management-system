import Header from './Header';
import Footer from './Footer';
import RemoteScannerModal from './RemoteScannerModal';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <RemoteScannerModal />
        </div>
    );
};

export default Layout;
